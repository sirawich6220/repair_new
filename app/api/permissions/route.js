import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM permissions ORDER BY group_name, id");
    return NextResponse.json({ success: true, permissions: rows });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching permissions" }, { status: 500 });
  }
}