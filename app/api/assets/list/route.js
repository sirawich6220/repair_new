import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM assets ORDER BY id DESC");

    return NextResponse.json({ success: true, assets: rows });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
