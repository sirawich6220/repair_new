import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // รับค่า keyword แทน asset_code เพราะอาจจะเป็นชื่อก็ได้
    const { keyword } = await req.json(); 

    // SQL: ค้นหาว่า keyword ไปตรงกับ asset_code หรือ asset_name หรือไม่
    // ใช้ LIKE %...% เพื่อให้ค้นหาบางส่วนของคำได้
    const query = `
      SELECT * FROM assets 
      WHERE asset_code LIKE ? OR asset_name LIKE ? 
      LIMIT 20
    `;
    const searchValue = `%${keyword}%`;

    const [rows] = await db.query(query, [searchValue, searchValue]);

    if (rows.length === 0) {
      return NextResponse.json({ found: false, message: "ไม่พบข้อมูล" });
    }

    // ส่งกลับไปทั้งหมดที่เจอ (Array) ให้ Frontend ตัดสินใจต่อ
    return NextResponse.json({ 
      found: true, 
      count: rows.length,
      data: rows 
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}