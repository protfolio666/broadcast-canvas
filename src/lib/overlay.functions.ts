import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Public: fetch a page's render JSON without auth (OBS viewer).
// Uses the publishable (anon) key + the "public read pages" RLS policy —
// SUPABASE_SERVICE_ROLE_KEY is not available on Lovable Cloud.
export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((d: { pageId: string }) => z.object({ pageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.",
      );
    }
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          // New-format sb_ keys are opaque, not JWTs — send only apikey.
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: page, error } = await supabase
      .from("pages")
      .select("id, name, background_url, refresh_ms, layers, sheet_connection_id, width, height")
      .eq("id", data.pageId)
      .single();
    if (error || !page) throw new Error("Overlay page not found");
    return page;
  });
