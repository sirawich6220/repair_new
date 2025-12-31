import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    // ❗ ถ้าไม่ส่ง user_id ห้ามดึงทั้งหมด
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "Missing user_id",
      });
    }

    const [rows] = await db.query(
      `
      SELECT 
        id,
        user_name,
        place,
        department,
        device_type,
        priority,
        description,
        status,
        created_at,
        updated_at,
        asset_code,
        asset_name
      FROM repairs
      WHERE user_id = ?        -- ✅ ดึงเฉพาะ user นั้น
      ORDER BY id DESC
    `,
      [userId]
    );

    return NextResponse.json({ success: true, repairs: rows });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
