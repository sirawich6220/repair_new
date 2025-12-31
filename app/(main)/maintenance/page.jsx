"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function MaintenancePlan() {
  const router = useRouter();
  
  // States
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  // State จัดการมุมมอง
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
       const token = localStorage.getItem("token");
       try {
         // Mock User

         const res = await fetch("/api/maintenance/list");
         const data = await res.json();
         
         if (data.success) {
            setPlans(data.plans);
         }
       } catch (error) {
         console.error(error);
       } finally {
         setLoading(false);
       }
    }
    fetchData();
  }, []);

  // Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedItems(plans.map(p => p.id));
    else setSelectedItems([]);
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(item => item !== id));
    else setSelectedItems([...selectedItems, id]);
  };

  const handleDelete = (id = null) => {
    const idsToDelete = id ? [id] : selectedItems;
    const count = idsToDelete.length;
    if (count === 0) return Swal.fire("แจ้งเตือน", "กรุณาเลือกรายการที่จะลบ", "warning");

    Swal.fire({
      title: `ยืนยันการลบ ${count} รายการ?`,
      text: "ข้อมูลจะถูกลบออกจากระบบทันที",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
            const res = await fetch("/api/maintenance/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToDelete })
            });
            const data = await res.json();
            if (data.success) {
                setPlans(prev => prev.filter(p => !idsToDelete.includes(p.id)));
                setSelectedItems([]);
                Swal.fire("เรียบร้อย", "ลบข้อมูลสำเร็จ", "success");
            } else {
                Swal.fire("ผิดพลาด", "ลบข้อมูลไม่สำเร็จ", "error");
            }
        } catch (err) {
            Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
        }
      }
    });
  };

  // --- Logic ปฏิทิน ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    // ช่องว่างก่อนวันที่ 1
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty bg-light border-end border-bottom"></div>);
    }
    
    // วนลูปสร้างวันที่ 1 - สิ้นเดือน
    for (let day = 1; day <= daysInMonth; day++) {
        
        // 🟢 แก้ไข: ใช้ Date Object เปรียบเทียบวัน/เดือน/ปี โดยตรง (แก้ปัญหา Timezone)
        const dayPlans = plans.filter(p => {
            const planDate = new Date(p.date); // แปลง string จาก DB ให้เป็น Date Object ตามเวลาเครื่อง
            return planDate.getDate() === day &&
                   planDate.getMonth() === month &&
                   planDate.getFullYear() === year;
        });

        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        days.push(
            <div key={day} className="calendar-day border-end border-bottom p-2 position-relative bg-white" style={{minHeight: '100px'}}>
                <div className="d-flex justify-content-between">
                    <span className={`fw-bold ${isToday ? 'text-white bg-primary px-2 rounded-circle' : 'text-secondary'}`} style={{fontSize: '0.9rem', width: isToday ? 'auto' : '24px', textAlign: 'center'}}>
                        {day}
                    </span>
                </div>
                
                {/* แสดงรายการงาน */}
                <div className="d-flex flex-column gap-1 mt-1">
                    {dayPlans.map((plan) => (
                        <div key={plan.id} className="badge bg-info text-dark text-start text-truncate fw-normal border border-info-subtle shadow-sm px-2 py-1" 
                             style={{cursor: 'pointer', fontSize: '0.75rem'}}
                             title={`${plan.asset_code}: ${plan.description}`}
                             onClick={() => Swal.fire({
                                 title: 'รายละเอียดแผนงาน',
                                 html: `
                                    <div class="text-start">
                                        <p><strong>วันที่:</strong> ${new Date(plan.date).toLocaleDateString('th-TH')}</p>
                                        <p><strong>รหัสครุภัณฑ์:</strong> ${plan.asset_code}</p>
                                        <p><strong>รายละเอียด:</strong> ${plan.description || '-'}</p>
                                        <p><strong>ผู้รับผิดชอบ:</strong> ${plan.responsible || '-'}</p>
                                    </div>
                                 `,
                                 confirmButtonText: 'ปิด'
                             })}
                        >
                            <i className="bi bi-circle-fill text-primary me-1" style={{fontSize: '6px'}}></i>
                            {plan.asset_code}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return days;
  };

  if (loading) return null;

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f4f6f8", fontFamily: "'Sarabun', sans-serif" }}>
       
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .btn-custom-red { background-color: #A92828; color: white; border: none; }
        .btn-custom-red:hover { background-color: #8a1f1f; color: white; }
        .btn-custom-light-red { background-color: #E67E7E; color: white; border: none; }
        .btn-custom-light-red:hover { background-color: #d66a6a; color: white; }
        .table-hover tbody tr:hover { background-color: #f8f9fa; }
        
        /* Calendar Styles */
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: #dee2e6; border-top: 1px solid #dee2e6; border-left: 1px solid #dee2e6; }
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-weight: bold; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .calendar-day:hover { background-color: #fcfcfc; }
      `}</style>

      {/* TOP BAR */}
      <div className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{zIndex: 99}}>
          <h5 className="fw-bold m-0 text-dark">แผนบำรุงรักษา</h5>
          <div className="d-flex align-items-center gap-3">
              <div className="text-end lh-1 d-none d-md-block border-start ps-3 ms-2">
                 <span className="d-block fw-bold small text-dark">{user?.first_name} {user?.last_name}</span>
                 <span className="text-muted small">ผู้ดูแลระบบ (admin)</span>
              </div>
              <button onClick={() => router.push('/logout')} className="btn btn-danger btn-sm rounded-1 px-3 fw-bold"><i className="bi bi-box-arrow-right me-1"></i> ออก</button>
          </div>
      </div>

      <div className="container-fluid px-4 py-4">
        
        {/* HEADER & ACTIONS */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center mb-3 gap-3">
            <h5 className="fw-bold m-0 text-dark align-self-start align-self-lg-center">
                {viewMode === 'calendar' ? 'ปฏิทินแผนบำรุงรักษา' : 'รายการแผนบำรุงรักษา (PM)'}
            </h5>
            
            <div className="d-flex flex-wrap gap-2 align-self-end align-self-lg-center">
                {/* ปุ่ม Action แสดงเฉพาะ List Mode */}
                {viewMode === 'list' && (
                    <>
                        <button className="btn btn-custom-red btn-sm fw-bold px-3 shadow-sm rounded-1" onClick={() => handleDelete(null)}>
                            <i className="bi bi-trash-fill me-1"></i> ลบทั้งหมด
                        </button>
                        <button className={`btn btn-sm fw-bold px-3 shadow-sm rounded-1 ${selectedItems.length > 0 ? 'btn-custom-light-red' : 'btn-secondary disabled'}`} onClick={() => handleDelete(null)}>
                            <i className="bi bi-trash me-1"></i> ลบที่เลือก
                        </button>
                    </>
                )}

                {/* ปุ่มสลับมุมมอง */}
                <button 
                    className={`btn btn-sm fw-bold px-3 shadow-sm rounded-1 ${viewMode === 'calendar' ? 'btn-outline-primary bg-white' : 'btn-primary'}`} 
                    onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                >
                    {viewMode === 'list' ? <><i className="bi bi-calendar3 me-1"></i> มุมมองปฏิทิน</> : <><i className="bi bi-list-ul me-1"></i> มุมมองตาราง</>}
                </button>

                <Link href="/maintenance/create" className="btn btn-success btn-sm fw-bold px-3 shadow-sm rounded-1">
                    <i className="bi bi-plus-lg me-1"></i> สร้างแผนใหม่
                </Link>
            </div>
        </div>

        {/* VIEW CONTENT */}
        <div className="card border-0 shadow-sm rounded-1 overflow-hidden">
            
            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
                <div className="table-responsive">
                    <table className="table align-middle mb-0">
                        <thead className="bg-light text-dark fw-bold" style={{fontSize: '0.9rem'}}>
                            <tr>
                                <th className="ps-4 py-3" style={{width: '50px'}}><input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={plans.length > 0 && selectedItems.length === plans.length} /></th>
                                <th>วันที่กำหนด</th>
                                <th>อุปกรณ์</th>
                                <th>รายละเอียดงาน</th>
                                <th>ผู้รับผิดชอบ</th>
                                <th className="text-end pe-4">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="border-top-0 bg-white">
                            {plans.length > 0 ? (
                                plans.map((item) => (
                                    <tr key={item.id} className="table-hover border-bottom">
                                        <td className="ps-4 py-3"><input type="checkbox" className="form-check-input" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} /></td>
                                        
                                        {/* วันที่ใช้ toLocaleDateString เพื่อให้ตรงกับเครื่อง */}
                                        <td className="fw-semibold text-dark fs-6">{new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                        
                                        <td className="fw-bold text-dark">{item.asset_code}</td>
                                        <td className="text-secondary">{item.description || "-"}</td>
                                        <td className="text-dark fw-semibold">{item.responsible || "-"}</td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="btn p-0 text-danger border-0" title="ลบ" onClick={() => handleDelete(item.id)}><i className="bi bi-trash-fill fs-5"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">ไม่พบข้อมูลแผนบำรุงรักษา</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- CALENDAR VIEW --- */}
            {viewMode === 'calendar' && (
                <div className="bg-white p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button className="btn btn-outline-secondary btn-sm rounded-1 px-3" onClick={() => changeMonth(-1)}><i className="bi bi-chevron-left"></i> ก่อนหน้า</button>
                        <h5 className="fw-bold m-0 text-primary">
                            {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                        </h5>
                        <button className="btn btn-outline-secondary btn-sm rounded-1 px-3" onClick={() => changeMonth(1)}>ถัดไป <i className="bi bi-chevron-right"></i></button>
                    </div>

                    <div className="calendar-header py-2 text-muted small text-uppercase bg-light">
                        <div className="text-danger">อาทิตย์</div>
                        <div>จันทร์</div>
                        <div>อังคาร</div>
                        <div>พุธ</div>
                        <div>พฤหัสบดี</div>
                        <div>ศุกร์</div>
                        <div className="text-primary">เสาร์</div>
                    </div>

                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}