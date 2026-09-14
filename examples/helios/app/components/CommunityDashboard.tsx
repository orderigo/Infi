"use client";
import { useCallback, useEffect, useState } from "react";
type Idea = {
  id: string;
  text: string;
  author: string;
  votes: number;
  createdAt: string;
  promotedAt?: string;
};
export function CommunityDashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/community/ideas", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load ideas");
    setIdeas(data.ideas);
  }, []);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function promote(id: string) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/community/ideas", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Promotion failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Promotion failed");
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
            Community control room
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Popular story ideas</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Review community ideas, then promote one into the next Fast H3
            episode.
          </p>
        </div>
        <button
          onClick={() => void load().catch((e) => setError(e.message))}
          className="rounded-md border border-zinc-700 px-3 py-2 font-mono text-xs text-zinc-300 hover:bg-zinc-800"
        >
          REFRESH
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="grid gap-3">
        {ideas.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            No community ideas yet. Ask viewers to pitch a story in the Fast H3
            tab.
          </div>
        )}
        {ideas.map((idea, index) => (
          <article
            key={idea.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span className="font-mono text-lg text-emerald-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-zinc-200">{idea.text}</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-500">
                  {idea.votes} vote{idea.votes === 1 ? "" : "s"} · first pitched
                  by {idea.author}
                </p>
              </div>
            </div>
            <button
              disabled={Boolean(idea.promotedAt) || busy === idea.id}
              onClick={() => void promote(idea.id)}
              className="shrink-0 rounded-md bg-emerald-400 px-4 py-2 font-mono text-xs font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {idea.promotedAt
                ? "PROMOTED"
                : busy === idea.id
                  ? "STARTING…"
                  : "PROMOTE EPISODE"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
