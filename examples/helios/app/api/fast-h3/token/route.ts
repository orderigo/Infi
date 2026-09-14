import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin";

const MODEL_NAME = "reactor/fast-h3";
const MAX_SESSIONS = 10;
const TOKEN_LIFETIME_SECONDS = 60 * 60;

export const dynamic = "force-dynamic";

/**
 * Mints a short-lived browser token that is limited to Fast H3 sessions.
 * The browser never receives the account API key, and no-store is essential:
 * a session remains bound to the original JWT for its full lifetime.
 */
export async function GET() {
  const { user } = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to start a Fast H3 episode session." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const apiKey = process.env.REACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REACTOR_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_REACTOR_API_URL || "https://api.reactor.inc";
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/tokens`, {
      method: "POST",
      headers: {
        "Reactor-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: TOKEN_LIFETIME_SECONDS,
        authorization_details: [
          {
            type: "session",
            resources: { models: { match: [MODEL_NAME] } },
            constraints: { max_sessions: MAX_SESSIONS },
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Reactor token service." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Reactor /tokens returned ${response.status}.` },
      { status: 502 },
    );
  }

  const { jwt, expires_at } = (await response.json()) as {
    jwt: string;
    expires_at: number;
  };

  return NextResponse.json(
    { jwt, expires_at },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
