// ไฟล์: app/api/jobs/update/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendLineFlex, repairStatusFlex } from "@/utils/line";

export async function POST(req) {
  try {
    // ✅ รับค่า note มาด้วย
    const { id, status, note } = await req.json();

    console.log(`📥 API Update Job: ID=${id}, Status=${status}, Note=${note}`);

    // 1. แปลง Status
    let dbStatus = status;
    if (status === 'in_progress') dbStatus = 'processing';

    // คำแปลสถานะ
    const statusTH = {
      pending: "รอรับงาน",
      waiting: "รอรับงาน",
      processing: "กำลังดำเนินการ (ช่างรับงานแล้ว)",
      in_progress: "กำลังดำเนินการ",
      completed: "เสร็จสิ้น",
      cancel: "ยกเลิก"
    };
    const statusTextTH = statusTH[dbStatus] || dbStatus;

    // =========================================================
    // 🔴 จุดแก้ไข: อัปเดต technician_note ลงฐานข้อมูลด้วย
    // =========================================================
    
    if (dbStatus === 'completed') {
        // ✅ กรณี "เสร็จสิ้น": บันทึกสถานะ, หมายเหตุช่าง, และเวลาจบงาน (completed_at)
        await db.query(
            `UPDATE repairs 
             SET status = ?, 
                 technician_note = ?, 
                 updated_at = NOW(), 
                 completed_at = NOW() 
             WHERE id = ?`,
            [dbStatus, note || "", id]
        );
    } else {
        // ✅ กรณีอื่น (เช่น รับงาน): บันทึกสถานะ และอัปเดตหมายเหตุ (ถ้ามี)
        await db.query(
            `UPDATE repairs 
             SET status = ?, 
                 technician_note = ?, 
                 updated_at = NOW() 
             WHERE id = ?`,
            [dbStatus, note || "", id]
        );
    }

    // 3. ดึงข้อมูลเพื่อส่ง LINE
    const [[repair]] = await db.query("SELECT * FROM repairs WHERE id = ?", [id]);
    
    if (repair) {
        const [[user]] = await db.query("SELECT line_user_id FROM users WHERE id = ?", [repair.user_id]);

        if (user?.line_user_id) {
            console.log(`📲 Sending LINE to: ${user.line_user_id}`);
            
            // ส่ง Flex Message
            const flex = repairStatusFlex(
                { ...repair, statusTH: statusTextTH }, 
                statusTextTH
            );
            await sendLineFlex(user.line_user_id, flex);
        }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔥 API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}