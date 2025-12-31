"use client";

import React, { useState, useEffect, useMemo } from "react"; // เพิ่ม useMemo
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const pathname = usePathname();
  
  const [openGroups, setOpenGroups] = useState({
    "ทั่วไป": true,
    "งานซ่อมและบำรุงรักษา": true,
    "คลังและทรัพย์สิน": false,
    "การตั้งค่าและจัดการ": false
  });

  // 🟢 1. ย้าย menuGroups มาไว้ข้างบนเพื่อใช้ตรวจสอบใน useEffect
  const menuGroups = useMemo(() => [
    {
      title: "ทั่วไป",
      icon: "bi-grid-fill",
      items: [
        { path: "/dashboard", icon: "bi-speedometer2", label: "แดชบอร์ด", permission: "dashboard_view" },
        { path: "/report", icon: "bi-file-earmark-bar-graph-fill", label: "รายงาน", permission: "dashboard_view" },
      ]
    },
    {
      title: "งานซ่อมและบำรุงรักษา",
      icon: "bi-wrench-adjustable-circle-fill",
      items: [
        { path: "/repair/new", icon: "bi-tools", label: "แจ้งซ่อมใหม่", permission: "repair_create" },
        { path: "/repair/list", icon: "bi-clipboard-fill", label: "ข้อมูลการทำงาน", permission: "repair_view" },
        { path: "/maintenance", icon: "bi-clipboard-check", label: "รายการบำรุงรักษา", permission: "repair_approve" },
        { path: "/repair/history", icon: "bi-clock-history", label: "ประวัติการแจ้งซ่อม", permission: null },
      ]
    },
    {
      title: "คลังและทรัพย์สิน",
      icon: "bi-box-seam-fill",
      items: [
        { path: "/assetcreate", icon: "bi-collection-fill", label: "ข้อมูลครุภัณฑ์", permission: "asset_view" },
        { path: "/assetimport", icon: "bi-file-earmark-spreadsheet", label: "ดึงข้อมูลจาก Exsil", permission: "asset_view" },
      ]
    },
    {
      title: "การตั้งค่าและจัดการ",
      icon: "bi-gear-wide-connected",
      items: [
        { path: "#", icon: "bi-sliders", label: "ตั้งค่า", permission: "system_setting" },
        { path: "/users", icon: "bi-people-fill", label: "จัดการผู้ใช้งาน", permission: "user_view" },
        { path: "/profiles", icon: "bi-person-badge", label: "จัดการโปรไฟล์ผู้ใช้", permission: "profile_manage" },
      ]
    }
  ], []);

  // 🟢 2. เพิ่ม useEffect เพื่อสั่งกางเมนูอัตโนมัติเมื่อ Path เปลี่ยน
  useEffect(() => {
    setShowMobile(false);
    
    // ค้นหาว่า pathname ปัจจุบันอยู่ใน group ไหน แล้วสั่งเปิด group นั้น
    menuGroups.forEach(group => {
      const isActive = group.items.some(item => item.path === pathname);
      if (isActive) {
        setOpenGroups(prev => ({ ...prev, [group.title]: true }));
      }
    });
  }, [pathname, menuGroups]);

  if (!user) return null;

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));

    useEffect(() => {
      // คำนวณความกว้างตามสถานะ collapsed
      const width = collapsed ? "80px" : "260px";
      // สร้างตัวแปร CSS ชื่อ --sidebar-width ไว้ที่ <html> tag
      document.documentElement.style.setProperty('--sidebar-width', width);
    }, [collapsed]);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="btn btn-success d-md-none rounded-circle shadow border border-white"
        style={{ position: 'fixed', top: '10px', left: '10px', width: '40px', height: '40px', zIndex: 1050, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowMobile(true)}
      >
        <i className="bi bi-list fs-4"></i>
      </button>

      <div className={`mobile-overlay ${showMobile ? 'active' : ''}`} onClick={() => setShowMobile(false)}></div>

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${showMobile ? "mobile-show" : ""}`}>
        
        {/* Header */}
        <div className="d-flex flex-column align-items-center pt-4 pb-2 position-relative">
             <button onClick={() => setShowMobile(false)} className="btn text-white position-absolute top-0 end-0 mt-2 me-2 d-md-none">
                <i className="bi bi-x-lg fs-4 opacity-75"></i>
             </button>

             <div className="text-center px-3 transition-all">
                <Image src="/MOPH.png" alt="logo" width={collapsed ? 40 : 70} height={collapsed ? 40 : 70} className="object-fit-contain" priority />
                <div className={`mt-2 text-white transition-all ${(collapsed && !showMobile) ? 'd-none' : 'd-block'}`}>
                    <h6 className="fw-bold m-0" style={{ fontSize: '1rem' }}>ระบบแจ้งซ่อม</h6>
                    <small className="opacity-75 d-block" style={{ fontSize: '0.75rem' }}>สสจ. อำนาจเจริญ</small>
                </div>
             </div>
        </div>

        <hr className="mx-3 border-white border opacity-25 my-2" />

        <div className="px-2 w-100 mt-2" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
            
            {menuGroups.map((group, groupIndex) => {
                const visibleItems = group.items.filter(item => {
                    if (user.role === 'admin') return true;
                    if (!item.permission) return true;
                    const userPerms = user.permissions || [];
                    return userPerms.includes(item.permission);
                });

                if (visibleItems.length === 0) return null;

                // 🟢 3. แก้ไขเงื่อนไข isOpen: ถ้าหด Sidebar อยู่ให้ปิดทิ้ง (ยกเว้น Mobile)
                const isOpen = (collapsed && !showMobile) ? false : openGroups[group.title];

                return (
                    <div key={groupIndex} className="mb-2">
                        {!collapsed || showMobile ? (
                            <div 
                                className="d-flex align-items-center justify-content-between px-3 py-2 text-white cursor-pointer select-none rounded hover-bg-white-10"
                                onClick={() => toggleGroup(group.title)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <i className={`bi ${group.icon} opacity-75`} style={{ fontSize: '0.9rem' }}></i>
                                    <span className="text-uppercase fw-bold" style={{ fontSize: '0.75rem', opacity: 0.9, letterSpacing: '0.5px' }}>
                                        {group.title}
                                    </span>
                                </div>
                                <i className={`bi bi-chevron-down transition-transform ${isOpen ? '' : 'rotate-minus-90'}`} style={{ fontSize: '0.7rem', opacity: 0.7 }}></i>
                            </div>
                        ) : (
                            <div className="text-center py-2 opacity-50"><hr className="border-white m-0" /></div>
                        )}

                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <ul className="nav flex-column">
                                        {visibleItems.map((item, idx) => {
                                            const isActive = pathname === item.path;
                                            return (
                                            <li key={idx} className="nav-item mb-1">
                                                <Link
                                                    href={item.path}
                                                    className={`nav-link d-flex align-items-center px-3 py-2 gap-3 rounded-3 text-white transition-all
                                                        ${isActive ? "bg-white bg-opacity-25 border-none border-white shadow-sm fw-bold" : "hover-bg-white-10"}`}
                                                    onClick={() => setShowMobile(false)}
                                                >
                                                    <i className={`bi ${item.icon} fs-5`} />
                                                    <span className={`${(collapsed && !showMobile) ? 'd-none' : 'd-block'}`} style={{ fontSize: '0.95rem' }}>
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Logout */}
            <div className="mt-2 border-top border-white border-opacity-25 pt-2">
                <Link href="/logout" className="nav-link d-flex align-items-center gap-3 px-3 py-2 text-white hover-bg-danger-10 rounded-3">
                    <i className="bi bi-door-open-fill fs-5" />
                    <span className={`${(collapsed && !showMobile) ? 'd-none' : 'd-block'}`}>ออกจากระบบ</span>
                </Link>
            </div>
        </div>

        {/* <button
          className="btn btn-light sidebar-toggle d-none d-md-flex position-absolute top-0 end-0 mt-4 me-n3 rounded-circle shadow-sm border"
          style={{ width: 30, height: 30, zIndex: 1001, padding: 0, alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
        </button> */}
      </aside>

      <style jsx global>{`
        .sidebar { position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: linear-gradient(180deg, #198754 0%, #146c43 100%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1040; box-shadow: 4px 0 10px rgba(0,0,0,0.1); }
        .sidebar.collapsed { width: 80px; }
        .hover-bg-white-10:hover { background-color: rgba(255, 255, 255, 0.1); }
        .hover-bg-danger-10:hover { background-color: rgba(220, 53, 69, 0.25); }
        .rotate-minus-90 { transform: rotate(-90deg); }
        .transition-transform { transition: transform 0.3s ease; }
        @media (max-width: 768px) {
            .sidebar { width: 280px !important; transform: translateX(-100%); left: 0 !important; }
            .sidebar.mobile-show { transform: translateX(0) !important; display: block !important; }
        }
        .mobile-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); z-index: 1030; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .mobile-overlay.active { opacity: 1; visibility: visible; }
      `}</style>
    </>
  );
}