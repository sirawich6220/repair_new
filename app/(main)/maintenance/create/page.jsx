"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function CreateMaintenancePlan() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]); // เก็บรายการครุภัณฑ์สำหรับ Dropdown

  // Form State
  const [formData, setFormData] = useState({
    date: "",
    asset_code: "",
    description: "",
    responsible: "",
  });

  // โหลดข้อมูลครุภัณฑ์มาใส่ Dropdown
  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets/list"); // ใช้ API เดิมที่มีอยู่
        const data = await res.json();
        if (data.success) {
            setAssets(data.assets || []);
        }
      } catch (err) {
        console.error("Error fetching assets:", err);
      }
    }
    fetchAssets();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.asset_code) {
        Swal.fire("ข้อมูลไม่ครบ", "กรุณาระบุวันที่และเลือกครุภัณฑ์", "warning");
        return;
    }

    setLoading(true);
    try {
        const res = await fetch("/api/maintenance/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: 'สร้างแผนบำรุงรักษาเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
            });
            router.push("/maintenance"); // กลับไปหน้ารายการ
        } else {
            Swal.fire("เกิดข้อผิดพลาด", data.error, "error");
        }
    } catch (err) {
        Swal.fire("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f4f6f8", fontFamily: "'Sarabun', sans-serif" }}>
      
      {/* Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .form-label { font-weight: 600; color: #495057; font-size: 0.9rem; }
        .form-control:focus, .form-select:focus { border-color: #198754; box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25); }
      `}</style>

      {/* Header */}
      <div className="bg-white border-bottom py-3 px-4 shadow-sm">
         <div className="d-flex align-items-center gap-2 text-muted small">
            <Link href="/maintenance" className="text-decoration-none text-secondary"><i className="bi bi-arrow-left me-1"></i> ย้อนกลับ</Link>
            <span>/</span>
            <span className="text-primary fw-bold">สร้างแผนใหม่</span>
         </div>
         <h4 className="fw-bold m-0 mt-2 text-dark">สร้างแผนบำรุงรักษา (PM)</h4>
      </div>

      <div className="container-fluid px-4 py-4">
        
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="row justify-content-center"
        >
            <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-header bg-success text-white py-3">
                        <h6 className="m-0 fw-bold"><i className="bi bi-calendar-plus me-2"></i> ข้อมูลแผนงาน</h6>
                    </div>
                    
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            
                            <div className="row g-3 mb-3">
                                {/* วันที่กำหนด */}
                                <div className="col-md-6">
                                    <label className="form-label">วันที่กำหนด (Due Date) <span className="text-danger">*</span></label>
                                    <input 
                                        type="date" 
                                        name="date"
                                        className="form-control"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* ผู้รับผิดชอบ */}
                                <div className="col-md-6">
                                    <label className="form-label">ผู้รับผิดชอบ</label>
                                    <input 
                                        type="text" 
                                        name="responsible"
                                        className="form-control"
                                        placeholder="ระบุชื่อเจ้าหน้าที่ / ช่าง"
                                        value={formData.responsible}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* เลือกครุภัณฑ์ */}
                            <div className="mb-3">
                                <label className="form-label">เลือกครุภัณฑ์ (Asset) <span className="text-danger">*</span></label>
                                <select 
                                    name="asset_code"
                                    className="form-select"
                                    value={formData.asset_code}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- กรุณาเลือกครุภัณฑ์ --</option>
                                    {assets.map((item, index) => (
                                        <option key={index} value={item.asset_code}>
                                            {item.asset_code} : {item.asset_name || item.asset_category} ({item.place || '-'})
                                        </option>
                                    ))}
                                </select>
                                <div className="form-text text-muted">
                                    * เลือกครุภัณฑ์ที่ต้องการทำ PM จากฐานข้อมูล
                                </div>
                            </div>

                            {/* รายละเอียดงาน */}
                            <div className="mb-4">
                                <label className="form-label">รายละเอียดการบำรุงรักษา</label>
                                <textarea 
                                    name="description"
                                    className="form-control"
                                    rows="4"
                                    placeholder="เช่น ตรวจสอบความร้อน, อัปเดต Patch, ทำความสะอาดภายใน..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            {/* Buttons */}
                            <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                                <Link href="/maintenance" className="btn btn-light border text-secondary px-4 fw-bold">
                                    ยกเลิก
                                </Link>
                                <button type="submit" className="btn btn-success px-4 fw-bold shadow-sm" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                    บันทึกแผนงาน
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </motion.div>

      </div>
    </div>
  );
}