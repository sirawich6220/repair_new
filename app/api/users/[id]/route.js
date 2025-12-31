import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// 🟢 PUT: แก้ไขข้อมูลผู้ใช้ (รวมถึง Profile ID)
export async function PUT(req, { params }) {
  try {
    const { id } = await params; // Next.js 15 ต้อง await
    const body = await req.json();
    
    // 1. รับค่า profile_id
    const { first_name, last_name, department, role, profile_id, password } = body;

    // 2. เตรียม Query อัปเดต (เพิ่ม profile_id = ?)
    let query = "UPDATE users SET first_name=?, last_name=?, department=?, role=?, profile_id=?";
    let values = [first_name, last_name, department, role, profile_id || null];

    // เช็คว่าเปลี่ยนรหัสผ่านไหม
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ", password=?";
      values.push(hashedPassword);
    }

    query += " WHERE id=?";
    values.push(id);

    // 3. ยิงลง Database
    await db.query(query, values);

    return NextResponse.json({ success: true, message: "แก้ไขข้อมูลสำเร็จ" });

  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "แก้ไขข้อมูลล้มเหลว" }, { status: 500 });
  }
}

// ... (DELETE function เดิม) ...
export async function DELETE(req, { params }) {
    const { id } = await params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
}