// -----------------------------
// Base64 URL-SAFE encode/decode
// -----------------------------

// แปลง JSON → base64 URL safe
export function encodeIdWithDate(id) {
  const payload = {
    id,
    ts: Date.now()
  };

  const json = JSON.stringify(payload);

  // base64 ปกติ
  let b64 = Buffer.from(json, "utf-8").toString("base64");

  // แปลงเป็น URL safe (แทนที่ + / =)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}


// base64 URL safe → JSON
export function decodeIdWithDate(code) {
  try {
    // แปลงกลับเป็น base64 ปกติ
    let b64 = code.replace(/-/g, "+").replace(/_/g, "/");

    // เติม padding ให้ครบ 4
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);

    const jsonStr = Buffer.from(b64, "base64").toString("utf-8");

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Decode error:", err);
    return null;
  }
}
