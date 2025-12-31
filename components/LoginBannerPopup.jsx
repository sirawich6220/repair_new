"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // เพิ่ม AnimatePresence เพื่อความสมูทตอนปิด

export default function LoginBannerPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 🟢 ตรวจสอบว่าเคยเห็นประกาศนี้ไปแล้วหรือยังในรอบการ Login นี้
    const hasSeenBanner = localStorage.getItem("hasSeenLoginBanner");

    if (!hasSeenBanner) {
      setOpen(true);
      // บันทึกค่าไว้ว่า "เห็นแล้วนะ"
      localStorage.setItem("hasSeenLoginBanner", "true");
    }
  }, []);

  // ฟังก์ชันสำหรับจัดการการ Logout (ควรเรียกใช้เมื่อ User กดปุ่มออกจากระบบ)
  // เพื่อให้การ Login ครั้งหน้า Popup กลับมาแสดงอีกครั้ง
  // localStorage.removeItem("hasSeenLoginBanner"); 

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            backdropFilter: "blur(4px)" // เพิ่ม Effect เบลอพื้นหลังให้ดูพรีเมียม
          }}
          onClick={() => setOpen(false)} // คลิกพื้นหลังเพื่อปิดได้
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="bg-white p-4 rounded-4 shadow-lg text-center mx-3"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()} // ป้องกันการกดในกล่องแล้ว Popup ปิด
          >
            <img
              src="/frame.png"
              className="img-fluid rounded-3 mb-3 shadow-sm"
              alt="banner"
            />

            <h5 className="fw-bold text-success mb-2">สำคัญมาก!</h5>
            <p className="text-muted">
              โปรดเพิ่มเพื่อนก่อน!! <br />
              เพื่อลงทะเบียนเเจ้งเตือนผ่าน Line 
            </p>

            <button
              className="btn btn-success w-100 mt-3 py-2 fw-bold"
              onClick={() => setOpen(false)}
            >
              รับทราบและปิดหน้าต่าง
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}