import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// 🟢 GET: ดึงข้อมูล (เพิ่มการ Join เพื่อเอาชื่อ Profile มาโชว์)
export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT u.*, p.name as profile_name 
      FROM users u 
      LEFT JOIN user_profiles p ON u.profile_id = p.id 
      ORDER BY u.id DESC
    `);
    return NextResponse.json({ users: rows });
  } catch (error) { /* ... */ }
}

// 🟢 POST: สร้าง User พร้อม Profile ID
export async function POST(req) {
  try {
    const body = await req.json();
    // 1. รับค่า profile_id มาด้วย
    const { username, password, first_name, last_name, department, role, profile_id } = body; 

    if (!username || !password || !first_name) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีแล้ว" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. เพิ่ม profile_id ในคำสั่ง SQL
    await db.query(
      `INSERT INTO users (username, password, first_name, last_name, department, role, profile_name, profile_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username, 
        hashedPassword, 
        first_name, 
        last_name, 
        department || '', 
        role || 'user', 
        role === 'admin' ? 'Admin' : 'User', // profile_name (ของเก่า)
        profile_id || null // 🟢 บันทึก ID ของ Profile ลงไป (ถ้าไม่มีให้เป็น NULL)
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}