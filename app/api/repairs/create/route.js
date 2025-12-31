import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      user_id,
      user_name,
      place,
      department,
      device_type,
      symptom,
      status,
      asset_code,
      asset_name
    } = body;

    if (!user_id || !user_name || !place || !department || !device_type || !asset_code || !asset_name) {
      return NextResponse.json({
        success: false,
        error: "ข้อมูลไม่ครบ กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    // บันทึกลงฐานข้อมูล
    const [result] = await db.query(
      `INSERT INTO repairs (
        user_id, user_name, place, department,
        device_type, description, status, asset_code, asset_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        user_name,
        place,
        department,
        device_type,
        symptom,
        status,
        asset_code,
        asset_name
      ]
    );

    const newId = result.insertId;

    // -----------------------------
    //   LINE Flex Message
    // -----------------------------
    // const token = process.env.LINE_CHANNEL_TOKEN;

    // const flexMessage = {
    //   type: "flex",
    //   altText: `📢 แจ้งซ่อม: ${asset_name}`,
    //   contents: {
    //     type: "bubble",
    //     size: "kilo", // ใช้ kilo ขนาดจะกำลังสวย (เล็กกว่า mega แต่ใหญ่กว่า micro)
    //     body: {
    //       type: "box",
    //       layout: "vertical",
    //       spacing: "md",
    //       paddingAll: "20px",
    //       contents: [
    //         {
    //           type: "text",
    //           text: "📢 แจ้งซ่อมใหม่",
    //           weight: "bold",
    //           size: "lg",
    //           color: "#008000"
    //         },
    //         {
    //           type: "box",
    //           layout: "vertical",
    //           spacing: "xs",
    //           contents: [
    //             {
    //               type: "text",
    //               text: `ผู้แจ้ง: ${user_name}`,
    //               size: "sm",
    //               wrap: true,
    //               color: "#333333"
    //             },
    //             {
    //               type: "text",
    //               text: `อุปกรณ์: ${asset_name}`,
    //               size: "sm",
    //               weight: "bold",
    //               wrap: true,
    //               color: "#333333"
    //             }
    //           ]
    //         },
    //         {
    //           type: "separator",
    //           margin: "md"
    //         },
    //         {
    //           type: "text",
    //           text: "ระบบจะแจ้งผลอัปเดตสถานะ ติดตามงานซ่อม",
    //           size: "xs",
    //           color: "#FF0000",
    //           wrap: true,
    //           align: "center"
    //         }
    //       ]
    //     }
    //   }
    // };


    // if (token) {
    //   const resLine = await fetch(
    //     "https://api.line.me/v2/bot/message/broadcast",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${token}`
    //       },
    //       body: JSON.stringify({ messages: [flexMessage] })
    //     }
    //   );

    //   console.log("LINE RESPONSE:", await resLine.text());
    // }

    return NextResponse.json({
      success: true,
      message: "บันทึกสำเร็จ ระบบจะแจ้งผลอัปเดตสถานะ ติดตามงานซ่อม",
      id: newId
    });

  } catch (err) {
    console.log("CREATE ERROR:", err);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาด: " + err.message
    });
  }
}
