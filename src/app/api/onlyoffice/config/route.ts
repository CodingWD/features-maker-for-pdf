import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const origin = process.env.NEXT_PUBLIC_APP_PUBLIC_URL || `${protocol}://${host}`;
  const documentServerUrl = (process.env.NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL || "").replace(/\/$/, "");
  const documentUrl = `${origin}/api/onlyoffice/document`;
  const callbackUrl = `${origin}/api/onlyoffice/callback`;

  return NextResponse.json({
    configured: Boolean(documentServerUrl),
    documentServerUrl,
    scriptUrl: documentServerUrl ? `${documentServerUrl}/web-apps/apps/api/documents/api.js` : "",
    config: {
      document: {
        fileType: "docx",
        key: "spec-template-v1",
        title: "spec-template.docx",
        url: documentUrl,
      },
      documentType: "word",
      editorConfig: {
        callbackUrl,
        lang: "zh-CN",
        mode: "edit",
        user: {
          id: "datasheet-user",
          name: "Data Sheet Builder",
        },
        customization: {
          autosave: false,
          forcesave: true,
        },
      },
      height: "100%",
      width: "100%",
    },
  });
}
