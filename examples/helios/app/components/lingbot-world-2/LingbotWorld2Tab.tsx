"use client";

import {
  LingbotWorld2MainVideoView,
  LingbotWorld2Provider,
  useLingbotWorld2,
} from "@reactor-models/lingbot-world-2";
import { Button } from "@/components/ui/button";
import { SnapClip } from "@/components/SnapClip";
import { LingbotWorldController } from "@/components/lingbot-world-2/LingbotWorldController";
import { useAuth } from "@/lib/useAuth";

const API_URL =
  process.env.NEXT_PUBLIC_REACTOR_API_URL ?? "https://api.reactor.inc";

async function fetchLingbotToken(): Promise<string> {
  const r = await fetch("/api/reactor/token?model=reactor/lingbot-world-2");
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Token fetch failed: ${r.status}`);
  }
  const { jwt } = (await r.json()) as { jwt: string };
  return jwt;
}

function StatusBar() {
  const { status, connect, disconnect, reset } = useLingbotWorld2();

  const dotColor =
    status === "ready"
      ? "#4ade80"
      : status === "connecting" || status === "waiting"
        ? "#facc15"
        : "rgba(255,255,255,0.3)";

  const statusLabel =
    status === "ready"
      ? "Connected"
      : status === "waiting"
        ? "Waiting for GPU..."
        : status === "connecting"
          ? "Connecting..."
          : "Disconnected";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full transition-colors"
            style={{
              backgroundColor: dotColor,
              animation:
                status === "connecting" || status === "waiting"
                  ? "statusPulse 1.5s infinite"
                  : "none",
            }}
          />
          <span className="font-mono text-xs font-bold text-zinc-200">
            {statusLabel}
          </span>
        </div>
        {status === "disconnected" ? (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => connect()}
            className="h-7 border-cyan-500/30 bg-cyan-500/20 px-3 font-mono text-xs text-cyan-300 hover:bg-cyan-500/30"
          >
            Connect
          </Button>
        ) : (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => disconnect()}
            className="h-7 border-white/15 bg-white/10 px-3 font-mono text-xs text-white hover:bg-white/15"
          >
            {status === "connecting" || status === "waiting"
              ? "Cancel"
              : "Disconnect"}
          </Button>
        )}
        {status === "ready" && (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => reset().catch(console.error)}
            className="h-7 border-red-500/20 bg-red-500/15 px-3 font-mono text-xs text-red-400 hover:bg-red-500/25"
          >
            Reset
          </Button>
        )}
      </div>
      <div className="text-[11px] font-mono text-zinc-400">
        Lingbot World 2 Interactive Environment
      </div>
    </div>
  );
}

function MainContent({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const { user } = useAuth();
  const { sidebar, controls } = LingbotWorldController({});

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StatusBar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left Column on Desktop / Bottom on Mobile: Presets, Layered Scene Editor, SnapClip */}
        <div className="order-2 flex min-h-0 min-w-0 flex-col gap-4 lg:order-1 lg:w-[min(100%,380px)] lg:max-w-[380px] lg:shrink-0 lg:overflow-y-auto lg:pr-1">
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3 backdrop-blur-md sm:p-4">
            {sidebar}
          </div>
          <SnapClip />
        </div>

        {/* Right Column on Desktop / Top on Mobile: Real-time Video Stream & Interactive Controls */}
        <div className="order-1 flex min-w-0 flex-1 flex-col gap-4 lg:order-2 lg:overflow-y-auto">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-cyan-500/20 bg-black shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <LingbotWorld2MainVideoView
              videoObjectFit="contain"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
            {!user && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-black/75 p-6 text-center backdrop-blur-md">
                <p className="mb-4 font-mono text-sm text-cyan-300">
                  Authentication Required to Connect to Lingbot World 2 Real-Time Stream
                </p>
                <button
                  onClick={onOpenAuth}
                  className="rounded-lg bg-cyan-500 px-6 py-2.5 font-mono text-xs font-bold text-zinc-950 transition hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  SIGN IN / REGISTER TO START
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3 backdrop-blur-md sm:p-4">
            {controls}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LingbotWorld2Tab({ onOpenAuth }: { onOpenAuth?: () => void }) {
  return (
    <>
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>
      <LingbotWorld2Provider apiUrl={API_URL} getJwt={fetchLingbotToken}>
        <MainContent onOpenAuth={onOpenAuth} />
      </LingbotWorld2Provider>
    </>
  );
}
