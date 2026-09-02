"use client";

import { HeliosMainVideoView, useHeliosState } from "@reactor-models/helios";
import { useState } from "react";

export function Video() {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);

  useHeliosState((msg) => setSnapshot(msg as unknown as Record<string, unknown>));

  const started = Boolean(snapshot?.started);
  const running = Boolean(snapshot?.running);
  const currentChunk = String(snapshot?.current_chunk ?? 0);
  const currentFrame = String(snapshot?.current_frame ?? 0);
  const currentPrompt = typeof snapshot?.current_prompt === "string" ? snapshot.current_prompt : "";

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-500/20 bg-zinc-950/90 shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md">
      {/* Real-time Video Stream Component */}
      <div className="relative h-full w-full">
        <HeliosMainVideoView />

        {/* High-Tech Overlay HUD */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
          {/* Top HUD bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-md border border-cyan-500/30 bg-zinc-950/80 px-2.5 py-1 backdrop-blur-md">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase text-cyan-300">
                HELIOS LIVE STREAM
              </span>
            </div>

            {started && (
              <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400 backdrop-blur-md">
                <span>CHUNK: <strong className="text-cyan-400">{currentChunk}</strong></span>
                <span>FRAMES: <strong className="text-cyan-400">{currentFrame}</strong></span>
                <span>STATE: <strong className="text-emerald-400">{running ? "GENERATING" : "PAUSED"}</strong></span>
              </div>
            )}
          </div>

          {/* Bottom Prompt HUD Overlay */}
          {currentPrompt && (
            <div className="rounded-lg border border-cyan-500/30 bg-zinc-950/85 p-3 font-mono backdrop-blur-md">
              <span className="text-[10px] uppercase text-cyan-400">ACTIVE PROMPT</span>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-200">
                {currentPrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
