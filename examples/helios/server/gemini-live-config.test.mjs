import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVertexLiveWebSocketUrl,
  getGeminiLiveConfig,
  parseGoogleServiceAccountJson,
} from "./gemini-live-config.mjs";

const credentials = {
  type: "service_account",
  project_id: "voice-project",
  client_email: "voice-agent@voice-project.iam.gserviceaccount.com",
  private_key:
    "-----BEGIN PRIVATE KEY-----\\nexample\\n-----END PRIVATE KEY-----\\n",
};

test("parses GOOGLE_SERVICE_ACCOUNT_JSON and restores private-key line breaks", () => {
  const result = parseGoogleServiceAccountJson(JSON.stringify(credentials));

  assert.equal(result.project_id, "voice-project");
  assert.match(result.private_key, /\nexample\n/);
});

test("accepts base64-encoded GOOGLE_SERVICE_ACCOUNT_JSON", () => {
  const encoded = Buffer.from(JSON.stringify(credentials)).toString("base64");
  const result = parseGoogleServiceAccountJson(encoded);

  assert.equal(result.client_email, credentials.client_email);
});

test("uses GOOGLE_SERVICE_ACCOUNT_JSON rather than the legacy variable", () => {
  const result = getGeminiLiveConfig({
    GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(credentials),
    GCP_SERVICE_ACCOUNT_KEY: "not-used",
    GOOGLE_CLOUD_LOCATION: "us-central1",
  });

  assert.equal(result.projectId, "voice-project");
  assert.equal(result.model, "gemini-live-2.5-flash-native-audio");
  assert.equal(
    result.upstreamUrl,
    "wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent",
  );
});

test("honors an explicit Vertex project override", () => {
  const result = getGeminiLiveConfig({
    GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(credentials),
    GOOGLE_CLOUD_PROJECT: "vertex-billing-project",
  });

  assert.equal(result.projectId, "vertex-billing-project");
});

test("uses the global Vertex host when configured", () => {
  assert.equal(
    buildVertexLiveWebSocketUrl("global"),
    "wss://aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent",
  );
});

test("rejects incomplete service-account credentials", () => {
  assert.throws(
    () => parseGoogleServiceAccountJson('{"project_id":"missing-key"}'),
    /requires project_id, client_email, and private_key/,
  );
});
