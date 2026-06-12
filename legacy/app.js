const SAMPLE_DATA = {
  productTitle: "E200 Series Industrial PC",
  companyEn: "Shenzhen Future Robot Technology Co., Limited",
  companyCn: "深圳市卓信创驰技术有限公司",
  docDate: "May 2023",
  docVersion: "Ver. 1.0",
  sheetTitle: "Data Sheet 产品规格书",
  features: [
    "Intel® Pentium® J4205/ Celeron® J3455 Processors",
    "1 x HDMI",
    "2 x Intel i225-V Gbe LANs",
    "1 x RS-232/422/485, 3 x RS-232 or RS-485",
    "3 x USB3.0, 1 x USB 2.0, 2 x USB 2.0(internal)",
    "Support Windows 10 IoT LTSC, Linux",
    "Compact and fanless design"
  ],
  specs: [
    { item: "Processor\nSystem", rows: [["CPU", "Intel Apollo Lake J4205/j3455 series SoC"], ["BIOS", "AMI EFI BIOS"]] },
    { item: "Memory", rows: [["Technology", "LPDDR4"], ["Max. Capacity", "8 GB"]] },
    { item: "Display", rows: [["Controller", "Intel Gen9 Graphic engine"], ["HDMI", "Max, 3840 x 2160 @30 Hz"]] },
    { item: "Audio", rows: [["HAD", "1"]] },
    { item: "Ethernet", rows: [["Controller", "2 x Intel i225-V"]] },
    { item: "Storage", rows: [["M.2", "1 x M.2 B/M- Key 2280 support SATA 3.0"], ["MSATA", "1(internal interface)"], ["SATA 3.0", "1"]] },
    { item: "I/O Interfaces", rows: [["USB 3.0", "3"], ["USB 2.0", "1"], ["COM", "1 x RS-232/422/485, 3 x RS-232 or RS-485"]] },
    { item: "Expansion", rows: [["SIM", "1 x Micro SIM"]] },
    { item: "Power", rows: [["Power Type", "24V/2.5A 4Pin phoenix terminal"]] },
    { item: "Others", rows: [["Watchdog", "255-level timer, resettable"], ["Front panel control", "Power LED, HDD LED, Reset, Power Switch"]] },
    { item: "Environment", rows: [["Operational", "0 ~ 60° C with 0.7m/s air flow"], ["Storage Temperature", "-40° C ~ 85° C"], ["Relative Humidity", "5 ~ 95% @ 40 °C (non-condensing)"]] },
    { item: "Certification", rows: [["EMC", "CE, FCC"]] },
    { item: "Physical\nCharacteristics", rows: [["Motherboard size", "146 x 102mm"], ["Machine demensions", "172 x 125 x 62.5mm"]] },
    { item: "OS Support", rows: [["OS Support", "Windows 10 64 Bit, Linux"]] }
  ],
  ordering: {
    columns: ["Model", "CPU", "Memory", "GbE", "USB3.0", "USB2.0", "CAN", "GPIO", "RS-232/RS-485", "M.2 SSD", "HDMI", "Power Input"],
    rows: [
      ["E200-2260", "Intel Celeron J3455\n2.3 GHz SoC", "4GB", "2", "3", "3", "2(OPTIONAL)", "8(OPTIONAL)", "4", "128GB", "1", "24V"],
      ["E200-5260", "Intel Pentium J4205\n1.5 GHz SoC", "4GB", "2", "3", "3", "2(OPTIONAL)", "8(OPTIONAL)", "4", "128GB", "1", "24V"]
    ]
  },
  images: {
    hero: {
      src: "",
      caption: "产品主图",
      layers: [],
      activeLayer: 0,
      background: "linear-gradient(180deg, #1296d8 0%, #d8f5ff 100%)",
      border: true,
      boxWidth: "",
      boxHeight: ""
    },
    dimension: "",
    interface: ""
  },
  customModules: [
    {
      type: "richText",
      title: "Application 应用场景",
      content: "适用于工业自动化、边缘计算、机器视觉、设备联网等场景。这里可以直接编辑为富文本说明。"
    },
    {
      type: "keyValueTable",
      title: "Extended Attributes 扩展属性",
      groups: [
        { item: "Mounting", rows: [["安装方式", "Wall mount / DIN rail optional"], ["外壳材质", "Aluminum alloy"]] },
        { item: "Service", rows: [["质保", "12 months"], ["定制", "Support OEM / ODM"]] }
      ]
    }
  ]
};

const state = structuredClone(SAMPLE_DATA);
let selectedImagePath = "";
let pendingReplaceImagePath = "";
let pendingAddImagePath = "";
let activeImageGesture = null;
let currentDocumentId = null;

const fields = {
  productTitle: document.querySelector("#productTitle"),
  companyEn: document.querySelector("#companyEn"),
  companyCn: document.querySelector("#companyCn"),
  docDate: document.querySelector("#docDate"),
  docVersion: document.querySelector("#docVersion"),
  sheetTitle: document.querySelector("#sheetTitle"),
  featuresInput: document.querySelector("#featuresInput"),
  specsInput: document.querySelector("#specsInput"),
  orderingInput: document.querySelector("#orderingInput"),
  modulesInput: document.querySelector("#modulesInput"),
  imageReplaceInput: document.querySelector("#imageReplaceInput"),
  documentTitle: document.querySelector("#documentTitle"),
  documentList: document.querySelector("#documentList"),
  versionName: document.querySelector("#versionName"),
  versionList: document.querySelector("#versionList"),
  statusText: document.querySelector("#statusText"),
  sheetPreview: document.querySelector("#sheetPreview")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function sanitizeRichHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value ?? "").replaceAll("\n", "<br>");
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "BR", "SPAN", "SUP", "SUB", "UL", "OL", "LI", "P", "DIV", "FONT"]);
  const allowedAttrs = new Set(["color", "face", "size"]);
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      [...child.attributes].forEach((attr) => {
        if (!allowedAttrs.has(attr.name.toLowerCase())) child.removeAttribute(attr.name);
      });
      walk(child);
    });
  };
  walk(template.content);
  return template.innerHTML;
}

