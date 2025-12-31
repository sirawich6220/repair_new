import { NextResponse } from "next/server";
import pool from "@/lib/db"; // ใช้ @ แทน path ยาวๆ ได้ถ้าตั้งค่าไว้

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM repairs ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}