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
    const doc = db.prepare(`
      SELECT id, title, product_title AS productTitle, data_json AS dataJson, created_at AS createdAt, updated_at AS updatedAt
      FROM documents
      WHERE id = ?
    `).get(id) as any;
    
    if (!doc) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }
    return NextResponse.json({ ...doc, data: JSON.parse(doc.dataJson) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const db = getDb();
    
    const exists = db.prepare("SELECT id FROM documents WHERE id = ?").get(id);
    if (!exists) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }
    
    const body = await req.json();
    const payload = normalizeDocumentPayload(body);
    
    const stmt = db.prepare(`
      UPDATE documents
      SET title = ?, product_title = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(payload.title, payload.productTitle, payload.dataJson, id);
    
    return NextResponse.json({ id, ...payload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
