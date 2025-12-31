import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params; 

    // --- แก้ไขตรงนี้ ---
    // ถ้าใช้ [...id] ค่าที่ได้จะเป็น Array เช่น ['7110-001-0004', '1']
    // เราต้องเอามาต่อกันด้วย '/' เพื่อให้กลับเป็นเลขครุภัณฑ์เต็มๆ
    let assetId = Array.isArray(id) ? id.join('/') : id;
    
    // เผื่อกรณีมีการ encode มา ก็ decode กลับ
    assetId = decodeURIComponent(assetId);
    // ----------------

    console.log("Searching Asset ID:", assetId); // เช็ค Log ดูค่าที่ได้

    const [rows] = await db.query(
      "SELECT * FROM assets WHERE id = ? LIMIT 1", // ตรวจสอบชื่อ column ใน db ด้วยนะครับว่าชื่อ id หรือ code
      [assetId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลครุภัณฑ์รหัสนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: rows[0]
    });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}