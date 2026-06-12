import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function normalizeDocumentPayload(payload: any) {
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const title = String(payload.title || data.productTitle || "未命名规格书").trim();
  const productTitle = String(data.productTitle || title).trim();
  return {
    title,
    productTitle,
    dataJson: JSON.stringify(data)
  };
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, title, product_title AS productTitle, created_at AS createdAt, updated_at AS updatedAt
      FROM documents
      ORDER BY updated_at DESC, id DESC
    `).all();
    return NextResponse.json({ documents: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = normalizeDocumentPayload(body);
    const db = getDb();
    
    const stmt = db.prepare(`
      INSERT INTO documents (title, product_title, data_json)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(payload.title, payload.productTitle, payload.dataJson);
    
    const versionStmt = db.prepare(`
      INSERT INTO document_versions (document_id, version_name, data_json)
      VALUES (?, ?, ?)
    `);
    versionStmt.run(result.lastInsertRowid, "初始版本", payload.dataJson);
    
    return NextResponse.json({ id: result.lastInsertRowid, ...payload }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