function rich(value) {
  return sanitizeRichHtml(value);
}

function getByPath(path) {
  return path.split(".").reduce((target, part) => target?.[part], state);
}

function ensureImageObject(path, fallbackCaption = "") {
  const current = getByPath(path);
  if (typeof current === "string") {
    const image = createImageObject(current, fallbackCaption);
    setRawByPath(path, image);
    return image;
  }
  if (current && typeof current === "object") {
    current.src ||= "";
    current.caption ||= fallbackCaption;
    if (!Array.isArray(current.layers)) {
      current.layers = current.src ? [{
        src: current.src,
        fit: current.fit || "contain",
        scale: Number(current.scale || 1),
        x: Number(current.x || 0),
        y: Number(current.y || 0),
        rotate: Number(current.rotate || 0)
      }] : [];
    }
    current.activeLayer = Math.min(Number(current.activeLayer || 0), Math.max(current.layers.length - 1, 0));
    current.layers.forEach((layer) => normalizeImageLayer(layer));
    current.rotate = Number(current.rotate || 0);
    current.background ||= "#ffffff";
    if (path === "images.hero" && current.background === "#ffffff") {
      current.background = "linear-gradient(180deg, #1296d8 0%, #d8f5ff 100%)";
    }
    current.border = current.border !== false;
    current.boxWidth = current.boxWidth ? Number(current.boxWidth) : "";
    current.boxHeight = current.boxHeight ? Number(current.boxHeight) : "";
    return current;
  }
  const image = createImageObject("", fallbackCaption);
  setRawByPath(path, image);
  return image;
}

function createImageObject(src = "", caption = "") {
  return {
    src,
    caption,
    layers: src ? [createImageLayer(src)] : [],
    activeLayer: 0,
    background: "#ffffff",
    border: true,
    boxWidth: "",
    boxHeight: ""
  };
}

function createImageLayer(src = "") {
  return {
    src,
    fit: "contain",
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0
  };
}

function normalizeImageLayer(layer) {
  layer.src ||= "";
  layer.fit ||= "contain";
  layer.scale = Number(layer.scale || 1);
  layer.x = Number(layer.x || 0);
  layer.y = Number(layer.y || 0);
  layer.rotate = Number(layer.rotate || 0);
  return layer;
}

function activeImageLayer(image) {
  if (!image.layers.length) image.layers.push(createImageLayer(image.src || ""));
  image.activeLayer = Math.min(Number(image.activeLayer || 0), image.layers.length - 1);
  return image.layers[image.activeLayer];
}

function setRawByPath(path, value) {
  const parts = path.split(".");
  let target = state;
  for (let index = 0; index < parts.length - 1; index += 1) {
    target = target[parts[index]];
  }
  target[parts.at(-1)] = value;
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

function syncForm() {
  fields.productTitle.value = state.productTitle;
  fields.companyEn.value = state.companyEn;
  fields.companyCn.value = state.companyCn;
  fields.docDate.value = state.docDate;
  fields.docVersion.value = state.docVersion;
  fields.sheetTitle.value = state.sheetTitle;
  fields.featuresInput.value = state.features.join("\n");
  fields.specsInput.value = prettyJson(state.specs);
  fields.orderingInput.value = prettyJson(state.ordering);
  fields.modulesInput.value = prettyJson(state.customModules);
  fields.documentTitle.value ||= state.productTitle || "未命名规格书";
}

function markStatus(text, isError = false) {
  fields.statusText.textContent = text;
  fields.statusText.style.color = isError ? "#c2410c" : "#64748b";
}

function updateFromForm() {
  state.productTitle = fields.productTitle.value.trim();
  state.companyEn = fields.companyEn.value.trim();
  state.companyCn = fields.companyCn.value.trim();
  state.docDate = fields.docDate.value.trim();
  state.docVersion = fields.docVersion.value.trim();
  state.sheetTitle = fields.sheetTitle.value.trim();
  state.features = fields.featuresInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  try {
    state.specs = JSON.parse(fields.specsInput.value || "[]");
    state.ordering = JSON.parse(fields.orderingInput.value || "{}");
    state.customModules = JSON.parse(fields.modulesInput.value || "[]");
    markStatus("已同步");
    render();
  } catch (error) {
    markStatus(`JSON 格式错误：${error.message}`, true);
  }
}

function replaceState(nextState) {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, structuredClone(nextState));
  selectedImagePath = "";
  syncForm();
  render();
}

function headerTemplate(isFirstPage = true) {
  const headerTitle = isFirstPage ? state.sheetTitle : state.productTitle;
  return `
    <header class="sheet-header">
      <div class="logo-mark" aria-label="Futurerobot logo">
        <div class="logo-word">FUTUREROBOT</div>
        <div class="logo-cn">卓信创驰®</div>
      </div>
      <div class="doc-title">
        <span class="rich-editable" contenteditable="true" spellcheck="false" data-bind="${isFirstPage ? "sheetTitle" : "productTitle"}">${rich(headerTitle)}</span>
      </div>
    </header>
  `;
}

