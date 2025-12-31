import db from "@/lib/db";
import { NextResponse } from "next/server";
import { decodeIdWithDate } from "@/utils/base64";

export async function GET(req, context) {
  // ✅ ต้อง await params
  const { id: encoded } = await context.params;

  const decoded = decodeIdWithDate(encoded);

  if (!decoded?.id) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  const realId = decoded.id;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        r.*,
        a.asset_name,
        a.asset_category,
        a.asset_type
      FROM repairs r
      LEFT JOIN assets a 
        ON r.asset_code = a.asset_code
      WHERE r.id = ?
      `,
      [realId]
    );


    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อมูล" });
    }

    const repair = rows[0];
    repair.images = safeJSON(repair.images);

    const [logs] = await db.query(
      `SELECT id, message, sender, type, created_at
       FROM repair_logs
       WHERE repair_id = ?
       ORDER BY created_at ASC`,
      [realId]
    );

    return NextResponse.json({
      success: true,
      data: { ...repair, logs },
    });

  } catch (err) {
    console.error("🔥 VIEW ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

function safeJSON(json) {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}
