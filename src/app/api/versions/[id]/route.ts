import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const db = getDb();
    const row = db.prepare(`
      SELECT id, document_id AS documentId, version_name AS versionName, data_json AS dataJson, created_at AS createdAt
      FROM document_versions
      WHERE id = ?
    `).get(id) as any;
    
    if (!row) {
      return NextResponse.json({ error: "版本不存在" }, { status: 404 });
    }
    return NextResponse.json({ ...row, data: JSON.parse(row.dataJson) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