function footerTemplate() {
  return `
    <footer class="sheet-footer">
      <div>
        <div class="rich-editable" contenteditable="true" spellcheck="false" data-bind="companyEn">${rich(state.companyEn)}</div>
        <div class="footer-cn rich-editable" contenteditable="true" spellcheck="false" data-bind="companyCn">${rich(state.companyCn)}</div>
      </div>
      <div class="footer-meta">
        <div class="rich-editable" contenteditable="true" spellcheck="false" data-bind="docDate">${rich(state.docDate)}</div>
        <div class="rich-editable" contenteditable="true" spellcheck="false" data-bind="docVersion">${rich(state.docVersion)}</div>
      </div>
    </footer>
  `;
}

function productSvg() {
  return `
    <svg class="placeholder-art" viewBox="0 0 620 320" role="img" aria-label="产品示意图">
      <defs>
        <linearGradient id="caseTop" x1="0" x2="1">
          <stop offset="0" stop-color="#c7d0d9"/>
          <stop offset="1" stop-color="#8c97a3"/>
        </linearGradient>
        <linearGradient id="caseFront" x1="0" x2="1">
          <stop offset="0" stop-color="#2d3845"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <polygon points="84,124 438,78 548,130 190,184" fill="url(#caseTop)" stroke="#606b76" stroke-width="3"/>
      <polygon points="84,124 190,184 190,254 84,194" fill="#3f4b58" stroke="#1f2937" stroke-width="3"/>
      <polygon points="190,184 548,130 548,200 190,254" fill="url(#caseFront)" stroke="#111827" stroke-width="3"/>
      <g fill="none" stroke="#0b1220" stroke-width="4">
        <rect x="232" y="174" width="46" height="28" rx="4"/>
        <rect x="288" y="166" width="46" height="28" rx="4"/>
        <rect x="354" y="157" width="48" height="18" rx="3"/>
        <rect x="422" y="149" width="42" height="22" rx="4"/>
      </g>
      <g fill="#0786d8">
        <rect x="448" y="181" width="42" height="18" rx="3"/>
        <rect x="496" y="174" width="28" height="18" rx="3"/>
      </g>
      <g stroke="#1f2937" stroke-width="2">
        <circle cx="214" cy="221" r="11" fill="#e6f7ff"/>
        <circle cx="292" cy="210" r="11" fill="#e6f7ff"/>
        <circle cx="370" cy="198" r="11" fill="#e6f7ff"/>
        <circle cx="448" cy="187" r="11" fill="#e6f7ff"/>
      </g>
      <g stroke="#1f2937" stroke-width="3">
        ${Array.from({ length: 12 }, (_, index) => `<line x1="${455 + index * 7}" y1="${85 + index * 3}" x2="${492 + index * 7}" y2="${103 + index * 3}"/>`).join("")}
      </g>
    </svg>
  `;
}

function dimensionSvg() {
  return `
    <svg class="placeholder-art" viewBox="0 0 860 250" role="img" aria-label="尺寸示意图">
      <g fill="none" stroke="#111" stroke-width="3">
        <rect x="275" y="58" width="310" height="118"/>
        ${Array.from({ length: 13 }, (_, i) => `<line x1="285" y1="${68 + i * 8}" x2="575" y2="${68 + i * 8}"/>`).join("")}
        <rect x="132" y="80" width="80" height="96"/>
        <rect x="650" y="50" width="86" height="134"/>
        <path d="M250 205h370M275 28h310M620 42v158M240 42v158"/>
        <path d="M275 28l-12 8M275 28l12 8M585 28l-12 8M585 28l12 8"/>
      </g>
      <g fill="#111" font-family="Arial" font-size="13" font-weight="700">
        <text x="417" y="24">190.20</text>
        <text x="425" y="224">216.20</text>
        <text x="630" y="117">125.00</text>
        <text x="675" y="38">67.50</text>
        <text x="152" y="194">62.5</text>
      </g>
    </svg>
  `;
}

function interfaceSvg() {
  return `
    <svg class="placeholder-art" viewBox="0 0 860 260" role="img" aria-label="接口示意图">
      <g fill="none" stroke="#111" stroke-width="4">
        <rect x="205" y="45" width="450" height="150"/>
        <line x1="205" y1="85" x2="655" y2="85"/>
        <rect x="245" y="103" width="34" height="28"/>
        <rect x="293" y="103" width="38" height="28"/>
        <rect x="338" y="103" width="38" height="28"/>
        <rect x="408" y="102" width="45" height="18"/>
        <rect x="490" y="102" width="42" height="30"/>
        <rect x="542" y="102" width="42" height="30"/>
        <rect x="248" y="160" width="72" height="28" rx="12"/>
        <rect x="345" y="160" width="72" height="28" rx="12"/>
        <rect x="442" y="160" width="72" height="28" rx="12"/>
        <rect x="539" y="160" width="72" height="28" rx="12"/>
      </g>
      <g stroke="#111" stroke-width="2">
        <line x1="262" y1="58" x2="262" y2="103"/>
        <line x1="318" y1="58" x2="318" y2="103"/>
        <line x1="430" y1="58" x2="430" y2="102"/>
        <line x1="511" y1="58" x2="511" y2="102"/>
        <line x1="564" y1="58" x2="564" y2="102"/>
        <line x1="284" y1="195" x2="284" y2="222"/>
        <line x1="284" y1="222" x2="575" y2="222"/>
        <line x1="575" y1="195" x2="575" y2="222"/>
      </g>
      <g fill="#111" font-family="Arial" font-size="12" font-weight="700">
        <text x="235" y="42">24V DC-IN</text>
        <text x="300" y="42">2 GbE LAN</text>
        <text x="418" y="42">HDMI</text>
        <text x="501" y="42">SIM</text>
        <text x="550" y="42">4 USB</text>
        <text x="417" y="245">4 COM</text>
        <text x="680" y="128">LED</text>
      </g>
    </svg>
  `;
}

