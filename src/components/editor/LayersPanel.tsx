import { useEditor } from "@/lib/editor-store";
import { Eye, EyeOff, Lock, Unlock, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";

export function LayersPanel() {
  const { layers, selectedId, select, updateLayer, deleteLayer, reorder, duplicateLayer } = useEditor();

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col bg-obsidian/60">
      <div className="p-3 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        Layers · {layers.length}
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
              className={`group px-2 py-1.5 rounded border cursor-pointer flex items-center gap-2 text-xs ${
                isSel
                  ? "bg-electric/10 border-electric/30 text-white"
                  : "border-transparent hover:bg-white/5 text-slate-400"
              }`}
            >
              <span className="font-mono w-4 text-[10px] uppercase text-slate-500">
                {layer.type[0]}
              </span>
              <input
                value={layer.name}
                onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent outline-none truncate"
              />
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 text-slate-500">
                <button
                  title="Bring forward"
                  onClick={(e) => {
                    e.stopPropagation();
                    reorder(layer.id, 1);
                  }}
                  className="hover:text-white"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  title="Send back"
                  onClick={(e) => {
                    e.stopPropagation();
                    reorder(layer.id, -1);
                  }}
                  className="hover:text-white"
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  title="Duplicate"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  className="hover:text-white"
                >
                  <Copy className="size-3" />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { hidden: !layer.hidden });
                }}
                className="text-slate-500 hover:text-white"
              >
                {layer.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { locked: !layer.locked });
                }}
                className="text-slate-500 hover:text-white"
              >
                {layer.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                }}
                className="text-slate-500 hover:text-red-400"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
