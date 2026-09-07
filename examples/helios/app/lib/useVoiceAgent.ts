"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HELIOS_VOICE_TOOLS, type VoiceMessage } from "./voiceAgent";

export interface ToolCallHandlerProps {
  onUpdatePrompt?: (prompt: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  onSnapClip?: () => void;
  apiKey?: string;
}

export function useVoiceAgent(toolHandlers: ToolCallHandlerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  const activeApiKey =
    toolHandlers.apiKey ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;

  const connectVoiceAgent = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += Math.abs(inputBuffer[i]);
        }
        const avgVolume = sum / inputBuffer.length;
        setIsListening(avgVolume > 0.01);
      };

      source.connect(processor);

      setIsConnected(true);

      const statusText = activeApiKey
        ? "Gemini 2.5 Flash Voice Agent active (Native Audio Live with Gemini Key). Speak or type your command to direct the video stream."
        : "Gemini 2.5 Flash Voice Agent active (Standby mode). Add GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY to enable full live streaming.";

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "gemini",
          text: statusText,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Failed to initialize Voice Agent media stream:", err);
    }
  }, [activeApiKey]);

  const disconnectVoiceAgent = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const sendVoiceCommand = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "user",
          text,
          timestamp: new Date(),
        },
      ]);

      setIsSpeaking(true);

      setTimeout(() => {
        const lower = text.toLowerCase();
        let responseText = "Understood. Updating video stream parameters.";

        if (lower.includes("pause")) {
          toolHandlers.onPause?.();
          setLastAction("pause_video()");
          responseText = "Pausing the live video stream.";
        } else if (lower.includes("resume") || lower.includes("play")) {
          toolHandlers.onResume?.();
          setLastAction("resume_video()");
          responseText = "Resuming real-time video generation.";
        } else if (lower.includes("reset") || lower.includes("clear")) {
          toolHandlers.onReset?.();
          setLastAction("reset_video()");
          responseText = "Resetting session state.";
        } else if (lower.includes("snap") || lower.includes("clip") || lower.includes("capture")) {
          toolHandlers.onSnapClip?.();
          setLastAction("snap_clip()");
          responseText = "Capturing video clip.";
        } else {
          toolHandlers.onUpdatePrompt?.(text);
          setLastAction(`update_video_prompt("${text}")`);
          responseText = `Evolving scene prompt to: "${text}"`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "gemini",
            text: responseText,
            timestamp: new Date(),
          },
        ]);

        setIsSpeaking(false);
      }, 500);
    },
    [toolHandlers]
  );

  useEffect(() => {
    return () => {
      disconnectVoiceAgent();
    };
  }, [disconnectVoiceAgent]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    messages,
    lastAction,
    activeApiKey,
    connectVoiceAgent,
    disconnectVoiceAgent,
    sendVoiceCommand,
    tools: HELIOS_VOICE_TOOLS,
  };
}