function imageToolbarTemplate(path, allowDelete = false) {
  return `
    <div class="image-float-toolbar" data-toolbar-for="${path}">
      <button type="button" data-image-tool="replace" data-image-path="${path}">替换</button>
      <button type="button" data-image-tool="addLayer" data-image-path="${path}">加图</button>
      <button type="button" data-image-tool="zoomOut" data-image-path="${path}">-</button>
      <button type="button" data-image-tool="zoomIn" data-image-path="${path}">+</button>
      <button type="button" data-image-tool="fit" data-image-path="${path}">完整</button>
      <button type="button" data-image-tool="cover" data-image-path="${path}">填满</button>
      <label title="背景色">底色<input type="color" data-image-tool="background" data-image-path="${path}"></label>
      ${allowDelete ? `<button type="button" data-image-tool="delete" data-image-path="${path}">删除</button>` : ""}
    </div>
  `;
}

function editableImageFrame(options) {
  const image = ensureImageObject(options.path, options.caption || "");
  const activeLayer = activeImageLayer(image);
  const selectedClass = selectedImagePath === options.path ? " is-selected" : "";
  const borderColor = image.border ? "#24272c" : "transparent";
  const customSize = `${image.boxWidth ? `width:${image.boxWidth}px;` : ""}${image.boxHeight ? `height:${image.boxHeight}px;` : ""}`;
  const imageMarkup = image.layers.length && image.layers.some((layer) => layer.src)
    ? image.layers.map((layer, layerIndex) => `<img class="image-layer ${layerIndex === image.activeLayer ? "active-layer" : ""}" data-layer-index="${layerIndex}" draggable="false" src="${layer.src}" alt="" style="--layer-fit:${layer.fit};--layer-scale:${layer.scale};--layer-x:${layer.x}px;--layer-y:${layer.y}px;--layer-rotate:${layer.rotate}deg;">`).join("")
    : `<div class="image-placeholder">${options.fallback()}</div>`;

  return `
    <div class="image-frame editable-image-frame ${options.className || ""}${selectedClass}"
      data-image-path="${options.path}"
      style="--editable-bg:${image.background};--editable-border:${borderColor};--image-fit:${activeLayer.fit};--image-scale:${activeLayer.scale};--image-x:${activeLayer.x}px;--image-y:${activeLayer.y}px;--image-rotate:${activeLayer.rotate}deg;${customSize}">
      ${options.unitLabel ? `<span class="unit-label">${options.unitLabel}</span>` : ""}
      ${imageToolbarTemplate(options.path, options.allowDelete)}
      <div class="image-stage" data-image-stage="${options.path}">
        ${imageMarkup}
      </div>
      <span class="resize-handle nw" data-resize-image="${options.path}"></span>
      <span class="resize-handle ne" data-resize-image="${options.path}"></span>
      <span class="resize-handle sw" data-resize-image="${options.path}"></span>
      <span class="resize-handle se" data-resize-image="${options.path}"></span>
    </div>
  `;
}

function featuresTemplate() {
  return state.features
    .map((feature, index) => `<li><span class="feature-check" aria-hidden="true"></span><span class="rich-editable" contenteditable="true" spellcheck="false" data-bind="features.${index}">${rich(feature)}</span></li>`)
    .join("");
}

