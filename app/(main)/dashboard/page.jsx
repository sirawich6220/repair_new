"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, Line } from "react-chartjs-2";
import { useRouter } from "next/navigation";
import { encodeIdWithDate } from "@/utils/base64";
import { motion } from "framer-motion";

// ---------------- Chart.js Config ----------------
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ waiting: 0, processing: 0, pending: 0, completed: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [problemData, setProblemData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          if (json?.user) {
            setUser(json.user);
            if (json.user.role === "user") { router.push("/repair/new"); return; }
          }
        } catch (err) { console.error("Auth error", err); }
      }

      try {
        const [s, m, p, r] = await Promise.all([
          fetch("/api/dashboard/stats").then(res => res.json()),
          fetch("/api/dashboard/monthly").then(res => res.json()),
          fetch("/api/dashboard/problems").then(res => res.json()),
          fetch("/api/dashboard/recent").then(res => res.json())
        ]);
        setStats(s);
        setMonthlyData(m);
        setProblemData(p);
        setRecent(r);
      } catch (error) { console.error("Data load error", error); }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 w-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status"></div>
          <div className="text-muted small">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  // Charts Config
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { drawBorder: false } }, x: { grid: { display: false } } }
  };

  const monthlyChart = {
    labels: monthlyData?.map((m) => `เดือน ${m.month}`) || [],
    datasets: [{
      label: "จำนวนงานซ่อม",
      data: monthlyData?.map((m) => m.total) || [],
      borderColor: "#198754",
      backgroundColor: "rgba(25, 135, 84, 0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
    }],
  };

  const problemChart = {
    labels: problemData?.map((p) => p.device_type) || [],
    datasets: [{
      data: problemData?.map((p) => p.total) || [],
      backgroundColor: ["#198754", "#20c997", "#0dcaf0", "#ffc107", "#6c757d"],
      borderRadius: 6,
    }],
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: "badge bg-danger-subtle text-danger border border-danger-subtle",
      processing: "badge bg-primary-subtle text-primary border border-primary-subtle",
      pending: "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle",
      completed: "badge bg-success-subtle text-success border border-success-subtle",
    };
    return badges[status] || "badge bg-light text-dark border";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-100 transition-all duration-300 px-3 px-md-4 pt-3 pb-5 bg-light min-vh-100"
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h3 className="fw-bold m-0 text-dark">📊 แผงควบคุม</h3>
           <span className="text-muted small">ระบบจัดการงานแจ้งซ่อม</span>
        </div>
        <div className="d-none d-md-flex align-items-center gap-3 bg-white p-2 rounded-pill shadow-sm border px-3">
            <span className="fw-bold small text-success">{user?.first_name} {user?.last_name}</span>
            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white" style={{width: 32, height: 32}}>
                <i className="bi bi-person-fill"></i>
            </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="row g-3 mb-4">
        {[
          { title: "รอรับงาน", value: stats?.waiting, color: "#dc3545", icon: "bi-hourglass-split" },
          { title: "กำลังดำเนินการ", value: stats?.processing, color: "#0d6efd", icon: "bi-gear-wide-connected" },
          { title: "รออะไหล่", value: stats?.pending, color: "#ffc107", icon: "bi-tools" },
          { title: "เสร็จสิ้น", value: stats?.completed, color: "#198754", icon: "bi-check-all" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-lg-3">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 rounded-4 shadow-sm bg-white border-0 h-100 d-flex justify-content-between align-items-center"
              style={{ borderLeft: `5px solid ${c.color} !important` }}
            >
              <div>
                <div className="text-muted small mb-1">{c.title}</div>
                <h3 className="fw-bold m-0" style={{ color: c.color }}>{c.value || 0}</h3>
              </div>
              <i className={`bi ${c.icon} opacity-25 d-none d-sm-block`} style={{ fontSize: "2rem", color: c.color }}></i>
            </motion.div>
          </div>
        ))}
      </div>

      {/* CHARTS Section */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 w-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold m-0"><i className="bi bi-graph-up text-success me-2"></i>สถิตงานซ่อมรายเดือน</h6>
                <span className="badge bg-light text-dark fw-normal">ปี 2025</span>
            </div>
            <div style={{ height: 300, width: '100%' }}>
              <Line data={monthlyChart} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 w-100">
            <h6 className="fw-bold mb-4"><i className="bi bi-pie-chart text-success me-2"></i>แยกตามประเภทอุปกรณ์</h6>
            <div style={{ height: 300, width: '100%' }}>
              <Bar data={problemChart} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE Section */}
      <div className="bg-white p-4 rounded-4 shadow-sm border-0 w-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="fw-bold m-0"><i className="bi bi-list-stars text-primary me-2"></i>รายการล่าสุด</h6>
            <Link href="/repair/list" className="btn btn-light btn-sm text-primary fw-bold">ดูทั้งหมด</Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle border-top">
            <thead className="table-light">
              <tr className="small text-muted">
                <th className="py-3">วันที่แจ้ง</th>
                <th className="py-3">ผู้ส่งคำขอ</th>
                <th className="py-3">อุปกรณ์</th>
                <th className="py-3">สถานะ</th>
                <th className="py-3 text-end">จัดการ</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {recent?.length === 0 ? (
                 <tr><td colSpan="5" className="text-center py-5 text-muted">ไม่มีรายการใหม่ในขณะนี้</td></tr>
              ) : recent?.map((item) => {
                const code = encodeIdWithDate(item.id);
                return (
                  <tr key={item.id}>
                    <td className="small">{item.created_at?.slice(0, 10)}</td>
                    <td className="fw-semibold">{item.user_name}</td>
                    <td><span className="badge bg-light text-dark fw-normal border">{item.device_type}</span></td>
                    <td><span className={getStatusBadge(item.status)}>{item.status}</span></td>
                    <td className="text-end">
                      <Link href={`/repair/view/${code}`} className="btn btn-success btn-sm rounded-pill px-3 shadow-sm">
                        รายละเอียด
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}