// ไฟล์ app/repair/print/[id]/layout.js
export default function PrintLayout({ children }) {
  return (
    <div className="print-only-layout">
      {/* คืนค่าเฉพาะ children โดยไม่มี Sidebar หรือ Navbar ของระบบ */}
      {children}
    </div>
  );
}