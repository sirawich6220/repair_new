"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);

  // 🟢 อ่านค่า Config จาก .env (แปลงเป็น Boolean)
  // ถ้าใน .env ตั้งเป็น false หรือไม่ได้ตั้งค่า ตัวแปรนี้จะเป็นเท็จ
  const isRecaptchaEnabled = process.env.NEXT_PUBLIC_ENABLE_RECAPTCHA === 'true';

  const handleLogin = async (e) => {
    e.preventDefault();

    // 🟢 เช็คเงื่อนไข: ตรวจสอบ Captcha เฉพาะตอนที่เปิดใช้งานเท่านั้น
    if (isRecaptchaEnabled && !captchaToken) {
        Swal.fire({
            icon: "warning",
            title: "ยืนยันตัวตน",
            text: "กรุณาติ๊กถูกที่ช่อง I'm not a robot",
            confirmButtonColor: "#0ba34f",
        });
        return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ส่ง token ไปด้วย (ถ้าปิดใช้งานจะเป็น null ก็ไม่เป็นไร)
        body: JSON.stringify({ username, password, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: data.error || "กรุณาตรวจสอบข้อมูลอีกครั้ง" });
        
        // 🟢 รีเซ็ต Captcha เฉพาะตอนเปิดใช้งาน
        if (isRecaptchaEnabled && recaptchaRef.current) {
            recaptchaRef.current.reset();
        }
        setCaptchaToken(null);
        setPassword(""); 
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user.id);
      localStorage.setItem("role", data.user.role);
      
      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ!", timer: 1200, showConfirmButton: false });
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" });
      
      // 🟢 รีเซ็ต Captcha เฉพาะตอนเปิดใช้งาน
      if (isRecaptchaEnabled && recaptchaRef.current) {
          recaptchaRef.current.reset();
      }
      setCaptchaToken(null);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-vh-100 d-flex justify-content-center align-items-center px-3"
      style={{
        background: "linear-gradient(135deg, #0fb258 0%, #0a7f3d 100%)",
        paddingTop: "20px",
        paddingBottom: "20px"
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white w-100 p-3 p-md-4 shadow-lg position-relative"
        style={{
          maxWidth: "380px",
          borderRadius: "16px",
        }}
      >
        {/* LOGO */}
        <div className="text-center mb-3">
          <motion.div
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-2 d-flex justify-content-center"
          >
            <Image src="/MOPH.png" alt="MOPH logo" width={70} height={70} />
          </motion.div>
          <h5 className="fw-bold mt-1 mb-0 text-success">ระบบแจ้งซ่อม</h5>
          <p className="text-muted small m-0" style={{fontSize: '0.8rem'}}>สสจ. อำนาจเจริญ</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin}>
          <div className="mb-2">
            <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>ชื่อผู้ใช้ / อีเมล</label>
            <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-success">
                <i className="bi bi-person-fill"></i>
                </span>
                <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ height: "40px", fontSize: "14px" }}
                />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold text-secondary mb-1" style={{fontSize: '0.8rem'}}>รหัสผ่าน</label>
            <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-success">
                <i className="bi bi-lock-fill"></i>
                </span>
                <input
                type="password"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ height: "40px", fontSize: "14px" }}
                />
            </div>
          </div>

          {/* 🟢 Captcha - แสดงผลเฉพาะเมื่อตั้งค่าเปิดใช้งาน */}
          {isRecaptchaEnabled && (
            <div className="mb-3 d-flex justify-content-center" style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LdYOy8sAAAAAOyNB3-UxhJGmKoDcm7sL5qvaPF4"
                    onChange={(token) => setCaptchaToken(token)}
                />
            </div>
          )}

          {/* ปุ่ม Login */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="btn w-100 fw-bold text-white shadow-sm"
            disabled={loading}
            style={{
              background: "linear-gradient(90deg, #0ba34f 0%, #198754 100%)",
              borderRadius: "8px",
              height: "40px",
              fontSize: "14px",
            }}
          >
            {loading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" style={{width: '1rem', height: '1rem'}}></span> 
                    <span>ตรวจสอบ...</span>
                </div>
            ) : "เข้าสู่ระบบ"}
          </motion.button>

          <div className="d-flex justify-content-between mt-3 px-1">
            <a href="/register" className="text-success text-decoration-none fw-semibold" style={{fontSize: '0.8rem'}}>
              <i className="bi bi-person-plus me-1"></i>สมัครสมาชิก
            </a>
            <a href="/forgot-password" className="text-secondary text-decoration-none" style={{fontSize: '0.8rem'}}>
              ลืมรหัสผ่าน?
            </a>
          </div>

        </form>

        <hr className="my-3 opacity-10" />

        <div className="text-center">
             <span className="badge bg-light text-muted border fw-normal mb-1" style={{fontSize: '0.7rem'}}>ผู้พัฒนาระบบ</span>
             <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>นายสิรวิชญ์ ธรรมบุตร (นักศึกษาฝึกงาน)</p>
             <p className="text-muted mt-0 mb-0 opacity-50" style={{ fontSize: '0.65rem' }}>Ver 1.0.0 © 2026 Amnat Charoen PHO</p>
        </div>
      </motion.div>
    </motion.div>
  );
}