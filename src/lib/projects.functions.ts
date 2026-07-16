import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id, name, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: proj, error } = await context.supabase
      .from("projects")
      .insert({ name: data.name, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // seed one page
    await context.supabase.from("pages").insert({
      project_id: proj.id,
      name: "Scoreboard",
      layers: [],
    });
    return proj;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: project, error } = await context.supabase
      .from("projects")
      .select("id, name, created_at, updated_at")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: pages, error: pErr } = await context.supabase
      .from("pages")
      .select("id, name, background_url, refresh_ms, layers, sheet_connection_id, updated_at")
      .eq("project_id", data.id)
      .order("created_at", { ascending: true });
    if (pErr) throw new Error(pErr.message);

    const { data: sheets, error: sErr } = await context.supabase
      .from("sheet_connections")
      .select("id, spreadsheet_id, spreadsheet_url, worksheet, headers")
      .eq("project_id", data.id);
    if (sErr) throw new Error(sErr.message);

    return { project, pages: pages ?? [], sheets: sheets ?? [] };
  });

export const createPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; name: string }) =>
    z.object({ projectId: z.string().uuid(), name: z.string().min(1).max(100) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: page, error } = await context.supabase
      .from("pages")
      .insert({ project_id: data.projectId, name: data.name, layers: [] })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return page;
  });

export const savePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      name?: string;
      background_url?: string | null;
      refresh_ms?: number;
      layers?: unknown[];
      sheet_connection_id?: string | null;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100).optional(),
          background_url: z.string().nullable().optional(),
          refresh_ms: z.number().int().min(500).max(60000).optional(),
          layers: z.array(z.any()).optional(),
          sheet_connection_id: z.string().uuid().nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("pages").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
