import { useEditor, type Layer } from "@/lib/editor-store";
import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  scale: number;
  onScaleChange: (s: number) => void;
  resolveText: (l: Layer) => string;
  resolveSrc: (l: Layer) => string;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;

export function Canvas({ scale, onScaleChange, resolveText, resolveSrc }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { background, layers, selectedId, select, updateLayer, pushHistory } = useEditor();
  const [drag, setDrag] = useState<null | {
    id: string;
    mode: "move" | "resize";
    handle?: string;
    startX: number;
    startY: number;
    orig: Layer;
  }>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onScaleChange(Math.max(0.1, Math.min(2, scale + (e.deltaY < 0 ? 0.05 : -0.05))));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, onScaleChange]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, layer: Layer, mode: "move" | "resize", handle?: string) => {
      if (layer.locked) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pushHistory();
      select(layer.id);
      setDrag({ id: layer.id, mode, handle, startX: e.clientX, startY: e.clientY, orig: { ...layer } });
    },
    [select, pushHistory],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      if (drag.mode === "move") {
        let nx = drag.orig.x + dx;
        let ny = drag.orig.y + dy;
        const w = drag.orig.w;
        const h = drag.orig.h;
        // Snap thresholds in canvas px (scale-independent for consistent feel)
        const TH = 6 / scale;

        // Collect snap targets from other visible layers + canvas
        const others = layers.filter((l) => l.id !== drag.id && !l.hidden);
        const vTargets: number[] = [0, CANVAS_W / 2, CANVAS_W];
        const hTargets: number[] = [0, CANVAS_H / 2, CANVAS_H];
        for (const o of others) {
          vTargets.push(o.x, o.x + o.w / 2, o.x + o.w);
          hTargets.push(o.y, o.y + o.h / 2, o.y + o.h);
        }

        const activeV: number[] = [];
        const activeH: number[] = [];

        // Vertical snap: left, center, right edges of dragged layer
        const myV = [nx, nx + w / 2, nx + w];
        let bestVDelta: number | null = null;
        let bestVLine: number | null = null;
        for (let i = 0; i < myV.length; i++) {
          for (const t of vTargets) {
            const d = t - myV[i];
            if (Math.abs(d) <= TH && (bestVDelta === null || Math.abs(d) < Math.abs(bestVDelta))) {
              bestVDelta = d;
              bestVLine = t;
            }
          }
        }
        if (bestVDelta !== null) {
          nx += bestVDelta;
          if (bestVLine !== null) activeV.push(bestVLine);
          // Also show any other edge that matches after snap
          const afterV = [nx, nx + w / 2, nx + w];
          for (const t of vTargets) {
            if (afterV.some((v) => Math.abs(v - t) < 0.5) && !activeV.includes(t)) activeV.push(t);
          }
        }

        const myH = [ny, ny + h / 2, ny + h];
        let bestHDelta: number | null = null;
        let bestHLine: number | null = null;
        for (let i = 0; i < myH.length; i++) {
          for (const t of hTargets) {
            const d = t - myH[i];
            if (Math.abs(d) <= TH && (bestHDelta === null || Math.abs(d) < Math.abs(bestHDelta))) {
              bestHDelta = d;
              bestHLine = t;
            }
          }
        }
        if (bestHDelta !== null) {
          ny += bestHDelta;
          if (bestHLine !== null) activeH.push(bestHLine);
          const afterH = [ny, ny + h / 2, ny + h];
          for (const t of hTargets) {
            if (afterH.some((v) => Math.abs(v - t) < 0.5) && !activeH.includes(t)) activeH.push(t);
          }
        }

        setGuides({ v: activeV, h: activeH });
        updateLayer(drag.id, { x: nx, y: ny });
      } else if (drag.handle) {
        let { x, y, w, h } = drag.orig;
        if (drag.handle.includes("e")) w = Math.max(20, drag.orig.w + dx);
        if (drag.handle.includes("s")) h = Math.max(20, drag.orig.h + dy);
        if (drag.handle.includes("w")) {
          const nw = Math.max(20, drag.orig.w - dx);
          x = drag.orig.x + (drag.orig.w - nw);
          w = nw;
        }
        if (drag.handle.includes("n")) {
          const nh = Math.max(20, drag.orig.h - dy);
          y = drag.orig.y + (drag.orig.h - nh);
          h = nh;
        }
        updateLayer(drag.id, { x, y, w, h });
      }
    },
    [drag, scale, updateLayer, layers],
  );

  const onPointerUp = useCallback(() => {
    setDrag(null);
    setGuides({ v: [], h: [] });
  }, []);

  return (
    <div
      ref={wrapRef}
      className="flex-1 bg-black overflow-auto flex items-center justify-center relative p-8"
      onClick={(e) => {
        // Only deselect when the empty canvas area itself is clicked — not
        // when a drag/resize on a child layer bubbles up as a click.
        if (e.target === e.currentTarget) select(null);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="absolute top-3 left-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
        Canvas 1920 × 1080 · {Math.round(scale * 100)}%
      </div>
      <div
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          position: "relative",
        }}
      >
        <div
          className="checkerboard absolute inset-0 border border-white/10"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {background && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={background}
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ objectFit: "contain" }}
            />
          )}
          {layers.map((layer) => {
            if (layer.hidden) return null;
            const isSel = layer.id === selectedId;
            const commonStyle: React.CSSProperties = {
              position: "absolute",
              left: layer.x,
              top: layer.y,
              width: layer.w,
              height: layer.h,
              transform: `rotate(${layer.rotation}deg)`,
              opacity: layer.opacity,
              cursor: layer.locked ? "not-allowed" : "move",
              outline: isSel ? "2px solid #00f0ff" : "none",
              outlineOffset: "2px",
            };
            return (
              <div
                key={layer.id}
                style={commonStyle}
                onPointerDown={(e) => onPointerDown(e, layer, "move")}
                onClick={(e) => {
                  e.stopPropagation();
                  select(layer.id);
                }}
              >
                <LayerContent layer={layer} textValue={resolveText(layer)} srcValue={resolveSrc(layer)} />
                {isSel && !layer.locked && (
                  <>
                    {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((h) => (
                      <div
                        key={h}
                        onPointerDown={(e) => onPointerDown(e, layer, "resize", h)}
                        style={{
                          position: "absolute",
                          width: 10,
                          height: 10,
                          background: "#00f0ff",
                          border: "1px solid #0a0a0c",
                          ...handlePos(h),
                          cursor: cursorFor(h),
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
          {/* Alignment guides (Canva-style) */}
          {guides.v.map((x, i) => (
            <div
              key={`v${i}`}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: 1,
                height: CANVAS_H,
                background: "#ff2d95",
                pointerEvents: "none",
                boxShadow: "0 0 4px #ff2d95",
              }}
            />
          ))}
          {guides.h.map((y, i) => (
            <div
              key={`h${i}`}
              style={{
                position: "absolute",
                top: y,
                left: 0,
                height: 1,
                width: CANVAS_W,
                background: "#ff2d95",
                pointerEvents: "none",
                boxShadow: "0 0 4px #ff2d95",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LayerContent({ layer, textValue, srcValue }: { layer: Layer; textValue: string; srcValue: string }) {
  if (layer.type === "text") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          fontWeight: layer.fontWeight,
          color: layer.color,
          textAlign: layer.align,
          display: "flex",
          alignItems: "center",
          justifyContent: layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
          textShadow: layer.textShadow,
          WebkitTextStroke: layer.strokeWidth ? `${layer.strokeWidth}px ${layer.stroke ?? "#000"}` : undefined,
          lineHeight: 1.05,
          whiteSpace: "pre",
          overflow: "hidden",
        }}
      >
        {textValue}
      </div>
    );
  }
  if (layer.type === "image") {
    if (!srcValue) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-white/30 border border-dashed border-white/20">
          image
        </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={srcValue}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: layer.fit ?? "contain", pointerEvents: "none" }}
        crossOrigin="anonymous"
      />
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: layer.fill,
        border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor}` : undefined,
        borderRadius: layer.borderRadius,
      }}
    />
  );
}

function handlePos(h: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    nw: { top: -5, left: -5 },
    n: { top: -5, left: "calc(50% - 5px)" },
    ne: { top: -5, right: -5 },
    e: { top: "calc(50% - 5px)", right: -5 },
    se: { bottom: -5, right: -5 },
    s: { bottom: -5, left: "calc(50% - 5px)" },
    sw: { bottom: -5, left: -5 },
    w: { top: "calc(50% - 5px)", left: -5 },
  };
  return map[h];
}
function cursorFor(h: string) {
  const c: Record<string, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
  return c[h];
}
