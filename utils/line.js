// ส่งข้อความปกติ
export async function sendLineText(to, message) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("📨 LINE Text Response:", data);
    return data;
  } catch (error) {
    console.error("❌ LINE TEXT ERROR:", error);
  }
}

export function howToRegisterFlex() {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "📲 วิธีผูกบัญชี LINE",
          weight: "bold",
          size: "lg",
          color: "#0F5132",
        },

        { type: "separator", margin: "md" },

        // ❗ แก้ตรงนี้ → ลบ color
        {
          type: "text",
          text: "เพื่อรับการแจ้งเตือนสถานะงานซ่อมแบบ Real-time",
          size: "sm",
          wrap: true
        },

        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "ขั้นตอน:",
              weight: "bold",
              size: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "text", text: "1️⃣", size: "lg", flex: 1 },
                {
                  type: "text",
                  text: "พิมพ์คำสั่ง: register <username>",
                  flex: 6,
                  wrap: true
                }
              ],
            },

            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "text", text: "📌", size: "lg", flex: 1 },
                {
                  type: "text",
                  text: "ตัวอย่าง: register somchai01",
                  flex: 6,
                  wrap: true
                },
              ],
            },

            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "text", text: "2️⃣", size: "lg", flex: 1 },
                {
                  type: "text",
                  text: "ถ้าผูกสำเร็จ 🎉 คุณจะได้รับข้อความยืนยัน",
                  flex: 6,
                  wrap: true
                },
              ],
            }
          ],
        },

        {
          type: "box",
          layout: "vertical",
          paddingAll: "12px",
          backgroundColor: "#E8F5E9",
          cornerRadius: "md",
          contents: [
            {
              type: "text",
              text: "หากไม่มี Username กรุณาสมัครได้ที่หน้าระบบแจ้งซ่อม",
              wrap: true,
              size: "xs",
              color: "#1B5E20"
            }
          ],
        }
      ],
    },
  };
}




export async function sendLineFlex(to, flexContent) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages: [
          {
            type: "flex",
            altText: "อัปเดตสถานะงานซ่อม",
            contents: flexContent,
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("📨 LINE Flex Response:", data);
    return data;
  } catch (error) {
    console.error("❌ LINE FLEX ERROR:", error);
  }
}


export function repairStatusFlex(repair, statusTextTH) {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: "🔧 อัปเดตสถานะงานซ่อม",
          weight: "bold",
          size: "lg",
          color: "#0f5f3b",
        },
        {
          type: "separator",
          margin: "md"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
          contents: [
            // 🟢 สถานะงาน
            {
              type: "box",
              layout: "baseline",
              contents: [
                { type: "text", text: "สถานะ:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: statusTextTH,
                  weight: "bold",
                  flex: 5,
                  color:
                    statusTextTH === "เสร็จสิ้น"
                      ? "#0f9d58"
                      : statusTextTH === "กำลังดำเนินการ"
                      ? "#4285f4"
                      : statusTextTH === "รออะไหล่"
                      ? "#fbbc05"
                      : "#ea4335",
                },
              ],
            },

            // 🟢 อุปกรณ์
            {
              type: "box",
              layout: "baseline",
              contents: [
                { type: "text", text: "อุปกรณ์:", weight: "bold", flex: 2 },
                { type: "text", text: repair.device_type, flex: 5 },
              ],
            },

            // 🟢 สถานที่
            {
              type: "box",
              layout: "baseline",
              contents: [
                { type: "text", text: "สถานที่:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: repair.place,
                  flex: 5,
                  wrap: true,
                },
              ],
            },

            // 🟢 รายละเอียดซ่อม (ใหม่แทนใบงาน)
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              contents: [
                { type: "text", text: "รายละเอียดซ่อม:", weight: "bold" },
                {
                  type: "text",
                  text: repair.description || "-",
                  wrap: true,
                  margin: "sm",
                  color: "#333333"
                }
              ]
            },

            // 🕒 เวลา
            {
              type: "box",
              layout: "baseline",
              margin: "md",
              contents: [
                { type: "text", text: "เวลา:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: new Date().toLocaleString("th-TH"),
                  flex: 5,
                  wrap: true,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

// ✔ Flex หลังผู้ใช้ register สำเร็จ
export function registerSuccessFlex(user) {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "20px",
      contents: [
        {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/MOPH.png",
          aspectMode: "fit",
          size: "80px",
          align: "center"
        },

        {
          type: "text",
          text: "ผูกบัญชีสำเร็จ!",
          weight: "bold",
          size: "lg",
          color: "#0F5132",
        },

        { type: "separator", margin: "md" },

        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "บัญชี LINE ของคุณเชื่อมกับระบบแจ้งซ่อมแล้ว",
              wrap: true,
              color: "#333333",
            },

            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                { type: "text", text: "👤 ผู้ใช้:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: `${user.first_name} ${user.last_name}`,
                  flex: 5,
                  wrap: true,
                },
              ],
            },

            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🏥 แผนก:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: user.department || "-",
                  flex: 5,
                  wrap: true,
                },
              ],
            },
          ],
        },

        {
          type: "box",
          layout: "vertical",
          paddingAll: "12px",
          backgroundColor: "#E8F5E9",
          cornerRadius: "md",
          contents: [
            {
              type: "text",
              text: "คุณจะได้รับแจ้งเตือนสถานะงานซ่อมแบบ Real-time",
              wrap: true,
              size: "sm",
              color: "#1B5E20",
            },
          ],
        },
      ],
    },
  };
}

