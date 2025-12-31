import { NextResponse } from "next/server";
import db from "@/lib/db";

// ฟังก์ชันสำหรับแปลง params ให้เป็นรหัสครุภัณฑ์ที่ถูกต้อง
// รองรับทั้งแบบ String ธรรมดา และ Array (กรณีมี /)
function getAssetCode(param) {
  if (!param) return null;
  // ถ้าเป็น Array (จาก [...asset_code]) ให้ต่อด้วย /
  const rawCode = Array.isArray(param) ? param.join('/') : param;
  // Decode เพื่อความชัวร์ (เผื่อมาเป็น %2F)
  return decodeURIComponent(rawCode);
}

// =======================
// 📌 GET ค้นหาครุภัณฑ์
// =======================
export async function GET(req, { params }) {
  try {
    const { asset_code } = await params;
    
    // ✅ แปลงค่าจาก URL ให้เป็นรหัสที่ถูกต้อง (แก้ปัญหา / และ %2F)
    const code = getAssetCode(asset_code); 

    console.log("🔍 Searching for:", code); // ดู Log ว่าค่ามาถูกไหม

    const [rows] = await db.query(
      "SELECT * FROM assets WHERE asset_code = ? LIMIT 1", // ⚠️ เช็คชื่อ Column ใน DB ว่าชื่อ asset_code หรือ id
      [code]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลครุภัณฑ์" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: rows[0],
    });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}

// =======================
// 📌 PUT อัปเดตครุภัณฑ์
// =======================
export async function PUT(req, { params }) {
  try {
    const { asset_code } = await params;
    
    // ✅ แปลงค่าจาก URL (รหัสเดิมที่ใช้ค้นหาเพื่อ update)
    const oldCode = getAssetCode(asset_code);

    const body = await req.json();

    // 🟢 ฟังก์ชันช่วยจัดการค่าตัวเลขและค่าว่าง
    const toNum = (val) => (val === "" || val === null || undefined === val ? 0 : Number(val));
    const toNull = (val) => (val === "" || val === null || undefined === val ? null : val);

    // รหัสใหม่ (เผื่อมีการแก้ไขรหัสครุภัณฑ์)
    const newCode = body.asset_code || oldCode; 

    await db.query(
      `UPDATE assets SET
        asset_code=?,  
        asset_name=?, 
        asset_type=?, 
        asset_category=?, 
        brand=?, 
        serial_number=?, 
        unit_price=?, 
        department=?, 
        description=?, 
        section=?, 
        location=?, 
        acquisition_method=?,
        budget_type=?, 
        purchase_doc_no=?, 
        sell_doc_no=?, 
        supplier=?, 
        asset_status=?,
        owner=?, 
        lifespan=?, 
        model=?, 
        warranty_period=?, 
        quantity=?, 
        work_type=?,
        fiscal_year=?, 
        disbursement_proof=?, 
        delivery_doc_no=?,
        current_condition=?, 
        used_for=?,
        received_date=?
      WHERE asset_code=?`, // Update ตัวที่มี asset_code ตรงกับ oldCode
      [
        newCode,
        toNull(body.asset_name),
        toNull(body.asset_type),
        toNull(body.asset_category),
        toNull(body.brand),
        toNull(body.serial_number),
        toNum(body.unit_price),
        toNull(body.department),
        toNull(body.description),
        toNull(body.section),
        toNull(body.location),
        toNull(body.acquisition_method),
        toNull(body.budget_type),
        toNull(body.purchase_doc_no),
        toNull(body.sell_doc_no),
        toNull(body.supplier),
        toNull(body.asset_status),
        toNull(body.owner),
        toNull(body.lifespan),
        toNull(body.model),
        toNull(body.warranty_period),
        toNum(body.quantity),
        toNull(body.work_type),
        toNull(body.fiscal_year),
        toNull(body.disbursement_proof),
        toNull(body.delivery_doc_no),
        toNull(body.current_condition),
        toNull(body.used_for),
        toNull(body.received_date),
        oldCode // เงื่อนไข WHERE
      ]
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("PUT API ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "บันทึกข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}