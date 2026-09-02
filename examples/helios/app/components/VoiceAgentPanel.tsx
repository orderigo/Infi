"use client";

import { useState } from "react";
import type { VoiceMessage } from "../lib/voiceAgent";

interface VoiceAgentPanelProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  messages: VoiceMessage[];
  lastAction: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSendCommand: (command: string) => void;
}

export function VoiceAgentPanel({
  isConnected,
  isListening,
  isSpeaking,
  messages,
  lastAction,
  onConnect,
  onDisconnect,
  onSendCommand,
}: VoiceAgentPanelProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendCommand(inputText);
    setInputText("");
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-zinc-950/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected
                ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                : "bg-zinc-600"
            }`}
          />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 sm:text-xs">
            Voice Agent · Gemini 2.5 Flash
          </span>
        </div>

        <button
          onClick={isConnected ? onDisconnect : onConnect}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition-all sm:px-3 sm:text-xs ${
            isConnected
              ? "border border-red-500/40 bg-red-950/30 text-red-400 hover:bg-red-900/50"
              : "border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          }`}
        >
          {isConnected ? "DISCONNECT" : "CONNECT VOICE"}
        </button>
      </div>

      {/* Audio Waveform & Status Visualizer */}
      {isConnected && (
        <div className="my-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 sm:my-3 sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-zinc-400 sm:text-[11px]">
            <span>
              STATUS:{" "}
              <strong
                className={
                  isSpeaking
                    ? "text-cyan-400"
                    : isListening
                    ? "text-emerald-400"
                    : "text-zinc-400"
                }
              >
                {isSpeaking
                  ? "SPEAKING AUDIO"
                  : isListening
                  ? "LISTENING..."
                  : "STANDBY"}
              </strong>
            </span>
            <span className="hidden sm:inline">MODEL: GEMINI-2.5-FLASH</span>
          </div>

          {/* High-tech Audio Frequency Bars Animation */}
          <div className="mt-2 flex items-center justify-center gap-1 sm:gap-1.5 h-6 sm:h-8">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? "bg-cyan-400 animate-pulse"
                    : isListening
                    ? "bg-emerald-400"
                    : "bg-zinc-700"
                }`}
                style={{
                  height: isSpeaking
                    ? `${Math.max(20, Math.sin(i + Date.now()) * 100)}%`
                    : isListening
                    ? `${Math.max(15, (i % 5) * 20)}%`
                    : "20%",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Last Executed Tool Call HUD Badge */}
      {lastAction && (
        <div className="mb-2.5 rounded-md border border-cyan-500/30 bg-cyan-950/20 p-1.5 text-[10px] font-mono text-cyan-300 sm:mb-3 sm:p-2 sm:text-[11px]">
          <span className="text-zinc-400">EXECUTED FUNCTION: </span>
          <code>{lastAction}</code>
        </div>
      )}

      {/* Transcript Log */}
      <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs font-sans sm:max-h-40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-2 sm:p-2.5 border ${
              msg.sender === "user"
                ? "border-zinc-800 bg-zinc-900/60 text-zinc-200 ml-2 sm:ml-4"
                : "border-cyan-500/20 bg-cyan-950/20 text-cyan-100 mr-2 sm:mr-4"
            }`}
          >
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-1 sm:text-[10px]">
              <span>{msg.sender === "user" ? "USER" : "GEMINI 2.5 FLASH"}</span>
              <span>{msg.timestamp.toLocaleTimeString()}</span>
            </div>
            <p className="leading-snug">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Direct Voice / Text Command Input */}
      {isConnected && (
        <form onSubmit={handleSubmit} className="mt-2.5 flex gap-2 sm:mt-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type instruction..."
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none sm:px-3"
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-mono font-semibold text-zinc-950 hover:bg-cyan-400"
          >
            SEND
          </button>
        </form>
      )}
    </div>
  );
}
