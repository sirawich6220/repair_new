"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { encodeIdWithDate } from "@/utils/base64";
import Swal from "sweetalert2";

const getStatusConfig = (status) => {
    switch(status) {
        case 'waiting': return { text: 'รอตรวจสอบ', class: 'bg-warning text-dark bg-opacity-25 border-warning' };
        case 'pending': return { text: 'รออะไหล่', class: 'bg-warning text-dark bg-opacity-25 border-warning' };
        case 'processing': return { text: 'กำลังดำเนินการ', class: 'bg-info text-dark bg-opacity-25 border-info' };
        case 'completed': return { text: 'สำเร็จ', class: 'bg-success text-success bg-opacity-10 border-success' };
        default: return { text: status, class: 'bg-secondary text-secondary bg-opacity-10 border-secondary' };
    }
}

export default function RepairList() {
  const router = useRouter();
  
  const [repairs, setRepairs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedItems, setSelectedItems] = useState([]);

  // 🟢 1. เช็คสิทธิ์ (Permissions Logic)
  const isAdmin = user?.role === 'admin'; 
  
  // สิทธิ์การเข้าดูหน้านี้: Admin หรือ มีสิทธิ์ repair_view
  const canView = isAdmin || user?.permissions?.includes('repair_view');

  // 🟢 สิทธิ์การแก้ไข: Admin หรือ มีสิทธิ์ repair_approve (อนุมัติ/จัดการงานซ่อม)
  const canEdit = isAdmin || user?.permissions?.includes('repair_approve');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json?.user) setUser(json.user);
      }

      const listRes = await fetch("/api/repairs/list");
      const listJson = await listRes.json();
      setRepairs(listJson.repairs || []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
      if (!loading && !canView) {
          router.push("/repair/history");
      }
  }, [loading, canView, router]);


  // 🟢 ฟังก์ชันสำหรับสั่งพิมพ์ (เปิดหน้า Print Layout ใหม่)
  const handlePrint = (id) => {
    // เข้ารหัส ID และเปิด Tab ใหม่เพื่อพิมพ์โดยเฉพาะ
    const printUrl = `/repair/print/${encodeIdWithDate(id)}`;
    window.open(printUrl, '_blank');
  };

  const filteredRepairs = repairs.filter(item => 
    item.device_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.id).includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
        const allIds = currentItems.map(item => item.id);
        setSelectedItems(allIds);
    } else {
        setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
        setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
        setSelectedItems([...selectedItems, id]);
    }
  };

  const handleDelete = (id = null) => {
      const isBulk = id === null;
      const count = isBulk ? selectedItems.length : 1;

      if (isBulk && count === 0) return Swal.fire("แจ้งเตือน", "กรุณาเลือกรายการที่จะลบ", "warning");

      Swal.fire({
          title: `ยืนยันการลบ ${count} รายการ?`,
          text: "ข้อมูลที่ลบจะไม่สามารถกู้คืนได้",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "ลบข้อมูล",
          cancelButtonText: "ยกเลิก"
      }).then((result) => {
          if (result.isConfirmed) {
              Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
              const idsToDelete = isBulk ? selectedItems : [id];
              setRepairs(repairs.filter(r => !idsToDelete.includes(r.id)));
              setSelectedItems([]);
          }
      });
  };

  if (!loading && !canView) return null;

  return (
    <div className="min-vh-100 pb-5" style={{ background: "#f5f7fa", fontFamily: "'Sarabun', sans-serif" }}>
       
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .table-hover tbody tr:hover { background-color: #f1f5f9; }
        .page-link { color: #6c757d; border: none; margin: 0 2px; border-radius: 4px; }
        .page-item.active .page-link { background-color: #0d6efd; color: white; }

        /* 🟢 CSS สำหรับการพิมพ์ */
        @media print {
            .sidebar, .sticky-top, .btn, .pagination, .card-header, .card-footer, .mobile-overlay {
                display: none !important;
            }
            .container-fluid, .card {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
            }
            body {
                background: white !important;
                font-size: 10pt;
            }
            table {
                border: 1px solid #dee2e6 !important;
            }
        }
      `}</style>

      {/* TOP BAR */}
      <div className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{zIndex: 99}}>
          <div className="d-flex align-items-center text-muted small">
             <i className="bi bi-house-door-fill me-2"></i>
             <span>หน้าแรก</span>
             <i className="bi bi-chevron-right mx-2" style={{fontSize: '0.7rem'}}></i>
             <span className="text-primary fw-bold">รายการแจ้งซ่อม</span>
          </div>
          
          <div className="d-flex align-items-center gap-3">
              <div className="text-end lh-1">
                 <span className="d-block fw-bold" style={{fontSize: '0.85rem'}}>{user?.first_name || 'Admin'}</span>
                 <span className="text-muted" style={{fontSize: '0.7rem'}}>{isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</span>
              </div>
              <div className="bg-light rounded-circle p-1 border">
                 <img src="/MOPH.png" width="32" height="32" alt="User" />
              </div>
              <button onClick={() => router.push('/logout')} className="btn btn-danger btn-sm rounded-1 ms-2"><i className="bi bi-box-arrow-right"></i></button>
          </div>
      </div>

      <div className="container-fluid px-4 py-4">
        
        {/* TITLE & ACTION BUTTONS */}
        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-start align-items-xl-center mb-4 gap-3">
            <h4 className="fw-bold m-0 text-dark">รายการแจ้งซ่อมทั้งหมด</h4>
            
            <div className="d-flex flex-wrap gap-2">
                {/* 🔒 ปุ่มลบ: เฉพาะ Admin */}
                {isAdmin && (
                    <>
                        <button className="btn btn-danger text-white btn-sm fw-bold px-3 shadow-sm" onClick={() => handleDelete(null)}>
                            <i className="bi bi-trash-fill me-1"></i> ลบทั้งหมด
                        </button>
                        <button 
                            className={`btn btn-sm fw-bold px-3 shadow-sm ${selectedItems.length > 0 ? 'btn-danger' : 'btn-light text-muted border'}`} 
                            onClick={() => handleDelete(null)}
                            disabled={selectedItems.length === 0}
                        >
                            <i className="bi bi-trash me-1"></i> ลบที่เลือก ({selectedItems.length})
                        </button>
                    </>
                )}

                <Link href="/repair/new" className="btn btn-primary btn-sm fw-bold px-3 shadow-sm">
                    <i className="bi bi-plus-lg me-1"></i> แจ้งปัญหา/งานซ่อม
                </Link>
                {/* <button className="btn btn-dark btn-sm fw-bold px-3 shadow-sm"><i className="bi bi-qr-code me-1"></i> พิมพ์ QR</button> */}
                <button className="btn btn-success btn-sm fw-bold px-3 shadow-sm"><i className="bi bi-download me-1"></i> Export</button>
                
                {isAdmin && <button className="btn btn-warning text-white btn-sm fw-bold px-3 shadow-sm"><i className="bi bi-upload me-1"></i> Import</button>}
            </div>
        </div>

        {/* MAIN CARD */}
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="card-header bg-white p-3 border-bottom-0">
                <div className="input-group" style={{maxWidth: '350px'}}>
                    <input type="text" className="form-control bg-light border-0" placeholder="ค้นหารหัสงาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <button className="btn btn-primary"><i className="bi bi-search"></i></button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase">
                        <tr>
                            <th className="ps-4" style={{width: '50px'}}>
                                {isAdmin ? <input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={selectedItems.length === currentItems.length && currentItems.length > 0} /> : <span>#</span>}
                            </th>
                            <th>รหัสงาน</th>
                            <th>อุปกรณ์</th>
                            <th>ผู้แจ้ง</th>
                            <th className="text-center">สถานะ</th>
                            <th>วันที่แจ้ง</th>
                            <th className="text-end pe-4">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="border-top-0">
                        {currentItems.map((item, index) => {
                            const statusConfig = getStatusConfig(item.status);
                            return (
                                <tr key={item.id} className="table-hover">
                                    <td className="ps-4">
                                        {isAdmin ? (
                                            <input type="checkbox" className="form-check-input" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                                        ) : (
                                            <span className="text-muted small">{indexOfFirstItem + index + 1}</span>
                                        )}
                                    </td>
                                    
                                    <td><span className="fw-bold text-dark">JOB-2025-{String(item.id).padStart(4, '0')}</span></td>

                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-semibold text-dark" style={{fontSize: '0.9rem'}}>{item.device_type}</span>
                                            <small className="text-muted" style={{fontSize: '0.75rem'}}>Code: {item.asset_code || '-'}</small>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-dark" style={{fontSize: '0.85rem'}}>{item.user_name}</span>
                                            <small className="text-muted" style={{fontSize: '0.7rem'}}>{item.department || 'แผนกทั่วไป'}</small>
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <span className={`badge rounded-pill fw-normal px-3 py-1 border ${statusConfig.class}`}>{statusConfig.text}</span>
                                    </td>

                                    <td>
                                        <span className="text-secondary small">
                                            {new Date(item.created_at).toLocaleDateString("th-TH")}
                                            <br/>
                                            {new Date(item.created_at).toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </td>

                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-1">
                                            {/* 🟢 ปุ่มพิมพ์: เรียกใช้ฟังก์ชัน handlePrint */}
                                            <button 
                                                className="btn btn-sm btn-light text-secondary border" 
                                                title="พิมพ์ใบแจ้งซ่อม"
                                                onClick={() => handlePrint(item.id)}
                                            >
                                                <i className="bi bi-printer"></i>
                                            </button>
                                            
                                            <Link href={`/repair/view/${encodeIdWithDate(item.id)}`} className="btn btn-sm btn-light text-primary border" title="ดูรายละเอียด">
                                                <i className="bi bi-eye-fill"></i>
                                            </Link>
                                            
                                            {canEdit && (
                                                <Link href={`/repair/edit/${encodeIdWithDate(item.id)}`} className="btn btn-sm btn-light text-warning border" title="แก้ไข/จัดการ">
                                                    <i className="bi bi-pencil-square"></i>
                                                </Link>
                                            )}
                                            
                                            {isAdmin && (
                                                <button className="btn btn-sm btn-light text-danger border" onClick={() => handleDelete(item.id)} title="ลบ">
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentItems.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-5 text-muted">ไม่พบข้อมูลรายการแจ้งซ่อม</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="card-footer bg-white border-top-0 py-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredRepairs.length)} จาก {filteredRepairs.length} รายการ</small>
                <nav>
                    <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>ก่อนหน้า</button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>ถัดไป</button>
                        </li>
                    </ul>
                </nav>
            </div>

        </div>
      </div>
    </div>
  );
}