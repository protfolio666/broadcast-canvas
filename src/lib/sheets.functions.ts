import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Parse a Google Sheets URL to extract spreadsheet id + gid (worksheet)
function parseSheetUrl(url: string): { spreadsheetId: string; gid: string | null } {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) throw new Error("Not a valid Google Sheets URL");
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  return { spreadsheetId: idMatch[1], gid: gidMatch ? gidMatch[1] : null };
}

async function fetchSheetCsv(spreadsheetId: string, gid: string | null): Promise<string[][]> {
  // Cache-bust: Google caches CSV export aggressively (up to ~30s) at the edge.
  // Adding a unique query param + no-store forces a fresh read every poll.
  const cacheBust = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  const url = gid ? `${base}&gid=${gid}&_=${cacheBust}` : `${base}&_=${cacheBust}`;
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed (${res.status}). Set the sheet to 'Anyone with the link can view'.`,
    );
  }
  const text = await res.text();
  return parseCsv(text);
}

// Minimal RFC 4180 CSV parser (handles quoted fields with commas/newlines)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

export const connectSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; url: string }) =>
    z.object({ projectId: z.string().uuid(), url: z.string().url() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { spreadsheetId, gid } = parseSheetUrl(data.url);
    const rows = await fetchSheetCsv(spreadsheetId, gid);
    const headers = rows[0] ?? [];
    const worksheet = gid ?? "0";

    const { data: existing } = await context.supabase
      .from("sheet_connections")
      .select("id")
      .eq("project_id", data.projectId)
      .eq("spreadsheet_id", spreadsheetId)
      .eq("worksheet", worksheet)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("sheet_connections")
        .update({ headers, spreadsheet_url: data.url })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, headers };
    }
    const { data: conn, error } = await context.supabase
      .from("sheet_connections")
      .insert({
        project_id: data.projectId,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: data.url,
        worksheet,
        headers,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: conn.id, headers };
  });

// Public server fn (no auth) — used by the OBS overlay page to fetch fresh values.
export const fetchSheetValues = createServerFn({ method: "GET" })
  .inputValidator((d: { connectionId: string }) =>
    z.object({ connectionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conn, error } = await supabaseAdmin
      .from("sheet_connections")
      .select("spreadsheet_id, worksheet")
      .eq("id", data.connectionId)
      .single();
    if (error || !conn) throw new Error("Sheet connection not found");
    const rows = await fetchSheetCsv(conn.spreadsheet_id, conn.worksheet);
    return { rows };
  });
