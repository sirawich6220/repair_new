"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { decodeIdWithDate } from "@/utils/base64";
import Swal from "sweetalert2";

export default function RepairEditPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params); // Unwrap params สำหรับ Next.js 15
  
  const [loading, setLoading] = useState(true);
  const [repair, setRepair] = useState({
    device_type: "",
    asset_code: "",
    description: "",
    status: "",
    user_name: ""
  });

  // 1. ดึงข้อมูลเดิมมาแสดงในฟอร์ม
  useEffect(() => {
    async function fetchRepairData() {
      try {
        const rawId = resolvedParams?.id;
        if (!rawId || rawId.includes("object Object")) return;

        const decodedData = decodeIdWithDate(rawId);
        const finalId = decodedData?.id || decodedData;

        const res = await fetch(`/api/repairs/${finalId}`);
        const data = await res.json();
        
        if (data.success) {
          setRepair(data.repair);
        } else {
          Swal.fire("ผิดพลาด", "ไม่พบข้อมูลงานซ่อม", "error");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRepairData();
  }, [resolvedParams?.id]);

  // 2. จัดการการเปลี่ยนแปลงในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRepair((prev) => ({ ...prev, [name]: value }));
  };

  // 3. ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      Swal.fire({ title: "กำลังบันทึก...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const decodedData = decodeIdWithDate(resolvedParams.id);
      const finalId = decodedData?.id || decodedData;

      const res = await fetch(`/api/repairs/${finalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repair),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire("สำเร็จ", "แก้ไขข้อมูลเรียบร้อยแล้ว", "success").then(() => {
          router.push("/repair/list"); // แก้ไขเสร็จกลับไปหน้าตาราง
        });
      } else {
        Swal.fire("ผิดพลาด", data.error || "ไม่สามารถบันทึกได้", "error");
      }
    } catch (error) {
      Swal.fire("Error", "การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว", "error");
    }
  };

  if (loading) return <div className="p-5 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container py-4" style={{ fontFamily: "'Sarabun', sans-serif" }}>
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 border-bottom-0">
          <h4 className="fw-bold mb-0 text-primary">
            <i className="bi bi-pencil-square me-2"></i> แก้ไขรายการแจ้งซ่อม
          </h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* ข้อมูลคงที่ (แสดงให้ดูเฉยๆ) */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">เลขที่ใบงาน</label>
                <input type="text" className="form-control bg-light" value={`JOB-2025-${String(repair.id).padStart(4, '0')}`} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">ผู้แจ้งซ่อม</label>
                <input type="text" className="form-control bg-light" value={repair.user_name} readOnly />
              </div>

              {/* ส่วนที่แก้ไขได้ */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">อุปกรณ์</label>
                <input type="text" name="device_type" className="form-control" value={repair.device_type} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">รหัสครุภัณฑ์</label>
                <input type="text" name="asset_code" className="form-control" value={repair.asset_code} onChange={handleChange} />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">สถานะงานซ่อม</label>
                <select name="status" className="form-select border-primary" value={repair.status} onChange={handleChange}>
                  <option value="waiting">รอตรวจสอบ</option>
                  <option value="pending">รออะไหล่</option>
                  <option value="processing">กำลังดำเนินการ</option>
                  <option value="completed">สำเร็จ</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">รายละเอียดอาการเสีย</label>
                <textarea name="description" className="form-control" rows="4" value={repair.description} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light border px-4" onClick={() => router.back()}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm">บันทึกการแก้ไข</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}