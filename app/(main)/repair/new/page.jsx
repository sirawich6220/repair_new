"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function NewRepairPage() {
  const [formData, setFormData] = useState({ deviceTypes: [] });
  const [user, setUser] = useState(null);

  // Form States
  const [selectedDevice, setSelectedDevice] = useState("");
  const [symptom, setSymptom] = useState("");
  const [needOS, setNeedOS] = useState("");
  const [osVersion, setOsVersion] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetName, setAssetName] = useState("");
  
  const [selectedPlace, setSelectedPlace] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [progress, setProgress] = useState(0); // 🟢 State สำหรับหลอดโหลด

  const osAllowedTypes = ["คอมพิวเตอร์ PC", "โน๊ตบุ๊ค", "เครื่อง Server"];

  // 1. Load User Data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.place) setSelectedPlace(data.user.place);
          if (data.user.department) setSelectedDepartment(data.user.department);
        }
      });
  }, []);

  // 2. คำนวณ Progress Bar แบบ Realtime
  useEffect(() => {
    let score = 0;
    if (user) score += 20; // มีข้อมูลผู้ใช้
    if (assetName) score += 40; // เลือกอุปกรณ์แล้ว
    if (symptom.length > 5) score += 40; // กรอกอาการเสียเกิน 5 ตัวอักษร
    setProgress(score);
  }, [user, assetName, symptom]);

  // Load Device Types (เหมือนเดิม)
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const res = await fetch("/api/assets/types");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFormData((prev) => ({ ...prev, deviceTypes: data }));
      } catch (error) {
        console.error("Error loading device types:", error);
      }
    };
    fetchDeviceTypes();
  }, []);

  // Check Asset Logic (เหมือนเดิม)
  const handleCheckAsset = async () => {
    const keyword = formData?.asset_code; 
    if (!keyword) return; 
  
    try {
      const res = await fetch("/api/assets/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword }), 
      });
  
      const result = await res.json();
  
      if (result.found) {
        if (result.count === 1) {
          applyAssetData(result.data[0]);
        } else {
          const options = {};
          result.data.forEach(item => {
            options[item.asset_code] = `${item.asset_code} : ${item.asset_name}`;
          });
  
          const { value: selectedCode } = await Swal.fire({
            title: 'พบข้อมูลหลายรายการ',
            text: `คำค้นหา "${keyword}" ตรงกับอุปกรณ์ ${result.count} รายการ`,
            icon: 'question',
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'กรุณาเลือกรายการที่ต้องการ',
            showCancelButton: true,
            confirmButtonText: 'เลือกรายการนี้',
            cancelButtonText: 'ยกเลิก'
          });
  
          if (selectedCode) {
            const selectedItem = result.data.find(x => x.asset_code === selectedCode);
            applyAssetData(selectedItem);
          }
        }
      } else {
        Swal.fire("ไม่พบข้อมูล", "ไม่พบรหัสหรือชื่อครุภัณฑ์นี้", "error");
        setSelectedDevice("");
        setAssetName("");
      }
    } catch (error) {
      console.error("Check Asset Error:", error);
    }
  };

  const applyAssetData = (item) => {
    setFormData(prev => ({ ...prev, asset_code: item.asset_code }));
    setAssetName(item.asset_name);
    setSelectedDevice(item.asset_type); 
  };
  
  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlace) return Swal.fire("แจ้งเตือน", "กรุณาเลือกสถานที่", "warning");
    if (!selectedDevice) return Swal.fire("แจ้งเตือน", "กรุณาเลือกประเภทอุปกรณ์", "warning");
    if (!selectedDepartment) return Swal.fire("แจ้งเตือน", "กรุณาเลือกแผนก", "warning");
    if (!symptom.trim()) return Swal.fire("แจ้งเตือน", "กรุณากรอกอาการเสีย", "warning");
    if (needOS === "yes" && !osVersion) return Swal.fire("แจ้งเตือน", "กรุณาเลือกเวอร์ชัน OS", "warning");

    const payload = {
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      place: selectedPlace,
      department: selectedDepartment,
      device_type: selectedDevice,
      asset_code: formData?.asset_code || null, 
      asset_name: assetName || null,
      symptom: symptom + (needOS === "yes" && osVersion ? ` | ต้องการลง OS ใหม่: ${osVersion}` : ""),
      status: "waiting",
    };

    try {
      Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
      const res = await fetch("/api/repairs/create", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        await Swal.fire("สำเร็จ!", "บันทึกสำเร็จ ระบบจะแจ้งผลอัปเดตสถานะ ติดตามงานซ่อม", "success");
        window.location.reload(); 
      } else {
        Swal.fire("เกิดข้อผิดพลาด", result.error || "บันทึกไม่สำเร็จ", "error");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };
  
  // Animation Variants
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

  return (
    // 🟢 Responsive Padding: p-2 (Mobile) -> p-md-4 (Desktop)
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 p-md-4" style={{ background: "#F4F6F7", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
            <h3 className="fw-bold m-0 text-success"><i className="bi bi-tools me-2"></i>แจ้งซ่อมใหม่</h3>
            <p className="text-muted small m-0">กรอกรายละเอียดอุปกรณ์ที่ต้องการซ่อม</p>
        </div>
        
        {/* User Badge */}
        <div className="bg-white px-3 py-2 rounded shadow-sm border d-flex align-items-center gap-2">
            <i className="bi bi-person-circle text-secondary fs-5"></i>
            <span className="fw-semibold small text-dark">
                {user ? `${user.first_name} ${user.last_name}` : "กำลังโหลด..."}
            </span>
        </div>
      </motion.div>

      {/* 🟢 Progress Bar (หลอดโหลด) */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="bg-white p-3 rounded shadow-sm mb-4">
         <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="fw-bold text-muted">ความครบถ้วนของข้อมูล</small>
            <small className={`fw-bold ${progress === 100 ? 'text-success' : 'text-primary'}`}>{progress}%</small>
         </div>
         <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
            <motion.div 
                className={`progress-bar progress-bar-striped progress-bar-animated ${progress === 100 ? 'bg-success' : 'bg-primary'}`} 
                role="progressbar" 
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            ></motion.div>
         </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="bg-white p-3 p-md-4 rounded shadow-sm">
        
        <form onSubmit={handleSubmit}>
            <div className="row g-3">
            
            {/* 🟢 SECTION 1: ข้อมูลครุภัณฑ์ */}
            <div className="col-12">
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3"><i className="bi bi-pc-display me-2"></i>ข้อมูลอุปกรณ์</h6>
            </div>

            <motion.div variants={fadeUp} className="col-12 col-md-4">
                <label className="form-label fw-semibold small">🔢 ค้นหารหัส / ชื่อครุภัณฑ์</label>
                <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="พิมพ์รหัส..."
                    value={formData?.asset_code || ""}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCheckAsset(); }}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    // onBlur={handleCheckAsset} // เอาออกเพื่อให้ไม่เด้งรบกวนในมือถือ
                />
                <button className="btn btn-primary" type="button" onClick={handleCheckAsset}>
                    <i className="bi bi-search"></i>
                </button>
                </div>
            </motion.div>

            <motion.div variants={fadeUp} className="col-12 col-md-4">
                <label className="form-label fw-semibold small">🏷️ ชื่อครุภัณฑ์</label>
                <input type="text" className="form-control bg-light" placeholder="-" value={assetName} readOnly />
            </motion.div>

            <motion.div variants={fadeUp} className="col-12 col-md-4">
                <label className="form-label fw-semibold small">💻 ประเภท</label>
                <input type="text" className="form-control bg-light" placeholder="-" value={selectedDevice} readOnly />
            </motion.div>

            {/* 🟢 SECTION 2: ข้อมูลผู้แจ้ง */}
            <div className="col-12 mt-4">
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3"><i className="bi bi-person-vcard me-2"></i>ข้อมูลผู้แจ้ง</h6>
            </div>

            <motion.div variants={fadeUp} className="col-12 col-md-6">
                <label className="form-label fw-semibold small">🏥 สถานที่</label>
                <input disabled className="form-control bg-light" value={user ? `${user.place}` : ""} />
            </motion.div> 

            <motion.div variants={fadeUp} className="col-12 col-md-6">
                <label className="form-label fw-semibold small">🗂️ แผนก</label>
                <input disabled className="form-control bg-light" value={user ? `${user.department}` : ""} />
            </motion.div>
            
            {/* 🟢 SECTION 3: อาการเสีย */}
            <div className="col-12 mt-4">
                <h6 className="fw-bold text-danger border-bottom pb-2 mb-3"><i className="bi bi-exclamation-triangle me-2"></i>อาการเสีย</h6>
            </div>

            <motion.div variants={fadeUp} className="col-12">
                <label className="form-label fw-semibold small">ระบุอาการอย่างละเอียด</label>
                <textarea 
                    className="form-control" 
                    rows={4} 
                    value={symptom} 
                    onChange={(e) => setSymptom(e.target.value)} 
                    placeholder="เช่น เปิดไม่ติด, หน้าจอฟ้า, เครื่องร้องดัง..."
                    style={{ fontSize: '1rem' }}
                ></textarea>
            </motion.div>

            {/* ส่วน OS (แสดงเฉพาะคอมพิวเตอร์) */}
            {osAllowedTypes.includes(selectedDevice) && (
                <motion.div variants={fadeUp} className="col-12">
                    <div className="p-3 bg-light rounded border mt-2">
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold small">💿 ต้องการลง Windows ใหม่?</label>
                                <select className="form-select" value={needOS} onChange={(e) => setNeedOS(e.target.value)}>
                                    <option value="">-- เลือก --</option>
                                    <option value="yes">ต้องการ</option>
                                    <option value="no">ไม่ต้องการ</option>
                                </select>
                            </div>
                            {needOS === "yes" && (
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-semibold small">🖥️ เลือกเวอร์ชัน</label>
                                    <select className="form-select" value={osVersion} onChange={(e) => setOsVersion(e.target.value)}>
                                        <option value="">-- เลือก Windows --</option>
                                        <option value="Windows 10">Windows 10</option>
                                        <option value="Windows 11">Windows 11</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div variants={fadeUp} className="col-12 mt-4">
                <button 
                    className={`btn w-100 py-3 fw-bold shadow-sm ${progress === 100 ? 'btn-success' : 'btn-secondary'}`} 
                    onClick={handleSubmit}
                    disabled={progress < 60} // ถ้ากรอกไม่ครบ ปุ่มจะกดไม่ได้ (Option)
                >
                    {progress === 100 ? <span><i className="bi bi-send-fill me-2"></i>ส่งแจ้งซ่อม</span> : "กรุณากรอกข้อมูลให้ครบ"}
                </button>
            </motion.div>

            </div>
        </form>
      </motion.div>
    </motion.div>
  );
}