import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req) {
  try {
    const { repair_id, sender, message } = await req.json();

    if (!repair_id || !message)
      return NextResponse.json({ success: false, error: "Missing data" });

    await db.query(
      `INSERT INTO repair_logs (repair_id, sender, message) VALUES (?, ?, ?)`,
      [repair_id, sender, message]
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
