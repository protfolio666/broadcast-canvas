import { useEditor } from "@/lib/editor-store";
import { Eye, EyeOff, Lock, Unlock, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";

export function LayersPanel() {
  const { layers, selectedId, select, updateLayer, deleteLayer, reorder, duplicateLayer } = useEditor();

  const allLocked = layers.length > 0 && layers.every((l) => l.locked);
  const toggleLockAll = () => {
    const next = !allLocked;
    layers.forEach((l) => updateLayer(l.id, { locked: next }));
  };

  return (
    <aside className="w-72 shrink-0 border-r border-white/5 flex flex-col bg-obsidian/60">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Layers · {layers.length}
        </span>
        <button
          onClick={toggleLockAll}
          disabled={layers.length === 0}
          title={allLocked ? "Unlock all layers" : "Lock all layers (freeze layout)"}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-widest disabled:opacity-40 ${
            allLocked
              ? "border-electric/40 text-electric bg-electric/10"
              : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {allLocked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          {allLocked ? "Locked" : "Lock all"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.length === 0 && (
          <div className="text-xs text-slate-500 p-4 text-center">
            No layers yet. Add text, image, or shape from the toolbar.
          </div>
        )}
        {[...layers].reverse().map((layer) => {
          const isSel = layer.id === selectedId;
          return (
            <div
              key={layer.id}
              onClick={() => select(layer.id)}
              className={`px-2 py-1.5 rounded border cursor-pointer text-xs ${
                isSel
                  ? "bg-electric/10 border-electric/30 text-white"
                  : "border-transparent hover:bg-white/5 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono w-4 text-[10px] uppercase text-slate-500 shrink-0">
                  {layer.type[0]}
                </span>
                <input
                  value={layer.name}
                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-transparent outline-none truncate"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { hidden: !layer.hidden });
                  }}
                  title={layer.hidden ? "Show" : "Hide"}
                  className="shrink-0 text-slate-500 hover:text-white"
                >
                  {layer.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  title={layer.locked ? "Unlock" : "Lock"}
                  className={`shrink-0 hover:text-white ${layer.locked ? "text-electric" : "text-slate-500"}`}
                >
                  {layer.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  title="Delete"
                  className="shrink-0 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {isSel && (
                <div className="flex gap-1 mt-1.5 pl-6 text-slate-500">
                  <button
                    title="Bring forward"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorder(layer.id, 1);
                    }}
                    className="p-1 rounded hover:bg-white/5 hover:text-white"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    title="Send back"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorder(layer.id, -1);
                    }}
                    className="p-1 rounded hover:bg-white/5 hover:text-white"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                  <button
                    title="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    className="p-1 rounded hover:bg-white/5 hover:text-white"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

