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
import { LingbotWorld2Tab } from "./components/lingbot-world-2/LingbotWorld2Tab";
import { useVoiceAgent } from "./lib/useVoiceAgent";
import { useAuth } from "./lib/useAuth";

async function fetchToken(): Promise<string> {
  const r = await fetch("/api/reactor/token?model=reactor/helios");
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Token fetch failed: ${r.status}`);
  }
  const { jwt } = (await r.json()) as { jwt: string };
  return jwt;
}

function HeliosMainSection({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user } = useAuth();
  const { setPrompt, pause, resume, reset, start } = useHelios();

  const voiceAgent = useVoiceAgent({
    onUpdatePrompt: (newPrompt: string) => {
      if (!user) {
        onOpenAuth();
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
      onOpenAuth();
      return;
    }
    voiceAgent.connectVoiceAgent();
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-6">
      {/* Video Main Section - Order 1 on mobile, Order 2 on desktop */}
      <section className="relative order-1 flex-1 lg:order-2">
        <Video />
        {!user && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/70 p-6 text-center backdrop-blur-md">
            <p className="mb-4 font-mono text-sm text-cyan-300">
              Authentication Required to Generate Real-Time Video & Use Voice Agent
            </p>
            <button
              onClick={onOpenAuth}
              className="rounded-lg bg-cyan-500 px-6 py-2.5 font-mono text-xs font-bold text-zinc-950 transition hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
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
              onOpenAuth();
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
  );
}

export function HeliosApp() {
  const [activeTab, setActiveTab] = useState<"helios" | "explore">("helios");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {activeTab === "helios" ? (
        <HeliosProvider getJwt={fetchToken}>
          <HeliosMainSection onOpenAuth={() => setAuthModalOpen(true)} />
        </HeliosProvider>
      ) : (
        <main className="flex flex-1 flex-col p-3 sm:p-4 lg:p-6">
          <LingbotWorld2Tab onOpenAuth={() => setAuthModalOpen(true)} />
        </main>
      )}
    </div>
  );
}
