"use client";

import { FastH3Provider } from "@reactor-models/fast-h3";
import { useAuth } from "../lib/useAuth";
import { Header } from "./fast-h3-episodes/Header";
import { StatusBadge } from "./fast-h3-episodes/StatusBadge";
import { CommandError } from "./fast-h3-episodes/CommandError";
import { EpisodeComposer } from "./fast-h3-episodes/EpisodeComposer";
import { NowPlaying } from "./fast-h3-episodes/NowPlaying";
import { QueuePanel } from "./fast-h3-episodes/QueuePanel";
import { SnapClip } from "./fast-h3-episodes/SnapClip";
import { Video } from "./fast-h3-episodes/Video";

const TOKEN_REFRESH_SKEW_MS = 60_000;
let cachedToken: { jwt: string; expiresAtMs: number } | null = null;
let inflightToken: Promise<string> | null = null;

/**
 * A Fast H3 session can only be operated by the exact token that created it.
 * Keep the no-store JWT stable for its lifetime and coalesce concurrent SDK
 * refreshes, rather than letting a browser cache replace it mid-session.
 */
async function fetchToken(): Promise<string> {
  if (
    cachedToken &&
    Date.now() < cachedToken.expiresAtMs - TOKEN_REFRESH_SKEW_MS
  ) {
    return cachedToken.jwt;
  }
  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    try {
      const response = await fetch("/api/fast-h3/token", {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Token fetch failed: ${response.status}`);
      }
      const { jwt, expires_at } = (await response.json()) as {
        jwt: string;
        expires_at: number;
      };
      cachedToken = { jwt, expiresAtMs: expires_at * 1000 };
      return jwt;
    } finally {
      inflightToken = null;
    }
  })();

  return inflightToken;
}

/**
 * The private, browser-driven Fast H3 workflow. Composing stays offline;
 * users can connect manually from the status panel or let Queue episode
 * connect on demand.
 */
export function FastH3EpisodesTab({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="font-mono text-xs text-zinc-500">Checking session…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <section className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
          <h2 className="font-mono text-sm font-semibold text-zinc-200">
            Sign in to use Fast H3 Episodes
          </h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Episode sessions consume Reactor capacity and are available to
            signed-in users only.
          </p>
          <button
            onClick={onOpenAuth}
            className="mt-4 rounded-md bg-brand px-4 py-2 font-mono text-xs font-semibold text-brand-fg"
          >
            SIGN IN / REGISTER
          </button>
        </section>
      </main>
    );
  }

  return (
    <FastH3Provider jwtToken={fetchToken}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-6">
          <aside className="order-2 flex w-full flex-col gap-3 sm:gap-4 lg:order-1 lg:w-96 lg:shrink-0">
            <StatusBadge />
            <CommandError />
            <NowPlaying />
            <EpisodeComposer />
            <QueuePanel />
            <SnapClip />
          </aside>
          <section className="order-1 flex-1 lg:order-2">
            <Video />
          </section>
        </main>
      </div>
    </FastH3Provider>
  );
}
