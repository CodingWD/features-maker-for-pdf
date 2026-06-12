import { NextResponse } from "next/server";
import { createSpecDocx } from "@/lib/docx";
import { SAMPLE_DATA_EN } from "@/lib/types";

export async function GET() {
  const docx = createSpecDocx(SAMPLE_DATA_EN);
  return new NextResponse(docx, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": 'inline; filename="spec-template.docx"',
      "cache-control": "no-store",
    },
  });
}
