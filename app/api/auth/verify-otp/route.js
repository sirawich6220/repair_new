import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // ถ้าจะใช้จริง ให้ติดตั้งและใช้

export async function POST(req) {
  try {
    const { username, otp, newPassword } = await req.json();

    if (!username || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    // หา user
    const [[user]] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      );
    }

    // หา OTP ที่ยังไม่ใช้และไม่หมดอายุ
    const [[otpRow]] = await db.query(
      `
      SELECT id, otp_code, expires_at, used
      FROM user_otp
      WHERE user_id = ?
        AND otp_code = ?
        AND used = 0
        AND expires_at > NOW()
      ORDER BY id DESC
      LIMIT 1
      `,
      [user.id, otp]
    );

    if (!otpRow) {
      return NextResponse.json(
        { success: false, message: "OTP ไม่ถูกต้อง หรือหมดอายุแล้ว" },
        { status: 400 }
      );
    }

    // TODO: แนะนำให้ใช้ bcrypt hash:
    const hash = await bcrypt.hash(newPassword, 10);
    // const hash = newPassword; // ❗ ตัวอย่างเท่านั้น ในจริงควรใช้ bcrypt

    

    // อัปเดตรหัสผ่าน
   await db.query(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [hash, user.id]
   );


    // mark OTP ว่าใช้แล้ว
    await db.query(
      "UPDATE user_otp SET used = 1 WHERE id = ?",
      [otpRow.id]
    );

    // ลบ OTP ที่หมดอายุหรือใช้แล้ว
    await db.query(`
        DELETE FROM user_otp 
        WHERE expires_at < NOW() OR used = 1
    `);

    return NextResponse.json({
      success: true,
      message: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว",
    });

  } catch (err) {
    console.error("❌ verify-otp error:", err);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
