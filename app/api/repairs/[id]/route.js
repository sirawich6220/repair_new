import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    // 🟢 Next.js 15 ต้อง await params
    const resolvedParams = await params;
    let id = resolvedParams.id;

    // 🚩 ตรวจสอบและป้องกันค่า [object Object]
    if (!id || String(id).includes("object") || isNaN(id)) {
       console.error("🚨 API Receive Invalid ID:", id);
       return NextResponse.json({ success: false, error: "Invalid ID Format" }, { status: 400 });
    }

    // 🔍 Query ข้อมูล (แนะนำให้ JOIN เพื่อเอาชื่อผู้แจ้งมาแสดงในใบซ่อม)
    const [rows] = await db.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM repairs r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`, 
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, repair: rows[0] });

  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}