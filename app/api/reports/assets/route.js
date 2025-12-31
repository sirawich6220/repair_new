import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        COUNT(r.id) as repair_count,
        MAX(r.created_at) as last_repair_date
      FROM assets a
      LEFT JOIN repairs r ON a.asset_code = r.asset_code
      GROUP BY a.id
      -- เรียงตามปีงบฯ ล่าสุดก่อน -> แล้วเรียงตามลำดับ (แปลงเป็นตัวเลข) -> แล้วเรียงตามรหัส
      ORDER BY 
        a.fiscal_year DESC, 
        CAST(a.asset_sequence AS UNSIGNED) ASC, 
        a.asset_code ASC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}