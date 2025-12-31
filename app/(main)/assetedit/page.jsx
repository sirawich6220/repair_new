"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function AssetEditPage() {
  const [assetList, setAssetList] = useState([]); 
  const [selectedCode, setSelectedCode] = useState("");
  const [results, setResults] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);

  const [editAll, setEditAll] = useState({
    code: "",
    type: "",
    category: "",
  });

  useEffect(() => {
    loadAssetList();
  }, []);

  const loadAssetList = async () => {
    try {
      const res = await fetch("/api/assets/list");
      const data = await res.json();
      if (data.success) setAssetList(data.assets);
    } catch (error) {
      console.error(error);
    }
  };

  const loadByCode = async (code) => {
    if (!code) {
      setResults([]);
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(`/api/assets/search?search=${code}`);
      const data = await res.json();

      if (!data.success || data.assets.length === 0) {
        Swal.fire({ icon: 'warning', title: 'ไม่พบข้อมูล', timer: 1500, showConfirmButton: false });
        setResults([]);
      } else {
        const firstItem = data.assets[0];
        setEditAll({
          code: firstItem.asset_code,
          type: firstItem.asset_type,
          category: firstItem.asset_category,
        });
        setResults(data.assets);
      }
    } catch (error) {
      Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkChange = (field, value) => {
    setEditAll(prev => ({ ...prev, [field]: value }));
    const updatedResults = results.map(item => ({
      ...item,
      [field === 'code' ? 'asset_code' : field === 'type' ? 'asset_type' : 'asset_category']: value
    }));
    setResults(updatedResults);
  };

  const handleIndividualChange = (index, field, value) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const saveItem = async (item) => {
    try {
      const res = await fetch(`/api/assets/${item.asset_code}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'บันทึกรายการนี้เรียบร้อย', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      } else {
        Swal.fire("Error", data.error, "error");
      }
    } catch (err) {
      Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
    }
  };

  const saveAll = async () => {
    const confirm = await Swal.fire({
        title: `ยืนยันการบันทึก ${results.length} รายการ?`,
        text: "ข้อมูลทั้งหมดจะถูกเปลี่ยนแปลง",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการบันทึก',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1e3a8a', // สีน้ำเงินกรมท่า
        cancelButtonColor: '#6c757d'
    });

    if (confirm.isConfirmed) {
        Swal.fire({ title: 'กำลังประมวลผล...', didOpen: () => Swal.showLoading() });
        try {
            for (const row of results) {
                await fetch(`/api/assets/${selectedCode}`, { 
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(row),
                });
            }
            Swal.fire("สำเร็จ!", "ปรับปรุงข้อมูลทั้งหมดเรียบร้อยแล้ว", "success");
            loadByCode(selectedCode); 
        } catch (error) {
            Swal.fire("Error", "เกิดข้อผิดพลาดบางรายการ", "error");
        }
    }
  };

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f0f2f5", fontFamily: "'Sarabun', sans-serif" }}>
      {/* Import Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .bg-gov-blue { background-color: #1e3a8a; } /* Royal Blue */
        .text-gov-blue { color: #1e3a8a; }
        .border-gov { border-color: #1e3a8a; }
        .header-stripe {
            height: 6px;
            background: linear-gradient(90deg, #1e3a8a 0%, #1e3a8a 40%, #fbbf24 40%, #fbbf24 60%, #1e3a8a 60%, #1e3a8a 100%);
        }
        .form-control { border-radius: 4px; border: 1px solid #ced4da; }
        .form-control:focus { border-color: #1e3a8a; box-shadow: 0 0 0 0.2rem rgba(30, 58, 138, 0.25); }
        .card-shadow { box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
      `}</style>

      {/* Decorative Top Stripe (แถบสีหน่วยงาน) */}
      <div className="header-stripe w-100"></div>

      {/* Header Section */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container-fluid px-4 py-3">
             <div className="d-flex align-items-center gap-3">
                <div className="bg-gov-blue text-white rounded p-2 d-flex align-items-center justify-content-center" style={{width: 48, height: 48}}>
                    <i className="bi bi-building-fill-gear fs-4"></i>
                </div>
                <div>
                    <h4 className="fw-bold text-gov-blue m-0">ระบบบริหารจัดการครุภัณฑ์</h4>
                    <small className="text-muted">ส่วนปรับปรุงข้อมูลแบบกลุ่ม (Batch Edit)</small>
                </div>
             </div>
        </div>
      </div>

      <div className="container-fluid px-4 mt-4">
        
        {/* 1. ส่วนค้นหา / เลือกกลุ่มข้อมูล */}
        <div className="card border-0 card-shadow mb-4" style={{ borderRadius: "8px" }}>
            <div className="card-header bg-white border-bottom py-3">
                <h6 className="m-0 fw-bold text-secondary"><i className="bi bi-search me-2"></i>ค้นหาชุดข้อมูล</h6>
            </div>
            <div className="card-body p-4 bg-light">
                <div className="row align-items-end">
                    <div className="col-md-8 mb-2 mb-md-0">
                        <label className="form-label fw-bold">เลือกกลุ่มรหัสครุภัณฑ์ (Prefix Code)</label>
                        <select
                            className="form-select form-select-lg"
                            value={selectedCode}
                            onChange={(e) => {
                                setSelectedCode(e.target.value);
                                loadByCode(e.target.value);
                            }}
                        >
                            <option value="">-- กรุณาเลือกรายการ --</option>
                            {[...new Set(assetList.map((a) => a.asset_code))].map((code, idx) => (
                                <option key={idx} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-4 text-end">
                         <a href="/assetcreate" className="btn btn-outline-primary w-100 w-md-auto">
                            <i className="bi bi-plus-circle me-1"></i> เพิ่มรายการใหม่
                         </a>
                    </div>
                </div>
            </div>
        </div>

        <AnimatePresence>
            {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    
                    {/* 2. Master Editor (ส่วนกำหนดค่าหลัก) */}
                    <div className="card border-0 card-shadow mb-4 overflow-hidden" style={{ borderRadius: "8px" }}>
                        <div className="card-header bg-gov-blue text-white py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="m-0 fw-bold"><i className="bi bi-sliders me-2"></i>ส่วนกำหนดค่าหลัก (Master Configuration)</h5>
                                <small className="opacity-75" style={{fontSize: '0.8rem'}}>การแก้ไขในส่วนนี้ จะมีผลกับทุกรายการด้านล่าง ({results.length} รายการ)</small>
                            </div>
                            <i className="bi bi-pencil-square fs-4 opacity-50"></i>
                        </div>
                        <div className="card-body p-4" style={{ backgroundColor: "#f8f9fa" }}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label text-gov-blue">รหัสครุภัณฑ์ (Prefix)</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white text-gov-blue"><i className="bi bi-qr-code"></i></span>
                                        <input 
                                            className="form-control fw-bold" 
                                            value={editAll.code} 
                                            onChange={(e) => handleBulkChange('code', e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-gov-blue">ประเภทครุภัณฑ์</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white text-gov-blue"><i className="bi bi-box-seam"></i></span>
                                        <input 
                                            className="form-control" 
                                            value={editAll.type} 
                                            onChange={(e) => handleBulkChange('type', e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-gov-blue">ชนิด/หมวดหมู่</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white text-gov-blue"><i className="bi bi-tags"></i></span>
                                        <input 
                                            className="form-control" 
                                            value={editAll.category} 
                                            onChange={(e) => handleBulkChange('category', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-top mt-4 pt-3 text-end">
                                <button className="btn btn-warning text-dark fw-bold px-4 shadow-sm" onClick={saveAll}>
                                    <i className="bi bi-save2-fill me-2"></i> บันทึกการเปลี่ยนแปลงทั้งหมด
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Data Grid (รายการข้อมูล) */}
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-gov-blue" style={{width: 5, height: 24, marginRight: 10}}></div>
                        <h6 className="fw-bold m-0 text-secondary">รายการข้อมูลย่อย (Individual Data)</h6>
                    </div>
                    
                    <div className="row g-3">
                        {results.map((item, index) => (
                            <div className="col-12 col-md-6 col-xl-4" key={index}>
                                <div className="card h-100 border card-shadow" style={{ borderRadius: "4px", borderTop: "4px solid #1e3a8a" }}>
                                    <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                        <span className="badge bg-secondary rounded-0">ลำดับที่ {index + 1}</span>
                                        <button 
                                            className="btn btn-sm btn-light text-primary border" 
                                            title="บันทึกเฉพาะรายการนี้"
                                            onClick={() => saveItem(item)}
                                        >
                                            <i className="bi bi-save me-1"></i> บันทึก
                                        </button>
                                    </div>
                                    <div className="card-body p-3 bg-light bg-opacity-25">
                                        <div className="mb-2">
                                            <label className="small fw-bold text-muted mb-1">รหัสครุภัณฑ์</label>
                                            <input 
                                                className="form-control form-control-sm" 
                                                value={item.asset_code}
                                                onChange={(e) => handleIndividualChange(index, 'asset_code', e.target.value)}
                                            />
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label className="small fw-bold text-muted mb-1">ประเภท</label>
                                                <input 
                                                    className="form-control form-control-sm" 
                                                    value={item.asset_type}
                                                    onChange={(e) => handleIndividualChange(index, 'asset_type', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="small fw-bold text-muted mb-1">ชนิด</label>
                                                <input 
                                                    className="form-control form-control-sm" 
                                                    value={item.asset_category}
                                                    onChange={(e) => handleIndividualChange(index, 'asset_category', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}