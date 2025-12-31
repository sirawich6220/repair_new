"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import LoginBannerPopup from "@/components/LoginBannerPopup";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [hideSidebar, setHideSidebar] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const noSidebarPages = ["/login", "/register"];
    setHideSidebar(noSidebarPages.includes(pathname));
  }, [pathname]);
  
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data.user || null));
  }, []);

  return (
    <div className="app-container">
      {!hideSidebar && <LoginBannerPopup />}
      
      {!hideSidebar && <Sidebar user={user} />}

      {/* ⭐ เพิ่ม class has-sidebar */}
      <div className={`content-wrapper ${!hideSidebar ? "has-sidebar" : ""}`}>
        {children}
      </div>
    </div>
  );
}
