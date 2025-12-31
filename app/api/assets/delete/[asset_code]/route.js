import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    // ⭐ ต้อง await context.params เสมอ !
    const { asset_code } = await context.params;

    if (!asset_code) {
      return NextResponse.json({ success: false, error: "Missing asset code" });
    }

    const [result] = await db.query(
      "DELETE FROM assets WHERE asset_code = ?",
      [asset_code]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: "ไม่พบข้อมูลที่จะลบ",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
