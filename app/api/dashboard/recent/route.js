import db from "@/lib/db";

export async function GET() {
  const conn = await db.getConnection();

  const [rows] = await conn.query(`
    SELECT id, created_at, user_name, device_type, status
    FROM repairs
    ORDER BY id DESC
    LIMIT 10
  `);

  conn.release();

  return Response.json(rows);
}
