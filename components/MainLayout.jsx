"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  // โหลดข้อมูล user จาก token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
  }, []);

  const noSidebarPages = ["/login", "/register"];
  const hideSidebar = noSidebarPages.includes(pathname);
  

  return (
  <div className="app-container">
    {!hideSidebar && user && <Sidebar user={user} />}

    <div
      className={`content-wrapper ${
        !hideSidebar && user ? "has-sidebar" : ""
      }`}
    >
      {children}
    </div>
  </div>
);

}
