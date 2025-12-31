import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ⚠️ แก้ตรงนี้: เปลี่ยน assets_type เป็นชื่อคอลัมน์ที่ถูกต้องใน DB ของคุณ
    // ตัวอย่าง: สมมติว่าใน DB ชื่อ 'asset_type'
    const correctColumnName = "asset_type"; 

    const query = `
      SELECT DISTINCT ${correctColumnName} 
      FROM assets 
      WHERE ${correctColumnName} IS NOT NULL AND ${correctColumnName} != ''
      ORDER BY ${correctColumnName} ASC
    `;

    const [rows] = await db.query(query);

    // map ข้อมูลออกมา
    const typeList = rows.map((row) => row[correctColumnName]);

    return NextResponse.json(typeList);

  } catch (err) {
    console.log("FETCH ASSETS ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}