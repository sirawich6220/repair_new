"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

export default function AssetViewPage() {
  const router = useRouter();
  const { id } = useParams(); // รับค่า ID จาก URL
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAssetDetail();
  }, [id]);

  const fetchAssetDetail = async () => {
    try {
      setLoading(true);
      // เปลี่ยน URL API ให้ตรงกับที่คุณใช้งาน (เช่น /api/assets/by-id/[id])
      const res = await fetch(`/api/assets/view/${id}`);
      const data = await res.json();
      if (data.success) {
        setAsset(data.asset);
      } else {
        Swal.fire("ไม่พบข้อมูล", "ไม่พบรหัสครุภัณฑ์ที่ระบุ", "error");
        router.push("/report");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center fw-bold fs-4">กำลังโหลดข้อมูล...</div>;
  if (!asset) return null;

  // ฟังก์ชันช่วยแสดงกลุ่มข้อมูล
  const DetailRow = ({ label, value, col = "col-md-6" }) => (
    <div className={`${col} mb-3`}>
      <label className="form-label small text-muted fw-bold d-block mb-1">{label}</label>
      <div className="p-2 border-bottom bg-light bg-opacity-50 rounded" style={{ minHeight: "38px" }}>
        {value || <span className="text-muted italic small">- ไม่ระบุ -</span>}
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f0f2f5", fontFamily: "'Sarabun', sans-serif" }}>
      
      {/* 🟢 Header / Action Bar */}
      <div className="bg-white shadow-sm py-3 px-4 mb-4 sticky-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary rounded-circle" onClick={() => router.back()}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <h4 className="fw-bold m-0 text-dark">
              รายละเอียดครุภัณฑ์: <span className="text-success">{asset.asset_code}</span>
            </h4>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-warning fw-bold px-4" onClick={() => router.push(`/assets/edit/${asset.asset_code}`)}>
              <i className="bi bi-pencil-square me-2"></i>แก้ไขข้อมูล
            </button>
            <button className="btn btn-outline-dark fw-bold px-4" onClick={() => window.print()}>
              <i className="bi bi-printer me-2"></i>พิมพ์
            </button>
          </div>
        </div>
      </div>

      <div className="container-fluid px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div className="row g-4">
            {/* 🟦 คอลัมน์ซ้าย: ข้อมูลหลัก */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="card-header bg-success text-white py-3 fw-bold">
                  <i className="bi bi-info-circle me-2"></i>ข้อมูลพื้นฐานและคุณลักษณะ
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    <DetailRow label="ชื่อรายการครุภัณฑ์" value={asset.asset_name} col="col-12" />
                    <DetailRow label="ยี่ห้อ" value={asset.brand} />
                    <DetailRow label="รุ่น / แบบ" value={asset.model} />
                    <DetailRow label="Serial Number (S/N)" value={asset.serial_number} />
                    <DetailRow label="ประเภท" value={asset.asset_type} />
                    <DetailRow label="หมวดหมู่" value={asset.asset_category} />
                    <DetailRow label="ปีงบประมาณ" value={asset.fiscal_year} />
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-primary text-white py-3 fw-bold">
                  <i className="bi bi-geo-alt me-2"></i>สถานที่ตั้งและผู้รับผิดชอบ
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    <DetailRow label="หน่วยงาน / ฝ่าย" value={asset.department} />
                    <DetailRow label="งาน / กลุ่มงาน" value={asset.section} />
                    <DetailRow label="สถานที่ตั้งปัจจุบัน" value={asset.location} col="col-12" />
                    <DetailRow label="ผู้ครอบครอง / ผู้รับผิดชอบ" value={asset.owner} />
                  </div>
                </div>
              </div>
            </div>

            {/* 🟩 คอลัมน์ขวา: ข้อมูลการเงินและสถานะ */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 border-top border-4 border-warning">
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-4 border-bottom pb-2">สถานะและมูลค่า</h6>
                  <div className="mb-4 text-center py-3 bg-light rounded-4">
                    <span className={`badge rounded-pill px-4 py-2 fs-6 ${
                      asset.asset_status === 'ใช้งานปกติ' ? 'bg-success' : 'bg-danger'
                    }`}>
                      {asset.asset_status}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">ราคาต่อหน่วย:</span>
                    <span className="fw-bold text-primary fs-5">
                      {Number(asset.unit_price).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">วันที่รับมอบ:</span>
                    <span className="fw-bold">
                      {asset.received_date ? new Date(asset.received_date).toLocaleDateString('th-TH') : '-'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">อายุการใช้งาน:</span>
                    <span className="fw-bold">{asset.lifespan || '-'} ปี</span>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-danger">ประวัติการซ่อม</h6>
                  {/* หากคุณมีข้อมูลประวัติการซ่อมให้นำมา Map ตรงนี้ */}
                  <div className="text-center py-4 text-muted small italic">
                    <i className="bi bi-tools fs-1 d-block mb-2 opacity-25"></i>
                    ยังไม่มีประวัติการซ่อมบำรุงในระบบ
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}