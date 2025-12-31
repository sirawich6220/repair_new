import db from "@/lib/db";
import { NextResponse } from "next/server";
import { sendLineFlex } from "@/utils/line";
import { otpFlex } from "@/utils/line";

export async function POST(req) {
  try {
    // 🟢 1. รับค่า phone เพิ่มเข้ามา
    const { username, phone } = await req.json();

    if (!username || !phone) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอก Username และเบอร์โทรศัพท์" },
        { status: 400 }
      );
    }

    // 🟢 2. แก้ Query ให้เช็คทั้ง username และ phone (ต้องตรงกันทั้งคู่)
    // หมายเหตุ: ตรวจสอบให้แน่ใจว่าในตาราง users ของคุณใช้ชื่อคอลัมน์ว่า 'phone' หรือ 'phone_number' แล้วแก้ให้ตรงกัน
    const [[user]] = await db.query(
      "SELECT id, username, line_user_id FROM users WHERE username = ? AND phone = ?",
      [username, phone]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง หรือเบอร์โทรศัพท์ไม่ตรงกับที่ลงทะเบียนไว้" },
        { status: 404 }
      );
    }

    if (!user.line_user_id) {
      return NextResponse.json(
        { success: false, message: "ผู้ใช้นี้ยังไม่ได้ผูกกับ LINE OA" },
        { status: 400 }
      );
    }

    
    // สร้าง OTP 6 หลัก
    const otpCode = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    // บันทึก OTP ลงฐานข้อมูล (หมดอายุ 5 นาที)
    await db.query(
      `
      INSERT INTO user_otp (user_id, otp_code, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      `,
      [user.id, otpCode]
    );

    // ส่ง OTP ผ่าน LINE OA
    await sendLineFlex(user.line_user_id, otpFlex(otpCode));

    return NextResponse.json({
      success: true,
      message: "ส่งรหัส OTP ไปยังบัญชี LINE ของคุณแล้ว",
    });

  } catch (err) {
    console.error("❌ request-otp error:", err);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}