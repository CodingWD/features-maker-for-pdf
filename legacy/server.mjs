import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(__dirname, "data");
const dbPath = join(dataDir, "datasheets.sqlite");
function cliValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const port = Number(cliValue("--port") || process.env.PORT || 4174);
const host = cliValue("--host") || process.env.HOST || "127.0.0.1";

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    product_title TEXT,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    version_name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );
`);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 60 * 1024 * 1024) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeDocumentPayload(payload) {
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const title = String(payload.title || data.productTitle || "未命名规格书").trim();
  const productTitle = String(data.productTitle || title).trim();
  return {
    title,
    productTitle,
    dataJson: JSON.stringify(data)
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, dbPath });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/documents") {
    const rows = db.prepare(`
      SELECT id, title, product_title AS productTitle, created_at AS createdAt, updated_at AS updatedAt
      FROM documents
      ORDER BY updated_at DESC, id DESC
    `).all();
    sendJson(res, 200, { documents: rows });
    return;
  }

  const documentMatch = url.pathname.match(/^\/api\/documents\/(\d+)$/);
  if (req.method === "GET" && documentMatch) {
    const id = Number(documentMatch[1]);
    const doc = db.prepare(`
      SELECT id, title, product_title AS productTitle, data_json AS dataJson, created_at AS createdAt, updated_at AS updatedAt
      FROM documents
      WHERE id = ?
    `).get(id);
    if (!doc) {
      sendJson(res, 404, { error: "文档不存在" });
      return;
    }
    sendJson(res, 200, { ...doc, data: JSON.parse(doc.dataJson) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/documents") {
    const payload = normalizeDocumentPayload(await readJsonBody(req));
    const result = db.prepare(`
      INSERT INTO documents (title, product_title, data_json)
      VALUES (?, ?, ?)
    `).run(payload.title, payload.productTitle, payload.dataJson);
    db.prepare(`
      INSERT INTO document_versions (document_id, version_name, data_json)
      VALUES (?, ?, ?)
    `).run(result.lastInsertRowid, "初始版本", payload.dataJson);
    sendJson(res, 201, { id: result.lastInsertRowid, ...payload });
    return;
  }

  if (req.method === "PUT" && documentMatch) {
    const id = Number(documentMatch[1]);
    const exists = db.prepare("SELECT id FROM documents WHERE id = ?").get(id);
    if (!exists) {
      sendJson(res, 404, { error: "文档不存在" });
      return;
    }
    const payload = normalizeDocumentPayload(await readJsonBody(req));
    db.prepare(`
      UPDATE documents
      SET title = ?, product_title = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.title, payload.productTitle, payload.dataJson, id);
    sendJson(res, 200, { id, ...payload });
    return;
  }

  const versionsMatch = url.pathname.match(/^\/api\/documents\/(\d+)\/versions$/);
  if (req.method === "GET" && versionsMatch) {
    const id = Number(versionsMatch[1]);
    const rows = db.prepare(`
      SELECT id, document_id AS documentId, version_name AS versionName, created_at AS createdAt
      FROM document_versions
      WHERE document_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(id);
    sendJson(res, 200, { versions: rows });
    return;
  }

  if (req.method === "POST" && versionsMatch) {
    const id = Number(versionsMatch[1]);
    const exists = db.prepare("SELECT id FROM documents WHERE id = ?").get(id);
    if (!exists) {
      sendJson(res, 404, { error: "文档不存在" });
      return;
    }
    const body = await readJsonBody(req);
    const payload = normalizeDocumentPayload(body);
    const versionName = String(body.versionName || `版本 ${new Date().toLocaleString("zh-CN")}`).trim();
    const result = db.prepare(`
      INSERT INTO document_versions (document_id, version_name, data_json)
      VALUES (?, ?, ?)
    `).run(id, versionName, payload.dataJson);
    sendJson(res, 201, { id: result.lastInsertRowid, documentId: id, versionName });
    return;
  }

  const versionMatch = url.pathname.match(/^\/api\/versions\/(\d+)$/);
  if (req.method === "GET" && versionMatch) {
    const id = Number(versionMatch[1]);
    const row = db.prepare(`
      SELECT id, document_id AS documentId, version_name AS versionName, data_json AS dataJson, created_at AS createdAt
      FROM document_versions
      WHERE id = ?
    `).get(id);
    if (!row) {
      sendJson(res, 404, { error: "版本不存在" });
      return;
    }
    sendJson(res, 200, { ...row, data: JSON.parse(row.dataJson) });
    return;
  }

  sendJson(res, 404, { error: "接口不存在" });
}

async function handleStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(__dirname, requested));
  if (!filePath.startsWith(normalize(__dirname))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await handleStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "服务器错误" });
  }
});

server.listen(port, host, () => {
  console.log(`规格书生成系统已启动: http://${host}:${port}/`);
  console.log(`SQLite 数据库: ${dbPath}`);
});