export function alreadyLinkedFlex(user) {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      spacing: "md",
      contents: [
        // 🔰 โลโก้หน่วยงาน
        {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/MOPH.png",
          aspectMode: "fit",
          size: "80px",
          align: "center"
        },

        {
          type: "text",
          text: "คุณได้ผูกบัญชีไปแล้ว",
          weight: "bold",
          size: "lg",
          align: "center",
          color: "#0F5132",
          margin: "md"
        },

        {
          type: "text",
          text: "บัญชี LINE ของคุณถูกเชื่อมกับระบบแจ้งซ่อมแล้ว",
          wrap: true,
          align: "center",
          color: "#444444",
          size: "sm"
        },

        {
          type: "separator",
          margin: "md"
        },

        // ℹ️ รายละเอียดผู้ใช้
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "👤 ผู้ใช้:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: `${user.first_name} ${user.last_name}`,
                  flex: 5,
                  wrap: true
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🏥 แผนก:", weight: "bold", flex: 2 },
                {
                  type: "text",
                  text: user.department || "-",
                  flex: 5,
                  wrap: true
                }
              ]
            }
          ]
        },

        // 🔒 กล่องแจ้งเตือน
        {
          type: "box",
          layout: "vertical",
          paddingAll: "12px",
          cornerRadius: "md",
          backgroundColor: "#FFF4F4",
          contents: [
            {
              type: "text",
              text: "บัญชีนี้ถูกเชื่อมอยู่แล้ว หากต้องการเปลี่ยนบัญชี กรุณาติดต่อเจ้าหน้าที่",
              wrap: true,
              size: "xs",
              color: "#B71C1C"
            }
          ]
        }
      ]
    }
  };
}

// Flex ส่ง OTP ลืมรหัสผ่าน (ธีมสาธารณสุขไทย)
export function otpFlex(otpCode) {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      spacing: "md",
      contents: [
        {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/MOPH.png",
          size: "80px",
          aspectMode: "fit",
          align: "center"
        },
        {
          type: "text",
          text: "🔐 ยืนยันตัวตนเพื่อตั้งรหัสผ่านใหม่",
          weight: "bold",
          size: "md",
          align: "center",
          color: "#0F5132",
          wrap: true
        },
        {
          type: "separator",
          margin: "md"
        },
        {
          type: "text",
          text: "รหัส OTP ของคุณคือ",
          align: "center",
          size: "sm",
          color: "#444444",
          wrap: true
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#E8F5E9",
          cornerRadius: "md",
          paddingAll: "12px",
          margin: "sm",
          contents: [
            {
              type: "text",
              text: otpCode,
              align: "center",
              weight: "bold",
              size: "xl",
              color: "#0F5132"
            },
            {
              type: "text",
              text: "ใช้ได้ภายใน 5 นาที",
              align: "center",
              size: "xs",
              color: "#1B5E20",
              margin: "sm"
            }
          ]
        },
        {
          type: "text",
          text: "กรุณากลับไปที่หน้าลืมรหัสผ่านบนเว็บไซต์ และกรอกรหัส OTP นี้",
          wrap: true,
          size: "xs",
          color: "#555555",
          margin: "md"
        }
      ]
    }
  };
}








