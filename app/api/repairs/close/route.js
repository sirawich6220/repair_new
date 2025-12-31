import db from "@/lib/db";
import { NextResponse } from "next/server";
import { sendLineFlex, repairStatusFlex } from "@/utils/line";

export async function POST(req) {
  const { repair_id, closing_detail, parts_used, cost } = await req.json();

  // 1) ป้องกันปิดงานซ้ำ
  const [[exists]] = await db.query(
    "SELECT id FROM repair_closings WHERE repair_id = ?",
    [repair_id]
  );

  if (exists) {
    return NextResponse.json({
      success: false,
      msg: "งานนี้ถูกปิดไปแล้ว",
    });
  }

  // 2) ดึงข้อมูลงาน + line_user_id
  const [[repair]] = await db.query(
    `SELECT r.*, u.line_user_id, u.first_name, u.last_name
     FROM repairs r 
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.id = ?`,
    [repair_id]
  );

  if (!repair) {
    return NextResponse.json({ success: false, msg: "ไม่พบใบงาน" });
  }

  // 3) บันทึกการปิดงาน
  const finalCost = cost === "" ? 0 : Number(cost);

  await db.query(
    `INSERT INTO repair_closings 
      (repair_id, closing_detail, parts_used, cost, closed_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [repair_id, closing_detail, parts_used, finalCost]
  );

  // 4) อัปเดตสถานะใบงาน
  await db.query(
    "UPDATE repairs SET status = 'completed', updated_at = NOW() WHERE id = ?",
    [repair_id]
  );

  // 5) บันทึก log
  await db.query(
    `INSERT INTO repair_logs (repair_id, type, message, sender)
     VALUES (?, 'status', 'ปิดงานแล้ว', 'admin')`,
    [repair_id]
  );

  // 6) ส่ง LINE แจ้งเตือนผู้แจ้ง
  if (repair.line_user_id) {
    await sendLineFlex(
      repair.line_user_id,
      repairStatusFlex(repair, "เสร็จสิ้น")
    );
  }

  return NextResponse.json({ success: true });
}
