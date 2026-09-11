import { GoogleAuth } from "google-auth-library";

export const GEMINI_LIVE_MODEL = "gemini-live-2.5-flash-native-audio";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

function decodeBase64Json(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

/**
 * Parses the only supported credential variable. The JSON may be supplied
 * directly or base64-encoded by a deployment platform.
 */
export function parseGoogleServiceAccountJson(value) {
  if (!value || !value.trim()) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  }

  const candidate = value.trim();
  let parsed;

  try {
    parsed = JSON.parse(candidate);
  } catch {
    try {
      parsed = JSON.parse(decodeBase64Json(candidate));
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON must contain a service-account JSON object or its base64 encoding",
      );
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must decode to an object");
  }

  const credentials = {
    ...parsed,
    private_key:
      typeof parsed.private_key === "string"
        ? parsed.private_key.replace(/\\n/g, "\n")
        : parsed.private_key,
  };

  if (
    !credentials.project_id ||
    !credentials.client_email ||
    !credentials.private_key
  ) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON requires project_id, client_email, and private_key",
    );
  }

  return credentials;
}

export function buildVertexLiveWebSocketUrl(location) {
  const host =
    location === "global"
      ? "aiplatform.googleapis.com"
      : `${location}-aiplatform.googleapis.com`;

  return `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
}

export function getGeminiLiveConfig(environment = process.env) {
  const credentials = parseGoogleServiceAccountJson(
    environment.GOOGLE_SERVICE_ACCOUNT_JSON,
  );
  const projectId = environment.GOOGLE_CLOUD_PROJECT || credentials.project_id;
  const location = environment.GOOGLE_CLOUD_LOCATION || "us-central1";

  if (!projectId) {
    throw new Error(
      "Set GOOGLE_CLOUD_PROJECT or include project_id in GOOGLE_SERVICE_ACCOUNT_JSON",
    );
  }

  return {
    credentials,
    projectId,
    location,
    model: environment.GEMINI_LIVE_MODEL || GEMINI_LIVE_MODEL,
    upstreamUrl: buildVertexLiveWebSocketUrl(location),
  };
}

export async function getGoogleAccessToken(credentials) {
  const auth = new GoogleAuth({
    credentials,
    scopes: [CLOUD_PLATFORM_SCOPE],
  });
  const client = await auth.getClient();
  const response = await client.getAccessToken();

  if (!response.token) {
    throw new Error("Google authentication did not return an access token");
  }

  return response.token;
}
