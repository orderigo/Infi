import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import {
  getGeminiLiveConfig,
  getGoogleAccessToken,
} from "./server/gemini-live-config.mjs";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
const LIVE_PATH = "/api/gemini/live";
const MAX_PENDING_MESSAGES = 8;
const currentDirectory = fileURLToPath(new URL(".", import.meta.url));
const development = process.env.NODE_ENV !== "production";
const nextApp = next({ dev: development, dir: currentDirectory });
const handle = nextApp.getRequestHandler();

function getSupabaseConfiguration() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !anonKey) {
    throw new Error(
      "Voice Agent requires SUPABASE_URL and SUPABASE_ANON_KEY to authenticate the browser session",
    );
  }

  return { url: url.replace(/\/$/, ""), anonKey };
}

function getSessionAccessToken(request) {
  const protocols = String(request.headers["sec-websocket-protocol"] || "")
    .split(",")
    .map((protocol) => protocol.trim());
  const authProtocol = protocols.find((protocol) =>
    protocol.startsWith("auth."),
  );

  if (!authProtocol) {
    throw new Error("Voice Agent session token is missing");
  }

  return authProtocol.slice("auth.".length);
}

async function verifyBrowserSession(request) {
  const token = getSessionAccessToken(request);
  const { url, anonKey } = getSupabaseConfiguration();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Voice Agent session is invalid or expired");
  }
}

function modelResourceName({ projectId, location, model }) {
  return `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;
}

function normalizeSetupMessage(message, config) {
  let payload;
  try {
    payload = JSON.parse(message.toString());
  } catch {
    throw new Error("Voice Agent messages must be valid JSON");
  }

  if (!payload?.setup || typeof payload.setup !== "object") {
    throw new Error("The first Voice Agent message must be a session setup");
  }

  return JSON.stringify({
    ...payload,
    setup: {
      ...payload.setup,
      // Never allow a browser to select an arbitrary Vertex model.
      model: modelResourceName(config),
    },
  });
}

function closeSocket(socket, code, reason) {
  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  ) {
    socket.close(code, reason);
  }
}

async function createGeminiProxy(browserSocket) {
  const config = getGeminiLiveConfig();
  const accessToken = await getGoogleAccessToken(config.credentials);
  const upstreamSocket = new WebSocket(config.upstreamUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let upstreamReady = false;
  let setupReceived = false;
  const pendingMessages = [];

  const forwardBrowserMessage = (data, isBinary) => {
    if (isBinary) {
      throw new Error("Voice Agent only accepts JSON WebSocket messages");
    }

    const text = data.toString();
    const message = setupReceived ? text : normalizeSetupMessage(text, config);
    setupReceived = true;
    upstreamSocket.send(message);
  };

  browserSocket.on("message", (data, isBinary) => {
    try {
      if (!upstreamReady) {
        if (pendingMessages.length >= MAX_PENDING_MESSAGES) {
          throw new Error("Voice Agent is still connecting; please retry");
        }
        pendingMessages.push([data, isBinary]);
        return;
      }

      forwardBrowserMessage(data, isBinary);
    } catch (error) {
      console.error("Voice Agent client message rejected:", error);
      closeSocket(browserSocket, 1008, "Invalid Voice Agent request");
    }
  });

  browserSocket.on("close", () =>
    closeSocket(upstreamSocket, 1000, "Browser disconnected"),
  );
  browserSocket.on("error", (error) => {
    console.error("Voice Agent browser WebSocket error:", error);
    closeSocket(upstreamSocket, 1011, "Browser WebSocket error");
  });

  upstreamSocket.on("open", () => {
    upstreamReady = true;

    try {
      for (const [data, isBinary] of pendingMessages.splice(0)) {
        forwardBrowserMessage(data, isBinary);
      }
    } catch (error) {
      console.error("Voice Agent setup rejected:", error);
      closeSocket(browserSocket, 1008, "Invalid Voice Agent setup");
      closeSocket(upstreamSocket, 1000, "Invalid setup");
    }
  });

  upstreamSocket.on("message", (data, isBinary) => {
    if (browserSocket.readyState === WebSocket.OPEN) {
      browserSocket.send(data, { binary: isBinary });
    }
  });

  upstreamSocket.on("close", (code, reason) => {
    closeSocket(
      browserSocket,
      code === 1000 ? 1000 : 1011,
      reason.toString() || "Gemini Live connection closed",
    );
  });

  upstreamSocket.on("error", (error) => {
    console.error("Gemini Live upstream WebSocket error:", error);
    closeSocket(browserSocket, 1011, "Gemini Live connection failed");
  });
}

await nextApp.prepare();

const server = createServer((request, response) => handle(request, response));
const webSocketServer = new WebSocketServer({
  noServer: true,
  maxPayload: 2 * 1024 * 1024,
});

server.on("upgrade", async (request, socket, head) => {
  const requestUrl = new URL(
    request.url || "/",
    `http://${request.headers.host}`,
  );
  if (requestUrl.pathname !== LIVE_PATH) {
    socket.destroy();
    return;
  }

  try {
    await verifyBrowserSession(request);
    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  } catch (error) {
    console.error("Voice Agent WebSocket upgrade rejected:", error);
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
  }
});

webSocketServer.on("connection", (browserSocket) => {
  createGeminiProxy(browserSocket).catch((error) => {
    console.error("Voice Agent proxy setup failed:", error);
    closeSocket(browserSocket, 1011, "Voice Agent configuration failed");
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Helios listening on http://${HOSTNAME}:${PORT}`);
});
