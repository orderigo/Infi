# Helios Interactive

A Next.js + TypeScript reference frontend for [**Helios**](https://reactor.inc). It combines Reactor’s real-time, prompt-driven video generation with a **Gemini Live Voice Agent** running through a server-side WebSocket proxy.

The browser captures microphone audio and sends it to the Helios server. The server authenticates the signed-in user, obtains a Google Cloud access token from `GOOGLE_SERVICE_ACCOUNT_JSON`, and proxies the Live API session to Vertex AI. **The Google credential and access token never reach the browser.**

## Quick start

> **Start a standalone project:** `npx create-reactor-app my-app --model=helios` scaffolds this example into a fresh app. The steps below run this example from a monorepo checkout.

You need a Reactor API key, a Supabase project for sign-in, and a Google Cloud service account for Gemini Live.

```bash
cd examples/helios
cp .env.example .env
# Add REACTOR_API_KEY, Supabase values, and GOOGLE_SERVICE_ACCOUNT_JSON.

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then select **Connect Voice**. Wait for the “Gemini Live session ready” message before speaking or sending a text command.

## Voice Agent configuration

### Required server environment variables

| Variable                                              | Purpose                                                                                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_JSON`                         | The Google service-account JSON as a single-line JSON string or a base64-encoded JSON string. This is the only credential variable used by the Voice Agent. |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL used to verify the browser’s logged-in session.                                                                                        |
| `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key used to verify the browser’s logged-in session.                                                                                           |
| `REACTOR_API_KEY`                                     | Reactor API key used to create Helios sessions.                                                                                                             |

### Optional server environment variables

| Variable                | Default                              | Purpose                                                                             |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `GOOGLE_CLOUD_LOCATION` | `us-central1`                        | Vertex AI location. Set `global` only when it is available in the selected project. |
| `GOOGLE_CLOUD_PROJECT`  | Service-account `project_id`         | Explicit Google Cloud project override.                                             |
| `GEMINI_LIVE_MODEL`     | `gemini-live-2.5-flash-native-audio` | Supported Gemini Live model to use.                                                 |

Before starting the application, enable the Vertex AI API in the Google Cloud project and grant the service account a role that can invoke Vertex AI generative models, such as **Vertex AI User** (`roles/aiplatform.user`). Billing must also be enabled for the project.

> Do not expose `GOOGLE_SERVICE_ACCOUNT_JSON` in a `NEXT_PUBLIC_*` variable, client-side source, or browser request. The custom server reads it only when establishing the upstream Vertex AI WebSocket.

## Deployment

The Voice Agent needs a deployment that supports persistent WebSocket connections and custom Node servers. Railway is configured for this repository: it runs `pnpm --filter helios start`, which starts `examples/helios/server.mjs` and the Next.js application together.

1. Deploy the repository to Railway.
2. Add the required server environment variables above, including `GOOGLE_SERVICE_ACCOUNT_JSON`.
3. Generate a public domain, open the app through HTTPS, sign in, and allow microphone access.

Deployments that only run Next.js route handlers without a persistent WebSocket server need a separate authenticated WebSocket proxy; the built-in Voice Agent proxy cannot run there.

## What you can do

- **Voice or text-control the video stream.** Speak or type natural-language instructions such as “Make it rain in a cyberpunk city,” “Pause the video,” or “Resume generation.”
- **Start a scene from a text prompt.** Select a curated preset or use free text.
- **Start a scene from an image.** Use an example image or upload your own.
- **Evolve a scene mid-stream.** Hot-swap prompts without stopping video generation.
- **Snap a clip.** Download a recent section of the live stream.

## Architecture

```text
Browser microphone / text
        │  authenticated WebSocket
        ▼
Helios custom Node server ── service-account access token ──► Vertex AI Gemini Live
        │
        └── Supabase session verification
```

Gemini Live API expects raw 16-bit PCM audio at 16 kHz as input and returns 24 kHz PCM audio. The client keeps its capture graph connected through a muted node so browser audio processing continues reliably, and it waits for Google’s setup confirmation before sending media or commands.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Gemini Live 2.5 Flash Native Audio · Google Auth Library · `ws` · Supabase · [`@reactor-models/helios`](https://www.npmjs.com/package/@reactor-models/helios) · [`@reactor-team/js-sdk`](https://www.npmjs.com/package/@reactor-team/js-sdk)
