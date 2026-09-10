import { NextResponse } from "next/server";
import { JWT } from "google-auth-library";

interface ServiceAccountCredentials {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
}

export async function GET() {
  try {
    const serviceAccountEnv =
      process.env.GCP_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const apiKeyEnv = process.env.GEMINI_API_KEY;

    let projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    if (serviceAccountEnv) {
      let credentials: ServiceAccountCredentials;
      try {
        credentials = JSON.parse(serviceAccountEnv);
      } catch {
        const decoded = Buffer.from(serviceAccountEnv, "base64").toString(
          "utf-8",
        );
        credentials = JSON.parse(decoded);
      }

      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
      }

      projectId = credentials.project_id || projectId;

      if (!credentials.client_email || !credentials.private_key || !projectId) {
        return NextResponse.json(
          {
            error:
              "Invalid service account key: project_id, client_email, and private_key are required",
          },
          { status: 500 },
        );
      }

      const jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      const tokenResponse = await jwtClient.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        return NextResponse.json(
          { error: "Failed to retrieve access token from Google Auth" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        accessToken,
        projectId,
        location,
      });
    }

    if (apiKeyEnv) {
      return NextResponse.json({
        apiKey: apiKeyEnv,
        projectId,
        location,
      });
    }

    return NextResponse.json(
      {
        error:
          "GEMINI voice credentials are not configured. Set GCP_SERVICE_ACCOUNT_KEY in Vercel Environment Variables.",
        projectId,
        location,
      },
      { status: 500 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in gemini token API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
