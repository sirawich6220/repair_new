"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
// ใช้ Relative Path เพื่อแก้ปัญหา Module not found
import AssetCreatePage from "../../../assetcreate/page"; 

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const asset_code = params.asset_code; 

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f8f9fa", fontFamily: "'Sarabun', sans-serif" }}>
      
      {/* 🟢 Header พร้อมปุ่มย้อนกลับ */}
      <div className="bg-white border-bottom py-3 px-4 mb-4 shadow-sm sticky-top" style={{ zIndex: 1020 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" 
              style={{ width: "40px", height: "40px" }}
              onClick={() => router.back()}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <div>
              <h4 className="fw-bold m-0 text-dark">
                แก้ไขข้อมูล: <span className="text-primary">{asset_code}</span>
              </h4>
              <p className="text-muted small m-0">กรุณาตรวจสอบข้อมูลก่อนทำการบันทึกการเปลี่ยนแปลง</p>
            </div>
          </div>
          
          <div>
            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm border border-warning">
              <i className="bi bi-pencil-fill me-1"></i> โหมดแก้ไข
            </span>
          </div>
        </div>
      </div>

      <div className="container-fluid px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* เรียกใช้ Component ลงทะเบียน และส่งรหัสไป AutoFill ข้อมูลเดิม */}
          <AssetCreatePage defaultAssetCode={asset_code} />
        </motion.div>
      </div>

      {/* ตกแต่ง Style เพิ่มเติม */}
      <style jsx global>{`
        .form-control:focus {
          border-color: #ffc107 !important;
          box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.2) !important;
        }
        .btn-success {
          padding: 12px 30px !important;
          font-weight: bold !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}