import db from "@/lib/db";

export async function GET() {
  const conn = await db.getConnection();

  const [rows] = await conn.query(`
    SELECT 
      MONTH(created_at) AS month,
      COUNT(*) AS total
    FROM repairs
    GROUP BY MONTH(created_at)
    ORDER BY month
  `);

  conn.release();

  return Response.json(rows);
}
