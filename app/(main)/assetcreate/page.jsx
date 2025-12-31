"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

// --- 🛠️ CONSTANTS: รหัสมาตรฐาน ---
const ASSET_TYPE_CODES = {
  "ครุภัณฑ์สำนักงาน": "7110", "ครุภัณฑ์ยานพาหนะ": "2310", "ครุภัณฑ์ไฟฟ้าและวิทยุ": "5835",
  "ครุภัณฑ์โฆษณาและเผยแพร่": "7730", "ครุภัณฑ์การเกษตร": "4330", "ครุภัณฑ์การแพทย์": "6520",
  "ครุภัณฑ์คอมพิวเตอร์": "7440", "ครุภัณฑ์การศึกษา": "6660", "ครุภัณฑ์งานบ้านงานครัว": "4110",
  "ครุภัณฑ์สนาม": "5410", "อาคารสิ่งก่อสร้าง": "9999"
};

const ASSET_CATEGORY_CODES = {
  "สินทรัพย์ถาวร": "001", "ครุภัณฑ์ต่ำกว่าเกณฑ์": "002", 
  "วัสดุคงทน": "003", "วัสดุสิ้นเปลือง": "004"
};

const ASSET_KIND_CODES = {
  "สำนักงาน": "0001", "วิทยาศาสตร์": "0002", "ยานพาหนะ": "0003", "โฆษณา": "0004",
  "ไฟฟ้า": "0005", "งานบ้าน": "0006", "เกษตร": "0007", "ก่อสร้าง": "0008",
  "สำรวจ": "0009", "คอมพิวเตอร์": "0010", "โรงงาน": "0011", "การแพทย์": "0012", "การศึกษา": "0013"
};

// --- 🛠️ HELPER FUNCTIONS ---

const getFiscalYearFull = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();
  let year = date.getFullYear();
  const month = date.getMonth() + 1; 
  if (month >= 10) year += 1; 
  return (year + 543).toString();
};

const getFiscalYearShort = (dateString = null) => {
  const fullYear = getFiscalYearFull(dateString);
  return fullYear.slice(-2);
};

