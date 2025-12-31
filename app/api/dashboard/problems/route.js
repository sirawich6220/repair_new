import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // เรียก API ภายในระบบผ่าน localhost (ไม่ใช้ https)
    const res = await fetch("http://localhost:3000/api/formdata/amnat");
    const formData = await res.json();

    const problemTypes = formData.deviceTypes;

    const connection = await db.getConnection();
    const [rows] = await connection.query(`
      SELECT device_type, COUNT(*) AS total
      FROM repairs
      GROUP BY device_type
    `);
    connection.release();

    const result = problemTypes.map((type) => {
      const found = rows.find((r) => r.device_type === type);
      return {
        device_type: type,
        total: found ? Number(found.total) : 0,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ ERROR /api/dashboard/problems:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
