"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { decodeIdWithDate } from "@/utils/base64";
import { motion } from "framer-motion";

export default function RepairView() {
  const { id: encoded } = useParams();
  const decoded = encoded ? decodeIdWithDate(encoded) : null;
  const realId = decoded?.id ?? null;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูล
  useEffect(() => {
    if (!encoded) return;

    fetch(`/api/repairs/view/${encoded}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
  }, [encoded]);

  // Update Status
  async function updateStatus(newStatus) {
    const res = await fetch("/api/repairs/updateStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: realId, status: newStatus }),
    });

    const result = await res.json();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "อัปเดตสถานะสำเร็จ!",
        timer: 900,
        showConfirmButton: false,
      });
      setTimeout(() => window.location.reload(), 900);
    }
  }

  async function sendReply() {
    if (!replyText.trim())
      return Swal.fire("แจ้งเตือน", "กรุณากรอกข้อความ", "warning");

    const sender = localStorage.getItem("role") || "admin";

    const res = await fetch("/api/repairs/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repair_id: realId,
        sender,
        message: replyText,
      }),
    });

    const result = await res.json();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "ส่งข้อความสำเร็จ!",
        timer: 900,
        showConfirmButton: false,
      });

      setReplyText("");
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-secondary d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="spinner-border text-success mb-3"></div>
        <div>กำลังโหลดข้อมูล...</div>
      </motion.div>
    );

  if (!data)
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center text-danger fw-bold mt-5">
        ❌ ไม่พบข้อมูลใบแจ้งซ่อม
      </motion.div>
    );

  const statusColor = {
    waiting: "bg-danger status-pulse",
    processing: "bg-primary status-pulse",
    pending: "bg-warning text-dark status-pulse",
    completed: "bg-success status-pulse",
  };

  const statusText = {
    waiting: "รอรับงาน",
    processing: "กำลังดำเนินการ",
    pending: "รออะไหล่",
    completed: "เสร็จสิ้น",
  };

  return (
    // 🟢 1. ปรับ Padding: p-2 (Mobile) -> p-md-4 (Desktop)
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-2 p-md-4"
      style={{ background: "#EEF1EF", minHeight: "100vh" }}
    >
      <style>
        {`
        .status-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(0,0,0,0.1); }
          50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(0,0,0,0.2); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(0,0,0,0.1); }
        }
        `}
      </style>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2"
      >
        <h3 className="fw-bold m-0 d-flex align-items-center gap-2">
            📄 ใบแจ้งซ่อม #{data.id}
        </h3>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-light border btn-sm shadow-sm align-self-end align-self-md-auto"
          onClick={() => router.back()}
        >
          <i className="bi bi-arrow-left me-1"></i> กลับ
        </motion.button>
      </motion.div>

      {/* 🟢 2. Layout Grid: เปลี่ยนจาก d-flex gap-4 เป็น row g-3 ของ Bootstrap */}
      <div className="row g-3">

        {/* LEFT PANEL: ข้อมูลทั่วไป */}
        <div className="col-12 col-lg-6">
            <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white shadow-sm p-3 p-md-4 rounded h-100"
            >
            <h5 className="fw-bold mb-3 border-bottom pb-2">📋 ข้อมูลผู้แจ้ง</h5>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <p className="mb-1"><b>👤 ผู้แจ้ง:</b> {data.user_name}</p>
                <p className="mb-1"><b>🏥 สถานที่:</b> {data.place}</p>
                <p className="mb-1"><b>แผนก:</b> {data.department}</p>
            </motion.div>

            <h5 className="fw-bold mt-4 mb-3 border-bottom pb-2">🔢 ข้อมูลครุภัณฑ์</h5>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {data.asset_code ? (
                <div className="mt-2">
                    <p className="mb-1"><b>รหัส:</b> <span className="text-primary fw-bold">{data.asset_code}</span></p>
                    <p className="mb-1"><b>ชื่อ:</b> {data.asset_name || "—"}</p>
                    <p className="mb-1"><b>ชนิด:</b> {data.asset_category || "—"}</p>
                    <p className="mb-1"><b>ประเภท:</b> {data.asset_type || "—"}</p>
                </div>
                ) : (
                <p className="text-muted text-center bg-light p-2 rounded">ไม่มีข้อมูลครุภัณฑ์</p>
                )}
            </motion.div>

            <div className="mt-4 d-flex justify-content-between align-items-center bg-light p-2 rounded border">
                <div>
                    <small className="text-muted d-block">ความเร่งด่วน</small>
                    <span className={`badge bg-danger`}>
                        {data.priority}
                    </span>
                </div>
                <div className="text-end">
                    <small className="text-muted d-block">สถานะงาน</small>
                    <span className={`badge ${statusColor[data.status]}`}>
                        {statusText[data.status] || data.status}
                    </span>
                </div>
            </div>

            <p className="mt-3 mb-1"><b>ประเภทอุปกรณ์:</b> {data.device_type}</p>
            <p className="mb-0 text-muted small">
                <i className="bi bi-clock me-1"></i>
                แจ้งเมื่อ: {new Date(data.created_at).toLocaleString("th-TH")}
            </p>

            {/* รูปภาพ */}
            {data.images?.length > 0 && (
                <>
                <h5 className="fw-bold mt-4 mb-2">📷 รูปภาพแนบ</h5>
                <div className="d-flex overflow-auto gap-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {data.images.map((img, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        style={{ flex: '0 0 auto' }} // ไม่ยืดขยาย
                    >
                        <a href={img} target="_blank" rel="noreferrer">
                            <Image
                            src={img}
                            width={120}
                            height={120}
                            alt="repair-img"
                            className="rounded shadow-sm border object-fit-cover"
                            />
                        </a>
                    </motion.div>
                    ))}
                </div>
                </>
            )}
            </motion.div>
        </div>

        {/* RIGHT PANEL: การจัดการ */}
        <div className="col-12 col-lg-6">
            <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white shadow-sm p-3 p-md-4 rounded h-100"
            >
            <h5 className="fw-bold text-primary mb-3">🛠️ รายละเอียดอาการเสีย</h5>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-light p-3 rounded border mb-4"
                style={{ whiteSpace: "pre-wrap", minHeight: '80px' }}
            >
                {data.description}
            </motion.div>

            {/* ปุ่มเปลี่ยนสถานะ */}
            <h5 className="fw-bold border-bottom pb-2">🔧 เปลี่ยนสถานะงาน</h5>

            <div className="d-grid gap-2 d-md-flex flex-wrap mt-3 mb-4">
                {[
                { k: "waiting", label: "รอรับงาน", color: "danger", icon: "bi-hourglass" },
                { k: "processing", label: "กำลังดำเนินการ", color: "primary", icon: "bi-tools" },
                { k: "pending", label: "รออะไหล่", color: "warning", icon: "bi-box-seam" },
                { k: "completed", label: "เสร็จสิ้น", color: "success", icon: "bi-check-circle" },
                ].map((btn) => (
                <motion.button
                    key={btn.k}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-outline-${btn.color} btn-sm flex-fill`}
                    onClick={() => updateStatus(btn.k)}
                >
                    <i className={`bi ${btn.icon} me-1`}></i> {btn.label}
                </motion.button>
                ))}
            </div>

            {/* ส่งข้อความ */}
            <h5 className="fw-bold border-bottom pb-2">💬 บันทึกการซ่อม / ตอบกลับ</h5>

            <textarea
                className="form-control mt-3 mb-3"
                rows="4"
                placeholder="พิมพ์รายละเอียดการซ่อม หรือข้อความตอบกลับ..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
            ></textarea>

            <div className="d-grid gap-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={sendReply}
                >
                    <i className="bi bi-send me-1"></i> บันทึกและส่งข้อความ
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-success"
                    onClick={() => router.push(`/repair/close/${realId}`)}
                >
                    <i className="bi bi-check2-circle me-1"></i> ปิดงานซ่อม (ลงบันทึก)
                </motion.button>
            </div>

            </motion.div>
        </div>
      </div>

      {/* HISTORY TIMELINE */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white shadow-sm p-3 p-md-4 rounded mt-3"
      >
        <h5 className="fw-bold mb-3"><i className="bi bi-clock-history"></i> ประวัติการดำเนินการ</h5>

        {/* 🟢 3. Horizontal Scroll: เพิ่ม overflow-x-auto เพื่อให้เลื่อนซ้ายขวาได้ในมือถือ */}
        <div className="d-flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin' }}>

          {/* การสร้างงาน */}
          <motion.div
            className="border rounded bg-light p-3 shadow-sm flex-shrink-0"
            style={{ width: "280px" }}
          >
            <div className="d-flex align-items-center mb-2">
                <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: 30, height: 30}}>
                    <i className="bi bi-person"></i>
                </div>
                <b>ผู้ใช้สร้างใบแจ้งซ่อม</b>
            </div>
            <div className="text-muted small ps-1">
              {new Date(data.created_at).toLocaleString("th-TH")}
            </div>
          </motion.div>

          {data.logs?.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border rounded bg-white p-3 shadow-sm flex-shrink-0 position-relative"
              style={{ width: "280px" }}
            >
              <div className="d-flex align-items-center mb-2">
                 <div className={`rounded-circle d-flex align-items-center justify-content-center me-2 text-white ${log.sender === 'admin' ? 'bg-primary' : 'bg-info'}`} style={{width: 30, height: 30}}>
                    <i className={`bi ${log.type === 'status' ? 'bi-gear' : 'bi-chat-dots'}`}></i>
                 </div>
                 <b className="text-truncate">
                    {log.type === "status" ? "อัปเดตสถานะ" : (log.sender === "admin" ? "เจ้าหน้าที่" : "ผู้ใช้")}
                 </b>
              </div>

              <div className="bg-light p-2 rounded mb-2 text-break small border">
                {log.message}
              </div>

              <small className="text-muted d-block text-end" style={{ fontSize: '0.75rem' }}>
                {new Date(log.created_at).toLocaleString("th-TH")}
              </small>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}