// --- 🧩 COMPONENTS ---
const InputField = memo(({ label, name, value, onChange, isEditing, type = "text", col = "col-12 col-md-6 col-lg-4", inputRef = null, placeholder = "", error = "", required = false, readOnly = false }) => (
  <div className={col}>
    <label className="form-label small text-muted fw-bold mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <input 
      ref={inputRef} type={type} name={name} value={value || ""} onChange={onChange} 
      readOnly={!isEditing || readOnly} placeholder={isEditing ? placeholder : ""} 
      className={`form-control ${(!isEditing || readOnly) ? "bg-light text-secondary border-dashed shadow-none" : error ? "border-danger bg-white" : "border-secondary-subtle bg-white focus-ring"}`} 
      style={{ fontSize: "0.95rem", borderRadius: "6px", transition: "all 0.2s" }} 
    />
    {error && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-exclamation-circle"></i> {error}</div>}
  </div>
));
InputField.displayName = "InputField";

const SelectField = memo(({ label, name, value, onChange, isEditing, options = [], col = "col-12 col-md-6 col-lg-4", error = "", required = false }) => (
  <div className={col}>
    <label className="form-label small text-muted fw-bold mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <select 
      name={name} value={value || ""} onChange={onChange} disabled={!isEditing} 
      className={`form-select ${!isEditing ? "bg-light text-secondary border-dashed" : error ? "border-danger" : "border-secondary-subtle"}`} 
      style={{ fontSize: "0.95rem", borderRadius: "6px" }}
    >
      <option value="">-- กรุณาเลือก --</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
    {error && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>{error}</div>}
  </div>
));
SelectField.displayName = "SelectField";

const FormSection = ({ title, icon, children }) => (
  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
    <div className="card-header bg-white border-bottom py-3 text-primary fw-bold d-flex align-items-center gap-2">
      <div className="bg-primary bg-opacity-10 p-2 rounded-circle"><i className={`bi ${icon} fs-5`}></i></div> {title}
    </div>
    <div className="card-body p-4 bg-white"><div className="row g-3">{children}</div></div>
  </div>
);

// --- 🚀 MAIN COMPONENT ---
export default function AssetCreatePage() {
  const emptyForm = {
    asset_sequence: "", asset_code: "", asset_name: "", asset_type: "", asset_category: "",
    brand: "", model: "", serial_number: "", description: "", 
    unit_price: "", quantity: "1", fiscal_year: "", acquisition_method: "", budget_type: "", 
    purchase_date: "", received_date: "", supplier: "", delivery_doc_no: "", purchase_doc_no: "", 
    disbursement_proof: "", disbursement_date: "", department: "สนง.สสจ.อำนาจเจริญ", section: "", 
    location: "", owner: "", work_type: "", asset_status: "ใช้งานปกติ", current_condition: "", 
    lifespan: "", warranty_period: "", remark: ""            
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [hideSearch, setHideSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [originalCode, setOriginalCode] = useState("");
  const [assetList, setAssetList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [searchMode, setSearchMode] = useState("text"); 
  const firstInputRef = useRef(null);

  useEffect(() => { 
    const init = async () => { await loadUserData(); await loadAssetList(); };
    init();
  }, []);

  const fetchRunningNumber = async (prefix) => {
    if (!prefix) return;
    setIsGenerating(true);
    try {
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/assets/running?prefix=${encodeURIComponent(prefix)}&t=${timestamp}`);
        const data = await res.json();
        
        const nextSeq = data.nextSeq || 1;
        const yearShort = getFiscalYearShort(form.received_date); 

        setForm(prev => ({
            ...prev,
            asset_code: `${prefix}${nextSeq}/${yearShort}`, 
            asset_sequence: nextSeq
        }));
    } catch (err) {
        console.error("Run number error:", err);
    } finally {
        setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!originalCode && isEditing) {
        const typeCode = ASSET_TYPE_CODES[form.asset_type] || "";
        const catCode = ASSET_CATEGORY_CODES[form.asset_category] || "";
        const kindCode = ASSET_KIND_CODES[form.description] || "";
        
        if (typeCode && catCode && kindCode) {
            const newPrefix = `${typeCode}-${catCode}-${kindCode}/`;
            if (!form.asset_code || !form.asset_code.startsWith(newPrefix)) {
                setForm(prev => ({ ...prev, asset_code: newPrefix, asset_sequence: "" }));
                fetchRunningNumber(newPrefix);
            }
        }
    }
  }, [form.asset_type, form.asset_category, form.description, isEditing, originalCode]);

  useEffect(() => {
    if (isEditing && form.received_date) {
        const fyFull = getFiscalYearFull(form.received_date);
        if (fyFull !== form.fiscal_year) {
            setForm(prev => ({ ...prev, fiscal_year: fyFull }));
            if (form.asset_code && form.asset_code.includes('/')) {
                const parts = form.asset_code.split('/');
                if (parts.length >= 3) {
                    const yearShort = getFiscalYearShort(form.received_date);
                    const newCode = `${parts[0]}/${parts[1]}/${yearShort}`; 
                    setForm(prev => ({ ...prev, asset_code: newCode }));
                }
            }
        }
    }
  }, [form.received_date, isEditing]);

  useEffect(() => {
    if (form.asset_code && typeof form.asset_code === 'string' && form.asset_code.includes('/')) {
        const parts = form.asset_code.trim().split('/');
        let autoSeq = "";
        if(parts.length >= 3) autoSeq = parts[parts.length - 2]; 
        else if (parts.length === 2) autoSeq = parts[1];

        if (autoSeq && !isNaN(parseInt(autoSeq)) && String(form.asset_sequence) !== String(autoSeq)) {
            setForm(prev => ({ ...prev, asset_sequence: autoSeq }));
        }
    }
  }, [form.asset_code]);

  const handleRefreshNumber = () => {
    if (form.asset_code && form.asset_code.includes('/')) {
        const parts = form.asset_code.split('/');
        if (parts.length >= 1) {
            const currentPrefix = parts[0] + '/'; 
            fetchRunningNumber(currentPrefix);
        }
    }
  };

  const loadUserData = async () => { try { const res = await fetch("/api/me", { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }); const data = await res.json(); if (data.user) setUser(data.user); } catch (err) { console.error(err); } finally { setLoading(false); } };
  const canManageAsset = user?.role?.toLowerCase().includes("admin") || user?.permissions?.includes("จัดการครุภัณฑ์") || String(user?.profile_id) === "1" || String(user?.profile_id) === "7";
  const loadAssetList = async () => { try { const res = await fetch("/api/assets/list"); const data = await res.json(); if (data.success) setAssetList(data.assets); } catch (err) { console.error(err); } };
  const handleChange = useCallback((e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); }, [errors]);
  const autoFillAsset = async (code) => { if(!code) return; try { Swal.showLoading(); const res = await fetch(`/api/assets/${encodeURIComponent(code)}`); const data = await res.json(); Swal.close(); if (!data.success) { Swal.fire("ไม่พบข้อมูล", "", "warning"); return; } const fx = (d) => (d ? d.split("T")[0] : ""); setForm({ ...data.asset, received_date: fx(data.asset.received_date), purchase_date: fx(data.asset.purchase_date), warranty_period: fx(data.asset.warranty_period), disbursement_date: fx(data.asset.disbursement_date) }); setOriginalCode(data.asset.asset_code); setShowForm(true); setHideSearch(true); setIsEditing(false); } catch (err) { Swal.fire("Error", "ดึงข้อมูลผิดพลาด", "error"); } };
  
  const validateForm = () => {
    const newErrors = {};
    if (!form.asset_code) newErrors.asset_code = "ระบุเลขครุภัณฑ์";
    if (!form.asset_name) newErrors.asset_name = "ระบุชื่อรายการ";
    if (!form.received_date) newErrors.received_date = "ระบุวันที่ตรวจรับ";
    if (!form.unit_price) newErrors.unit_price = "ระบุราคา";
    if (!form.asset_type) newErrors.asset_type = "เลือกประเภท";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!canManageAsset) return Swal.fire("สิทธิ์ไม่ถึง", "คุณไม่มีสิทธิ์จัดการครุภัณฑ์", "error");
    if (!validateForm()) return Swal.fire("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลช่องที่มี * ให้ครบถ้วน", "warning");

    try {
      Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const isNew = !originalCode;
      const url = isNew ? "/api/assets/create" : `/api/assets/${encodeURIComponent(originalCode)}`;
      const payload = { ...form };
      ['received_date', 'purchase_date', 'warranty_period', 'disbursement_date'].forEach(key => { if (payload[key] === "") payload[key] = null; });
      
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      
      if (data.success) { 
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
        setIsEditing(false); setOriginalCode(form.asset_code); loadAssetList(); 
      } else { 
        Swal.fire("บันทึกไม่สำเร็จ", data.error, "error"); 
      }
    } catch { Swal.fire("Error", "เชื่อมต่อ Server ไม่ได้", "error"); }
  };

  if (loading) return <div className="d-flex vh-100 justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f8f9fa", fontFamily: "'Sarabun', sans-serif" }}>
       <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); body { font-family: 'Sarabun', sans-serif; } .border-dashed { border-style: dashed !important; border-color: #dee2e6 !important; } .fixed-bottom { z-index: 2050 !important; background: white; border-top: 1px solid #dee2e6; box-shadow: 0 -5px 15px rgba(0,0,0,0.05); } `}</style>

      {/* Header */}
      <div className="bg-white shadow-sm py-3 px-3 px-md-5 mb-4 border-bottom sticky-top" style={{ zIndex: 101 }}>
        <div className="d-flex justify-content-between align-items-center">
            <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2"><i className="bi bi-box-seam-fill text-primary"></i> ทะเบียนครุภัณฑ์</h4>
            <div className="text-end">
                <span className={`badge ${canManageAsset ? 'bg-success' : 'bg-secondary'} px-3 py-2 rounded-pill fw-normal`}>
                    <i className={`bi ${canManageAsset ? 'bi-person-check-fill' : 'bi-person-lock'} me-1`}></i> {canManageAsset ? 'เจ้าหน้าที่พัสดุ' : 'ผู้ใช้งานทั่วไป'}
                </span>
            </div>
        </div>
      </div>

      <div className="container-fluid px-3 px-md-5">
          {/* Search Box */}
          {!hideSearch && (
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "12px" }}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-9">
                  <label className="form-label small fw-bold text-secondary mb-1"><i className="bi bi-search me-1"></i> ค้นหาข้อมูล</label>
                  <div className="input-group">
                    <button className={`btn ${searchMode === 'text' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSearchMode('text')}><i className="bi bi-keyboard"></i></button>
                    <button className={`btn ${searchMode === 'select' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSearchMode('select')}><i className="bi bi-list-ul"></i></button>
                    {searchMode === 'text' ? (
                        <input list="assetOptions" className="form-control" placeholder="พิมพ์เลขครุภัณฑ์ หรือ ชื่อรายการ..." value={form.asset_code} onChange={(e) => setForm({...form, asset_code: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && autoFillAsset(form.asset_code)} />
                    ) : (
                        <select className="form-select" value={form.asset_code} onChange={(e) => setForm({...form, asset_code: e.target.value})}>
                            <option value="">-- เลือกรายการ --</option>
                            {assetList.map((a, i) => <option key={i} value={a.asset_code}>{a.asset_code} : {a.asset_name}</option>)}
                        </select>
                    )}
                    <datalist id="assetOptions">{assetList.map((a, i) => <option key={i} value={a.asset_code}>{a.asset_name}</option>)}</datalist>
                    <button className="btn btn-primary px-4" onClick={() => autoFillAsset(form.asset_code)} disabled={!form.asset_code}>ค้นหา</button>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  {canManageAsset && (
                    <button className="btn btn-success w-100 shadow-sm" onClick={() => { setForm(emptyForm); setErrors({}); setShowForm(true); setHideSearch(true); setIsEditing(true); setOriginalCode(""); }}>
                      <i className="bi bi-plus-lg me-2"></i>ลงทะเบียนใหม่
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-5 mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4 ps-3 border-start border-4 border-primary">
                <div>
                    <h4 className="fw-bold m-0 text-dark">{originalCode ? `แก้ไขรายการ: ${form.asset_code}` : "ลงทะเบียนครุภัณฑ์ใหม่"}</h4>
                    <small className="text-muted">กรุณากรอกข้อมูลให้ครบถ้วนตามระเบียบ</small>
                </div>
                <button type="button" className="btn btn-light rounded-circle shadow-sm" onClick={() => { setShowForm(false); setHideSearch(false); }}><i className="bi bi-x-lg"></i></button>
              </div>

              {/* 🟢 1. ข้อมูลพื้นฐาน */}
              <FormSection title="ข้อมูลหลัก (Identification)" icon="bi-info-circle-fill">
                <SelectField label="ประเภท (Type)" name="asset_type" value={form.asset_type} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-4" options={Object.keys(ASSET_TYPE_CODES)} error={errors.asset_type} required />
                <SelectField label="หมวดหมู่ (Category)" name="asset_category" value={form.asset_category} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-4" options={Object.keys(ASSET_CATEGORY_CODES)} />
                <SelectField label="ชนิด/ลักษณะ (Kind)" name="description" value={form.description} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-4" options={Object.keys(ASSET_KIND_CODES)} />

                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold mb-1">เลขครุภัณฑ์ (Code) <span className="text-danger">*</span></label>
                    <div className="input-group">
                        <input 
                            type="text" 
                            className={`form-control ${errors.asset_code ? 'border-danger' : ''} bg-light fw-bold`}
                            name="asset_code" 
                            value={form.asset_code} 
                            readOnly={true} // ล็อกช่องนี้ให้กรอกไม่ได้
                            placeholder="ระบบรันให้อัตโนมัติ..."
                            style={{ cursor: 'not-allowed' }}
                        />
                        {isEditing && !originalCode && (
                            <button className="btn btn-outline-secondary" type="button" onClick={handleRefreshNumber} title="รีรันเลขใหม่">
                                {isGenerating ? <div className="spinner-border spinner-border-sm"></div> : <i className="bi bi-arrow-clockwise"></i>}
                            </button>
                        )}
                    </div>
                    {errors.asset_code && <div className="text-danger small mt-1" style={{fontSize: '0.75rem'}}>{errors.asset_code}</div>}
                    <small className="text-info" style={{ fontSize: '0.7rem' }}>* รหัสจะเปลี่ยนตาม ประเภท/หมวดหมู่/ชนิด และวันที่ตรวจรับ</small>
                </div>

                <InputField label="ลำดับที่ (Seq)" name="asset_sequence" value={form.asset_sequence} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-2" readOnly={true} />
                <InputField label="ปีงบประมาณ (พ.ศ.)" name="fiscal_year" value={form.fiscal_year} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-4" placeholder="เช่น 2568" readOnly={true} />
                
                <InputField label="ชื่อรายการ (Asset Name)" name="asset_name" value={form.asset_name} onChange={handleChange} isEditing={isEditing} col="col-12" error={errors.asset_name} required />
                <InputField label="ยี่ห้อ (Brand)" name="brand" value={form.brand} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-4" />
                <InputField label="รุ่น (Model)" name="model" value={form.model} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-4" />
                <InputField label="S/N (Serial Number)" name="serial_number" value={form.serial_number} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-4" />
              </FormSection>

              {/* 🟢 2. ข้อมูลการเงิน */}
              <FormSection title="การจัดซื้อและงบประมาณ (Finance)" icon="bi-cash-coin">
                <InputField label="วันที่ตรวจรับ (Received Date)" name="received_date" value={form.received_date} onChange={handleChange} isEditing={isEditing} type="date" col="col-12 col-md-4" error={errors.received_date} required />
                <InputField label="ราคาต่อหน่วย (บาท)" name="unit_price" value={form.unit_price} onChange={handleChange} isEditing={isEditing} type="number" col="col-6 col-md-4" error={errors.unit_price} required />
                <InputField label="จำนวน (หน่วย)" name="quantity" value={form.quantity} onChange={handleChange} isEditing={isEditing} type="number" col="col-6 col-md-4" />
                
                <InputField label="วิธีได้มา" name="acquisition_method" value={form.acquisition_method} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-6" placeholder="เช่น ตกลงราคา, e-bidding" />
                <InputField label="ผู้ขาย/บริษัท (Supplier)" name="supplier" value={form.supplier} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-6" />
                <InputField label="เลขที่ใบส่งของ" name="delivery_doc_no" value={form.delivery_doc_no} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-6" />
                <InputField label="เลขที่ใบสั่งซื้อ (PO)" name="purchase_doc_no" value={form.purchase_doc_no} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-6" />
              </FormSection>

              {/* 🟢 3. สถานที่และการใช้งาน */}
              <FormSection title="สถานที่และสถานะ (Location & Status)" icon="bi-geo-alt-fill">
                <InputField label="หน่วยงานที่รับผิดชอบ" name="department" value={form.department} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-6" />
                <InputField label="สถานที่ตั้ง/ห้อง" name="location" value={form.location} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-6" placeholder="ระบุตึก/ชั้น/ห้อง" />
                <InputField label="ผู้รับผิดชอบ (Owner)" name="owner" value={form.owner} onChange={handleChange} isEditing={isEditing} col="col-12 col-md-6" />
                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold">สถานะปัจจุบัน</label>
                    <select className="form-select" name="asset_status" value={form.asset_status} onChange={handleChange} disabled={!isEditing}>
                        <option value="ใช้งานปกติ">✅ ใช้งานปกติ</option>
                        <option value="ชำรุด">🛠 ชำรุด (รอซ่อม)</option>
                        <option value="เสื่อมสภาพ">📉 เสื่อมสภาพ</option>
                        <option value="จำหน่าย">🗑 จำหน่าย</option>
                    </select>
                </div>
                <InputField label="สภาพ (%)" name="current_condition" value={form.current_condition} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-2" />
                <InputField label="อายุการใช้งาน (ปี)" name="lifespan" value={form.lifespan} onChange={handleChange} isEditing={isEditing} col="col-6 col-md-2" />
                <InputField label="หมดประกัน (Warranty Exp)" name="warranty_period" value={form.warranty_period} onChange={handleChange} isEditing={isEditing} type="date" col="col-6 col-md-3" />
                <InputField label="หมายเหตุ" name="remark" value={form.remark} onChange={handleChange} isEditing={isEditing} col="col-12" />
              </FormSection>

              {/* Action Bar */}
              <div className="fixed-bottom p-3 d-flex justify-content-end align-items-center px-md-5 bg-white border-top shadow-lg">
                <div className="d-flex gap-2">
                    {!isEditing ? (
                        <>
                            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowForm(false); setHideSearch(false); }}>ปิดหน้าต่าง</button>
                            {canManageAsset && <button type="button" className="btn btn-warning px-4" onClick={() => { setIsEditing(true); setTimeout(() => firstInputRef.current?.focus(), 100); }}><i className="bi bi-pencil-square me-2"></i>แก้ไขข้อมูล</button>}
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn-light border px-4" onClick={() => { if(originalCode) setIsEditing(false); else { setShowForm(false); setHideSearch(false); } }}>ยกเลิก</button>
                            {canManageAsset && <button type="button" className="btn btn-success px-5" onClick={handleSave} disabled={isGenerating}>
                                {isGenerating ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                บันทึกข้อมูล
                            </button>}
                        </>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}