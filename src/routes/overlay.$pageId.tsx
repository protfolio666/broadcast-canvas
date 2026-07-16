import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getPublicPage } from "@/lib/overlay.functions";
import { fetchSheetValues } from "@/lib/sheets.functions";
import type { Layer } from "@/lib/editor-store";

export const Route = createFileRoute("/overlay/$pageId")({
  ssr: false,
  component: OverlayView,
  head: () => ({
    meta: [
      { title: "Overlay — Overlay Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function OverlayView() {
  const { pageId } = useParams({ from: "/overlay/$pageId" });
  const getPageFn = useServerFn(getPublicPage);
  const fetchValsFn = useServerFn(fetchSheetValues);

  const { data: page } = useQuery({
    queryKey: ["overlay", pageId],
    queryFn: () => getPageFn({ data: { pageId } }),
    refetchInterval: 15000, // pick up structural edits every 15s
  });

  const [values, setValues] = useState<string[][] | null>(null);

  const refreshMs = page?.refresh_ms ?? 1000;
  const connId = page?.sheet_connection_id ?? null;

  useEffect(() => {
    document.body.classList.add("obs-mode");
    return () => document.body.classList.remove("obs-mode");
  }, []);

  useEffect(() => {
    if (!connId) return;
    let cancelled = false;
    const load = () =>
      fetchValsFn({ data: { connectionId: connId } })
        .then((r) => {
          if (!cancelled) setValues(r.rows);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, Math.max(500, refreshMs));
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [connId, refreshMs, fetchValsFn]);

  const layers = useMemo<Layer[]>(
    () => ((page?.layers as unknown as Layer[]) ?? []).filter((l) => !l.hidden),
    [page],
  );

  function resolveText(l: Layer): string {
    if (l.type !== "text") return "";
    if (l.binding?.source === "sheet" && values) {
      const headers = values[0] ?? [];
      const idx = headers.indexOf(l.binding.column);
      const row = values[l.binding.row - 1];
      if (idx < 0 || !row) return "";
      return row[idx] ?? "";
    }
    return l.text ?? "";
  }
  function resolveSrc(l: Layer): string {
    if (l.type !== "image") return "";
    if (l.binding?.source === "sheet" && values) {
      const headers = values[0] ?? [];
      const idx = headers.indexOf(l.binding.column);
      const row = values[l.binding.row - 1];
      if (idx < 0 || !row) return "";
      return row[idx] ?? "";
    }
    return l.src ?? "";
  }

  const W = page?.width ?? 1920;
  const H = page?.height ?? 1080;

  const [vp, setVp] = useState({ w: typeof window !== "undefined" ? window.innerWidth : W, h: typeof window !== "undefined" ? window.innerHeight : H });
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!page) return null;

  const scale = Math.min(vp.w / W, vp.h / H);
  const offX = (vp.w - W * scale) / 2;
  const offY = (vp.h - H * scale) / 2;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: offY,
          left: offX,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          imageRendering: "auto",
        }}
      >
        {page.background_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.background_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
        {layers.map((l) => {
          const style: React.CSSProperties = {
            position: "absolute",
            left: l.x,
            top: l.y,
            width: l.w,
            height: l.h,
            transform: `rotate(${l.rotation}deg)`,
            opacity: l.opacity,
          };
          if (l.type === "text") {
            return (
              <div
                key={l.id}
                style={{
                  ...style,
                  fontFamily: l.fontFamily,
                  fontSize: l.fontSize,
                  fontWeight: l.fontWeight,
                  color: l.color,
                  textAlign: l.align,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    l.align === "center" ? "center" : l.align === "right" ? "flex-end" : "flex-start",
                  textShadow: l.textShadow,
                  WebkitTextStroke: l.strokeWidth
                    ? `${l.strokeWidth}px ${l.stroke ?? "#000"}`
                    : undefined,
                  lineHeight: 1.05,
                  whiteSpace: "pre",
                  overflow: "hidden",
                }}
              >
                {resolveText(l)}
              </div>
            );
          }
          if (l.type === "image") {
            const src = resolveSrc(l);
            if (!src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={l.id}
                src={src}
                alt=""
                style={{ ...style, objectFit: l.fit ?? "contain" }}
                crossOrigin="anonymous"
              />
            );
          }
          return (
            <div
              key={l.id}
              style={{
                ...style,
                background: l.fill,
                border: l.borderWidth ? `${l.borderWidth}px solid ${l.borderColor}` : undefined,
                borderRadius: l.borderRadius,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
