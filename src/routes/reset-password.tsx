import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Reset password — Overlay Studio" }] }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in URL hash and creates a session
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-panel border border-white/10 rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Set new password</h1>
        {!ready ? (
          <p className="text-sm text-slate-400">
            Waiting for reset link… If nothing happens, request a new link from the{" "}
            <Link to="/auth" className="text-electric hover:underline">sign-in page</Link>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3 mt-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-sm text-white outline-none focus:border-electric"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-electric text-obsidian font-bold text-sm rounded disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
