"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { encodeIdWithDate } from "@/utils/base64";
import { motion, AnimatePresence } from "framer-motion";

export default function RepairHistory() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  // 🎨 Helper: เลือกสี Badge แบบ Soft UI
  const getStatusBadge = (status) => {
    switch (status) {
      case "waiting": return "bg-danger-subtle text-danger border border-danger-subtle";
      case "processing": return "bg-primary-subtle text-primary border border-primary-subtle";
      case "pending": return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "completed": return "bg-success-subtle text-success border border-success-subtle";
      default: return "bg-secondary-subtle text-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
        case "waiting": return "รอรับงาน";
        case "processing": return "กำลังดำเนินการ";
        case "pending": return "รออะไหล่";
        case "completed": return "เสร็จสิ้น";
        default: return status;
    }
  };

  const getPriorityBadge = (priority) => {
      switch (priority) {
          case "urgent": return <span className="badge bg-danger">🔥 เร่งด่วน</span>;
          case "normal": return <span className="badge bg-secondary">ปกติ</span>;
          case "low": return <span className="badge bg-info text-dark">ไม่เร่งด่วน</span>;
          default: return priority;
      }
  }

  function formatDateRaw(dateString) {
    if (!dateString) return "-";
    const data = new Date(dateString);
    if (isNaN(data)) return "-";
    return data.toLocaleString("th-TH", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem("user_id");
      try {
        const res = await fetch(`/api/repairs/history?user_id=${userId}`);
        const data = await res.json();
        if (data.success) setRepairs(data.repairs);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadLogs(id) {
    setSelectedId(id);
    try {
      const code = encodeIdWithDate(id);
      const res = await fetch(`/api/repairs/view/${code}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLogs(data.data.logs || []);
        setShowLogs(true);
      } else {
        Swal.fire("ผิดพลาด", "ไม่สามารถโหลดประวัติได้", "error");
      }
    } catch (err) {
      Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    }
  }

  if (loading)
    return (
        <div className="d-flex justify-content-center align-items-center vh-50" style={{minHeight: "60vh"}}>
            <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

  return (
    <div className="container-fluid py-4 px-md-5" style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3"
      >
        <div>
            <h3 className="fw-bold m-0 text-dark"><i className="bi bi-clock-history text-success me-2"></i>ประวัติการแจ้งซ่อม</h3>
            <p className="text-muted small m-0">รายการแจ้งซ่อมทั้งหมดของคุณ</p>
        </div>
        <div className="bg-white px-3 py-2 rounded shadow-sm border">
            <span className="fw-bold text-success fs-5">{repairs.length}</span> <span className="text-muted small">รายการ</span>
        </div>
      </motion.div>

      {/* 📱 MOBILE VIEW: CARDS */}
      <div className="d-md-none">
        {repairs.map((r, i) => (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={r.id}
                className="card border-0 shadow-sm mb-3 overflow-hidden"
                style={{ borderRadius: "12px" }}
            >
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className={`badge rounded-pill fw-normal px-3 py-2 ${getStatusBadge(r.status)}`}>
                            {getStatusText(r.status)}
                        </span>
                        <small className="text-muted">{formatDateRaw(r.created_at)}</small>
                    </div>

                    <h6 className="fw-bold text-dark mb-1">{r.device_type}</h6>
                    <div className="text-muted small mb-2"><i className="bi bi-geo-alt me-1"></i>{r.place} ({r.department})</div>
                    
                    {(r.asset_name || r.asset_code) && (
                         <div className="bg-light p-2 rounded mb-2 border border-light">
                            <div className="fw-semibold text-dark small">{r.asset_name || "-"}</div>
                            <div className="text-secondary small" style={{fontSize: '0.75rem'}}>Code: {r.asset_code || "-"}</div>
                         </div>
                    )}

                    <div className="d-flex justify-content-between align-items-end mt-3">
                        <div>{getPriorityBadge(r.priority)}</div>
                        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => loadLogs(r.id)}>
                            <i className="bi bi-chat-text me-1"></i> ติดตามงาน
                        </button>
                    </div>
                </div>
            </motion.div>
        ))}
      </div>

      {/* 💻 DESKTOP VIEW: TABLE */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="card border-0 shadow-sm d-none d-md-block" 
        style={{ borderRadius: "16px", overflow: "hidden" }}
      >
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light text-secondary">
                <tr>
                  <th className="py-3 ps-4" style={{width: "5%"}}>#</th>
                  <th style={{width: "12%"}}>วันที่แจ้ง</th>
                  <th style={{width: "15%"}}>สถานที่ / แผนก</th>
                  <th style={{width: "18%"}}>อุปกรณ์ (ครุภัณฑ์)</th>
                  <th style={{width: "10%"}}>ประเภท</th>
                  <th style={{width: "10%"}}>ความเร่งด่วน</th>
                  <th style={{width: "10%"}}>สถานะ</th>
                  <th style={{width: "10%"}} className="text-end pe-4">เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r, i) => (
                  <tr key={r.id}>
                    <td className="ps-4 text-muted fw-bold">{i + 1}</td>
                    <td>
                        <div className="fw-semibold text-dark">{formatDateRaw(r.created_at).split(' ')[0]}</div>
                        <div className="text-muted small">{formatDateRaw(r.created_at).split(' ')[1]}</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{r.place}</div>
                      <div className="text-muted small text-truncate" style={{maxWidth: "150px"}}>{r.department}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{r.asset_name || "-"}</div>
                      {r.asset_code && <div className="badge bg-light text-secondary border font-monospace mt-1">{r.asset_code}</div>}
                    </td>
                    <td><span className="badge bg-secondary-subtle text-dark border">{r.device_type}</span></td>
                    <td>{getPriorityBadge(r.priority)}</td>
                    <td>
                      <span className={`badge rounded-pill fw-normal px-3 py-2 ${getStatusBadge(r.status)}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-light btn-sm text-primary fw-bold shadow-sm"
                        onClick={() => loadLogs(r.id)}
                        data-bs-toggle="tooltip" 
                        title="ดูประวัติการตอบกลับ"
                      >
                        <i className="bi bi-chat-left-text me-1"></i> รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </motion.div>

      {/* 💬 MODAL LOGS (ANIMATED) */}
      <AnimatePresence>
      {showLogs && (
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999 }}
            onClick={() => setShowLogs(false)}
       >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white shadow-lg overflow-hidden d-flex flex-column"
            style={{ width: "90%", maxWidth: "600px", borderRadius: "20px", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Modal Header */}
              <div className="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold m-0 text-success"><i className="bi bi-clipboard-pulse me-2"></i>อัปเดตอาการเสีย</h5>
                    <small className="text-muted">ประวัติการดำเนินการและการตอบกลับ</small>
                  </div>
                  <button className="btn-close" onClick={() => setShowLogs(false)}></button>
              </div>

              {/* Modal Body (Timeline) */}
              <div className="p-4 overflow-auto bg-white" style={{ flex: 1 }}>
                {selectedLogs.length === 0 ? (
                  <div className="text-center py-5">
                      <div className="text-muted opacity-50 display-1 mb-3"><i className="bi bi-chat-square-dots"></i></div>
                      <p className="text-muted">ยังไม่มีประวัติการตอบกลับ</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {selectedLogs.map((log) => (
                      <div key={log.id} className="d-flex gap-3">
                          <div className="d-flex flex-column align-items-center">
                             <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{width: 35, height: 35}}>
                                <i className="bi bi-person-fill"></i>
                             </div>
                             <div className="h-100 border-start border-2 border-light my-1" style={{minHeight: 20}}></div>
                          </div>
                          <div className="bg-light p-3 rounded-4 w-100 position-relative">
                              <div className="fw-bold text-dark mb-1">{log.message}</div>
                              <div className="text-end">
                                  <small className="text-muted" style={{fontSize: '0.75rem'}}>
                                    {new Date(log.created_at).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })} • {new Date(log.created_at).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                                  </small>
                              </div>
                          </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-top bg-light text-end">
                <button className="btn btn-secondary px-4 rounded-pill" onClick={() => setShowLogs(false)}>ปิดหน้าต่าง</button>
              </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}