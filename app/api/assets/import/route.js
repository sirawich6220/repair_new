import { NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";

// 🛠️ Helper: แปลงค่าเป็นตัวเลขจำนวนเต็ม
const toInt = (val) => {
  if (!val) return 0;
  const str = String(val).replace(/[^0-9]/g, "");
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
};

// 🛠️ Helper: แปลงค่าเป็นทศนิยม (ราคา)
const toFloat = (val) => {
  if (!val) return 0;
  const str = String(val).replace(/,/g, ""); 
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// 🛠️ Helper: แปลงวันที่ไทย (Safe Mode)
function parseThaiDate(thaiDateStr) {
  if (!thaiDateStr) return null;
  
  let str = String(thaiDateStr).trim();
  if (str === "" || str === "-" || str === "0") return null;

  // 🟢 1. กรณี Excel Serial Date (ตัวเลขล้วน ยาวๆ)
  // ต้องเช็คว่าเป็นตัวเลข และไม่อยู่ในรูปปี พ.ศ. (ต้องไม่ใช่ 25xx)
  if (!isNaN(str) && str.length > 4 && !str.startsWith("25")) {
     try {
        // สูตรแปลง Excel Serial Date เป็น JS Date
        const serial = parseFloat(str);
        // Excel เริ่มนับ 1900-01-01 แต่มี bug leap year 1900, ลบ 25569 เพื่อปรับเป็น Unix Epoch
        // ใช้สูตรพื้นฐาน (Serial - 25569) * 86400 * 1000
        const date = new Date((serial - 25569) * 86400 * 1000);
        
        // 🛡️ สำคัญ: เช็คก่อนว่า Date ถูกต้องไหม
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
     } catch (e) {
        return null; // ถ้าแปลงไม่ได้ ให้ข้ามไป
     }
  }

  // 🟢 2. กรณี Text Format
  str = str.replace(/-/g, " "); // แปลง - เป็น วรรค
  str = str.replace(/\//g, " "); // แปลง / เป็น วรรค

  const months = { 
    "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04", "พ.ค.": "05", "มิ.ย.": "06", 
    "ก.ค.": "07", "ส.ค.": "08", "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
    "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม": "03", "เมษายน": "04", "พฤษภาคม": "05", "มิถุนายน": "06",
    "กรกฎาคม": "07", "สิงหาคม": "08", "กันยายน": "09", "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม": "12"
  };

  try {
    let parts = str.split(" ");
    parts = parts.filter(p => p.trim() !== "");

    // 2.1 มีแค่ปี (เช่น "2563")
    if (parts.length === 1 && parts[0].length === 4) {
        const yearVal = parseInt(parts[0]);
        // ถ้าเป็น พ.ศ. (24xx - 26xx) ลบ 543
        if (yearVal > 2400) return `${yearVal - 543}-01-01`;
        // ถ้าเป็น ค.ศ. (19xx - 20xx) ใช้เลย
        if (yearVal > 1900) return `${yearVal}-01-01`;
    }

    // 2.2 เดือน ปี (เช่น "พ.ย. 59")
    if (parts.length === 2) {
       const month = months[parts[0]] || "01";
       let yearBE = parseInt(parts[1]);
       if (yearBE < 100) yearBE += 2500; 
       const yearAD = yearBE - 543;
       return `${yearAD}-${month}-01`;
    }

    // 2.3 วัน เดือน ปี (เช่น "12 ต.ค. 66")
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1]] || "01";
      let yearBE = parseInt(parts[2]);
      if (yearBE < 100) yearBE += 2500;
      const yearAD = yearBE - 543;
      return `${yearAD}-${month}-${day}`;
    }
  } catch (e) { return null; }
  
  return null;
}

// 🛠️ Helper: แกะข้อมูลจากรหัส
function extractCodeInfo(code) {
    let seq = null;
    let year = null;
    if(code && code.includes('/')) {
        const parts = code.split('/');
        if(parts.length >= 3) {
            seq = parts[parts.length - 2];
            year = "25" + parts[parts.length - 1]; 
        } else if (parts.length === 2) {
            seq = parts[1];
        }
    }
    return { seq, year };
}

