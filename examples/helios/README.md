# Helios Interactive

A Next.js + TypeScript reference frontend for [**Helios**](https://reactor.inc) — Reactor's real-time, prompt-driven video generation model integrated with Google Vertex AI Gemini 2.0 Flash Voice Agent.

Connect, send a prompt, or speak to Gemini Voice Agent to produce and steer a continuous real-time video stream. Start from a curated text prompt, an example image, or your own image. Hot-swap prompts mid-flight via voice or UI. The whole app is built on the typed [`@reactor-models/helios`](https://www.npmjs.com/package/@reactor-models/helios) SDK.

```
┌──────────────────────┬─────────────────────────────────────┐
│  Status   ▸ ready    │                                     │
│                      │                                     │
│  Voice Agent Panel   │                                     │
│  [Gemini 2.0 Flash]  │         live video output           │
│  (waveform / chat)   │         (HeliosMainVideoView)       │
│                      │                                     │
│  Try a prompt        │                                     │
│  ┌────────┬────────┐ │                                     │
│  │ Leo    │ Rain   │ │                                     │
│  └────────┴────────┘ │                                     │
│  ┌────────┬────────┐ │                                     │
│  │ Flower │ Max    │ │                                     │
│  └────────┴────────┘ │                                     │
│                      │                                     │
│  Or start from image │                                     │
│  [Upload your own]   │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

## Quick start

> **Start a standalone project:** `npx create-reactor-app my-app --model=helios` scaffolds this example into a fresh app — no clone needed. The steps below are for running it in-place from a monorepo checkout.

You'll need a Reactor API key — grab one at [reactor.inc/account/api-keys](https://www.reactor.inc/account/api-keys). It starts with `rk_`.

```bash
cp .env.example .env
# add your key: REACTOR_API_KEY=rk_...
# add GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), click **Connect**, and pick a starting point or activate the **Voice Agent**.

## Deploy to Railway or Vercel

This application includes both root and subdirectory `railway.json` configurations for seamless 1-click publishing on [Railway](https://railway.app) and is fully Vercel compatible.

### Step-by-Step Deployment:

1. **Push to GitHub**: Make sure your repository is pushed to GitHub.
2. **Deploy on Railway / Vercel**:
   - Log in to [Railway Dashboard](https://railway.app/dashboard) or Vercel.
   - Click **New Project** → **Deploy from GitHub repo**.
3. **Set Environment Variables**:
   - Add `REACTOR_API_KEY` set to your key (`rk_...`).
   - Add `GCP_SERVICE_ACCOUNT_KEY` set to your Google Cloud service account JSON string.
4. **Generate Public Domain**:
   - Your Helios AI Voice Agent application is now live!

## What you can do with it

- **Voice Agent Gemini 2.0 Flash Control.** Speak or type natural language instructions to steer the Helios video model in real time (e.g., "Make it rain in cyberpunk city", "Pause the video", "Resume generation").
- **Start a scene from a text prompt.** Four curated prompt presets in the sidebar, plus a free-text input.
- **Start a scene from an image.** Example images pair with hand-tuned prompts, or upload your own.
- **Evolve the scene mid-stream.** Hot-swap prompts without stopping the video generation stream.
- **Snap a clip.** Grab the last 10 seconds of the live stream and download MP4s.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Gemini 2.0 Flash Voice Agent · [`@reactor-models/helios`](https://www.npmjs.com/package/@reactor-models/helios) · [`@reactor-team/js-sdk`](https://www.npmjs.com/package/@reactor-team/js-sdk)
