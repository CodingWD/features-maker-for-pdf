export interface ImageLayer {
  src: string;
  fit: "contain" | "cover" | string;
  scale: number;
  x: number;
  y: number;
  rotate: number;
}

export interface ImageObject {
  src: string;
  caption: string;
  layers: ImageLayer[];
  activeLayer: number;
  background: string;
  border: boolean;
  boxWidth: number | string;
  boxHeight: number | string;
}

export interface SpecRow {
  item: string;
  rows: string[][];
}

export interface OrderingTable {
  columns: string[];
  rows: string[][];
}

export interface CustomModule {
  type: "richText" | "keyValueTable" | "comparisonTable" | "imageGallery";
  title: string;
  content?: string;
  groups?: SpecRow[];
  columns?: string[];
  rows?: string[][];
  images?: ImageObject[];
}

export interface CanvasElement {
  id: string;
  type: "heading" | "text" | "features" | "specsTable" | "orderingTable" | "imageBox";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  table?: {
    columns: string[];
    rows: string[][];
    columnWidths?: number[];
    rowHeights?: number[];
  };
}

export interface DataSheetState {
  productTitle: string;
  companyEn: string;
  companyCn: string;
  docDate: string;
  docVersion: string;
  sheetTitle: string;
  features: string[];
  specs: SpecRow[];
  ordering: OrderingTable;
  images: {
    hero: ImageObject | ImageObject[] | string;
    dimension: ImageObject | ImageObject[] | string;
    interface: ImageObject | ImageObject[] | string;
  };
  customModules: CustomModule[];
  canvasElements?: CanvasElement[];
}

const baseImage = (caption: string): ImageObject => ({
  src: "",
  caption,
  layers: [],
  activeLayer: 0,
  background: "linear-gradient(180deg, #1296d8 0%, #d8f5ff 100%)",
  border: true,
  boxWidth: "",
  boxHeight: "",
});

export const SAMPLE_DATA_EN: DataSheetState = {
  productTitle: "E200 Series Industrial PC",
  companyEn: "Shenzhen Yanxiang Technology Co., Limited",
  companyCn: "深圳市研响科技有限公司",
  docDate: "May 2025",
  docVersion: "Ver. 1.0",
  sheetTitle: "Data Sheet",
  features: [
    "Intel® Pentium® J4205 / Celeron® J3455 processors",
    "1 x HDMI display output",
    "2 x Intel i225-V Gigabit Ethernet ports",
    "1 x RS-232/422/485, 3 x RS-232 or RS-485",
    "3 x USB 3.0, 1 x USB 2.0, 2 x internal USB 2.0",
    "Supports Windows 10 IoT LTSC and Linux",
    "Compact fanless aluminum enclosure",
  ],
  specs: [
    { item: "Processor\nSystem", rows: [["CPU", "Intel Apollo Lake J4205/J3455 series SoC"], ["BIOS", "AMI EFI BIOS"]] },
    { item: "Memory", rows: [["Technology", "LPDDR4"], ["Max. Capacity", "8 GB"]] },
    { item: "Display", rows: [["Controller", "Intel Gen9 graphics engine"], ["HDMI", "Max. 3840 x 2160 @ 30 Hz"]] },
    { item: "Audio", rows: [["HD Audio", "1"]] },
    { item: "Ethernet", rows: [["Controller", "2 x Intel i225-V"]] },
    { item: "Storage", rows: [["M.2", "1 x M.2 B/M-Key 2280, SATA 3.0 support"], ["mSATA", "1 internal interface"], ["SATA 3.0", "1"]] },
    { item: "I/O Interfaces", rows: [["USB 3.0", "3"], ["USB 2.0", "1 external, 2 internal"], ["COM", "1 x RS-232/422/485, 3 x RS-232 or RS-485"]] },
    { item: "Expansion", rows: [["SIM", "1 x Micro SIM"]] },
    { item: "Power", rows: [["Power Type", "24 V / 2.5 A, 4-pin Phoenix terminal"]] },
    { item: "Other", rows: [["Watchdog", "255-level timer, resettable"], ["Front panel control", "Power LED, HDD LED, reset, power switch"]] },
    { item: "Environment", rows: [["Operating Temperature", "0 ~ 60°C with 0.7 m/s air flow"], ["Storage Temperature", "-40°C ~ 85°C"], ["Relative Humidity", "5 ~ 95% @ 40°C, non-condensing"]] },
    { item: "Certification", rows: [["EMC", "CE, FCC"]] },
    { item: "Physical\nCharacteristics", rows: [["Motherboard Size", "146 x 102 mm"], ["System Dimensions", "172 x 125 x 62.5 mm"]] },
    { item: "OS Support", rows: [["OS Support", "Windows 10 64-bit, Linux"]] },
  ],
  ordering: {
    columns: ["Model", "CPU", "Memory", "GbE", "USB 3.0", "USB 2.0", "CAN", "GPIO", "RS-232/RS-485", "M.2 SSD", "HDMI", "Power Input"],
    rows: [
      ["E200-2260", "Intel Celeron J3455\n2.3 GHz SoC", "4 GB", "2", "3", "3", "2 optional", "8 optional", "4", "128 GB", "1", "24 V"],
      ["E200-5260", "Intel Pentium J4205\n1.5 GHz SoC", "4 GB", "2", "3", "3", "2 optional", "8 optional", "4", "128 GB", "1", "24 V"],
    ],
  },
  images: {
    hero: baseImage("Product image"),
    dimension: "",
    interface: "",
  },
  customModules: [
    { type: "richText", title: "Application", content: "Suitable for industrial automation, edge computing, machine vision, and equipment networking. This section can be edited directly." },
    { type: "keyValueTable", title: "Extended Attributes", groups: [{ item: "Mounting", rows: [["Installation", "Wall mount / DIN rail optional"], ["Material", "Aluminum alloy"]] }, { item: "Service", rows: [["Warranty", "12 months"], ["Customization", "OEM / ODM support"]] }] },
  ],
};

