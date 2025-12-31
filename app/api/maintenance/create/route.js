import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { date, asset_code, description, responsible } = body;

    // ตรวจสอบข้อมูลจำเป็น
    if (!date || !asset_code) {
      return NextResponse.json({ error: "กรุณากรอกวันที่และเลือกครุภัณฑ์" }, { status: 400 });
    }

    // บันทึกลงฐานข้อมูล (Status เริ่มต้นเป็น 'pending')
    await db.query(
      `INSERT INTO maintenance_plans (date, asset_code, description, responsible, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [date, asset_code, description, responsible]
    );

    return NextResponse.json({ success: true, message: "บันทึกข้อมูลสำเร็จ" });

  } catch (error) {
    console.error("Create Plan Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}