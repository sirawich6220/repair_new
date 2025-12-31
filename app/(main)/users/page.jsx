"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [formData, setFormData] = useState({ 
      id: null, username: "", password: "", first_name: "", last_name: "", 
      department: "", role: "user", profile_id: "" 
  });

  // 🟢 1. สร้างตัวแปรเช็คสิทธิ์ (Permissions Logic)
  // Admin ระบบ ทำได้ทุกอย่าง
  const isAdmin = currentUser?.role === 'admin';
  // สิทธิ์จัดการผู้ใช้ (User Management): เช็คว่ามี code 'user_manage' หรือไม่
  const canManage = isAdmin || currentUser?.permissions?.includes('user_manage');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token = localStorage.getItem("token");
    try {
        if (token) {
            const resMe = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
            const dataMe = await resMe.json();
            if (dataMe.user) setCurrentUser(dataMe.user);
        }

        const resUsers = await fetch('/api/users');
        const dataUsers = await resUsers.json();
        if (dataUsers.users) setUsers(dataUsers.users);

        const resProfiles = await fetch('/api/profiles');
        const dataProfiles = await resProfiles.json();
        if (dataProfiles.profiles) setProfiles(dataProfiles.profiles);

    } catch (error) {
        console.error("Error:", error);
    }
  }

  const openModal = (mode, user = null) => {
      // 🟢 ป้องกันการแอบกด (Double check)
      if (!canManage) return;

      setModalMode(mode);
      if (mode === 'edit' && user) {
          setFormData({ ...user, password: "", profile_id: user.profile_id || "" });
      } else {
          setFormData({ id: null, username: "", password: "", first_name: "", last_name: "", department: "", role: "user", profile_id: "" });
      }
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!formData.username || !formData.first_name) return Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ", "warning");
      
      Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });

      try {
          let url = '/api/users';
          let method = 'POST';
          if (modalMode === 'edit') {
              url = `/api/users/${formData.id}`;
              method = 'PUT';
          }

          const res = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const data = await res.json();

          if (data.success) {
              Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
              setShowModal(false);
              loadData(); 
          } else {
              Swal.fire("ผิดพลาด", data.error, "error");
          }
      } catch (error) {
          Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
  };

  const getRoleBadge = (role) => {
      switch(role) {
          case 'admin': return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2">Admin System</span>;
          case 'staff': return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2">Staff</span>;
          default: return <span className="badge bg-success-subtle text-success border border-success-subtle px-2">User</span>;
      }
  };

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f4f6f8", fontFamily: "'Sarabun', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
      `}</style>

      {/* TOP BAR */}
      <div className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{zIndex: 99}}>
          <h5 className="fw-bold m-0 text-dark">จัดการผู้ใช้งาน</h5>
          <div className="d-flex align-items-center gap-3">
              <div className="text-end lh-1 d-none d-md-block border-start ps-3 ms-2">
                 <span className="d-block fw-bold small text-dark">{currentUser?.first_name} {currentUser?.last_name}</span>
                 <span className="text-muted small">{currentUser?.role}</span>
              </div>
          </div>
      </div>

      <div className="container-fluid px-4 py-4">
        <div className="d-flex justify-content-between mb-3">
            <h4>รายชื่อผู้ใช้งาน</h4>
            
            {/* 🟢 ปุ่มเพิ่ม: เช็คสิทธิ์ canManage */}
            {canManage ? (
                <button className="btn btn-primary shadow-sm" onClick={() => openModal('add')}>
                    <i className="bi bi-plus-lg me-1"></i> เพิ่มผู้ใช้ใหม่
                </button>
            ) : (
                <button className="btn btn-secondary shadow-sm" disabled>
                    <i className="bi bi-lock-fill me-1"></i> เพิ่มผู้ใช้ใหม่ (ล็อก)
                </button>
            )}
        </div>

        {/* TABLE */}
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="table-responsive">
                <table className="table align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="ps-4">ชื่อ-สกุล</th>
                            <th>Username</th>
                            <th>แผนก</th>
                            <th className="text-center">Role (System)</th>
                            <th className="text-center">Profile (Permission)</th>
                            <th className="text-end pe-4">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="ps-4 fw-bold">{u.first_name} {u.last_name}</td>
                                <td className="text-secondary">{u.username}</td>
                                <td>{u.department || "-"}</td>
                                <td className="text-center">{getRoleBadge(u.role)}</td>
                                <td className="text-center">
                                    {u.profile_name ? (
                                        <span className="badge bg-info text-dark">{u.profile_name}</span>
                                    ) : (
                                        <span className="text-muted small">- ไม่ระบุ -</span>
                                    )}
                                </td>

                                <td className="text-end pe-4">
                                    {/* 🟢 ปุ่มแก้ไข: เช็คสิทธิ์ canManage */}
                                    {canManage ? (
                                        <button className="btn btn-sm btn-primary fw-bold px-3" onClick={() => openModal('edit', u)}>
                                            <i className="bi bi-pencil-square me-1"></i> แก้ไข
                                        </button>
                                    ) : (
                                        <button className="btn btn-sm btn-secondary fw-bold px-3" disabled>
                                            <i className="bi bi-lock-fill me-1"></i> ล็อก
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{zIndex: 1050, background: 'rgba(0,0,0,0.5)'}}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3 shadow-lg w-100 mx-3" style={{maxWidth: '600px'}}
                >
                    <div className="px-4 py-3 border-bottom bg-primary text-white d-flex justify-content-between">
                        <h6 className="m-0 fw-bold">{modalMode === 'add' ? 'เพิ่มผู้ใช้งาน' : 'แก้ไขผู้ใช้งาน'}</h6>
                        <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                    </div>
                    
                    <div className="p-4">
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label small fw-bold">Username</label>
                                <input className="form-control" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={modalMode==='edit'} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold">Password</label>
                                <input type="password" className="form-control" placeholder={modalMode==='edit' ? '(เว้นว่างถ้าไม่เปลี่ยน)' : ''} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold">ชื่อจริง</label>
                                <input className="form-control" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold">นามสกุล</label>
                                <input className="form-control" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold">แผนก</label>
                                <input className="form-control" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
                            </div>

                            <hr className="my-2"/>
                            
                            <div className="col-6">
                                <label className="form-label small fw-bold text-danger">System Role (Login Level)</label>
                                <select className="form-select" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    <option value="user">User (ผู้ใช้ทั่วไป)</option>
                                    <option value="staff">Staff (เจ้าหน้าที่)</option>
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>

                            <div className="col-6">
                                <label className="form-label small fw-bold text-primary">Profile (Menu Access)</label>
                                <select 
                                    className="form-select border-primary" 
                                    value={formData.profile_id} 
                                    onChange={(e) => setFormData({...formData, profile_id: e.target.value})}
                                >
                                    <option value="">-- ไม่ระบุโปรไฟล์ --</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-top bg-light text-end">
                        <button className="btn btn-light border me-2" onClick={() => setShowModal(false)}>ยกเลิก</button>
                        <button className="btn btn-primary px-4 fw-bold" onClick={handleSave}>บันทึกข้อมูล</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}