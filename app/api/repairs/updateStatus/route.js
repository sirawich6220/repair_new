import db from "@/lib/db";
import { sendLineFlex, repairStatusFlex } from "@/utils/line";

export async function POST(req) {
  try {
    const { id, status } = await req.json();

    // 🌟 แปลงสถานะเป็นภาษาไทย
    const statusTH = {
      waiting: "รอรับงาน",
      processing: "กำลังดำเนินการ",
      pending: "รออะไหล่",
      completed: "เสร็จสิ้น",
    };

    const statusTextTH = statusTH[status] || status;

    // 1) ดึงข้อมูลใบงาน
    const [[repair]] = await db.query(
      "SELECT * FROM repairs WHERE id = ?",
      [id]
    );

    if (!repair) {
      return Response.json({ success: false, message: "ไม่พบใบงาน" });
    }

    // 2) อัปเดตสถานะใน DB
    await db.query(
      "UPDATE repairs SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );

    // 3) ดึง LINE USER ID
    const [[user]] = await db.query(
      "SELECT line_user_id FROM users WHERE id = ?",
      [repair.user_id]
    );

    // 4) ส่งแจ้งเตือน (เฉพาะเมื่อผู้ใช้ผูก LINE แล้ว)
    if (user?.line_user_id) {

      // 🎨 สร้าง Flex Message ภาษาไทย
      const flex = repairStatusFlex(
        {
          ...repair,
          statusTH: statusTextTH,  // ใส่สถานะไทยเข้าไปให้ Flex ใช้
        },
        statusTextTH
      );

      // 🚀 ส่ง Flex Message
      await sendLineFlex(user.line_user_id, flex);

      console.log("📨 ส่ง Flex แจ้งเตือนให้:", user.line_user_id);
    } else {
      console.log("⚠️ ไม่พบ line_user_id ของผู้ใช้");
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("ERROR updateStatus:", err);
    return Response.json({ success: false, error: err });
  }
}
