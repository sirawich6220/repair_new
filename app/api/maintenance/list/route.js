import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ดึงข้อมูลเรียงตามวันที่ล่าสุด
    const [rows] = await db.query(
      "SELECT * FROM maintenance_plans ORDER BY date DESC"
    );

    return NextResponse.json({ 
      success: true, 
      plans: rows 
    });

  } catch (error) {
    console.error("Fetch Maintenance Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}