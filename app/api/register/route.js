import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ ใช้ bcrypt ในการ hash

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      place,
      captchaToken 
    } = body;

    // ==========================================
    // 🛡️ PART 1: ตรวจสอบ Captcha (Bot Check)
    // ==========================================
    
    if (!captchaToken) {
        return NextResponse.json({ error: "กรุณายืนยันตัวตน (Captcha)" }, { status: 400 });
    }

    const secretKey = "6LdYOy8sAAAAAJRM_ZJ81TOjLb6TixtHkdXy0lPC"; 

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    const captchaRes = await fetch(verifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
        return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว หรือเป็นบอท" }, { status: 400 });
    }

    // ==========================================
    // 📝 PART 2: ตรวจสอบข้อมูลผู้ใช้ (Validation)
    // ==========================================

    if (!username || !password || !first_name || !last_name || !department) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const [existsUser] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existsUser.length > 0) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" },
        { status: 409 }
      );
    }

    const [existsEmail] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existsEmail.length > 0) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // ==========================================
    // 💾 PART 3: บันทึกลงฐานข้อมูล
    // ==========================================

    // 🔐 แปลงรหัสผ่านเป็น hash
    const password_hash = await bcrypt.hash(password, 10);

    // 🟢 กำหนดค่าเริ่มต้น
    const role = "user";
    const profile_id = 6; // 👈 กำหนดค่า profile เป็น 1 ตามที่คุณต้องการ

    // 💾 บันทึกลงฐานข้อมูล (เพิ่ม profile_id เข้าไปในรายการคอลัมน์)
    await db.query(
      `INSERT INTO users
      (first_name, last_name, email, phone, department, position, place, username, password_hash, role, profile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // 👈 เพิ่มเครื่องหมาย ? เป็น 11 ตัว
      [
        first_name,
        last_name,
        email,
        phone,
        department,
        position, 
        place,
        username,
        password_hash,
        role,
        profile_id, // 👈 ส่งค่า 1 เข้าฐานข้อมูล
      ]
    );

    return NextResponse.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ!",
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Server Error", detail: err.message },
      { status: 500 }
    );
  }
}