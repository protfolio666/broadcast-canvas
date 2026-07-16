import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listProjects, createProject, deleteProject } from "@/lib/projects.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, LogOut, Trash2, Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Overlay Studio" }] }),
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const deleteFn = useServerFn(deleteProject);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
  });

  const createMut = useMutation({
    mutationFn: (n: string) => createFn({ data: { name: n } }),
    onSuccess: (proj) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setCreating(false);
      setName("");
      navigate({ to: "/project/$projectId", params: { projectId: proj.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-obsidian text-slate-200">
      <header className="border-b border-white/5 bg-obsidian/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-electric rounded flex items-center justify-center">
              <div className="size-4 border-2 border-obsidian rotate-45" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              OVERLAY<span className="text-electric">STUDIO</span>
            </span>
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-1">Your overlays and broadcast graphics</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 bg-electric text-obsidian font-bold text-sm rounded flex items-center gap-2 hover:opacity-90"
          >
            <Plus className="size-4" /> New project
          </button>
        </div>

        {creating && (
          <div className="mb-6 p-4 bg-slate-panel border border-white/10 rounded-xl flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name (e.g. VCT Masters)"
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-electric"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) createMut.mutate(name.trim());
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <button
              onClick={() => name.trim() && createMut.mutate(name.trim())}
              disabled={!name.trim() || createMut.isPending}
              className="px-4 py-2 bg-electric text-obsidian font-bold text-sm rounded disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 border border-white/10 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-slate-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="border border-white/5 rounded-xl p-16 text-center">
            <Radio className="size-10 text-electric mx-auto mb-4" />
            <h2 className="font-display text-xl text-white mb-2">No projects yet</h2>
            <p className="text-slate-400 mb-6">Create your first broadcast project to get started.</p>
            <button
              onClick={() => setCreating(true)}
              className="px-5 py-2.5 bg-electric text-obsidian font-bold text-sm rounded"
            >
              Create project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group bg-slate-panel border border-white/10 hover:border-electric/30 rounded-xl p-5 transition-colors"
              >
                <Link
                  to="/project/$projectId"
                  params={{ projectId: p.id }}
                  className="block"
                >
                  <div className="aspect-video checkerboard rounded mb-4 border border-white/5" />
                  <h3 className="font-display font-bold text-white text-lg group-hover:text-electric transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) deleteMut.mutate(p.id);
                  }}
                  className="mt-3 text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
