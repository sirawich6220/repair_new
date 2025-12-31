// app/layout.tsx
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export const metadata = {
  title: "ระบบแจ้งซ่อม - สำนักงานสาธารณสุขจังหวัด",
  description: "ระบบแจ้งซ่อมอุปกรณ์คอมพิวเตอร์และเครือข่าย",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
