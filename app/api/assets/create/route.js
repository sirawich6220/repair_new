import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();

    // 🛠️ Helper Functions
    const toInt = (val) => {
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    };
    
    const toFloat = (val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    const toNull = (val) => {
      return (val === "" || val === undefined || val === "null") ? null : val;
    };

    // 1. รับค่าจาก Frontend
    const {
      asset_sequence, // (1)
      asset_code,     // (2)
      asset_name,     // (3)
      asset_type,     // (4)
      asset_category, // (5)
      brand,          // (6)
      model,          // (7)
      serial_number,  // (8)
      description,    // (9)
      unit_price,     // (10)
      quantity,       // (11)
      fiscal_year,    // (12)
      acquisition_method, // (13)
      budget_type,    // (14)
      purchase_date,  // (15)
      received_date,  // (16)
      supplier,       // (17)
      delivery_doc_no,// (18)
      purchase_doc_no,// (19)
      disbursement_proof, // (20)
      disbursement_date,  // (21)
      department,     // (22)
      section,        // (23)
      location,       // (24)
      owner,          // (25)
      work_type,      // (26)
      asset_status,   // (27)
      current_condition, // (28)
      lifespan,       // (29)
      warranty_period,// (30)
      remark          // (31)
    } = body;

    // 🟢 Logic Auto Sequence: ถ้าไม่ได้กรอกลำดับมา ให้ดึงจากหลังเครื่องหมาย /
    let finalSequence = asset_sequence;
    if (!finalSequence && asset_code && String(asset_code).includes('/')) {
        const parts = String(asset_code).split('/');
        finalSequence = parts[parts.length - 1]; 
    }

    // 2. Validate
    if (!asset_code) {
      return NextResponse.json({ success: false, error: "กรุณาระบุเลขครุภัณฑ์" });
    }

    // 3. Check Duplicate
    const [existing] = await db.query("SELECT id FROM assets WHERE asset_code = ?", [asset_code]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "เลขครุภัณฑ์นี้มีในระบบแล้ว" });
    }

    // 4. Insert ลง Database (31 Columns)
    await db.query(
      `INSERT INTO assets (
        asset_sequence, asset_code, asset_name, asset_type, asset_category,
        brand, model, serial_number, description,
        unit_price, quantity, fiscal_year, acquisition_method, budget_type,
        purchase_date, received_date, supplier,
        delivery_doc_no, purchase_doc_no, disbursement_proof, disbursement_date,
        department, section, location, owner, work_type,
        asset_status, current_condition, lifespan, warranty_period, remark
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )`, // เช็คแล้ว: มีเครื่องหมาย ? ทั้งหมด 31 ตัว ครบถ้วน
      [
        toNull(finalSequence), // 1
        asset_code,            // 2
        toNull(asset_name),    // 3
        toNull(asset_type),    // 4
        toNull(asset_category),// 5
        
        toNull(brand),         // 6
        toNull(model),         // 7
        toNull(serial_number), // 8
        toNull(description),   // 9
        
        toFloat(unit_price),   // 10
        toInt(quantity),       // 11
        toNull(fiscal_year),   // 12
        toNull(acquisition_method), // 13
        toNull(budget_type),   // 14
        
        toNull(purchase_date), // 15
        toNull(received_date), // 16
        toNull(supplier),      // 17
        
        toNull(delivery_doc_no),    // 18
        toNull(purchase_doc_no),    // 19
        toNull(disbursement_proof), // 20
        toNull(disbursement_date),  // 21
        
        toNull(department),    // 22
        toNull(section),       // 23
        toNull(location),      // 24
        toNull(owner),         // 25
        toNull(work_type),     // 26
        
        toNull(asset_status),  // 27
        toNull(current_condition), // 28
        toInt(lifespan),       // 29
        toNull(warranty_period), // 30
        toNull(remark)         // 31 (ตัวนี้แหละที่น่าจะหายไปรอบก่อน)
      ]
    );

    return NextResponse.json({ success: true, message: "บันทึกข้อมูลสำเร็จ" });

  } catch (error) {
    console.error("CREATE ASSET ERROR:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}