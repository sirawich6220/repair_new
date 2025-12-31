import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req) {
  try {
    const { search } = Object.fromEntries(req.nextUrl.searchParams);

    if (!search || search.trim() === "") {
      return NextResponse.json({ success: false, assets: [] });
    }

    const keyword = `%${search}%`;

    const [rows] = await db.query(
      `
      SELECT *
      FROM assets
      WHERE 
        asset_code LIKE ?
        OR asset_name LIKE ?
        OR asset_type LIKE ?
        OR asset_category LIKE ?
        OR brand LIKE ?
        OR model LIKE ?
        OR location LIKE ?
      ORDER BY asset_code ASC
      `,
      [keyword, keyword, keyword, keyword, keyword, keyword, keyword]
    );

    return NextResponse.json({ success: true, assets: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
