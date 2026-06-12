import type { DataSheetState } from "@/lib/types";

const encoder = new TextEncoder();

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const paragraph = (text: string, style = "") =>
  `<w:p>${style}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;

const heading = (text: string) =>
  paragraph(
    text,
    `<w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:after="160"/></w:pPr>`
  );

const table = (columns: string[], rows: string[][]) => {
  const renderCell = (value: string, header = false) => `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="1600" w:type="dxa"/>
        ${header ? `<w:shd w:fill="0081C7"/>` : ""}
      </w:tcPr>
      <w:p>
        <w:r>
          ${header ? `<w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr>` : ""}
          <w:t xml:space="preserve">${escapeXml(value || "")}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="B7C9D4"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>${columns.map((column) => renderCell(column, true)).join("")}</w:tr>
      ${rows.map((row) => `<w:tr>${columns.map((_, index) => renderCell(row[index] || "")).join("")}</w:tr>`).join("")}
    </w:tbl>`;
};

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const u16 = (value: number) => {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
};

const u32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
};

const concat = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const zipStore = (files: { name: string; content: string }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    localParts.push(local);

    centralParts.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ])
    );
    offset += local.length;
  }

  const central = concat(centralParts);
  return concat([
    ...localParts,
    central,
    concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(central.length),
      u32(offset),
      u16(0),
    ]),
  ]);
};

export function createSpecDocx(state: DataSheetState) {
  const specRows = (state.specs || []).flatMap((group) =>
    (group.rows || []).map((row, index) => [index === 0 ? group.item : "", row[0] || "", row[1] || ""])
  );
  const features = (state.features || []).map((feature) => paragraph(`• ${feature}`)).join("");
  const body = `
    ${heading(state.productTitle || "Product Data Sheet")}
    ${paragraph("Features")}
    ${features}
    ${paragraph("Specifications")}
    ${table(["Item", "Sub-Items", "Descriptions"], specRows)}
    ${paragraph("Ordering Information")}
    ${table(state.ordering?.columns || [], state.ordering?.rows || [])}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdHeader"/>
      <w:footerReference w:type="default" r:id="rIdFooter"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360"/>
    </w:sectPr>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>${body}</w:body>
    </w:document>`;

  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      ${paragraph(`YANXIANG    ${state.sheetTitle || "Data Sheet"}`)}
    </w:hdr>`;

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      ${paragraph(`${state.companyEn || ""}    ${state.docDate || ""}    ${state.docVersion || ""}`)}
      ${paragraph(state.companyCn || "")}
    </w:ftr>`;

  return zipStore([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
          <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
          <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
        </Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>`,
    },
    {
      name: "word/_rels/document.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
          <Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
        </Relationships>`,
    },
    { name: "word/document.xml", content: documentXml },
    { name: "word/header1.xml", content: headerXml },
    { name: "word/footer1.xml", content: footerXml },
  ]);
}