function specsTableTemplate() {
  let rows = "";
  state.specs.forEach((group, groupIndex) => {
    const groupRows = Array.isArray(group.rows) ? group.rows : [];
    groupRows.forEach((row, index) => {
      rows += "<tr>";
      if (index === 0) {
        rows += `<td class="category-cell rich-editable" contenteditable="true" spellcheck="false" data-bind="specs.${groupIndex}.item" rowspan="${groupRows.length || 1}">${rich(group.item)}</td>`;
      }
      rows += `<td class="sub-cell rich-editable" contenteditable="true" spellcheck="false" data-bind="specs.${groupIndex}.rows.${index}.0">${rich(row[0])}</td><td class="rich-editable" contenteditable="true" spellcheck="false" data-bind="specs.${groupIndex}.rows.${index}.1">${rich(row[1])}</td></tr>`;
    });
  });
  return `
    <table class="data-table">
      <thead>
        <tr><th>Item</th><th>Sub-Items</th><th>Descriptions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function orderingTableTemplate() {
  const columns = Array.isArray(state.ordering.columns) ? state.ordering.columns : [];
  const rows = Array.isArray(state.ordering.rows) ? state.ordering.rows : [];
  return `
    <table class="data-table ordering-table">
      <thead><tr>${columns.map((column, index) => `<th class="rich-editable" contenteditable="true" spellcheck="false" data-bind="ordering.columns.${index}">${rich(column)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => `<td class="rich-editable" contenteditable="true" spellcheck="false" data-bind="ordering.rows.${rowIndex}.${cellIndex}">${rich(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function moduleControlsTemplate(index) {
  return `
    <div class="module-controls" aria-label="模块操作">
      <button type="button" data-module-action="up" data-index="${index}">上移</button>
      <button type="button" data-module-action="down" data-index="${index}">下移</button>
      <button type="button" data-module-action="delete" data-index="${index}">删除</button>
    </div>
  `;
}

function keyValueModuleTable(module, moduleIndex) {
  const groups = Array.isArray(module.groups) ? module.groups : [];
  let rows = "";
  groups.forEach((group, groupIndex) => {
    const groupRows = Array.isArray(group.rows) ? group.rows : [];
    groupRows.forEach((row, rowIndex) => {
      rows += "<tr>";
      if (rowIndex === 0) {
        rows += `<td class="category-cell rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.groups.${groupIndex}.item" rowspan="${groupRows.length || 1}">${rich(group.item)}</td>`;
      }
      rows += `<td class="sub-cell rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.groups.${groupIndex}.rows.${rowIndex}.0">${rich(row[0])}</td><td class="rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.groups.${groupIndex}.rows.${rowIndex}.1">${rich(row[1])}</td></tr>`;
    });
  });
  return `
    <table class="data-table">
      <thead><tr><th>Item</th><th>Sub-Items</th><th>Descriptions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function comparisonModuleTable(module, moduleIndex) {
  const columns = Array.isArray(module.columns) ? module.columns : [];
  const rows = Array.isArray(module.rows) ? module.rows : [];
  return `
    <table class="data-table ordering-table">
      <thead><tr>${columns.map((column, index) => `<th class="rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.columns.${index}">${rich(column)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => `<td class="rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.rows.${rowIndex}.${cellIndex}">${rich(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function imageGalleryModule(module, moduleIndex) {
  const images = Array.isArray(module.images) ? module.images : [];
  if (!images.length) {
    return editableImageFrame({ path: `customModules.${moduleIndex}.images.0`, className: "drawing-frame", fallback: productSvg, allowDelete: true });
  }
  return `
    <div class="image-gallery">
      ${images.map((image, imageIndex) => `
        <figure class="gallery-item">
          ${editableImageFrame({ path: `customModules.${moduleIndex}.images.${imageIndex}`, className: "gallery-frame", fallback: productSvg, caption: image.caption, allowDelete: true })}
          <figcaption class="gallery-caption rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.images.${imageIndex}.caption">${rich(image.caption || `Image ${imageIndex + 1}`)}</figcaption>
        </figure>
      `).join("")}
    </div>
  `;
}

function moduleContentTemplate(module, moduleIndex) {
  if (module.type === "imageGallery") return imageGalleryModule(module, moduleIndex);
  if (module.type === "keyValueTable") return keyValueModuleTable(module, moduleIndex);
  if (module.type === "comparisonTable") return comparisonModuleTable(module, moduleIndex);
  return `<div class="module-body rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${moduleIndex}.content">${rich(module.content || "在这里输入模块内容。")}</div>`;
}

function customModulesTemplate() {
  const modules = Array.isArray(state.customModules) ? state.customModules : [];
  return modules.map((module, index) => `
    <article class="sheet-page module-page">
      ${moduleControlsTemplate(index)}
      <div class="sheet-content">
        ${headerTemplate(false)}
        <section class="section">
          <h3 class="section-title rich-editable" contenteditable="true" spellcheck="false" data-bind="customModules.${index}.title">${rich(module.title || "Untitled Module 未命名模块")}</h3>
          ${moduleContentTemplate(module, index)}
        </section>
      </div>
      ${footerTemplate()}
    </article>
  `).join("");
}

function render() {
  fields.sheetPreview.innerHTML = `
    <article class="sheet-page">
      <div class="sheet-content">
        ${headerTemplate(true)}
        <h1 class="product-heading rich-editable" contenteditable="true" spellcheck="false" data-bind="productTitle">${rich(state.productTitle)}</h1>
        <section class="hero-grid">
          ${editableImageFrame({ path: "images.hero", className: "hero-frame", fallback: productSvg, caption: "产品主图" })}
          <div class="features">
            <h3>Features 产品特性</h3>
            <ul>${featuresTemplate()}</ul>
          </div>
        </section>
        <section class="section">
          <h3 class="section-title">Specifications 规格信息</h3>
          ${specsTableTemplate()}
        </section>
      </div>
      ${footerTemplate()}
    </article>

    <article class="sheet-page">
      <div class="sheet-content">
        ${headerTemplate(false)}
        <section class="section">
          <h3 class="section-title">Dimensions 尺寸</h3>
          ${editableImageFrame({ path: "images.dimension", className: "drawing-frame", fallback: dimensionSvg, caption: "尺寸图", unitLabel: "Unit: mm" })}
        </section>
        <section class="section">
          <h3 class="section-title">Interface 接口</h3>
          ${editableImageFrame({ path: "images.interface", className: "drawing-frame tall", fallback: interfaceSvg, caption: "接口图" })}
        </section>
        <section class="section">
          <h3 class="section-title">Ordering Information 订购信息</h3>
          ${orderingTableTemplate()}
        </section>
      </div>
      ${footerTemplate()}
    </article>
    ${customModulesTemplate()}
  `;
  bindRichEditors();
  bindModuleControls();
  bindImageEditors();
}

function setByPath(path, value) {
  const parts = path.split(".");
  let target = state;
  for (let index = 0; index < parts.length - 1; index += 1) {
    target = target[parts[index]];
  }
  target[parts.at(-1)] = sanitizeRichHtml(value);
}

function bindRichEditors() {
  document.querySelectorAll("[contenteditable][data-bind]").forEach((element) => {
    element.addEventListener("input", () => {
      setByPath(element.dataset.bind, element.innerHTML);
      syncForm();
      markStatus("富文本已同步");
    });
    element.addEventListener("paste", (event) => {
      event.preventDefault();
      const html = event.clipboardData.getData("text/html");
      const text = event.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, sanitizeRichHtml(html || escapeHtml(text)));
    });
  });
}

function bindModuleControls() {
  document.querySelectorAll("[data-module-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.moduleAction;
      if (action === "delete") {
        state.customModules.splice(index, 1);
      }
      if (action === "up" && index > 0) {
        [state.customModules[index - 1], state.customModules[index]] = [state.customModules[index], state.customModules[index - 1]];
      }
      if (action === "down" && index < state.customModules.length - 1) {
        [state.customModules[index + 1], state.customModules[index]] = [state.customModules[index], state.customModules[index + 1]];
      }
      syncForm();
      render();
      markStatus("模块已更新");
    });
  });
}

function updateImageFrameStyle(path) {
  const image = ensureImageObject(path);
  const layer = activeImageLayer(image);
  const frame = document.querySelector(`[data-image-path="${CSS.escape(path)}"]`);
  if (!frame) return;
  frame.style.setProperty("--editable-bg", image.background);
  frame.style.setProperty("--editable-border", image.border ? "#24272c" : "transparent");
  if (image.boxWidth) frame.style.width = `${image.boxWidth}px`;
  if (image.boxHeight) frame.style.height = `${image.boxHeight}px`;
  frame.style.setProperty("--image-fit", layer.fit);
  frame.style.setProperty("--image-scale", layer.scale);
  frame.style.setProperty("--image-x", `${layer.x}px`);
  frame.style.setProperty("--image-y", `${layer.y}px`);
  frame.style.setProperty("--image-rotate", `${layer.rotate}deg`);
  frame.querySelectorAll(".image-layer").forEach((element, index) => {
    const item = image.layers[index];
    element.classList.toggle("active-layer", index === image.activeLayer);
    if (!item) return;
    element.style.setProperty("--layer-fit", item.fit);
    element.style.setProperty("--layer-scale", item.scale);
    element.style.setProperty("--layer-x", `${item.x}px`);
    element.style.setProperty("--layer-y", `${item.y}px`);
    element.style.setProperty("--layer-rotate", `${item.rotate}deg`);
  });
}

function selectImage(path) {
  selectedImagePath = path;
  document.querySelectorAll(".editable-image-frame").forEach((frame) => {
    frame.classList.toggle("is-selected", frame.dataset.imagePath === path);
  });
}

function clearImageSelection() {
  selectedImagePath = "";
  document.querySelectorAll(".editable-image-frame.is-selected").forEach((frame) => {
    frame.classList.remove("is-selected");
  });
}

function deleteImageByPath(path) {
  const parts = path.split(".");
  const imageIndex = Number(parts.at(-1));
  const arrayPath = parts.slice(0, -1).join(".");
  const targetArray = getByPath(arrayPath);
  if (Array.isArray(targetArray) && Number.isInteger(imageIndex)) {
    targetArray.splice(imageIndex, 1);
  }
}

function runImageTool(tool, path, value) {
  const image = ensureImageObject(path);
  const layer = activeImageLayer(image);
  if (tool === "replace") {
    pendingReplaceImagePath = path;
    fields.imageReplaceInput.value = "";
    fields.imageReplaceInput.click();
    return;
  }
  if (tool === "addLayer") {
    pendingAddImagePath = path;
    pendingReplaceImagePath = "";
    fields.imageReplaceInput.value = "";
    fields.imageReplaceInput.click();
    return;
  }
  if (tool === "zoomIn") layer.scale = Math.min(4, Number((layer.scale + 0.12).toFixed(2)));
  if (tool === "zoomOut") layer.scale = Math.max(0.25, Number((layer.scale - 0.12).toFixed(2)));
  if (tool === "fit") {
    layer.fit = "contain";
    layer.scale = 1;
    layer.x = 0;
    layer.y = 0;
  }
  if (tool === "cover") {
    layer.fit = "cover";
    layer.scale = 1;
    layer.x = 0;
    layer.y = 0;
  }
  if (tool === "background") image.background = value;
  if (tool === "delete") {
    deleteImageByPath(path);
    selectedImagePath = "";
    syncForm();
    render();
    markStatus("图片已删除");
    return;
  }
  updateImageFrameStyle(path);
  syncForm();
  markStatus("图片已更新");
}

function bindImageEditors() {
  document.querySelectorAll(".editable-image-frame").forEach((frame) => {
    frame.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".image-float-toolbar")) return;
      selectImage(frame.dataset.imagePath);
    });
  });

  document.querySelectorAll("[data-image-tool]").forEach((control) => {
    const eventName = control.type === "color" ? "input" : "click";
    control.addEventListener(eventName, (event) => {
      event.stopPropagation();
      runImageTool(control.dataset.imageTool, control.dataset.imagePath, control.value);
    });
  });

  document.querySelectorAll("[data-image-stage]").forEach((stage) => {
    stage.addEventListener("pointerdown", (event) => {
      const path = stage.dataset.imageStage;
      const image = ensureImageObject(path);
      const clickedLayer = event.target.closest(".image-layer");
      if (clickedLayer) image.activeLayer = Number(clickedLayer.dataset.layerIndex || 0);
      const layer = activeImageLayer(image);
      selectImage(path);
      if (!layer.src || event.target.closest(".resize-handle")) return;
      event.preventDefault();
      stage.setPointerCapture(event.pointerId);
      activeImageGesture = {
        type: "move",
        path,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        imageX: layer.x,
        imageY: layer.y
      };
      updateImageFrameStyle(path);
    });
    stage.addEventListener("wheel", (event) => {
      const path = stage.dataset.imageStage;
      if (selectedImagePath !== path) return;
      event.preventDefault();
      const image = ensureImageObject(path);
      const layer = activeImageLayer(image);
      const delta = event.deltaY < 0 ? 0.08 : -0.08;
      layer.scale = Math.max(0.25, Math.min(4, Number((layer.scale + delta).toFixed(2))));
      updateImageFrameStyle(path);
      syncForm();
      markStatus("图片已缩放");
    }, { passive: false });
  });

  document.querySelectorAll("[data-resize-image]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const path = handle.dataset.resizeImage;
      const image = ensureImageObject(path);
      selectImage(path);
      handle.setPointerCapture(event.pointerId);
      const frame = document.querySelector(`[data-image-path="${CSS.escape(path)}"]`);
      const rect = frame.getBoundingClientRect();
      activeImageGesture = {
        type: "boxResize",
        path,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        boxWidth: image.boxWidth || rect.width,
        boxHeight: image.boxHeight || rect.height
      };
    });
  });
}

