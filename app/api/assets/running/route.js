import { NextResponse } from "next/server";
import db from "@/lib/db";

// 🚀 บังคับให้ทำงานใหม่ทุกครั้ง ไม่เก็บ Cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix"); 

    if (!prefix) return NextResponse.json({ nextSeq: 1 });

    // Query หาเลขที่มากที่สุด
    const [rows] = await db.query(
      `SELECT asset_code FROM assets WHERE asset_code LIKE ? ORDER BY id DESC`,
      [`${prefix}%`]
    );

    let maxSeq = 0;

    // วนลูปหาค่า Max (วิธีนี้ชัวร์กว่า SQL Sort หากมีข้อมูลปนกัน)
    for (const row of rows) {
      const code = row.asset_code;
      if (code.startsWith(prefix)) {
        const suffix = code.substring(prefix.length); // ตัด Prefix ทิ้ง
        const parts = suffix.split('/'); // แยกด้วย /
        if (parts.length > 0 && parts[0] !== "") {
          const num = parseInt(parts[0], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    // ส่งกลับพร้อม Header ห้าม Cache เด็ดขาด
    return NextResponse.json(
      { nextSeq: maxSeq + 1 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );

  } catch (error) {
    console.error("RUNNING ERROR:", error);
    return NextResponse.json({ nextSeq: 1 });
  }
}