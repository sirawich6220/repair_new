"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 ส่งคำขอ OTP
  async function requestOTP() {
    if (!username.trim() || !phone.trim()) {
      Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบ", text: "กรุณากรอก Username และ เบอร์โทรศัพท์", confirmButtonColor: "#0ba34f" });
      return;
    }
    if (phone.length < 9) {
        Swal.fire({ icon: "warning", title: "เบอร์โทรไม่ถูกต้อง", text: "กรุณากรอกเบอร์โทรศัพท์ให้ครบถ้วน", confirmButtonColor: "#0ba34f" });
        return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, phone }),
      });
      const data = await res.json();
      if (!data.success) {
        Swal.fire("ผิดพลาด", data.message, "error");
      } else {
        Swal.fire({ icon: "success", title: "ข้อมูลถูกต้อง!", text: "ส่ง OTP แล้ว", timer: 1500, showConfirmButton: false });
        setStep(2);
      }
    } catch (error) { Swal.fire("Error", "เชื่อมต่อไม่ได้", "error"); }
    setLoading(false);
  }

  // 🔹 ตรวจ OTP + เปลี่ยนรหัสผ่าน
  async function verifyOTP() {
    if (!otp.trim() || !newPassword.trim()) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ", "warning"); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        Swal.fire("ผิดพลาด", data.message, "error");
      } else {
        Swal.fire({ icon: "success", title: "สำเร็จ!", text: "ตั้งรหัสผ่านใหม่เรียบร้อย", timer: 1500, showConfirmButton: false });
        setTimeout(() => { window.location.href = "/login"; }, 1500);
      }
    } catch (error) { Swal.fire("Error", "เชื่อมต่อไม่ได้", "error"); }
    setLoading(false);
  }

  const stepVariants = {
    hidden: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2 } }),
  };

  const inputStyle = {
    height: "45px", // 🟢 ลดความสูงลง
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: "16px" // กัน iPhone ซูม
  };

  return (
    <div className="d-flex justify-content-center align-items-center px-3"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top right, #2ecc71 0%, #0a7f3d 100%)",
        padding: "10px"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="card shadow p-4 bg-white border-0 w-100"
        style={{
          maxWidth: "420px", // 🟢 ปรับให้แคบลง (Compact)
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="d-inline-block">
            <Image src="/MOPH.png" alt="Logo" width={60} height={60} className="mb-2" /> {/* Logo เล็กลง */}
          </motion.div>
          <h5 className="fw-bold text-success mb-1">🔐 กู้คืนรหัสผ่าน</h5>
          <p className="text-muted small mb-3" style={{fontSize: '0.85rem'}}>กรอกข้อมูลเพื่อยืนยันตัวตน</p>

          {/* Progress Indicator (Compact) */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all small ${step >= 1 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{width: 30, height: 30}}>1</div>
            <div className="bg-light flex-grow-1 rounded" style={{height: 3}}>
                 <motion.div className="bg-success h-100 rounded" initial={{width: '0%'}} animate={{width: step === 1 ? '50%' : '100%'}}></motion.div>
            </div>
            <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all small ${step >= 2 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{width: 30, height: 30}}>2</div>
          </div>
        </div>

        {/* Form Container */}
        <div style={{ position: "relative", minHeight: "310px", overflow: "hidden" }}> {/* ลดความสูง Container */}
          <AnimatePresence initial={false} custom={step} mode="wait">
            
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" custom={1} variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="w-100 position-absolute top-0 start-0">
                <div className="mb-2">
                    <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>ชื่อผู้ใช้งาน (username)</label>
                    <div className="input-group shadow-sm" style={{borderRadius: "10px", overflow: "hidden"}}>
                        <span className="input-group-text bg-white border-end-0 ps-3 text-success"><i className="bi bi-person-circle"></i></span>
                        <input type="text" className="form-control border-start-0" style={inputStyle} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>เบอร์โทรศัพท์ที่ลงทะเบียนไว้</label>
                    <div className="input-group shadow-sm" style={{borderRadius: "10px", overflow: "hidden"}}>
                        <span className="input-group-text bg-white border-end-0 ps-3 text-primary"><i className="bi bi-telephone-fill"></i></span>
                        <input type="tel" maxLength={10} className="form-control border-start-0" style={inputStyle} placeholder="08x-xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
                    </div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} className="btn w-100 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" onClick={requestOTP} disabled={loading} style={{ height: "45px", borderRadius: "10px", background: "linear-gradient(90deg, #0ba34f 0%, #198754 100%)" }}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-shield-lock-fill"></i>} <span>ตรวจสอบข้อมูล</span>
                </motion.button>

                <div className="text-center mt-3 text-muted bg-light p-2 rounded-3" style={{ fontSize: "11px" }}>
                  <i className="bi bi-info-circle text-primary me-1"></i> ต้องตรงกับข้อมูลที่ลงทะเบียนไว้
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" custom={2} variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="w-100 position-absolute top-0 start-0">
                <div className="mb-2">
                    <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>รหัส OTP (6 หลัก)</label>
                    <div className="input-group shadow-sm" style={{borderRadius: "10px", overflow: "hidden"}}>
                        <span className="input-group-text bg-white border-end-0 ps-3 text-warning"><i className="bi bi-key-fill"></i></span>
                        <input type="text" maxLength={6} className="form-control border-start-0 fw-bold text-center" style={{...inputStyle, fontSize: '1.2rem', letterSpacing: '3px'}} placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))} />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>รหัสผ่านใหม่</label>
                    <div className="input-group shadow-sm" style={{borderRadius: "10px", overflow: "hidden"}}>
                        <span className="input-group-text bg-white border-end-0 ps-3 text-primary"><i className="bi bi-lock-fill"></i></span>
                        <input type="password" className="form-control border-start-0" style={inputStyle} placeholder="รหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} className="btn w-100 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" onClick={verifyOTP} disabled={loading} style={{ height: "45px", borderRadius: "10px", background: "linear-gradient(90deg, #0ba34f 0%, #198754 100%)" }}>
                   {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check-circle-fill"></i>} <span>ยืนยันเปลี่ยนรหัส</span>
                </motion.button>

                <div className="text-center mt-3">
                  <button className="btn btn-link text-secondary text-decoration-none small d-flex align-items-center mx-auto gap-1" onClick={() => setStep(1)} disabled={loading} style={{fontSize: '0.8rem'}}>
                    <i className="bi bi-arrow-left"></i> ย้อนกลับไปแก้ไข
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center mt-2 pt-2 border-top">
            <Link href="/login" className="text-decoration-none fw-bold text-success small" style={{fontSize: '0.85rem'}}>
                <i className="bi bi-box-arrow-in-right me-1"></i> กลับไปหน้าเข้าสู่ระบบ
            </Link>
        </div>
      </motion.div>
    </div>
  );
}