window.addEventListener("pointermove", (event) => {
  if (!activeImageGesture) return;
  const image = ensureImageObject(activeImageGesture.path);
  const layer = activeImageLayer(image);
  if (activeImageGesture.type === "move") {
    layer.x = activeImageGesture.imageX + event.clientX - activeImageGesture.startX;
    layer.y = activeImageGesture.imageY + event.clientY - activeImageGesture.startY;
  }
  if (activeImageGesture.type === "boxResize") {
    image.boxWidth = Math.max(180, Math.round(activeImageGesture.boxWidth + event.clientX - activeImageGesture.startX));
    image.boxHeight = Math.max(140, Math.round(activeImageGesture.boxHeight + event.clientY - activeImageGesture.startY));
  }
  updateImageFrameStyle(activeImageGesture.path);
});

window.addEventListener("pointerup", () => {
  if (!activeImageGesture) return;
  syncForm();
  markStatus(activeImageGesture.type === "boxResize" ? "图片框尺寸已更新" : "图片位置已更新");
  activeImageGesture = null;
});

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".editable-image-frame, .image-float-toolbar, .resize-handle")) return;
  clearImageSelection();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") clearImageSelection();
});

function addModule(module) {
  state.customModules.push(module);
  syncForm();
  render();
  markStatus("已新增模块");
}

