"use client";

import { useAuth } from "../lib/useAuth";

interface HeaderProps {
  activeTab?: "helios" | "explore";
  onTabChange?: (tab: "helios" | "explore") => void;
  onOpenAuth?: () => void;
}

export function Header({
  activeTab = "helios",
  onTabChange,
  onOpenAuth,
}: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 bg-zinc-950/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 lg:px-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-mono text-xs font-bold tracking-tight text-cyan-400 sm:text-sm">
            REACTOR AI <span className="text-[10px] font-normal text-zinc-400 sm:text-xs">LABS</span>
          </h1>
        </div>

        {/* Header Tab Navigation Menu */}
        <nav className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
          <button
            onClick={() => onTabChange?.("helios")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-semibold transition ${
              activeTab === "helios"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span>Helios AI</span>
            <span className="hidden text-[10px] font-normal opacity-70 sm:inline">× Gemini</span>
          </button>
          <button
            onClick={() => onTabChange?.("explore")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-semibold transition ${
              activeTab === "explore"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span>Explore</span>
            <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-300">
              Lingbot World 2
            </span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 font-mono text-[10px] text-zinc-300 sm:text-xs">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1 font-mono text-[10px] text-red-400 transition hover:bg-red-900/50 sm:text-xs"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="rounded border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 font-mono text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] sm:text-xs"
          >
            SIGN IN / REGISTER
          </button>
        )}
      </div>
    </header>
  );
}
