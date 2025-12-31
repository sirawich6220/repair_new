import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM repairs ORDER BY id DESC"
    );

    return NextResponse.json({ success: true, repairs: rows });
  } catch (err) {
    console.error("LIST ERROR:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
