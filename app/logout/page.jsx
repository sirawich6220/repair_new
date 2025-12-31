"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // ลบ token
    localStorage.removeItem("token");

    // รอ 300ms แล้ว redirect
    setTimeout(() => {
      router.replace("/login");
    }, 300);
  }, [router]);

  return (
    <div className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh", fontSize: "20px" }}>
        
    </div>
  );
}
