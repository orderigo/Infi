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

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · [`@reactor-models/helios`](https://www.npmjs.com/package/@reactor-models/helios) · [`@reactor-team/js-sdk`](https://www.npmjs.com/package/@reactor-team/js-sdk)
