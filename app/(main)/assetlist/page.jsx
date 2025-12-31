"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function AssetListPage() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch("/api/assets/list");
    const data = await res.json();
    setAssets(data.assets || []);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบครุภัณฑ์นี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก"
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch("/api/assets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire("สำเร็จ", "ลบข้อมูลแล้ว", "success");
      loadData();
    } else {
      Swal.fire("ผิดพลาด", data.error, "error");
    }
  };

  return (
    <div
      className="p-4"
      style={{ background: "#F4F6F7", minHeight: "100vh" }}
    >
      <div className="d-flex justify-content-between mb-3">
        <h3 className="fw-bold">📘 ทะเบียนคุมทรัพย์สินทั้งหมด</h3>

        <Link href="/assetcreate" className="btn btn-success">
          + เพิ่มครุภัณฑ์ใหม่
        </Link>
      </div>

      <div className="bg-white p-3 rounded shadow-sm table-responsive">
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อครุภัณฑ์</th>
              <th>ประเภท</th>
              <th>หน่วยงาน</th>
              <th>สภาพ</th>
              <th className="text-end">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.asset_code}</td>
                <td>{a.asset_name}</td>
                <td>{a.asset_type}</td>
                <td>{a.department}</td>
                <td>{a.condition}</td>
                <td className="text-end">
                  <Link
                    href={`/assetedit/${a.id}`}
                    className="btn btn-sm btn-primary me-2"
                  >
                    แก้ไข
                  </Link>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="btn btn-sm btn-danger"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}

            {assets.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-3">
                  ไม่มีข้อมูลครุภัณฑ์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
