import db from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    // 1. รับ Token จาก Header (ใส่ await เพื่อความถูกต้องตาม Next.js 15+)
    const headersList = await headers(); 
    const token = headersList.get("authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    // 2. ตรวจสอบความถูกต้องของ Token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return NextResponse.json({ user: null, message: "Invalid Token" }, { status: 200 });
    }
    
    // 3. ดึงข้อมูล User (ต้องมั่นใจว่าดึง u.role มาด้วย)
    const [users] = await db.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.place, u.department, u.role, u.profile_id, p.name as profile_name 
       FROM users u 
       LEFT JOIN user_profiles p ON u.profile_id = p.id 
       WHERE u.id = ?`, 
      [decoded.id]
    );

    const user = users[0];
    if (!user) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    // 4. ดึง Permission Codes (ถ้ามี profile_id)
    let permissions = [];
    if (user.profile_id) {
        const [perms] = await db.query(
            `SELECT p.code 
             FROM permissions p
             JOIN profile_permissions pp ON p.id = pp.permission_id
             WHERE pp.profile_id = ?`,
            [user.profile_id]
        );
        permissions = perms.map(p => p.code);
    }

    // 5. ส่งข้อมูลกลับไปให้ Frontend
    return NextResponse.json({ 
        user: { 
            ...user, 
            permissions: permissions 
        } 
    });

  } catch (error) {
    console.error("API /me Error:", error);
    return NextResponse.json({ user: null, error: "Server Internal Error" }, { status: 500 });
  }
}