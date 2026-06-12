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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, document_id AS documentId, version_name AS versionName, created_at AS createdAt
      FROM document_versions
      WHERE document_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(id);
    return NextResponse.json({ versions: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const db = getDb();
    const exists = db.prepare("SELECT id FROM documents WHERE id = ?").get(id);
    if (!exists) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }
    
    const body = await req.json();
    const payload = normalizeDocumentPayload(body);
    const versionName = String(body.versionName || `版本 ${new Date().toLocaleString("zh-CN")}`).trim();
    
    const stmt = db.prepare(`
      INSERT INTO document_versions (document_id, version_name, data_json)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(id, versionName, payload.dataJson);
    
    return NextResponse.json({ id: result.lastInsertRowid, documentId: id, versionName }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
