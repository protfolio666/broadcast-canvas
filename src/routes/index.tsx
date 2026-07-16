import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Link2, Radio, Zap, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-obsidian text-slate-200 font-sans">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-obsidian/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-electric rounded flex items-center justify-center">
              <div className="size-4 border-2 border-obsidian rotate-45"></div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              OVERLAY<span className="text-electric">STUDIO</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#how" className="hover:text-electric transition-colors">How it works</a>
            <a href="#features" className="hover:text-electric transition-colors">Features</a>
            <a href="#pricing" className="hover:text-electric transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-electric transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="px-4 py-2 text-sm font-medium hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth"
              className="px-5 py-2 bg-electric text-obsidian font-bold text-sm rounded shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform"
            >
              Go Live Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-20 pb-12 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-electric/20 bg-electric/5 text-electric text-[10px] font-mono font-bold uppercase tracking-widest mb-6">
          <span className="size-1.5 rounded-full bg-electric animate-pulse"></span>
          Live for Tournament Season
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight max-w-5xl mx-auto">
          PRO BROADCASTS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric to-blue-500">
            POWERED BY SHEETS
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-10 leading-relaxed">
          Upload your PNG. Drop editable fields on top. Bind them to a Google Sheet.
          Get a transparent OBS browser source URL that updates the second your sheet changes.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/auth"
            className="px-8 py-4 bg-electric text-obsidian font-bold text-sm uppercase tracking-widest rounded hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          >
            Start building free
          </Link>
          <a
            href="#how"
            className="px-8 py-4 border border-white/10 hover:border-electric/40 font-bold text-sm uppercase tracking-widest rounded"
          >
            See how it works
          </a>
        </div>
      </header>

      {/* Editor preview mockup */}
      <div className="max-w-screen-2xl mx-auto px-6 mb-24">
        <div className="bg-slate-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="h-14 border-b border-white/5 bg-obsidian/50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-electric uppercase tracking-widest">Editor</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-sm text-slate-300 italic">Masters_Final_LowerThird.ovl</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded border border-green-500/20">
                <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                  Sheet Connected
                </span>
              </div>
              <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-bold">
                COPY OBS URL
              </button>
            </div>
          </div>
          <div className="flex h-[520px]">
            <aside className="w-64 border-r border-white/5 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Scene Layers
              <div className="mt-4 space-y-1">
                <div className="px-3 py-2 bg-electric/10 border border-electric/20 rounded text-xs font-semibold text-white normal-case tracking-normal">
                  Player_Name_01
                </div>
                {["Team_Logo_Alpha", "Score_Primary", "Background_Overlay.png"].map((n) => (
                  <div key={n} className="px-3 py-2 text-xs text-slate-400 normal-case tracking-normal">
                    {n}
                  </div>
                ))}
              </div>
            </aside>
            <main className="flex-1 bg-black p-12 flex items-center justify-center">
              <div className="w-full aspect-video checkerboard rounded border border-white/10 relative">
                <div className="absolute bottom-[15%] left-[10%] px-4 py-2 border-2 border-electric bg-electric/5 text-white font-display font-bold text-3xl shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  SHROUD
                </div>
              </div>
            </main>
            <aside className="w-72 border-l border-white/5 bg-obsidian/40 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Properties
              <div className="mt-4 space-y-4 normal-case tracking-normal">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Sheet column</div>
                  <div className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white">
                    Sheet1!A2 (Player_Name)
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Font size</div>
                  <div className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white">
                    48px
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="max-w-screen-2xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8">
        {[
          { n: "01", icon: Upload, t: "Upload PNG", d: "Drop your custom broadcast graphic. Transparent PNGs at any resolution." },
          { n: "02", icon: Link2, t: "Bind to Sheet", d: "Connect a public Google Sheet. Map each text or image to a column." },
          { n: "03", icon: Radio, t: "Copy OBS URL", d: "Paste the transparent 1920×1080 URL into OBS Browser Source. That's it." },
        ].map((s) => (
          <div key={s.n} className="p-8 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-electric font-display text-2xl">{s.n}</span>
              <s.icon className="size-5 text-electric" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 italic">{s.t}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="max-w-screen-2xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-white">Built for live production</h2>
          <p className="text-slate-400 mt-2">Every feature designed for the pressure of a live broadcast.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Zap, t: "Sub-second sync", d: "Sheet edits reach OBS in ~1 second. Configurable refresh rates." },
            { icon: Layers, t: "Unlimited layers", d: "Text, images, shapes. Layer, group, and reorder like Canva." },
            { icon: Sparkles, t: "Transparent overlays", d: "True alpha for OBS Browser Source. No green screen, no keying." },
          ].map((f) => (
            <div key={f.t} className="p-8 bg-white/[0.02] border border-white/5 rounded-xl hover:border-electric/30 transition-colors">
              <f.icon className="size-6 text-electric mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{f.t}</h3>
              <p className="text-sm text-slate-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-screen-2xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-white">Simple pricing</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: "Free", price: "$0", features: ["1 project", "3 overlay pages", "Google Sheets sync", "OBS browser source"] },
            { name: "Pro", price: "$19/mo", features: ["Unlimited projects", "Unlimited overlays", "1s refresh rate", "Priority support"], featured: true },
            { name: "Team", price: "$49/mo", features: ["Everything in Pro", "5 team members", "Shared asset library", "Custom domain"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`p-8 rounded-xl border ${
                p.featured
                  ? "border-electric bg-electric/5 shadow-[0_0_40px_rgba(0,240,255,0.15)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="font-display text-lg font-bold text-white uppercase tracking-widest">
                {p.name}
              </div>
              <div className="font-display text-4xl font-bold text-white mt-2">{p.price}</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-electric">→</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-6 block text-center py-2 rounded font-bold text-sm ${
                  p.featured
                    ? "bg-electric text-obsidian"
                    : "border border-white/10 text-white hover:bg-white/5"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-white">FAQ</h2>
        </div>
        <div className="space-y-4">
          {[
            { q: "Do I need to share my Google Sheet publicly?", a: "The sheet must be set to 'Anyone with the link can view.' Overlay Studio reads it as CSV using Google's built-in export — no OAuth, no keys." },
            { q: "Does the overlay have a transparent background?", a: "Yes. The /overlay/:pageId URL renders with a transparent body — perfect for OBS Browser Source at 1920×1080." },
            { q: "How fast do sheet changes appear on stream?", a: "You choose the refresh rate: 1s, 2s, 5s, 10s, or manual. Changes are live within one refresh cycle." },
            { q: "What file types can I upload?", a: "PNG, JPG, WebP. Transparent PNGs are ideal for broadcast overlays." },
          ].map((item) => (
            <details key={item.q} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 group">
              <summary className="font-bold text-white cursor-pointer flex justify-between items-center">
                {item.q}
                <span className="text-electric text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-screen-2xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-electric rounded flex items-center justify-center">
              <div className="size-3 border-2 border-obsidian rotate-45"></div>
            </div>
            <span className="font-display font-bold text-white">
              OVERLAY<span className="text-electric">STUDIO</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">© 2026 Overlay Studio · Built for esports</div>
        </div>
      </footer>
    </div>
  );
}
