import { NextResponse } from "next/server";

const DEFAULT_MODEL_NAME = "reactor/helios";
const MAX_SESSIONS = 10;
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const CACHE_SKEW_SECONDS = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelName = searchParams.get("model") || DEFAULT_MODEL_NAME;

  const apiKey = process.env.REACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REACTOR_API_KEY is not set on the server" },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_REACTOR_API_URL || "https://api.reactor.inc";

  const res = await fetch(`${baseUrl}/tokens`, {
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
          resources: { models: { match: [modelName] } },
          constraints: { max_sessions: MAX_SESSIONS },
        },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Reactor /tokens returned ${res.status}` },
      { status: 502 },
    );
  }

  const { jwt, expires_at } = (await res.json()) as {
    jwt: string;
    expires_at: number;
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(0, expires_at - nowSeconds - CACHE_SKEW_SECONDS);

  return NextResponse.json(
    { jwt },
    {
      headers: {
        "Cache-Control": `private, max-age=${maxAge}`,
      },
    },
  );
}
