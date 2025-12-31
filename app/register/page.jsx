"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

// Component Input ย่อย
const CustomInput = ({ label, icon, type = "text", name, value, onChange, placeholder }) => (
  <div className="mb-2">
    <label className="form-label fw-bold text-secondary mb-1" style={{ fontSize: '0.75rem' }}>{label}</label>
    <div className="input-group shadow-sm" style={{ borderRadius: "8px", overflow: "hidden" }}>
      <span className="input-group-text bg-white border-end-0 ps-3 text-success" style={{ border: "1px solid #e2e8f0", paddingRight: '10px' }}>
        <i className={`bi ${icon}`} style={{ fontSize: '0.9rem' }}></i>
      </span>
      <input
        type={type}
        className="form-control border-start-0 ps-1"
        style={{ height: "40px", border: "1px solid #e2e8f0", fontSize: "16px", backgroundColor: "#fcfcfc" }}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const recaptchaRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    department: "", place: "", username: "", password: "", confirm_password: "",
  });

  useEffect(() => {
    fetch("/api/formdata/amnat").then((res) => res.json()).then((data) => setFormData(data));
  }, []);

  const allDepartments = formData ? [...new Set(formData.places.flatMap((p) => p.departments))] : [];
  const places = formData?.places || [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const nextStep = () => {
    if (!form.first_name || !form.last_name || !form.phone || !form.department || !form.email) {
      Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบถ้วน", confirmButtonColor: "#0ba34f" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
        Swal.fire({ icon: "warning", title: "ยืนยันตัวตน", text: "กรุณาติ๊กถูกที่ช่อง I'm not a robot", confirmButtonColor: "#0ba34f" });
        return;
    }

    if (!form.place || !form.username || !form.password) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบ" }); return;
    }
    if (form.password !== form.confirm_password) {
      Swal.fire({ icon: "error", title: "รหัสผ่านไม่ตรงกัน" }); return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, captchaToken }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        Swal.fire({ icon: "error", title: "สมัครไม่สำเร็จ", text: data.error });
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      } else {
        Swal.fire({ icon: "success", title: "สำเร็จ!", showConfirmButton: false, timer: 1500 });
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch { 
        Swal.fire({ icon: "error", title: "เชื่อมต่อไม่ได้" }); 
    }
    setLoading(false);
  };

  const stepVariants = {
    hidden: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2 } }),
  };

  return (
    <div className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", background: "radial-gradient(circle at top right, #2ecc71 0%, #0a7f3d 100%)", padding: "10px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="card shadow p-3 p-md-4 bg-white border-0 w-100"
        style={{ maxWidth: "420px", borderRadius: "16px", overflow: "hidden" }}
      >
        {/* 🟢 ส่วน Header: จัด Logo กลาง + Progress Bar */}
        <div className="text-center mb-2">
             <div className="d-flex justify-content-center mb-1">
                <Image src="/MOPH.png" alt="Logo" width={50} height={50} className="d-block" />
             </div>
             <h6 className="fw-bold text-success mb-3">ลงทะเบียนใช้งาน</h6>
             
             {/* Progress Bar */}
             <div className="d-flex align-items-center justify-content-center gap-2 mb-3 px-4 position-relative">
                <div className="position-absolute bg-light rounded" style={{ height: 2, width: "60%", zIndex: 0 }}></div>
                <motion.div className="position-absolute bg-success rounded" style={{ height: 2, width: "60%", zIndex: 1, left: "20%", transformOrigin: "left" }} initial={{ scaleX: 0 }} animate={{ scaleX: step === 1 ? 0.05 : 1 }} transition={{ duration: 0.5 }}></motion.div>
                
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all border position-relative z-2 ${step >= 1 ? 'bg-success text-white border-success' : 'bg-white text-muted border-light'}`} style={{ width: 24, height: 24, fontSize: '0.7rem' }}>1</div>
                <div style={{ width: "30%" }}></div>
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all border position-relative z-2 ${step >= 2 ? 'bg-success text-white border-success' : 'bg-white text-muted border-light'}`} style={{ width: 24, height: 24, fontSize: '0.7rem' }}>2</div>
             </div>
        </div>

        <div style={{ position: "relative", minHeight: "380px" }}>
          <AnimatePresence initial={false} custom={step} mode="wait">
            
            {/* STEP 1 */}
            {step === 1 && (
               <motion.div key="step1" custom={1} variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="w-100">
                  <div className="row g-2 mb-1">
                    <div className="col-6"><CustomInput label="ชื่อจริง" icon="bi-person" name="first_name" value={form.first_name} onChange={handleChange} placeholder="ชื่อ" /></div>
                    <div className="col-6"><CustomInput label="นามสกุล" icon="bi-person" name="last_name" value={form.last_name} onChange={handleChange} placeholder="นามสกุล" /></div>
                  </div>
                  <CustomInput label="เบอร์โทร" icon="bi-telephone" name="phone" value={form.phone} onChange={handleChange} placeholder="08x-xxxxxxx" />
                  <CustomInput label="อีเมล" icon="bi-envelope" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary mb-1" style={{ fontSize: '0.75rem' }}>แผนก / ฝ่าย</label>
                    <div className="input-group shadow-sm" style={{ borderRadius: "8px", overflow: "hidden" }}>
                        <span className="input-group-text bg-white border-end-0 ps-3 text-success"><i className="bi bi-diagram-3" style={{ fontSize: '0.9rem' }}></i></span>
                        <select className="form-select border-start-0 ps-2" style={{ height: "40px", border: "1px solid #e2e8f0", fontSize: "16px" }} name="department" value={form.department} onChange={handleChange}>
                        <option value="">-- เลือกแผนก --</option>
                        {allDepartments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </select>
                    </div>
                  </div>

                  <button className="btn w-100 text-white fw-bold shadow-sm mt-2" onClick={nextStep} style={{ height: "40px", borderRadius: "8px", background: "#0ba34f", fontSize: '0.9rem' }}>
                    ถัดไป <i className="bi bi-arrow-right ms-1"></i>
                  </button>
               </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" custom={2} variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="w-100">
                <div className="mb-2">
                  <label className="form-label fw-bold text-secondary mb-1" style={{ fontSize: '0.75rem' }}>สถานที่</label>
                  <select className="form-select shadow-sm" style={{ height: "40px", fontSize: "16px" }} name="place" value={form.place} onChange={handleChange}>
                      <option value="">-- เลือกสถานที่ --</option>
                      {places.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <CustomInput label="Username" icon="bi-person-fill" name="username" value={form.username} onChange={handleChange} placeholder="ภาษาอังกฤษ" />
                <div className="row g-2 mb-2">
                  <div className="col-12"><CustomInput label="รหัสผ่าน" icon="bi-lock-fill" type="password" name="password" value={form.password} onChange={handleChange} placeholder="******" /></div>
                  <div className="col-12" style={{ marginTop: "-8px" }}><CustomInput label="ยืนยันรหัสผ่าน" icon="bi-check-circle-fill" type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="******" /></div>
                </div>

                <div className="mb-3 d-flex justify-content-center">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        // ใช้ Site Key เดิมของคุณ (ถ้าจะเปลี่ยนไปใช้ Test Key ให้เปลี่ยนเป็น 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI)
                        sitekey="6LdYOy8sAAAAAOyNB3-UxhJGmKoDcm7sL5qvaPF4" 
                        onChange={(token) => setCaptchaToken(token)}
                    />
                </div>

                <button className="btn w-100 text-white fw-bold shadow-sm mb-2" onClick={handleSubmit} disabled={loading} style={{ height: "40px", borderRadius: "8px", background: "#0ba34f", fontSize: '0.9rem' }}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <span><i className="bi bi-check-circle me-1"></i> ยืนยันการสมัคร</span>}
                </button>

                <div className="text-center">
                  <button className="btn btn-link text-secondary text-decoration-none small p-0" onClick={() => setStep(1)} style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-arrow-left me-1"></i> ย้อนกลับ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="text-center mt-2 pt-2 border-top">
          <Link href="/login" className="text-decoration-none fw-bold text-success small" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-box-arrow-in-right me-1"></i> เข้าสู่ระบบ
          </Link>
        </div>
      </motion.div>
    </div>
  );
}