function findOrCreateGalleryModule(title = "Product Gallery 产品图片库") {
  let gallery = state.customModules.find((module) => module.type === "imageGallery");
  if (!gallery) {
    gallery = { type: "imageGallery", title, images: [] };
    state.customModules.push(gallery);
  }
  return gallery;
}

function handleImageUpload(event, key) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const previous = ensureImageObject(`images.${key}`, key);
    const next = createImageObject(reader.result, key);
    next.background = key === "hero"
      ? (previous.background && previous.background !== "#ffffff" ? previous.background : "linear-gradient(180deg, #1296d8 0%, #d8f5ff 100%)")
      : previous.background;
    next.border = previous.border;
    next.boxWidth = previous.boxWidth;
    next.boxHeight = previous.boxHeight;
    state.images[key] = next;
    render();
    markStatus("图片已更新");
  };
  reader.readAsDataURL(file);
}

function handleGalleryUpload(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  const gallery = findOrCreateGalleryModule();
  let pending = files.length;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      gallery.images.push(createImageObject(reader.result, file.name.replace(/\.[^.]+$/, "")));
      pending -= 1;
      if (pending === 0) {
        syncForm();
        render();
        markStatus(`已追加 ${files.length} 张图库图片`);
        event.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  });
}

function downloadJson() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.productTitle || "data-sheet"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败：${response.status}`);
  return payload;
}

function currentDocumentPayload() {
  updateFromForm();
  return {
    title: fields.documentTitle.value.trim() || state.productTitle || "未命名规格书",
    data: structuredClone(state)
  };
}

async function refreshDocuments() {
  try {
    const payload = await apiJson("/api/documents");
    fields.documentList.innerHTML = payload.documents.map((doc) => {
      const label = `${doc.title} · ${doc.updatedAt}`;
      return `<option value="${doc.id}">${escapeHtml(label)}</option>`;
    }).join("");
    if (currentDocumentId) fields.documentList.value = String(currentDocumentId);
    markStatus("历史已刷新");
  } catch (error) {
    markStatus(`历史刷新失败：${error.message}`, true);
  }
}

async function refreshVersions() {
  fields.versionList.innerHTML = "";
  if (!currentDocumentId) return;
  try {
    const payload = await apiJson(`/api/documents/${currentDocumentId}/versions`);
    fields.versionList.innerHTML = payload.versions.map((version) => {
      const label = `${version.versionName} · ${version.createdAt}`;
      return `<option value="${version.id}">${escapeHtml(label)}</option>`;
    }).join("");
  } catch (error) {
    markStatus(`版本刷新失败：${error.message}`, true);
  }
}

async function saveAsDocument() {
  try {
    const payload = await apiJson("/api/documents", {
      method: "POST",
      body: JSON.stringify(currentDocumentPayload())
    });
    currentDocumentId = payload.id;
    await refreshDocuments();
    await refreshVersions();
    markStatus("已另存为新文档");
  } catch (error) {
    markStatus(`保存失败：${error.message}`, true);
  }
}

async function saveDocument() {
  if (!currentDocumentId) {
    await saveAsDocument();
    return;
  }
  try {
    await apiJson(`/api/documents/${currentDocumentId}`, {
      method: "PUT",
      body: JSON.stringify(currentDocumentPayload())
    });
    await refreshDocuments();
    markStatus("当前文档已保存");
  } catch (error) {
    markStatus(`保存失败：${error.message}`, true);
  }
}

async function loadDocument() {
  const id = fields.documentList.value;
  if (!id) return markStatus("请选择要打开的文档", true);
  try {
    const payload = await apiJson(`/api/documents/${id}`);
    currentDocumentId = payload.id;
    fields.documentTitle.value = payload.title;
    replaceState(payload.data);
    await refreshDocuments();
    await refreshVersions();
    markStatus("文档已打开");
  } catch (error) {
    markStatus(`打开失败：${error.message}`, true);
  }
}

async function saveVersion() {
  if (!currentDocumentId) {
    await saveAsDocument();
  }
  if (!currentDocumentId) return;
  try {
    const payload = currentDocumentPayload();
    payload.versionName = fields.versionName.value.trim() || `版本 ${new Date().toLocaleString("zh-CN")}`;
    await apiJson(`/api/documents/${currentDocumentId}/versions`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    fields.versionName.value = "";
    await refreshVersions();
    markStatus("历史版本已保存");
  } catch (error) {
    markStatus(`保存版本失败：${error.message}`, true);
  }
}

async function loadVersion() {
  const id = fields.versionList.value;
  if (!id) return markStatus("请选择要打开的版本", true);
  try {
    const payload = await apiJson(`/api/versions/${id}`);
    replaceState(payload.data);
    markStatus("版本已打开，保存后会覆盖当前文档");
  } catch (error) {
    markStatus(`打开版本失败：${error.message}`, true);
  }
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-panel="${button.dataset.tab}"]`).classList.add("active");
  });
});

