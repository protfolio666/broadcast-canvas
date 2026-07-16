import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: fetch a page's render JSON without auth (OBS viewer)
export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((d: { pageId: string }) => z.object({ pageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: page, error } = await supabaseAdmin
      .from("pages")
      .select("id, name, background_url, refresh_ms, layers, sheet_connection_id, width, height")
      .eq("id", data.pageId)
      .single();
    if (error || !page) throw new Error("Overlay page not found");
    return page;
  });
