import db from "@/lib/db";
import { 
  sendLineFlex,
  howToRegisterFlex,
  sendLineText,
  registerSuccessFlex,
  alreadyLinkedFlex
} from "@/utils/line";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const event = body.events?.[0];

  if (!event) return NextResponse.json({});

  const userId = event.source.userId;
  const message = event.message?.text || "";
  const msg = message.trim().toLowerCase();

  console.log("✨ LINE EVENT:", event.type);

  // 🟢 1) เมื่อผู้ใช้เพิ่มเพื่อน → ส่ง Flex วิธีการสมัครทันที
  if (event.type === "follow") {
    await sendLineFlex(userId, howToRegisterFlex());
    return NextResponse.json({ ok: true });
  }

  // 🟢 2) ผู้ใช้ขอ "วิธีสมัคร"
  if (["สมัคร", "วิธีสมัคร", "help", "วิธีผูกบัญชี"].includes(msg)) {
    await sendLineFlex(userId, howToRegisterFlex());
    return NextResponse.json({ ok: true });
  }

  // 🟢 3) คำสั่ง register <username>
  if (msg.startsWith("register ")) {
    const username = msg.replace("register ", "").trim();

    // 🔍 ค้นหา user จากระบบ
    const [[user]] = await db.query(
      "SELECT id, username, first_name, last_name, department, line_user_id FROM users WHERE username = ?",
      [username]
    );

    // ❌ ไม่พบ user
    if (!user) {
      await sendLineText(userId, "❌ ไม่พบ username นี้ในระบบ");
      return NextResponse.json({});
    }

    // ❗ พบ user แล้ว แต่เคยผูกบัญชี LINE ไปแล้ว
    if (user.line_user_id) {
      await sendLineFlex(userId, alreadyLinkedFlex(user));
      return NextResponse.json({});
    }

    // 🟢 ผูกบัญชีสำเร็จ
    await db.query(
      "UPDATE users SET line_user_id = ? WHERE id = ?",
      [userId, user.id]
    );

    // ส่ง Flex ยืนยันผูกสำเร็จ
    await sendLineFlex(userId, registerSuccessFlex(user));

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({});
}
