import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { ids } = await req.json(); // รับ array ของ id ที่จะลบ เช่น [1, 2]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลที่ต้องการลบ" }, { status: 400 });
    }

    // แปลง array เป็น string สำหรับ SQL IN (...)
    // วิธีนี้ปลอดภัยกว่าการต่อ string ตรงๆ แต่ต้องระวัง SQL Injection
    // ในที่นี้เราใช้ '?' ตามจำนวน ID เพื่อใช้ Parameterized Query
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM maintenance_plans WHERE id IN (${placeholders})`;

    await db.query(query, ids);

    return NextResponse.json({ 
      success: true, 
      message: `ลบข้อมูล ${ids.length} รายการสำเร็จ` 
    });

  } catch (error) {
    console.error("Delete Maintenance Error:", error);
    return NextResponse.json({ error: "ลบข้อมูลล้มเหลว" }, { status: 500 });
  }
}