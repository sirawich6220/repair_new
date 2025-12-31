"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function UserProfilesPage() {
  const router = useRouter();
  
  const [profiles, setProfiles] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState([]); 
  const [selectedPerms, setSelectedPerms] = useState([]);   

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [editId, setEditId] = useState(null);        
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    loadData();
    fetchPermissionsMaster();
  }, []);

  async function loadData() {
    const token = localStorage.getItem("token");
    try {
      if (token) {
          const resMe = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
          const dataMe = await resMe.json();
          if (dataMe.user) setCurrentUser(dataMe.user);
      }
      const resProfiles = await fetch("/api/profiles");
      const dataProfiles = await resProfiles.json();
      if (dataProfiles.success) setProfiles(dataProfiles.profiles);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  async function fetchPermissionsMaster() {
      try {
        const res = await fetch("/api/permissions");
        const data = await res.json();
        if (data.success) setAllPermissions(data.permissions);
      } catch (error) { console.error("Error fetching permissions:", error); }
  }

  const handleTogglePerm = (permId) => {
      if (selectedPerms.includes(permId)) {
          setSelectedPerms(selectedPerms.filter(id => id !== permId));
      } else {
          setSelectedPerms([...selectedPerms, permId]);
      }
  };

  const openAddModal = () => {
      setModalMode("add");
      setEditId(null);
      setFormData({ name: "", description: "" });
      setSelectedPerms([]);
      setShowModal(true);
  };

  const openEditModal = async (profile) => {
      setModalMode("edit");
      setEditId(profile.id);
      setFormData({ name: profile.name, description: profile.description || "" });
      try {
          const res = await fetch(`/api/profiles/${profile.id}`);
          const data = await res.json();
          if (data.success && data.permissionIds) {
              setSelectedPerms(data.permissionIds);
          } else {
              setSelectedPerms([]);
          }
      } catch (e) { setSelectedPerms([]); }
      setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return Swal.fire("แจ้งเตือน", "กรุณาระบุชื่อโปรไฟล์", "warning");
    Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
    try {
        let url = "/api/profiles";
        let method = "POST";
        if (modalMode === "edit") {
            url = `/api/profiles/${editId}`;
            method = "PUT";
        }
        const payload = { ...formData, permissions: selectedPerms };
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
            setShowModal(false);
            loadData();
        } else {
            Swal.fire("ผิดพลาด", data.error, "error");
        }
    } catch (err) { Swal.fire("Error", "เชื่อมต่อ Server ไม่ได้", "error"); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "ยืนยันการลบ?", text: "ข้อมูลจะถูกลบถาวร", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "ลบ"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetch(`/api/profiles/${id}`, { method: "DELETE" });
        loadData();
        Swal.fire("เรียบร้อย", "ลบข้อมูลสำเร็จ", "success");
      }
    });
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
      const group = perm.group_name || 'สิทธิ์อื่นๆ';
      if (!acc[group]) acc[group] = [];
      acc[group].push(perm);
      return acc;
  }, {});

  const stats = {
    total: profiles.length,
    system: profiles.filter(p => p.type === 'system').length,
    custom: profiles.filter(p => p.type === 'custom').length
  };

  // 🟢 Helper สำหรับเลือกไอคอนตามกลุ่มสิทธิ์
  const getGroupIcon = (group) => {
      if (group.includes('ซ่อม')) return 'bi-tools';
      if (group.includes('ครุภัณฑ์') || group.includes('ทรัพย์สิน')) return 'bi-box-seam';
      if (group.includes('ผู้ใช้')) return 'bi-people';
      if (group.includes('ตั้งค่า')) return 'bi-gear';
      return 'bi-shield-check';
  };

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f8f9fa", fontFamily: "'Sarabun', sans-serif" }}>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .bg-purple { background-color: #a55eea; }
        .text-purple { color: #a55eea; }
        .badge-soft-purple { background-color: #f3e5f5; color: #a55eea; border: 1px solid #e1bee7; }
        .btn-purple { background-color: #a55eea; color: white; border: none; }
        .btn-purple:hover { background-color: #8854d0; color: white; }
        .card-icon-bg { position: absolute; right: 20px; bottom: 10px; font-size: 3rem; opacity: 0.15; }
      `}</style>

      {/* TOP BAR */}
      <div className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{zIndex: 99}}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-house-door-fill text-muted"></i>
            <i className="bi bi-chevron-right text-muted small"></i>
            <h6 className="fw-bold m-0 text-dark">จัดการโปรไฟล์ผู้ใช้</h6>
          </div>
          <div className="d-flex align-items-center gap-3">
              <div className="text-end lh-1 d-none d-md-block border-start ps-3 ms-2">
                 <span className="d-block fw-bold small text-dark">
                    <i className="bi bi-person-circle me-1 text-primary"></i>
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "..."}
                 </span>
                 <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{currentUser?.role || "user"}</span>
              </div>
              <button onClick={() => router.push('/logout')} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
                <i className="bi bi-power me-1"></i> ออกจากระบบ
              </button>
          </div>
      </div>

      <div className="container-fluid px-4 py-4">
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
                <h4 className="fw-bold m-0 text-dark">
                  <i className="bi bi-person-vcard-fill me-2 text-primary"></i>สิทธิ์และโปรไฟล์ผู้ใช้
                </h4>
                <p className="text-muted small m-0">จัดการกลุ่มผู้ใช้และสิทธิ์การเข้าถึงฟีเจอร์ต่างๆ ในระบบ</p>
            </div>
            <div className="d-flex gap-2">
                 <button className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill" onClick={openAddModal}>
                    <i className="bi bi-plus-circle-fill me-2"></i> สร้างโปรไฟล์ใหม่
                 </button>
            </div>
        </div>

        {/* INFO & STATS */}
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <div className="card border-0 shadow-sm bg-primary text-white h-100 p-4 position-relative overflow-hidden">
                    <h6 className="opacity-75 fw-light">โปรไฟล์ทั้งหมด</h6>
                    <h2 className="fw-bold mb-0">{loading ? "-" : stats.total} รายการ</h2>
                    <i className="bi bi-people-fill card-icon-bg"></i>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card border-0 shadow-sm bg-success text-white h-100 p-4 position-relative overflow-hidden">
                    <h6 className="opacity-75 fw-light">โปรไฟล์ระบบ (System)</h6>
                    <h2 className="fw-bold mb-0">{loading ? "-" : stats.system} รายการ</h2>
                    <i className="bi bi-shield-check card-icon-bg"></i>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card border-0 shadow-sm bg-purple text-white h-100 p-4 position-relative overflow-hidden">
                    <h6 className="opacity-75 fw-light">โปรไฟล์กำหนดเอง (Custom)</h6>
                    <h2 className="fw-bold mb-0">{loading ? "-" : stats.custom} รายการ</h2>
                    <i className="bi bi-person-gear card-icon-bg"></i>
                </div>
            </div>
        </div>

        {/* TABLE */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
                <table className="table align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase">
                        <tr>
                            <th className="ps-4 py-3">ชื่อกลุ่มโปรไฟล์</th>
                            <th>คำอธิบายรายละเอียด</th>
                            <th className="text-center">สิทธิ์ที่ได้รับ</th>
                            <th className="text-center">ประเภท</th>
                            <th className="text-end pe-4">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="border-top-0 bg-white">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5">
                                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                กำลังโหลดข้อมูล...
                            </td></tr>
                        ) : profiles.length > 0 ? (
                            profiles.map((item) => (
                                <tr key={item.id} className="table-hover">
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white ${item.type === 'system' ? 'bg-primary' : 'bg-purple shadow-sm'}`} style={{width: 38, height: 38}}>
                                                <i className={`bi ${item.type === 'system' ? 'bi-shield-fill-check' : 'bi-person-fill-gear'} fs-5`}></i>
                                            </div>
                                            <div>
                                              <span className="fw-bold text-dark d-block">{item.name}</span>
                                              <small className="text-muted">ID: {item.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-secondary small">{item.description || <em className="opacity-50">ไม่ได้ระบุคำอธิบาย</em>}</td>
                                    <td className="text-center">
                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 rounded-pill fw-bold">
                                            <i className="bi bi-key-fill me-1"></i> {item.menu_count || 0} รายการ
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {item.type === 'system' ? (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 rounded-pill">
                                              <i className="bi bi-lock-fill me-1"></i>System
                                            </span>
                                        ) : (
                                            <span className="badge badge-soft-purple px-3 rounded-pill">
                                              <i className="bi bi-pencil-fill me-1"></i>Custom
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button className="btn btn-sm btn-white border text-primary fw-bold px-3 shadow-sm hover-primary" onClick={() => openEditModal(item)}>
                                              <i className="bi bi-pencil-square me-1"></i> แก้ไข
                                            </button>
                                            {item.type !== 'system' ? (
                                                <button className="btn btn-sm btn-white border text-danger fw-bold px-3 shadow-sm hover-danger" onClick={() => handleDelete(item.id)}>
                                                  <i className="bi bi-trash3-fill me-1"></i> ลบ
                                                </button>
                                            ) : (
                                                <button className="btn btn-sm btn-light text-muted px-3" disabled title="โปรไฟล์ระบบไม่สามารถลบได้">
                                                  <i className="bi bi-ban me-1"></i> ลบ
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">
                              <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                              ไม่พบข้อมูลโปรไฟล์
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center px-2" style={{zIndex: 1050, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="bg-white rounded-4 shadow-xl w-100 d-flex flex-column border"
                    style={{maxWidth: '850px', maxHeight: '85vh'}}
                >
                    <div className={`px-4 py-3 border-bottom d-flex justify-content-between align-items-center text-white rounded-top-4 ${modalMode === 'add' ? 'bg-primary' : 'bg-warning'}`}>
                        <h5 className="m-0 fw-bold">
                            <i className={`bi ${modalMode === 'add' ? 'bi-plus-circle-fill' : 'bi-pencil-square'} me-2`}></i> 
                            {modalMode === 'add' ? "เพิ่มโปรไฟล์ใหม่" : "ตั้งค่าสิทธิ์การใช้งาน"}
                        </h5>
                        <button className="btn-close btn-close-white shadow-none" onClick={() => setShowModal(false)}></button>
                    </div>
                    
                    <div className="p-4 overflow-auto custom-scrollbar">
                        <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-dark">ชื่อกลุ่มโปรไฟล์ <span className="text-danger">*</span></label>
                                <div className="input-group">
                                  <span className="input-group-text bg-white"><i className="bi bi-tag-fill text-muted"></i></span>
                                  <input 
                                      type="text" 
                                      className="form-control" 
                                      placeholder="เช่น IT Admin, หัวหน้าฝ่าย"
                                      value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      disabled={editId && profiles.find(p => p.id === editId)?.type === 'system'}
                                  />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-dark">คำอธิบายสั้นๆ</label>
                                <div className="input-group">
                                  <span className="input-group-text bg-white"><i className="bi bi-info-circle-fill text-muted"></i></span>
                                  <input 
                                      type="text"
                                      className="form-control" 
                                      placeholder="ระบุวัตถุประสงค์ของกลุ่มนี้..."
                                      value={formData.description}
                                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                                  />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 mb-3">
                          <div className="bg-primary-subtle p-2 rounded-circle">
                            <i className="bi bi-shield-lock-fill text-primary"></i>
                          </div>
                          <h6 className="fw-bold text-dark m-0">กำหนดสิทธิ์การเข้าถึง (Permissions Mapping)</h6>
                        </div>

                        <div className="row g-4">
                            {Object.entries(groupedPermissions).map(([group, perms]) => (
                                <div key={group} className="col-12">
                                    <div className="bg-white border rounded-3 p-3 shadow-sm">
                                      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                          <i className={`bi ${getGroupIcon(group)} text-primary fs-5`}></i>
                                          <span className="fw-bold text-secondary">{group}</span>
                                      </div>
                                      <div className="row g-3">
                                          {perms.map(perm => (
                                              <div key={perm.id} className="col-md-6 col-lg-4">
                                                  <div className={`form-check p-2 rounded-3 hover-bg-light transition-all ${selectedPerms.includes(perm.id) ? 'bg-primary-subtle border-primary-subtle border' : 'border'}`}>
                                                      <input 
                                                          className="form-check-input ms-0 me-2" 
                                                          type="checkbox" 
                                                          id={`perm-${perm.id}`}
                                                          checked={selectedPerms.includes(perm.id)}
                                                          onChange={() => handleTogglePerm(perm.id)}
                                                          disabled={editId && profiles.find(p => p.id === editId)?.type === 'system'}
                                                      />
                                                      <label className="form-check-label small fw-medium" htmlFor={`perm-${perm.id}`} style={{cursor: 'pointer'}}>
                                                          {perm.name}
                                                      </label>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-3 border-top bg-light text-end rounded-bottom-4">
                        <button className="btn btn-light border me-2 fw-bold px-4" onClick={() => setShowModal(false)}>
                          <i className="bi bi-x me-1"></i> ยกเลิก
                        </button>
                        <button className={`btn px-5 fw-bold shadow-sm ${modalMode === 'add' ? 'btn-primary' : 'btn-warning text-white'}`} onClick={handleSave}>
                            <i className="bi bi-check-circle-fill me-2"></i> บันทึกข้อมูลโปรไฟล์
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}