import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getProject, savePage, createPage, deletePage } from "@/lib/projects.functions";
import { connectSheet, fetchSheetValues } from "@/lib/sheets.functions";
import { useEditor, newLayer, type Layer } from "@/lib/editor-store";
import { Canvas } from "@/components/editor/Canvas";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Type,
  ImageIcon,
  Square,
  Save,
  Undo2,
  Redo2,
  Upload,
  Link2,
  Radio,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/project/$projectId")({
  component: EditorPage,
  head: () => ({ meta: [{ title: "Editor — Overlay Studio" }] }),
});

function EditorPage() {
  const { projectId } = useParams({ from: "/_authenticated/project/$projectId" });
  const qc = useQueryClient();
  const getFn = useServerFn(getProject);
  const savePageFn = useServerFn(savePage);
  const createPageFn = useServerFn(createPage);
  const deletePageFn = useServerFn(deletePage);
  const connectSheetFn = useServerFn(connectSheet);
  const fetchValsFn = useServerFn(fetchSheetValues);

  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getFn({ data: { id: projectId } }),
  });

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.4);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetValues, setSheetValues] = useState<Record<string, string[][]>>({});

  const editor = useEditor();

  useEffect(() => {
    if (data && !activePageId && data.pages[0]) setActivePageId(data.pages[0].id);
  }, [data, activePageId]);

  const activePage = data?.pages.find((p) => p.id === activePageId);

  useEffect(() => {
    if (activePage) {
      editor.init(activePage.id, activePage.background_url, (activePage.layers as Layer[]) ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, data]);

  // Load latest sheet values for previews in the editor
  useEffect(() => {
    if (!data) return;
    data.sheets.forEach((s) => {
      fetchValsFn({ data: { connectionId: s.id } })
        .then((r) => setSheetValues((prev) => ({ ...prev, [s.id]: r.rows })))
        .catch(() => {});
    });
  }, [data, fetchValsFn]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!activePageId) return;
      await savePageFn({
        data: {
          id: activePageId,
          background_url: editor.background,
          layers: editor.layers,
        },
      });
    },
    onSuccess: () => {
      editor.markSaved();
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  // Autosave (debounced)
  const dirty = editor.dirty;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dirty || !activePageId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveMut.mutate(), 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, editor.layers, editor.background, activePageId]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      } else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        editor.redo();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (editor.selectedId) editor.duplicateLayer(editor.selectedId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (editor.selectedId) {
          e.preventDefault();
          editor.deleteLayer(editor.selectedId);
        }
      } else if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveMut.mutate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.selectedId]);

  const uploadBackground = useCallback(
    async (file: File) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("overlays").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data: signed } = await supabase.storage
        .from("overlays")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signed?.signedUrl) {
        editor.setBackground(signed.signedUrl);
        toast.success("Background uploaded");
      }
    },
    [editor],
  );

  const connectSheetMut = useMutation({
    mutationFn: (url: string) => connectSheetFn({ data: { projectId, url } }),
    onSuccess: () => {
      toast.success("Sheet connected");
      setShowSheetDialog(false);
      setSheetUrl("");
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const resolveText = useCallback(
    (l: Layer): string => {
      if (l.type !== "text") return "";
      if (l.binding?.source === "sheet") {
        const rows = sheetValues[l.binding.connectionId];
        if (!rows) return l.text ?? "";
        const headers = rows[0] ?? [];
        const idx = headers.indexOf(l.binding.column);
        const dataRow = rows[l.binding.row - 1];
        if (idx < 0 || !dataRow) return "—";
        return dataRow[idx] ?? "";
      }
      return l.text ?? "";
    },
    [sheetValues],
  );

  const resolveSrc = useCallback(
    (l: Layer): string => {
      if (l.type !== "image") return "";
      if (l.binding?.source === "sheet") {
        const rows = sheetValues[l.binding.connectionId];
        if (!rows) return l.src ?? "";
        const headers = rows[0] ?? [];
        const idx = headers.indexOf(l.binding.column);
        const dataRow = rows[l.binding.row - 1];
        if (idx < 0 || !dataRow) return "";
        return dataRow[idx] ?? "";
      }
      return l.src ?? "";
    },
    [sheetValues],
  );

  const overlayUrl = useMemo(() => {
    if (!activePageId) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/overlay/${activePageId}`;
  }, [activePageId]);

  if (isLoading || !data) {
    return <div className="min-h-screen bg-obsidian text-slate-500 p-10">Loading editor…</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-obsidian text-slate-200 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-white/5 bg-obsidian/80 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-white">
            <ArrowLeft className="size-4" />
          </Link>
          <span className="font-display font-bold text-white">{data.project.name}</span>
          <span className="h-4 w-px bg-white/10" />
          <span className="text-sm text-slate-400 italic">
            {activePage?.name ?? "Untitled"}
          </span>
          {editor.dirty && <span className="text-[10px] text-electric font-mono">● unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          <ToolbarBtn onClick={editor.undo} title="Undo (Ctrl+Z)"><Undo2 className="size-4" /></ToolbarBtn>
          <ToolbarBtn onClick={editor.redo} title="Redo (Ctrl+Y)"><Redo2 className="size-4" /></ToolbarBtn>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor.addLayer(newLayer("text"))} title="Add text">
            <Type className="size-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.addLayer(newLayer("image"))} title="Add image">
            <ImageIcon className="size-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.addLayer(newLayer("rect"))} title="Add rectangle">
            <Square className="size-4" />
          </ToolbarBtn>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <label className="cursor-pointer px-3 py-1.5 border border-white/10 rounded text-xs hover:bg-white/5 flex items-center gap-1.5">
            <Upload className="size-3" /> Background
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadBackground(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setShowSheetDialog(true)}
            className="px-3 py-1.5 border border-white/10 rounded text-xs hover:bg-white/5 flex items-center gap-1.5"
          >
            <Link2 className="size-3" /> Sheet
          </button>
          <button
            onClick={() => saveMut.mutate()}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 flex items-center gap-1.5"
          >
            <Save className="size-3" /> Save
          </button>
          <button
            onClick={() => {
              if (!overlayUrl) return;
              navigator.clipboard.writeText(overlayUrl);
              toast.success("OBS URL copied");
            }}
            className="px-4 py-1.5 bg-electric text-obsidian font-bold text-xs rounded flex items-center gap-1.5"
          >
            <Radio className="size-3" /> Copy OBS URL
          </button>
        </div>
      </header>

      {/* Page tabs */}
      <div className="h-10 border-b border-white/5 bg-obsidian flex items-center gap-1 px-3 overflow-x-auto shrink-0">
        {data.pages.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePageId(p.id)}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
              p.id === activePageId
                ? "bg-electric/10 text-electric border border-electric/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={() => {
            const name = prompt("Page name (e.g. Scoreboard, MVP, Result)");
            if (name)
              createPageFn({ data: { projectId, name } }).then(() =>
                qc.invalidateQueries({ queryKey: ["project", projectId] }),
              );
          }}
          className="px-2 py-1 text-xs text-slate-500 hover:text-electric flex items-center gap-1"
        >
          <Plus className="size-3" /> New page
        </button>
        {activePageId && data.pages.length > 1 && (
          <button
            onClick={() => {
              if (!activePageId) return;
              if (!confirm("Delete this page?")) return;
              deletePageFn({ data: { id: activePageId } }).then(() => {
                setActivePageId(null);
                qc.invalidateQueries({ queryKey: ["project", projectId] });
              });
            }}
            className="ml-auto text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
          >
            <Trash2 className="size-3" /> Delete page
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <LayersPanel />
        <Canvas scale={scale} onScaleChange={setScale} resolveText={resolveText} resolveSrc={resolveSrc} />
        <PropertiesPanel sheets={data.sheets.map((s) => ({ id: s.id, worksheet: s.worksheet, headers: s.headers as string[] }))} />
      </div>

      {/* Sheet dialog */}
      {showSheetDialog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSheetDialog(false)}
        >
          <div
            className="bg-slate-panel border border-white/10 rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-white mb-2">Connect Google Sheet</h2>
            <p className="text-sm text-slate-400 mb-4">
              Paste your Google Sheet URL. The sheet must be set to{" "}
              <span className="text-electric">"Anyone with the link can view"</span> in Share settings.
              We read the first row as column headers.
            </p>
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-electric mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSheetDialog(false)} className="px-4 py-2 border border-white/10 rounded text-sm">
                Cancel
              </button>
              <button
                onClick={() => sheetUrl && connectSheetMut.mutate(sheetUrl)}
                disabled={!sheetUrl || connectSheetMut.isPending}
                className="px-4 py-2 bg-electric text-obsidian font-bold text-sm rounded disabled:opacity-50"
              >
                Connect
              </button>
            </div>
            {data.sheets.length > 0 && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Connected sheets
                </div>
                {data.sheets.map((s) => (
                  <div key={s.id} className="text-xs text-slate-400 py-1">
                    <a href={s.spreadsheet_url} target="_blank" rel="noreferrer" className="text-electric hover:underline">
                      {s.spreadsheet_id.slice(0, 12)}…
                    </a>
                    <span className="ml-2 text-slate-500">
                      {(s.headers as string[]).length} columns
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 border border-white/10 rounded text-slate-300 hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
