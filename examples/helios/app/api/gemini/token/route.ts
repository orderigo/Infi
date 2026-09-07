import { NextResponse } from "next/server";
import crypto from "crypto";

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, "base64");
  const encodedSignature = signature
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwtAssertion = `${signatureInput}.${encodedSignature}`;

  const params = new URLSearchParams();
  params.append(
    "grant_type",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  );
  params.append("assertion", jwtAssertion);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function GET() {
  try {
    const serviceAccountEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const apiKeyEnv = process.env.GEMINI_API_KEY;

    let accessToken = "";
    let projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    if (serviceAccountEnv) {
      let saJson;
      try {
        saJson = JSON.parse(serviceAccountEnv);
      } catch {
        const decoded = Buffer.from(serviceAccountEnv, "base64").toString("utf-8");
        saJson = JSON.parse(decoded);
      }

      projectId = saJson.project_id || projectId;
      const clientEmail = saJson.client_email;
      const privateKey = saJson.private_key;

      if (!clientEmail || !privateKey) {
        return NextResponse.json(
          { error: "Invalid GOOGLE_SERVICE_ACCOUNT_JSON format", fallback: true },
          { status: 200 }
        );
      }

      accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    } else if (apiKeyEnv) {
      return NextResponse.json({
        apiKey: apiKeyEnv,
        projectId,
        location,
      });
    } else {
      return NextResponse.json({
        fallback: true,
        message: "GEMINI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON is not configured on server.",
        projectId,
        location,
      });
    }

    return NextResponse.json({
      accessToken,
      projectId,
      location,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in gemini token API:", message);
    return NextResponse.json({ error: message, fallback: true }, { status: 200 });
  }
}
