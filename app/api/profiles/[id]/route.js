import db from "@/lib/db";
import { NextResponse } from "next/server";

// 🟢 PUT: แก้ไขข้อมูล + อัปเดตสิทธิ์
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, permissions } = body; // รับ array permissions มาด้วย

    if (!name) return NextResponse.json({ error: "ระบุชื่อโปรไฟล์" }, { status: 400 });

    // 1. อัปเดตข้อมูลพื้นฐาน
    await db.query("UPDATE user_profiles SET name = ?, description = ? WHERE id = ?", [name, description, id]);

    // 2. ถ้ามีการส่งสิทธิ์มา ให้ทำการอัปเดต (ลบเก่า -> ใส่ใหม่)
    if (permissions && Array.isArray(permissions)) {
       // ลบสิทธิ์เดิมทั้งหมดของ Profile นี้
       await db.query("DELETE FROM profile_permissions WHERE profile_id = ?", [id]);

       // ใส่สิทธิ์ใหม่เข้าไป (ถ้ามีการเลือก)
       if (permissions.length > 0) {
           const values = permissions.map(permId => [id, permId]);
           await db.query("INSERT INTO profile_permissions (profile_id, permission_id) VALUES ?", [values]);
       }

       // อัปเดตจำนวนเมนู (menu_count) ในตารางหลัก
       await db.query("UPDATE user_profiles SET menu_count = ? WHERE id = ?", [permissions.length, id]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 🟢 GET: ดึงข้อมูลโปรไฟล์เดียว + สิทธิ์ที่มี (ไว้ใช้ตอนกด Edit)
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        
        // ดึง permission_id ที่ Profile นี้มีอยู่
        const [rows] = await db.query("SELECT permission_id FROM profile_permissions WHERE profile_id = ?", [id]);
        const permissionIds = rows.map(r => r.permission_id);

        return NextResponse.json({ success: true, permissionIds });
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

// ... (DELETE function เดิม ไม่ต้องแก้)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const [check] = await db.query("SELECT type FROM user_profiles WHERE id = ?", [id]);
    
    if (check.length === 0) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    if (check[0].type === 'system') return NextResponse.json({ error: "ลบโปรไฟล์ระบบไม่ได้" }, { status: 403 });

    await db.query("DELETE FROM user_profiles WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}