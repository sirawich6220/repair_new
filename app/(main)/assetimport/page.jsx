"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Download, 
  Info,
  ShieldCheck,
  ArrowRight,
  Trash2
} from "lucide-react";

export default function AssetImportPage() {
  // 🟢 เปลี่ยนจากเก็บไฟล์เดียว เป็น Array []
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 🟢 ฟังก์ชันจัดการเมื่อเลือกไฟล์
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // แปลง FileList เป็น Array แล้วนำไปรวมกับของเดิม (หรือจะแทนที่ก็ได้)
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 🟢 ฟังก์ชันลบไฟล์ทีละรายการ
  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadFile = async () => {
    if (files.length === 0) return Swal.fire("แจ้งเตือน", "กรุณาเลือกไฟล์ Excel อย่างน้อย 1 ไฟล์", "warning");

    setLoading(true);
    const form = new FormData();
    
    // 🟢 Loop เพื่อยัดทุกไฟล์ลงใน FormData
    files.forEach((file) => {
      form.append("file", file); 
    });

    try {
      const res = await fetch("/api/assets/import", { method: "POST", body: form });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "นำเข้าข้อมูลสำเร็จ",
          text: `ระบบดำเนินการบันทึกข้อมูลเรียบร้อยแล้ว`, // ปรับข้อความตาม Response Backend
          confirmButtonColor: "#1e40af",
        });
        setFiles([]); // เคลียร์ค่าเมื่อเสร็จ
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.error || "ไม่สามารถนำเข้าข้อมูลได้", "error");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาดระบบ", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-10 px-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-300 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-800 mb-1">
              <ShieldCheck size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Asset Management System</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">นำเข้าข้อมูลครุภัณฑ์ประจำปี</h1>
            <p className="text-slate-500 mt-1">อัปโหลดไฟล์เอกสาร Excel เพื่อบันทึกข้อมูลเข้าสู่ฐานข้อมูลกลาง</p>
          </div>
          {/* <a 
            href="/templates/asset_template.xlsx"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <Download size={16} />
            ดาวน์โหลดแบบฟอร์มมาตรฐาน
          </a> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Instructions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Info size={18} className="text-blue-600" />
                ข้อกำหนดการนำเข้า
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                  รองรับไฟล์ .xlsx และ .xls เท่านั้น
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                  อัปโหลดได้หลายไฟล์พร้อมกัน
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                  ขนาดไฟล์ไม่เกิน 15MB ต่อไฟล์
                </li>
              </ul>
            </div>

            {/* <div className="bg-blue-900 p-6 rounded-xl text-white shadow-lg shadow-blue-900/20">
              <h4 className="font-bold mb-2">ต้องการความช่วยเหลือ?</h4>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                หากพบปัญหาในการนำเข้าข้อมูล กรุณาติดต่อฝ่ายจัดการสินทรัพย์ โทร. 1234
              </p>
              <button className="text-xs font-bold py-2 px-4 bg-blue-800 hover:bg-blue-700 rounded transition-colors w-full border border-blue-700">
                อ่านคู่มือการใช้งาน
              </button>
            </div> */}
          </div>

          {/* Right Column: Upload Tool */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-1 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1">
                  <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-tight">Upload Terminal</div>
                </div>
              </div>

              <div className="p-8 flex-1">
                {/* 🟢 Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        setFiles((prev) => [...prev, ...droppedFiles]);
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-lg transition-all flex flex-col items-center justify-center py-8 px-4 mb-6 ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet size={40} className="text-slate-400 mb-3" />
                  <p className="text-slate-700 font-semibold text-center text-sm">ลากไฟล์มาวางที่นี่ หรือ</p>
                  
                  <label className="mt-3 px-6 py-2 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-all active:bg-slate-100">
                    Browse Files
                    {/* 🟢 ใส่ multiple เพื่อเลือกหลายไฟล์ */}
                    <input type="file" className="hidden" accept=".xls,.xlsx" multiple onChange={handleFileChange} />
                  </label>
                </div>

                {/* 🟢 File List Area */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      รายการไฟล์ ({files.length})
                    </div>
                    <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg shadow-sm ring-1 ring-blue-50 group hover:ring-blue-200 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-blue-100 rounded flex shrink-0 items-center justify-center text-blue-700 font-bold text-xs">
                              XLS
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(index)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 transition-colors"
                            title="ลบไฟล์"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded text-green-700 text-xs font-medium mt-4">
                      <CheckCircle2 size={14} />
                      พร้อมสำหรับการนำเข้า {files.length} ไฟล์
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-4">
                {files.length > 0 && (
                   <button 
                    onClick={() => setFiles([])}
                    className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors"
                   >
                    ล้างทั้งหมด
                   </button>
                )}
                <button
                  onClick={uploadFile}
                  disabled={files.length === 0 || loading}
                  className={`flex items-center gap-2 px-8 py-2.5 rounded text-sm font-bold transition-all shadow-sm ${
                    files.length === 0 || loading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-800 text-white hover:bg-blue-900 active:transform active:scale-95"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังประมวลผล...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      นำเข้าข้อมูล ({files.length})
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center border-t border-slate-200 pt-10 pb-8">
  <div className="inline-flex items-center gap-4 mb-4">
    <div className="h-[1px] w-8 bg-slate-300"></div>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
      Official Asset Control Unit
    </span>
    <div className="h-[1px] w-8 bg-slate-300"></div>
  </div>
  
  <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
    สงวนลิขสิทธิ์ © ๒๕๖๙ ระบบบริหารจัดการทะเบียนครุภัณฑ์และสินทรัพย์ดิจิทัล
    <br />
    ส่วนงานพัสดุและบริหารสินทรัพย์ หน่วยงานบริหารจัดการทรัพย์สินภาครัฐ
  </p>
  
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px]">
            <span className="text-slate-400">ระดับความปลอดภัยของข้อมูล:</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold border border-slate-200 rounded uppercase tracking-wider">
              ลับ (Classified)
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 italic">สำหรับใช้งานภายในส่วนราชการเท่านั้น</span>
          </div>
        </div>
      </div>
    </div>
  );
}