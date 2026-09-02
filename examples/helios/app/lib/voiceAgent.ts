// Tools / Function declarations exported to Gemini 2.5 Flash Voice Agent
export const HELIOS_VOICE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "update_video_prompt",
        description:
          "Updates or hot-swaps the current video generation text prompt in real-time without stopping the video stream.",
        parameters: {
          type: "OBJECT",
          properties: {
            prompt: {
              type: "STRING",
              description:
                "Detailed visual prompt description of the scene to generate.",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "pause_video",
        description: "Pauses the live real-time video generation.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "resume_video",
        description: "Resumes the live real-time video generation.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "reset_video",
        description:
          "Resets the current video session and returns to the initial setup phase.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "snap_clip",
        description: "Captures and downloads a video clip of the live stream.",
        parameters: {
          type: "OBJECT",
          properties: {
            duration_seconds: {
              type: "NUMBER",
              description: "Length of the clip in seconds (default 10).",
            },
          },
        },
      },
    ],
  },
];

export interface VoiceMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: Date;
}

export interface VoiceToolCall {
  name: string;
  args: Record<string, unknown>;
  callId: string;
}
