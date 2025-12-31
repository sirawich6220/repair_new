import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM user_profiles ORDER BY type DESC, id ASC");
    return NextResponse.json({ success: true, profiles: rows });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) return NextResponse.json({ error: "ระบุชื่อโปรไฟล์" }, { status: 400 });

    // 1. Insert Profile
    const [result] = await db.query(
      "INSERT INTO user_profiles (name, description, type, menu_count) VALUES (?, ?, 'custom', ?)",
      [name, description || '', permissions ? permissions.length : 0]
    );
    
    const newProfileId = result.insertId;

    // 2. Insert Permissions (ถ้ามี)
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        const values = permissions.map(permId => [newProfileId, permId]);
        await db.query("INSERT INTO profile_permissions (profile_id, permission_id) VALUES ?", [values]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}