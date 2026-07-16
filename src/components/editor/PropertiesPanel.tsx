import { useEditor, type Layer } from "@/lib/editor-store";

interface SheetConn {
  id: string;
  worksheet: string;
  headers: string[];
}

export function PropertiesPanel({ sheets }: { sheets: SheetConn[] }) {
  const { layers, selectedId, updateLayer } = useEditor();
  const layer = layers.find((l) => l.id === selectedId);

  if (!layer) {
    return (
      <aside className="w-72 border-l border-white/5 bg-obsidian/60 p-6 text-xs text-slate-500">
        Select a layer to edit its properties.
      </aside>
    );
  }

  const num = (v: number | undefined) => (v === undefined ? "" : String(Math.round(v)));

  const upd = (patch: Partial<Layer>) => updateLayer(layer.id, patch);

  return (
    <aside className="w-72 border-l border-white/5 bg-obsidian/60 overflow-y-auto">
      <div className="p-3 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
        <span>Properties</span>
        <span className="text-slate-600">{layer.type}</span>
      </div>

      <Section title="Transform">
        <Grid>
          <Field label="X"><NumInput v={layer.x} on={(n) => upd({ x: n })} /></Field>
          <Field label="Y"><NumInput v={layer.y} on={(n) => upd({ y: n })} /></Field>
          <Field label="W"><NumInput v={layer.w} on={(n) => upd({ w: n })} /></Field>
          <Field label="H"><NumInput v={layer.h} on={(n) => upd({ h: n })} /></Field>
          <Field label="Rot"><NumInput v={layer.rotation} on={(n) => upd({ rotation: n })} /></Field>
          <Field label="Opacity">
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={layer.opacity}
              onChange={(e) => upd({ opacity: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </Grid>
      </Section>

      {layer.type === "text" && (
        <Section title="Text">
          <Field label="Value (static)">
            <textarea
              rows={2}
              value={layer.text ?? ""}
              onChange={(e) => upd({ text: e.target.value })}
              className={inputCls + " resize-none"}
            />
          </Field>
          <Grid>
            <Field label="Size"><NumInput v={layer.fontSize} on={(n) => upd({ fontSize: n })} /></Field>
            <Field label="Weight">
              <select
                value={layer.fontWeight ?? 400}
                onChange={(e) => upd({ fontWeight: Number(e.target.value) })}
                className={inputCls}
              >
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Field>
          </Grid>
          <Field label="Font family">
            <select
              value={layer.fontFamily ?? "Inter"}
              onChange={(e) => upd({ fontFamily: e.target.value })}
              className={inputCls}
            >
              {["Chakra Petch", "Inter", "JetBrains Mono", "Arial", "Impact", "Georgia"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Grid>
            <Field label="Color">
              <input type="color" value={layer.color ?? "#ffffff"} onChange={(e) => upd({ color: e.target.value })} className="w-full h-8 bg-transparent border border-white/10 rounded" />
            </Field>
            <Field label="Align">
              <select
                value={layer.align ?? "left"}
                onChange={(e) => upd({ align: e.target.value as Layer["align"] })}
                className={inputCls}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="Stroke">
              <input type="color" value={layer.stroke ?? "#000000"} onChange={(e) => upd({ stroke: e.target.value })} className="w-full h-8 bg-transparent border border-white/10 rounded" />
            </Field>
            <Field label="Stroke W">
              <NumInput v={layer.strokeWidth} on={(n) => upd({ strokeWidth: n })} />
            </Field>
          </Grid>
          <Field label="Shadow (CSS)">
            <input
              type="text"
              placeholder="0 2px 8px rgba(0,0,0,0.5)"
              value={layer.textShadow ?? ""}
              onChange={(e) => upd({ textShadow: e.target.value })}
              className={inputCls}
            />
          </Field>
        </Section>
      )}

      {layer.type === "image" && (
        <Section title="Image">
          <Field label="Source URL (static)">
            <input
              type="text"
              value={layer.src ?? ""}
              onChange={(e) => upd({ src: e.target.value })}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>
          <Field label="Fit">
            <select value={layer.fit ?? "contain"} onChange={(e) => upd({ fit: e.target.value as Layer["fit"] })} className={inputCls}>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
            </select>
          </Field>
        </Section>
      )}

      {layer.type === "rect" && (
        <Section title="Shape">
          <Field label="Fill">
            <input type="text" value={layer.fill ?? ""} onChange={(e) => upd({ fill: e.target.value })} className={inputCls} placeholder="rgba(...)" />
          </Field>
          <Grid>
            <Field label="Border">
              <input type="color" value={layer.borderColor ?? "#00f0ff"} onChange={(e) => upd({ borderColor: e.target.value })} className="w-full h-8 bg-transparent border border-white/10 rounded" />
            </Field>
            <Field label="Width">
              <NumInput v={layer.borderWidth} on={(n) => upd({ borderWidth: n })} />
            </Field>
          </Grid>
          <Field label="Radius">
            <NumInput v={layer.borderRadius} on={(n) => upd({ borderRadius: n })} />
          </Field>
        </Section>
      )}

      {(layer.type === "text" || layer.type === "image") && (
        <Section title="Data Binding">
          <Field label="Source">
            <select
              value={layer.binding?.source ?? "static"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "static") upd({ binding: { source: "static" } });
                else {
                  const first = sheets[0];
                  if (!first) return;
                  upd({ binding: { source: "sheet", connectionId: first.id, column: first.headers[0] ?? "", row: 2 } });
                }
              }}
              className={inputCls}
            >
              <option value="static">Static value</option>
              <option value="sheet" disabled={sheets.length === 0}>
                Google Sheet {sheets.length === 0 && "(connect one first)"}
              </option>
            </select>
          </Field>
          {layer.binding?.source === "sheet" && (
            <>
              <Field label="Sheet">
                <select
                  value={layer.binding.connectionId}
                  onChange={(e) => {
                    const conn = sheets.find((s) => s.id === e.target.value);
                    if (!conn) return;
                    upd({
                      binding: {
                        source: "sheet",
                        connectionId: conn.id,
                        column: conn.headers[0] ?? "",
                        row: (layer.binding as { row: number }).row,
                      },
                    });
                  }}
                  className={inputCls}
                >
                  {sheets.map((s) => (
                    <option key={s.id} value={s.id}>Sheet · {s.worksheet}</option>
                  ))}
                </select>
              </Field>
              <Field label="Column">
                <select
                  value={layer.binding.column}
                  onChange={(e) =>
                    upd({
                      binding: { ...(layer.binding as Extract<Layer["binding"], { source: "sheet" }>), column: e.target.value },
                    })
                  }
                  className={inputCls}
                >
                  {(sheets.find((s) => s.id === (layer.binding as { connectionId: string }).connectionId)?.headers ?? []).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </Field>
              <Field label="Row (data row, header is row 1)">
                <NumInput v={layer.binding.row} on={(n) => upd({ binding: { ...(layer.binding as Extract<Layer["binding"], { source: "sheet" }>), row: Math.max(2, n) } })} />
              </Field>
            </>
          )}
        </Section>
      )}
    </aside>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-electric";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 space-y-3 border-b border-white/5">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
function NumInput({ v, on }: { v: number | undefined; on: (n: number) => void }) {
  return (
    <input
      type="number"
      value={v === undefined ? "" : Math.round(v)}
      onChange={(e) => on(Number(e.target.value))}
      className={inputCls}
    />
  );
}
