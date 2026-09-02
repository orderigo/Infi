export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 lg:px-6">
      <div className="flex items-baseline gap-2 sm:gap-3">
        <h1 className="text-xs font-mono font-bold tracking-tight text-cyan-400 sm:text-sm">
          HELIOS AI <span className="text-[10px] font-normal text-zinc-400 sm:text-xs">× GEMINI 2.5 FLASH</span>
        </h1>
        <span className="hidden border-l border-zinc-800 pl-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500 md:inline">
          Real-time Video Generation & Voice Agent Control
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 text-[9px] font-mono text-cyan-300 sm:px-2.5 sm:text-[10px]">
          LIVE STREAM ACTIVE
        </span>
        <span className="hidden text-[10px] font-mono uppercase tracking-wider text-zinc-500 sm:inline sm:text-[11px]">
          POWERED BY VECTOR / GEMINI
        </span>
      </div>
    </header>
  );
}
