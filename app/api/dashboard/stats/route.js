import db from "@/lib/db";

export async function GET() {
  const conn = await db.getConnection();

  const [rows] = await conn.query(`
    SELECT 
      SUM(status = 'waiting') AS waiting,
      SUM(status = 'processing') AS processing,
      SUM(status = 'pending') AS pending,
      SUM(status = 'completed') AS completed
    FROM repairs
  `);

  conn.release();

  return Response.json(rows[0]);
}
