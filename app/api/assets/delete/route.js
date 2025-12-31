import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" });
    }

    await db.query("DELETE FROM assets WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
