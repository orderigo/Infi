"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HELIOS_VOICE_TOOLS, type VoiceMessage } from "./voiceAgent";

export interface ToolCallHandlerProps {
  onUpdatePrompt?: (prompt: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  onSnapClip?: () => void;
}

// Convert Float32Array audio buffer to 16kHz 16-bit PCM Int16Array / Base64
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== "undefined" ? btoa(binary) : "";
}

function base64ToFloat32PCM(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numSamples = Math.floor(len / 2);
  const float32Array = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32Array[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);
  }
  return float32Array;
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
  const nextAudioStartTimeRef = useRef<number>(0);

  const playIncomingPcmAudio = useCallback((base64Pcm: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const float32Data = base64ToFloat32PCM(base64Pcm);
      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      const startTime = Math.max(currentTime, nextAudioStartTimeRef.current);
      source.start(startTime);
      nextAudioStartTimeRef.current = startTime + audioBuffer.duration;

      setIsSpeaking(true);
      source.onended = () => {
        if (audioCtx.currentTime >= nextAudioStartTimeRef.current - 0.05) {
          setIsSpeaking(false);
        }
      };
    } catch (err) {
      console.error("Error playing incoming PCM audio:", err);
    }
  }, []);

  const handleToolCall = useCallback(
    (functionCalls: Array<{ name: string; args: Record<string, unknown>; id: string }>) => {
      const responses: Array<{ response: { output: Record<string, unknown> }; id: string }> = [];

      for (const call of functionCalls) {
        const { name, args, id } = call;
        let resultMsg = "";

        if (name === "update_video_prompt") {
          const prompt = (args.prompt as string) || "";
          toolHandlers.onUpdatePrompt?.(prompt);
          setLastAction(`update_video_prompt("${prompt}")`);
          resultMsg = `Updated video prompt to: "${prompt}"`;
        } else if (name === "pause_video") {
          toolHandlers.onPause?.();
          setLastAction("pause_video()");
          resultMsg = "Paused video generation stream.";
        } else if (name === "resume_video") {
          toolHandlers.onResume?.();
          setLastAction("resume_video()");
          resultMsg = "Resumed real-time video generation.";
        } else if (name === "reset_video") {
          toolHandlers.onReset?.();
          setLastAction("reset_video()");
          resultMsg = "Reset video generation session.";
        } else if (name === "snap_clip") {
          toolHandlers.onSnapClip?.();
          setLastAction("snap_clip()");
          resultMsg = "Snapped video clip.";
        }

        if (resultMsg) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: "gemini",
              text: `⚡ Executed tool: ${name} → ${resultMsg}`,
              timestamp: new Date(),
            },
          ]);
        }

        responses.push({
          response: { output: { success: true, message: resultMsg } },
          id,
        });
      }

      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        const toolResponsePayload = {
          toolResponse: {
            functionResponses: responses,
          },
        };
        webSocketRef.current.send(JSON.stringify(toolResponsePayload));
      }
    },
    [toolHandlers]
  );

  const connectVoiceAgent = useCallback(async () => {
    try {
      if (webSocketRef.current || isConnected) return;

      const tokenRes = await fetch("/api/gemini/token", { cache: "no-store" });
      const tokenData = await tokenRes.json().catch(() => ({ fallback: true }));

      if (!tokenRes.ok) {
        throw new Error(
          (tokenData as { error?: string }).error ||
            `Gemini token endpoint failed (${tokenRes.status})`
        );
      }

      const { accessToken, apiKey, projectId, location, fallback } = tokenData as {
        accessToken?: string;
        apiKey?: string;
        projectId: string;
        location: string;
        fallback?: boolean;
      };

      if (fallback || (!accessToken && !apiKey)) {
        setIsConnected(true);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "gemini",
            text: "Voice Agent connected in assistant mode. Add GCP_SERVICE_ACCOUNT_KEY to the server environment to enable live microphone audio.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (e) {
        console.warn("Microphone access not granted or unavailable:", e);
      }

      let wsUrl = "";
      if (accessToken) {
        const host = `${location}-aiplatform.googleapis.com`;
        wsUrl = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?project=${encodeURIComponent(projectId)}&location=${encodeURIComponent(location)}&access_token=${encodeURIComponent(accessToken)}`;
      } else if (apiKey) {
        wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;
      }

      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      let setupComplete = false;

      ws.onopen = () => {
        setIsConnected(true);

        const modelPath = accessToken
          ? `projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash`
          : "models/gemini-2.0-flash";

        const setupMessage = {
          setup: {
            model: modelPath,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck",
                  },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: "You are an AI video stream director. Your job is to listen to the user and steer real-time video generation by executing function tools: update_video_prompt, pause_video, resume_video, reset_video, or snap_clip. Always call function tools when the user requests actions or new scene concepts.",
                },
              ],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: HELIOS_VOICE_TOOLS,
          },
        };

        ws.send(JSON.stringify(setupMessage));

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "gemini",
            text: "Gemini Live WebSocket opened. Waiting for session setup confirmation...",
            timestamp: new Date(),
          },
        ]);

        if (stream && audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
          scriptProcessorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputBuffer = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputBuffer.length; i++) {
              sum += Math.abs(inputBuffer[i]);
            }
            const avgVolume = sum / inputBuffer.length;
            setIsListening(avgVolume > 0.01);

            if (
              setupComplete &&
              webSocketRef.current &&
              webSocketRef.current.readyState === WebSocket.OPEN
            ) {
              const pcmBuffer = floatTo16BitPCM(inputBuffer);
              const base64Audio = arrayBufferToBase64(pcmBuffer);

              const audioChunkPayload = {
                realtimeInput: {
                  mediaChunks: [
                    {
                      mimeType: "audio/pcm",
                      data: base64Audio,
                    },
                  ],
                },
              };
              webSocketRef.current.send(JSON.stringify(audioChunkPayload));
            }
          };

          source.connect(processor);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.setupComplete) {
            setupComplete = true;
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: "gemini",
                text: "Gemini Live session ready. Speak into your mic or type commands.",
                timestamp: new Date(),
              },
            ]);
          }

          if (data.toolCall && data.toolCall.functionCalls) {
            handleToolCall(data.toolCall.functionCalls);
          }

          const inputTranscript = data.inputTranscription?.text;
          const outputTranscript = data.outputTranscription?.text;
          if (inputTranscript || outputTranscript) {
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: inputTranscript ? "user" : "gemini",
                text: inputTranscript || outputTranscript,
                timestamp: new Date(),
              },
            ]);
          }

          if (data.serverContent) {
            const modelTurn = data.serverContent.modelTurn;

            if (modelTurn && modelTurn.parts) {
              for (const part of modelTurn.parts) {
                if (part.text) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      sender: "gemini",
                      text: part.text,
                      timestamp: new Date(),
                    },
                  ]);
                }
                if (part.inlineData && part.inlineData.data) {
                  playIncomingPcmAudio(part.inlineData.data);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error processing WebSocket message from Gemini:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Gemini WebSocket error:", err);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        webSocketRef.current = null;
        if (event.code !== 1000) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: "gemini",
              text: `Voice connection closed (${event.code}). ${event.reason || "Check the Gemini model, Vertex AI permissions, and server environment variables."}`,
              timestamp: new Date(),
            },
          ]);
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to connect Voice Agent:", msg);
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "gemini",
          text: `Voice Agent connection failed: ${msg}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [handleToolCall, playIncomingPcmAudio, isConnected]);

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

      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        const textPayload = {
          clientContent: {
            turns: [
              {
                role: "user",
                parts: [{ text }],
              },
            ],
            turnComplete: true,
          },
        };
        webSocketRef.current.send(JSON.stringify(textPayload));
      } else {
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
      }
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
    connectVoiceAgent,
    disconnectVoiceAgent,
    sendVoiceCommand,
    tools: HELIOS_VOICE_TOOLS,
  };
}
