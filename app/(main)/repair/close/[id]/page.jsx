"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { encodeIdWithDate } from "@/utils/base64";

export default function RepairClose() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const code = encodeIdWithDate(id);
      const res = await fetch(`/api/repairs/view/${code}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    }
    load();
  }, [id]);

  const [closingDetail, setClosingDetail] = useState("");
  const [partsUsed, setPartsUsed] = useState("-");
  const [cost, setCost] = useState("");

  async function submit() {
    if (!closingDetail.trim()) {
      return Swal.fire("ผิดพลาด", "กรุณากรอกรายละเอียดปิดงาน", "error");
    }

    const res = await fetch("/api/repairs/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repair_id: id,
        closing_detail: closingDetail,
        parts_used: partsUsed,
        cost,
      }),
    });

    const json = await res.json();

    if (json.success) {
      Swal.fire({
        icon: "success",
        title: "ปิดงานสำเร็จ!",
        html: `
          <p>ระบบได้บันทึกข้อมูลการปิดงานเรียบร้อยแล้ว</p>
          <a href="/api/repairs/export?id=${id}" target="_blank" class="btn btn-success mt-3">
            📄 ดาวน์โหลดใบรายงานซ่อม
          </a>
        `,
        confirmButtonText: "กลับไปหน้าใบงาน",
      }).then(() => {
        const code = encodeIdWithDate(id);
        router.push(`/repair/view/${code}`);
      });
    }
  }

  if (!data)
    return <div className="p-4 text-center fw-bold">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">🔧 ปิดงานซ่อม #{id}</h2>

      <div className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">รายละเอียดการซ่อม</label>
          <textarea
            className="form-control"
            rows={3}
            value={closingDetail}
            onChange={(e) => setClosingDetail(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">อะไหล่ที่ใช้</label>
          <input
            className="form-control"
            value={partsUsed}
            onChange={(e) => setPartsUsed(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">ค่าใช้จ่าย (บาท)</label>
          <input
            type="number"
            className="form-control"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
        </div>

        <button className="btn btn-success px-4" onClick={submit}>
          ✔ ปิดงาน
        </button>
      </div>
    </div>
  );
}
