"use client";

import { useAuth } from "../lib/useAuth";

interface HeaderProps {
  onOpenAuth?: () => void;
}

export function Header({ onOpenAuth }: HeaderProps) {
  const { user, signOut } = useAuth();

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
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-300 sm:text-xs border border-zinc-800 bg-zinc-900/60 px-2 py-1 rounded">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[10px] font-mono text-red-400 hover:bg-red-900/50 transition sm:text-xs"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="rounded border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 text-[11px] font-mono font-semibold text-cyan-300 hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition sm:text-xs"
          >
            SIGN IN / REGISTER
          </button>
        )}
      </div>
    </header>
  );
}
