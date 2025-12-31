import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY";

// ✔ เข้ารหัสรหัสผ่าน
export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// ✔ เปรียบเทียบรหัสผ่าน
export function comparePassword(inputPassword, hashedPassword) {
  return bcrypt.compareSync(inputPassword, hashedPassword);
}

// ✔ สร้าง JWT
export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

// ✔ ตรวจสอบ JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}
