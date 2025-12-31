import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing userId or message" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("LINE API ERROR:", data);
      return NextResponse.json(
        { success: false, data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("LINE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
