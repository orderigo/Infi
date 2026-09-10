"use client";

import { HeliosMainVideoView, useHeliosState } from "@reactor-models/helios";
import { useState } from "react";

export function Video() {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(
    null,
  );

  useHeliosState((msg) =>
    setSnapshot(msg as unknown as Record<string, unknown>),
  );

  const started = Boolean(snapshot?.started);
  const running = Boolean(snapshot?.running);
  const currentChunk = String(snapshot?.current_chunk ?? 0);
  const currentFrame = String(snapshot?.current_frame ?? 0);
  const currentPrompt =
    typeof snapshot?.current_prompt === "string" ? snapshot.current_prompt : "";

  return (
    <div className="relative flex h-full min-h-[280px] sm:min-h-[380px] lg:min-h-[480px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-500/20 bg-zinc-950/90 shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md">
      {/* Real-time Video Stream Component */}
      <div className="relative h-full w-full">
        <HeliosMainVideoView />

        {/* High-Tech Overlay HUD */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-4">
          {/* Top HUD bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-zinc-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-mono font-semibold uppercase text-cyan-300 sm:text-[11px]">
                HELIOS LIVE STREAM
              </span>
            </div>

            {started && (
              <div className="flex items-center gap-2 sm:gap-3 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[9px] font-mono text-zinc-400 backdrop-blur-md sm:px-2.5 sm:py-1 sm:text-[11px]">
                <span>
                  CHUNK:{" "}
                  <strong className="text-cyan-400">{currentChunk}</strong>
                </span>
                <span>
                  FRAMES:{" "}
                  <strong className="text-cyan-400">{currentFrame}</strong>
                </span>
                <span>
                  STATE:{" "}
                  <strong className="text-emerald-400">
                    {running ? "GENERATING" : "PAUSED"}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Bottom Prompt HUD Overlay */}
          {currentPrompt && (
            <div className="rounded-lg border border-cyan-500/30 bg-zinc-950/85 p-2 sm:p-3 font-mono backdrop-blur-md">
              <span className="text-[9px] uppercase text-cyan-400 sm:text-[10px]">
                ACTIVE PROMPT
              </span>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-200 sm:mt-1 sm:text-xs">
                {currentPrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
