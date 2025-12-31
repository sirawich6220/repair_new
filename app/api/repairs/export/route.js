export const runtime = "nodejs";

import db from "@/lib/db";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(req) {
  const id = req.nextUrl.searchParams.get("id");

  const [[repair]] = await db.query(
    "SELECT * FROM repairs WHERE id = ?", [id]
  );

  const [[closing]] = await db.query(
    "SELECT * FROM repair_closings WHERE repair_id = ?", [id]
  );

  // ฟอนต์ไทย
  const fontRegular = path.join(process.cwd(), "public", "fonts", "Sarabun-Regular.ttf");
  const fontBold = path.join(process.cwd(), "public", "fonts", "Sarabun-Bold.ttf");

  // โลโก้
  const logoPath = path.join(process.cwd(), "public", "MOPH.png");

  const pdfBuffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      font: fontRegular,   // ⭐ ป้องกัน PDFKit ใช้ Helvetica
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    // โหลดฟอนต์ไทย
    doc.registerFont("TH", fontRegular);
    doc.registerFont("THB", fontBold);

    // บังคับใช้ฟอนต์ไทย
    doc.font("TH");

    // ---------------------------
    // HEADER
    // ---------------------------
    doc.image(logoPath, 40, 30, { width: 60 });
    doc.font("THB").fontSize(20).text("ใบรายงานปิดงานซ่อม", 120, 40);

    doc.moveDown(2);

    doc
      .moveTo(40, 100)
      .lineTo(555, 100)
      .strokeColor("#0f6a47")
      .lineWidth(2)
      .stroke();

    doc.moveDown(1.5);

    // ---------------------------
    // SECTION: ข้อมูลใบงาน
    // ---------------------------
    doc.font("THB").fontSize(14).fillColor("#0f6a47")
      .text("ข้อมูลใบงาน", { underline: true });
    doc.moveDown(0.7);

    doc.font("TH").fontSize(12).fillColor("#000");
    doc.text(`• หมายเลขงาน: ${id}`);
    doc.text(`• ผู้แจ้ง: ${repair.user_name}`);
    doc.text(`• แผนก: ${repair.department}`);
    doc.text(`• สถานที่: ${repair.place}`);
    doc.text(`• ประเภทอุปกรณ์: ${repair.device_type}`);
    doc.text(`• วันที่แจ้ง: ${new Date(repair.created_at).toLocaleString("th-TH")}`);

    doc.moveDown(1.2);

    // ---------------------------
    // SECTION: อาการเสีย
    // ---------------------------
    doc.font("THB").fontSize(14).fillColor("#0f6a47")
      .text("รายละเอียดอาการเสีย", { underline: true });

    doc.moveDown(0.7);

    doc.font("TH").fontSize(12).fillColor("#000")
      .text(repair.description, { width: 500 });

    doc.moveDown(1.2);

    // ---------------------------
    // SECTION: ปิดงาน
    // ---------------------------
    doc.font("THB").fontSize(14).fillColor("#0f6a47")
      .text("ผลการดำเนินงาน (ปิดงาน)", { underline: true });

    doc.moveDown(0.7);

    doc.font("TH").fontSize(12).fillColor("#000");
    doc.text(`• รายละเอียดการซ่อม:`);
    doc.text(closing.closing_detail, { indent: 20 });

    doc.text(`\n• อะไหล่ที่ใช้:`);
    doc.text(closing.parts_used || "-", { indent: 20 });

    doc.text(`\n• ค่าใช้จ่าย: ${closing.cost ? closing.cost + " บาท" : "-"}`);

    doc.text(`• ปิดงานเมื่อ: ${new Date(closing.closed_at).toLocaleString("th-TH")}`);

    doc.moveDown(1.5);

    // ---------------------------
    // SIGNATURE
    // ---------------------------
    const boxTop = doc.y;
    doc.rect(40, boxTop, 515, 120).strokeColor("#0f6a47").lineWidth(1.5).stroke();

    doc.font("THB").fontSize(13).fillColor("#0f6a47")
      .text("ลายเซ็นผู้ดำเนินการ", 50, boxTop + 10);

    doc.font("TH").fontSize(12).fillColor("#000");
    doc.text("..............................................................", 50, boxTop + 55);
    doc.text("(.......................................................)", 50, boxTop + 80);

    // END
    doc.end();
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=repair_${id}.pdf`,
    },
  });
}
