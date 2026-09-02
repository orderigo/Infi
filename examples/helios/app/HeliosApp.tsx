"use client";

import { HeliosProvider, useHelios } from "@reactor-models/helios";
import { Header } from "./components/Header";
import { StatusBadge } from "./components/StatusBadge";
import { CommandError } from "./components/CommandError";
import { NowPlaying } from "./components/NowPlaying";
import { EvolveScene } from "./components/EvolveScene";
import { PromptComposer } from "./components/PromptComposer";
import { ImageStarter } from "./components/ImageStarter";
import { SnapClip } from "./components/SnapClip";
import { Video } from "./components/Video";
import { VoiceAgentPanel } from "./components/VoiceAgentPanel";
import { useVoiceAgent } from "./lib/useVoiceAgent";

async function fetchToken(): Promise<string> {
  const r = await fetch("/api/reactor/token");
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Token fetch failed: ${r.status}`);
  }
  const { jwt } = (await r.json()) as { jwt: string };
  return jwt;
}

function MainLayout() {
  const { setPrompt, pause, resume, reset, start } = useHelios();

  const voiceAgent = useVoiceAgent({
    onUpdatePrompt: (newPrompt: string) => {
      setPrompt({ prompt: newPrompt });
      start();
    },
    onPause: () => pause(),
    onResume: () => resume(),
    onReset: () => reset(),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
        <aside className="flex w-full flex-col gap-4 lg:w-96 lg:shrink-0">
          <StatusBadge />
          <CommandError />
          <VoiceAgentPanel
            isConnected={voiceAgent.isConnected}
            isListening={voiceAgent.isListening}
            isSpeaking={voiceAgent.isSpeaking}
            messages={voiceAgent.messages}
            lastAction={voiceAgent.lastAction}
            onConnect={voiceAgent.connectVoiceAgent}
            onDisconnect={voiceAgent.disconnectVoiceAgent}
            onSendCommand={voiceAgent.sendVoiceCommand}
          />
          <NowPlaying />
          <EvolveScene />
          <PromptComposer />
          <ImageStarter />
          <SnapClip />
        </aside>
        <section className="flex-1">
          <Video />
        </section>
      </main>
    </div>
  );
}

export function HeliosApp() {
  return (
    <HeliosProvider getJwt={fetchToken}>
      <MainLayout />
    </HeliosProvider>
  );
}
