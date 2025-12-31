import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT asset_code, asset_name FROM assets ORDER BY asset_code ASC`
    );

    return NextResponse.json({ success: true, assets: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
