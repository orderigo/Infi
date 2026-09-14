# Helios Interactive

A Next.js + TypeScript reference frontend for [**Helios**](https://reactor.inc), Reactor's real-time, prompt-driven video generation model.

Sign-in is handled through Supabase, while the Reactor API key remains server-side.

## Quick start

> **Start a standalone project:** `npx create-reactor-app my-app --model=helios` scaffolds this example into a fresh app. The steps below run this example from a monorepo checkout.

You need a Reactor API key and a Supabase project for sign-in.

```bash
cd examples/helios
cp .env.example .env
# Add REACTOR_API_KEY and Supabase values.

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in to start using Helios.

## Fast H3 Episodes

The **Episodes** tab adds the canonical, private Fast H3 compose-and-play workflow to the root application. Draft an episode from an idea with the optional server-side AI writer or write scenes by hand, then queue one to six scenes as a continuous video. The tab connects only when the episode is queued, capacity-checks the full episode, chains each later scene from the previous clip's final frame, mirrors both model queues, and supports synchronized playback and a 10-second MP4 capture.

Every later scene must begin with a fully described **hard cut** and repeat the setting, subjects, lighting, and style. Fast H3 only reads the current scene prompt; these constraints preserve story continuity without gradual visual degradation across a chain. `REACTOR_API_KEY` is required and always remains server-side. Add the optional `COMETAPI_KEY`, `COMETAPI_BASE_URL`, and `COMETAPI_MODEL` settings from `.env.example` to enable AI-written scene prompts through CometAPI's OpenAI-compatible Chat Completions API. The default model is `deepseek-v4-flash`; manual composition remains fully available without a CometAPI key.

## Community-driven AI Story Channel

The **Fast H3** tab is a community-driven AI story channel: viewers pitch ideas in LiveKit chat, repeated ideas accumulate popularity, and an authorized operator can open **Control Room** to promote a popular idea into the streamer's next episode.

Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_ROOM` for the Helios viewer, and set the same values in `examples/fast-h3-livestream/streamer/.env`. Add the operator's signed-in Supabase email to `ADMIN_EMAILS` in the Helios environment. The operator must sign in before opening **Control Room**.

The current MVP keeps the ranked idea list in the running Next.js process. Use a shared database before deploying multiple instances or requiring durable voting history.

## Deployment

Railway is configured for this repository: it runs `pnpm --filter helios start` to serve the Next.js application.

1. Deploy the repository to Railway.
2. Add the required environment variables above.
3. Generate a public domain and open the app through HTTPS.

## What you can do

- **Text-control the video stream.** Use natural-language instructions such as “Make it rain in a cyberpunk city,” “Pause the video,” or “Resume generation.”
- **Start a scene from a text prompt.** Select a curated preset or use free text.
- **Start a scene from an image.** Use an example image or upload your own.
- **Evolve a scene mid-stream.** Hot-swap prompts without stopping video generation.
- **Snap a clip.** Download a recent section of the live stream.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · [`@reactor-models/helios`](https://www.npmjs.com/package/@reactor-models/helios) · [`@reactor-models/fast-h3`](https://www.npmjs.com/package/@reactor-models/fast-h3) · [`@reactor-team/js-sdk`](https://www.npmjs.com/package/@reactor-team/js-sdk)
