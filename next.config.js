/** @type {import('next').NextConfig} */

const nextConfig = {
  poweredByHeader: false, // ปิด X-Powered-By ของ Next.js

  // 🚫 ปิดการสร้าง Source Maps ทั้งฝั่ง Browser และ Server
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Powered-By",
            value: "None",
          },
          {
            key: "Server",
            value: "nextjs",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
