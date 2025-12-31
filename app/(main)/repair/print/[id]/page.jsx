"use client";

import React, { useEffect, useState, use } from "react";
import { decodeIdWithDate } from "@/utils/base64";

export default function PrintRepairPage({ params }) {
  const resolvedParams = use(params); 
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRepairData() {
      try {
        const rawId = resolvedParams?.id;
        if (!rawId || typeof rawId !== 'string' || rawId.includes("object Object")) return;

        const decodedData = decodeIdWithDate(rawId);
        const finalId = decodedData?.id || decodedData; 
        
        const res = await fetch(`/api/repairs/${finalId}`);
        const data = await res.json();
        
        if (data.success) {
          setRepair(data.repair);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRepairData();
  }, [resolvedParams?.id]);

  useEffect(() => {
    if (!loading && repair) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, repair]);

  if (loading) return <div className="p-5 text-center">กำลังโหลดข้อมูลใบแจ้งซ่อม...</div>;
  if (!repair) return <div className="p-5 text-center text-danger">ไม่พบข้อมูลงานซ่อม</div>;

  return (
    <div className="print-wrapper">
      <style jsx global>{`
        /* 🟢 ซ่อน Sidebar และส่วนประกอบอื่นๆ ของ Layout หลักตอนสั่งพิมพ์ */
        @media print {
          /* ระบุ Class ของ Sidebar/Navbar ที่คุณใช้อยู่เพื่อสั่งซ่อน */
          nav, aside, .sidebar, .navbar, .no-print, button, header:not(.print-header) {
            display: none !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }
        }

        /* การแสดงผลบนหน้าจอปกติ */
        .print-container {
          max-width: 800px;
          margin: 40px auto;
          padding: 40px;
          background: white;
          border: 1px solid #eee;
          box-shadow: 0 0 15px rgba(0,0,0,0.05);
          font-family: 'Sarabun', sans-serif;
        }

        .print-header {
          display: flex;
          align-items: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
      `}</style>

      <div className="print-container">
        {/* หัวใบแจ้งซ่อม */}
        <div className="print-header">
          <img src="/MOPH.png" alt="logo" style={{ width: '70px', height: '70px', marginRight: '20px' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>ใบแจ้งซ่อมและใบรับงาน</h2>
            <p style={{ margin: 0, fontSize: '16px' }}>สำนักงานสาธารณสุขจังหวัดอำนาจเจริญ</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px' }}>เลขที่ใบงาน:</span><br />
            <strong style={{ fontSize: '18px' }}>JOB-2025-{String(repair.id).padStart(4, '0')}</strong>
          </div>
        </div>

        {/* เนื้อหาข้อมูล */}
        <div style={{ lineHeight: '2' }}>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '150px', fontWeight: 'bold' }}>ผู้แจ้งซ่อม:</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #ccc' }}>{repair.user_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '150px', fontWeight: 'bold' }}>อุปกรณ์:</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #ccc' }}>{repair.device_type}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '150px', fontWeight: 'bold' }}>รหัสครุภัณฑ์:</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #ccc' }}>{repair.asset_code || 'ไม่ระบุรหัส'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '150px', fontWeight: 'bold' }}>รายละเอียดอาการ:</span>
            <span style={{ flex: 1, borderBottom: '1px dotted #ccc', minHeight: '60px' }}>{repair.description}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <span style={{ width: '150px', fontWeight: 'bold' }}>วันที่แจ้ง:</span>
            <span style={{ flex: 1 }}>{new Date(repair.created_at).toLocaleDateString("th-TH", { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* ส่วนลงนาม */}
        <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <div style={{ borderBottom: '1px solid black', marginBottom: '10px' }}></div>
            <p>( ................................................... )</p>
            <strong>ผู้แจ้งซ่อม</strong>
          </div>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <div style={{ borderBottom: '1px solid black', marginBottom: '10px' }}></div>
            <p>( ................................................... )</p>
            <strong>เจ้าหน้าที่รับงาน</strong>
          </div>
        </div>
      </div>
    </div>
  );
}