export async function POST(req) {
  try {
    const data = await req.formData();
    const files = data.getAll("file"); 

    if (!files || files.length === 0)
      return NextResponse.json({ success: false, error: "ไม่พบไฟล์" });

    let successCount = 0;
    let totalRows = 0;

    for (const file of files) {
      console.log(`\n📂 Reading: ${file.name}`);
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: "array" });
      const fileNameType = file.name.replace(/\.[^/.]+$/, "").trim(); 

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          
          // 📌 Key หลัก: รหัสครุภัณฑ์ (Column D = Index 3)
          const colCode = row[3]?.toString().trim(); 

          // กรองแถวที่ไม่ใช่ข้อมูล
          if (!colCode || colCode.length < 5 || colCode.includes("เลขที่") || colCode.includes("รวม")) {
             continue;
          }

          totalRows++;

          // อ่านข้อมูลพื้นฐาน
          const colDate = row[1]?.toString().trim() ?? ""; // วันที่ (Col B)
          const colName = row[4]?.toString().trim() ?? ""; // ชื่อ (Col E)
          const colPrice = row[5]?.toString().trim() ?? "0"; // ราคา (Col F)
          const colMethod = row[6]?.toString().trim() ?? ""; // วิธีได้มา (Col G)
          
          // 📍 Smart Detect: อายุการใช้งาน (Lifespan)
          // ลองหาที่ Col H (Index 7) ก่อน (สำหรับไฟล์ต่ำกว่าเกณฑ์)
          // ถ้าไม่มี หรือไม่ใช่ตัวเลข ให้ไปหาที่ Col L (Index 11) (สำหรับไฟล์สินทรัพย์ถาวร)
          let rawLifespan = row[7]?.toString().trim(); 
          if (!rawLifespan || isNaN(parseInt(rawLifespan))) {
              rawLifespan = row[11]?.toString().trim();
          }

          const colLocation = row[8]?.toString().trim() ?? ""; // สถานที่ (Col I)

          // แปลงข้อมูล
          const receivedDate = parseThaiDate(colDate);
          const unitPrice = toFloat(colPrice); 
          let lifespan = toInt(rawLifespan);
          const { seq, year } = extractCodeInfo(colCode); 

          // 🛡️ Guard: ป้องกันค่าอายุเพี้ยน (เช่น เป็นปี พ.ศ. หรือหลักหมื่น)
          if (lifespan > 100 || lifespan < 0) { 
              lifespan = 0; 
          }

          try {
            await db.query(
                `INSERT INTO assets (
                    asset_code, asset_name, asset_type, asset_category, 
                    received_date, unit_price, acquisition_method, 
                    lifespan, location, department, 
                    asset_status, quantity, owner, 
                    asset_sequence, fiscal_year, remark
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    asset_name = VALUES(asset_name),
                    received_date = VALUES(received_date),
                    unit_price = VALUES(unit_price),
                    lifespan = VALUES(lifespan),
                    fiscal_year = VALUES(fiscal_year),
                    location = VALUES(location)
                `,
                [
                    colCode,
                    colName,
                    fileNameType, 
                    sheetName.includes("ต่ำ") ? "ครุภัณฑ์ต่ำกว่าเกณฑ์" : "สินทรัพย์ถาวร",
                    receivedDate,
                    unitPrice,
                    colMethod,
                    lifespan,   // ✅ ค่าอายุที่ถูกต้อง
                    colLocation, 
                    "สนง.สสจ.อำนาจเจริญ", 
                    "ใช้งานปกติ",
                    1,
                    colLocation, // ใส่สถานที่ลงช่องผู้รับผิดชอบชั่วคราว
                    seq,         // ลำดับ
                    year,        // ปีงบ
                    ""
                ]
            );
            successCount++;
          } catch (sqlErr) {
            console.error(`   ❌ SQL Error (${colCode}):`, sqlErr.message);
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: successCount, total: totalRows });

  } catch (err) {
    console.error("🔥 Import Error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}