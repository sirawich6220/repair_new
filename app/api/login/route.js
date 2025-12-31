import { NextResponse } from "next/server";
import db from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, password, captchaToken } = await req.json();

    // Debug: ดูค่าที่รับมา
    console.log(`🔹 Login Attempt: User [${username}] via ${captchaToken === "ios-app-secret-bypass-1234" ? "iOS App" : "Web"}`);

    // 1. ตรวจสอบ Captcha
    if (!captchaToken) {
        return NextResponse.json({ success: false, message: "กรุณายืนยันตัวตน (Captcha)" }, { status: 400 });
    }

    // ============================================================
    // 🟢 BYPASS CHECK
    // ============================================================
    if (captchaToken !== "ios-app-secret-bypass-1234") {
        const secretKey = "6LdYOy8sAAAAAJRM_ZJ81TOjLb6TixtHkdXy0lPC"; // Test Key
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
        
        const captchaRes = await fetch(verifyUrl, { method: "POST" });
        const captchaData = await captchaRes.json();

        if (!captchaData.success) {
            console.error("❌ Captcha Failed");
            return NextResponse.json({ success: false, message: "Captcha ไม่ถูกต้อง" }, { status: 400 });
        }
    } else {
        console.log("🔓 iOS Bypass Success");
    }
    // ============================================================

    // 2. ตรวจสอบข้อมูลนำเข้า
    if (!username || !password) {
      console.log("❌ Missing Username/Password");
      return NextResponse.json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    // 3. ค้นหา User
    const [rows] = await db.query("SELECT * FROM users WHERE username = ? OR email = ?", [
      username, username, 
    ]);

    if (rows.length === 0) {
      console.log("❌ User Not Found");
      return NextResponse.json({ success: false, message: "ไม่พบบัญชีผู้ใช้นี้" }, { status: 400 });
    }

    const user = rows[0];

    // 4. ตรวจสอบรหัสผ่าน
    const isMatch = await comparePassword(password, user.password_hash); 
    
    if (!isMatch) {
      console.log("❌ Wrong Password");
      return NextResponse.json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" }, { status: 400 });
    }

    // 5. สร้าง Token
    const token = await generateToken({
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    });

    console.log("✅ Login Success");

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("🔥 Server Error:", err);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" }, { status: 500 });
  }
}