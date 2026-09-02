export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-cyan-500/20 bg-zinc-950/70 px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-sm font-mono font-bold tracking-tight text-cyan-400">
          HELIOS AI <span className="text-xs font-normal text-zinc-400">× GEMINI 2.5 FLASH</span>
        </h1>
        <span className="hidden border-l border-zinc-800 pl-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500 sm:inline">
          Real-time Video Generation & Voice Agent Control
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300">
          LIVE STREAM ACTIVE
        </span>
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          POWERED BY VECTOR / GEMINI
        </span>
      </div>
    </header>
  );
}