document.querySelectorAll(".rich-toolbar button").forEach((button) => {
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => {
    document.execCommand(button.dataset.command, false, null);
    syncActiveRichEditor();
  });
});

function syncActiveRichEditor() {
  const activeEditor = document.activeElement?.closest?.("[contenteditable][data-bind]");
  if (activeEditor) {
    setByPath(activeEditor.dataset.bind, activeEditor.innerHTML);
    syncForm();
    markStatus("富文本已同步");
  }
}

document.querySelector("#fontFamilyControl").addEventListener("change", (event) => {
  document.execCommand("fontName", false, event.target.value);
  syncActiveRichEditor();
});

document.querySelector("#fontSizeControl").addEventListener("change", (event) => {
  document.execCommand("fontSize", false, event.target.value);
  syncActiveRichEditor();
});

document.querySelector("#fontColorControl").addEventListener("input", (event) => {
  document.execCommand("foreColor", false, event.target.value);
  syncActiveRichEditor();
});

[
  fields.productTitle,
  fields.companyEn,
  fields.companyCn,
  fields.docDate,
  fields.docVersion,
  fields.sheetTitle,
  fields.featuresInput,
  fields.specsInput,
  fields.orderingInput,
  fields.modulesInput
].forEach((field) => {
  field.addEventListener("input", updateFromForm);
  field.addEventListener("change", updateFromForm);
});

document.querySelector("#heroImage").addEventListener("change", (event) => handleImageUpload(event, "hero"));
document.querySelector("#dimensionImage").addEventListener("change", (event) => handleImageUpload(event, "dimension"));
document.querySelector("#interfaceImage").addEventListener("change", (event) => handleImageUpload(event, "interface"));
fields.imageReplaceInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  const targetPath = pendingAddImagePath || pendingReplaceImagePath;
  if (!file || !targetPath) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = ensureImageObject(targetPath, file.name.replace(/\.[^.]+$/, ""));
    if (pendingAddImagePath) {
      image.layers.push(createImageLayer(reader.result));
      image.activeLayer = image.layers.length - 1;
    } else {
      const layer = activeImageLayer(image);
      layer.src = reader.result;
      layer.scale = 1;
      layer.x = 0;
      layer.y = 0;
      layer.rotate = 0;
      image.src = reader.result;
    }
    image.caption ||= file.name.replace(/\.[^.]+$/, "");
    syncForm();
    render();
    selectImage(targetPath);
    markStatus(pendingAddImagePath ? "图片已添加到当前图片框" : "图片已替换");
    pendingReplaceImagePath = "";
    pendingAddImagePath = "";
  };
  reader.readAsDataURL(file);
});
document.querySelector("#galleryImages").addEventListener("change", handleGalleryUpload);
document.querySelector("#addRichModule").addEventListener("click", () => addModule({
  type: "richText",
  title: "New Section 新增说明",
  content: "在这里输入说明文字，支持加粗、斜体、下划线和列表。"
}));
document.querySelector("#addGalleryModule").addEventListener("click", () => addModule({
  type: "imageGallery",
  title: "Image Gallery 图片展示",
  images: []
}));
document.querySelector("#addSpecModule").addEventListener("click", () => addModule({
  type: "keyValueTable",
  title: "More Specifications 更多规格",
  groups: [
    { item: "Category", rows: [["Attribute", "Value"], ["Attribute", "Value"]] }
  ]
}));
document.querySelector("#addTableModule").addEventListener("click", () => addModule({
  type: "comparisonTable",
  title: "Model Comparison 型号对比",
  columns: ["Model", "CPU", "Memory", "Storage"],
  rows: [["Model-A", "CPU", "Memory", "Storage"], ["Model-B", "CPU", "Memory", "Storage"]]
}));
document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#downloadJsonButton").addEventListener("click", downloadJson);
document.querySelector("#saveDocumentButton").addEventListener("click", saveDocument);
document.querySelector("#saveAsDocumentButton").addEventListener("click", saveAsDocument);
document.querySelector("#refreshDocumentsButton").addEventListener("click", refreshDocuments);
document.querySelector("#loadDocumentButton").addEventListener("click", loadDocument);
document.querySelector("#saveVersionButton").addEventListener("click", saveVersion);
document.querySelector("#loadVersionButton").addEventListener("click", loadVersion);
fields.documentList.addEventListener("change", async () => {
  currentDocumentId = Number(fields.documentList.value) || currentDocumentId;
  await refreshVersions();
});
document.querySelector("#resetButton").addEventListener("click", () => {
  currentDocumentId = null;
  fields.documentTitle.value = "";
  fields.versionList.innerHTML = "";
  replaceState(SAMPLE_DATA);
  syncForm();
  markStatus("已恢复示例");
});

syncForm();
render();
refreshDocuments();