export const SAMPLE_DATA_ZH: DataSheetState = {
  productTitle: "E200 系列工业电脑",
  companyEn: "Shenzhen Yanxiang Technology Co., Limited",
  companyCn: "深圳市研响科技有限公司",
  docDate: "2025年5月",
  docVersion: "版本 1.0",
  sheetTitle: "产品规格书",
  features: [
    "采用 Intel® Pentium® J4205 / Celeron® J3455 处理器",
    "提供 1 个 HDMI 显示接口",
    "搭载 2 个 Intel i225-V 千兆网口",
    "提供 1 个 RS-232/422/485，3 个 RS-232 或 RS-485 串口",
    "3 个 USB 3.0，1 个 USB 2.0，2 个内部 USB 2.0 接口",
    "支持 Windows 10 IoT LTSC、Linux 操作系统",
    "紧凑型无风扇铝合金散热设计",
  ],
  specs: [
    { item: "处理器\n系统", rows: [["CPU", "Intel Apollo Lake J4205/J3455 系列 SoC"], ["BIOS", "AMI EFI BIOS"]] },
    { item: "内存", rows: [["技术", "LPDDR4"], ["最大容量", "8 GB"]] },
    { item: "显示", rows: [["控制器", "Intel Gen9 图形引擎"], ["HDMI", "最高支持 3840 x 2160 @ 30 Hz"]] },
    { item: "音频", rows: [["高清音频", "1"]] },
    { item: "网络", rows: [["控制器", "2 x Intel i225-V"]] },
    { item: "存储", rows: [["M.2", "1 x M.2 B/M-Key 2280，支持 SATA 3.0"], ["mSATA", "1 个内部接口"], ["SATA 3.0", "1"]] },
    { item: "外部接口", rows: [["USB 3.0", "3"], ["USB 2.0", "1 个外置，2 个内置"], ["COM", "1 x RS-232/422/485，3 x RS-232 或 RS-485"]] },
    { item: "扩展", rows: [["SIM", "1 x Micro SIM"]] },
    { item: "电源", rows: [["电源类型", "24 V / 2.5 A，4 针凤凰端子"]] },
    { item: "其他", rows: [["看门狗", "255 级定时器，支持复位"], ["前面板控制", "电源灯、硬盘灯、复位键、电源键"]] },
    { item: "环境", rows: [["工作温度", "0 ~ 60°C，0.7 m/s 风速下"], ["存储温度", "-40°C ~ 85°C"], ["相对湿度", "5 ~ 95% @ 40°C，非冷凝"]] },
    { item: "认证", rows: [["EMC", "CE, FCC"]] },
    { item: "物理\n特性", rows: [["主板尺寸", "146 x 102 mm"], ["整机尺寸", "172 x 125 x 62.5 mm"]] },
    { item: "操作系统", rows: [["系统支持", "Windows 10 64 位、Linux"]] },
  ],
  ordering: {
    columns: ["型号", "CPU", "内存", "网口", "USB 3.0", "USB 2.0", "CAN", "GPIO", "RS-232/RS-485", "M.2 SSD", "HDMI", "电源输入"],
    rows: [
      ["E200-2260", "Intel Celeron J3455\n2.3 GHz SoC", "4 GB", "2", "3", "3", "2 个可选", "8 个可选", "4", "128 GB", "1", "24 V"],
      ["E200-5260", "Intel Pentium J4205\n1.5 GHz SoC", "4 GB", "2", "3", "3", "2 个可选", "8 个可选", "4", "128 GB", "1", "24 V"],
    ],
  },
  images: {
    hero: baseImage("产品主图"),
    dimension: "",
    interface: "",
  },
  customModules: [
    { type: "richText", title: "应用场景", content: "适用于工业自动化、边缘计算、机器视觉、设备联网等场景。这里可以直接编辑为富文本说明。" },
    { type: "keyValueTable", title: "扩展属性", groups: [{ item: "安装方式", rows: [["安装方式", "壁挂 / DIN 导轨可选"], ["外壳材质", "铝合金"]] }, { item: "售后服务", rows: [["质保", "12 个月"], ["定制服务", "支持 OEM / ODM"]] }] },
  ],
};

export const SAMPLE_DATA: DataSheetState = SAMPLE_DATA_ZH;
