"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

export default function AssetFullReport() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    searchTerm: "",
    department: "",
    status: "",
    fiscalYear: ""
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/assets"); 
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Load report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.asset_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                       item.asset_code?.includes(filters.searchTerm);
    const matchDept = filters.department ? item.department === filters.department : true;
    const matchStatus = filters.status ? item.asset_status === filters.status : true;
    const matchYear = filters.fiscalYear ? String(item.fiscal_year) === filters.fiscalYear : true;
    
    return matchSearch && matchDept && matchStatus && matchYear;
  });

  // 🟢 ฟังก์ชันส่งออก Excel (ใช้แทนการพิมพ์ PDF)
  const exportToExcel = () => {
    if (filteredData.length === 0) return Swal.fire("แจ้งเตือน", "ไม่มีข้อมูลสำหรับส่งออก", "warning");

    // 1. เตรียมข้อมูลสำหรับ Excel
    const excelData = filteredData.map((item, index) => ({
      "ลำดับ": index + 1,
      "รหัสครุภัณฑ์": item.asset_code,
      "ชื่อรายการ": item.asset_name,
      "ยี่ห้อ/รุ่น": `${item.brand || ''} ${item.model || ''}`.trim() || "-",
      "หมายเลขเครื่อง (S/N)": item.serial_number || "-",
      "หน่วยงาน": item.department || "-",
      "สถานที่ตั้ง": item.location || "-",
      "ผู้รับผิดชอบ": item.owner || "-",
      "ปีงบประมาณ": item.fiscal_year || "-",
      "ราคา (บาท)": Number(item.unit_price) || 0,
      "สถานะ": item.asset_status,
      "อายุ (ปี)": item.lifespan || "-",
      "หมายเหตุ": item.remark || "-"
    }));

    // 2. สร้าง Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 3. ตั้งค่าความกว้างคอลัมน์ (ให้สวยงามเมื่อเปิดใน Excel)
    const columnWidths = [
      { wch: 6 },  // ลำดับ
      { wch: 22 }, // รหัสครุภัณฑ์
      { wch: 40 }, // ชื่อรายการ
      { wch: 25 }, // ยี่ห้อ/รุ่น
      { wch: 15 }, // S/N
      { wch: 20 }, // หน่วยงาน
      { wch: 20 }, // สถานที่
      { wch: 20 }, // ผู้รับผิดชอบ
      { wch: 8 },  // ปีงบ
      { wch: 15 }, // ราคา
      { wch: 12 }, // สถานะ
      { wch: 8 },  // อายุ
      { wch: 15 }  // หมายเหตุ
    ];
    worksheet['!cols'] = columnWidths;

    // 4. สร้าง Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ทะเบียนครุภัณฑ์");
    
    // 5. ตั้งชื่อไฟล์และดาวน์โหลด
    const fileName = `รายงานครุภัณฑ์_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // คำนวณสรุปยอด (Stats)
  const stats = {
    totalItems: filteredData.length,
    totalValue: filteredData.reduce((sum, item) => sum + Number(item.unit_price), 0),
    normalItems: filteredData.filter(i => i.asset_status === 'ใช้งานปกติ').length,
    brokenItems: filteredData.filter(i => i.asset_status === 'ชำรุด').length
  };

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f8fafc", fontFamily: "'Sarabun', sans-serif" }}>
      <style jsx global>{`
        .report-card { border: none; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
      `}</style>
      
      {/* 🟢 Header Section */}
      <div className="bg-white border-bottom py-4 px-4 sticky-top" style={{ zIndex: 1020 }}>
        <div className="container-fluid d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="fw-bold m-0 text-dark d-flex align-items-center">
              <i className="bi bi-file-earmark-bar-graph-fill me-3 text-success fs-3"></i>
              รายงานทะเบียนครุภัณฑ์
            </h4>
            <p className="text-muted small m-0 mt-1">สรุปข้อมูลทะเบียนทรัพย์สินหน่วยงาน (ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')})</p>
          </div>
          <div className="d-flex gap-2">
            {/* 🟢 ปุ่มพิมพ์ เปลี่ยนเป็น Download Excel ตามสั่ง */}
            <button className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" onClick={exportToExcel}>
              <i className="bi bi-printer me-2"></i>พิมพ์รายงาน (Excel)
            </button>
          </div>
        </div>
      </div>

      <div className="container-fluid px-4 mt-4">
        
        {/* 📊 Quick Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "รายการทั้งหมด", value: stats.totalItems, unit: "รายการ", color: "primary", icon: "bi-box-seam" },
            { label: "มูลค่ารวม", value: stats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2}), unit: "บาท", color: "success", icon: "bi-currency-dollar" },
            { label: "สภาพปกติ", value: stats.normalItems, unit: "รายการ", color: "info", icon: "bi-check-circle" },
            { label: "ชำรุด/รอซ่อม", value: stats.brokenItems, unit: "รายการ", color: "danger", icon: "bi-exclamation-triangle" },
          ].map((s, idx) => (
            <div key={idx} className="col-12 col-md-3">
              <div className="card report-card p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className={`stat-icon bg-${s.color} bg-opacity-10 text-${s.color}`}>
                    <i className={`bi ${s.icon} fs-4`}></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">{s.label}</small>
                    <h5 className="fw-bold mb-0">{s.value} <small className="fs-6 fw-normal text-muted">{s.unit}</small></h5>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔍 Filter Section */}
        <div className="card report-card mb-4 border-start border-4 border-success">
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary text-uppercase">ค้นหา</label>
                <div className="input-group border rounded-pill overflow-hidden bg-light">
                  <span className="input-group-text bg-transparent border-0 pe-0"><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" className="form-control bg-transparent border-0 shadow-none py-2" 
                    placeholder="ค้นหาจากชื่อหรือรหัสครุภัณฑ์..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary text-uppercase">หน่วยงาน</label>
                <select className="form-select border rounded-pill py-2 bg-light shadow-none" value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
                  <option value="">ทั้งหมดทุกหน่วยงาน</option>
                  <option value="บริหารทั่วไป">ฝ่ายบริหารทั่วไป</option>
                  <option value="ยุทธศาสตร์">กลุ่มงานยุทธศาสตร์</option>
                  <option value="IT">งานสารสนเทศ (IT)</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary text-uppercase">สถานะ</label>
                <select className="form-select border rounded-pill py-2 bg-light shadow-none" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                  <option value="">ทุกสถานะ</option>
                  <option value="ใช้งานปกติ">ใช้งานปกติ</option>
                  <option value="ชำรุด">ชำรุด</option>
                  <option value="รอซ่อม">รอซ่อม</option>
                  <option value="จำหน่าย">แทงจำหน่าย</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-outline-secondary w-100 rounded-pill py-2" onClick={() => setFilters({searchTerm: "", department: "", status: "", fiscalYear: ""})}>
                  ล้างค่า
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Table Section */}
        <div className="card report-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light border-bottom">
                <tr className="text-muted small text-uppercase">
                  <th className="ps-4 py-3" style={{ width: "60px" }}>#</th>
                  <th style={{ width: "160px" }}>รหัสครุภัณฑ์</th>
                  <th>รายการครุภัณฑ์</th>
                  <th>หน่วยงานที่ดูแล</th>
                  <th className="text-center">ปีงบ</th>
                  <th className="text-end">ราคาต่อหน่วย</th>
                  <th className="text-center">สถานะ</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border text-success"></div></td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="border-bottom-0">
                      <td className="ps-4 text-muted small">{index + 1}</td>
                      <td><span className="badge bg-light text-dark border px-2 py-1 fw-medium">{item.asset_code}</span></td>
                      <td>
                        <div className="fw-bold text-dark">{item.asset_name}</div>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>S/N: {item.serial_number || '-'}</div>
                      </td>
                      <td><span className="small text-muted">{item.department}</span></td>
                      <td className="text-center small">{item.fiscal_year}</td>
                      <td className="text-end fw-bold text-dark">
                        {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-1 fw-medium ${
                          item.asset_status === 'ใช้งานปกติ' ? 'bg-success bg-opacity-10 text-success border border-success' :
                          item.asset_status === 'ชำรุด' ? 'bg-danger bg-opacity-10 text-danger border border-danger' :
                          'bg-warning bg-opacity-10 text-warning border border-warning'
                        }`} style={{ fontSize: '11px' }}>
                          {item.asset_status}
                        </span>
                      </td>
                      <td className="text-center">
                         <button className="btn btn-sm btn-light border rounded-circle" style={{ width: 32, height: 32 }} onClick={() => router.push(`/assets/view/${item.id}`)}>
                            <i className="bi bi-eye text-primary"></i>
                         </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="text-center py-5 text-muted italic">-- ไม่พบข้อมูลที่ต้องการค้นหา --</td></tr>
                )}
              </tbody>
              {!loading && filteredData.length > 0 && (
                <tfoot className="bg-light">
                  <tr className="fw-bold text-dark">
                    <td colSpan="5" className="text-end py-3">มูลค่ารวมตามรายการที่กรอง ({filteredData.length} รายการ):</td>
                    <td className="text-end text-success fs-5 py-3 border-start border-end">
                      {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan="2" className="py-3 ps-3">บาท</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}