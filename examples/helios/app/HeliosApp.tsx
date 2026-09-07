"use client";

import { useState } from "react";
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
import { AuthModal } from "./components/AuthModal";
import { useVoiceAgent } from "./lib/useVoiceAgent";
import { useAuth } from "./lib/useAuth";

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
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { setPrompt, pause, resume, reset, start } = useHelios();

  const voiceAgent = useVoiceAgent({
    onUpdatePrompt: (newPrompt: string) => {
      if (!user) {
        setAuthModalOpen(true);
        return;
      }
      setPrompt({ prompt: newPrompt });
      start();
    },
    onPause: () => pause(),
    onResume: () => resume(),
    onReset: () => reset(),
  });

  const handleConnectVoice = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    voiceAgent.connectVoiceAgent();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenAuth={() => setAuthModalOpen(true)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-6">
        {/* Video Main Section - Order 1 on mobile, Order 2 on desktop */}
        <section className="order-1 flex-1 lg:order-2 relative">
          <Video />
          {!user && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/70 backdrop-blur-md p-6 text-center">
              <p className="mb-4 text-sm font-mono text-cyan-300">
                Authentication Required to Generate Real-Time Video & Use Voice Agent
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="rounded-lg bg-cyan-500 px-6 py-2.5 text-xs font-mono font-bold text-zinc-950 transition hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                SIGN IN / REGISTER TO START
              </button>
            </div>
          )}
        </section>

        {/* Sidebar Controls - Order 2 on mobile, Order 1 on desktop */}
        <aside className="order-2 flex w-full flex-col gap-3 sm:gap-4 lg:order-1 lg:w-96 lg:shrink-0">
          <StatusBadge />
          <CommandError />
          <VoiceAgentPanel
            isConnected={voiceAgent.isConnected}
            isListening={voiceAgent.isListening}
            isSpeaking={voiceAgent.isSpeaking}
            messages={voiceAgent.messages}
            lastAction={voiceAgent.lastAction}
            onConnect={handleConnectVoice}
            onDisconnect={voiceAgent.disconnectVoiceAgent}
            onSendCommand={(cmd) => {
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              voiceAgent.sendVoiceCommand(cmd);
            }}
          />
          <NowPlaying />
          <EvolveScene />
          <PromptComposer />
          <ImageStarter />
          <SnapClip />
        </aside>
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
