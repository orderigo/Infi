import { NextResponse } from "next/server";
import { DataPacket_Kind, RoomServiceClient } from "livekit-server-sdk";
import { getAdminUser } from "../../../lib/admin";
import {
  getIdea,
  listIdeas,
  markPromoted,
  recordIdea,
} from "../../../lib/communityStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin)
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  return NextResponse.json(
    { ideas: listIdeas() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idea = recordIdea(
    String(body.author || "viewer"),
    String(body.text || "")
      .trim()
      .slice(0, 500),
  );
  if (!idea)
    return NextResponse.json({ error: "Idea is required" }, { status: 400 });
  return NextResponse.json({ idea }, { status: 201 });
}

export async function PUT(request: Request) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin)
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const idea = getIdea(String(body.id || ""));
  if (!idea)
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret)
    return NextResponse.json(
      { error: "LiveKit is not configured" },
      { status: 503 },
    );
  const room = process.env.LIVEKIT_ROOM || "fast-h3-livestream";
  const client = new RoomServiceClient(url.replace(/^ws/, "http"), key, secret);
  await client.sendData(
    room,
    new TextEncoder().encode(
      JSON.stringify({
        type: "promote_idea",
        author: "community",
        text: idea.text,
      }),
    ),
    DataPacket_Kind.RELIABLE,
    { topic: "show.chat" },
  );
  markPromoted(idea.id);
  return NextResponse.json({ idea });
}
