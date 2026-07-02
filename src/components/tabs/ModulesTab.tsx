"use client";

import { useMemo } from "react";
import { useAppContext } from "@/components/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CanvasElement, DataSheetState, OrderingTable, SpecRow } from "@/lib/types";

const CONTENT_LEFT = 50;
const CONTENT_TOP = 118;

const moduleLabel: Record<CanvasElement["type"], string> = {
  heading: "标题",
  text: "文本框",
  features: "产品特点",
  specsTable: "规格表",
  orderingTable: "订购表",
  imageBox: "图片框",
};

const fitColumnWidths = (columns: string[], width = 860) => {
  const count = Math.max(columns.length, 1);
  const columnWidth = Math.max(54, Math.floor(width / count));
  return columns.map(() => columnWidth);
};

const cloneTable = (table: OrderingTable, width = 860) => ({
  columns: [...(table?.columns || [])],
  rows: (table?.rows || []).map((row) => [...row]),
  columnWidths: fitColumnWidths(table?.columns || [], width),
  rowHeights: (table?.rows || []).map(() => 44),
});

const specsToTable = (specs: SpecRow[]) => ({
  columns: ["项目", "子项", "描述"],
  rows: (specs || []).flatMap((group) =>
    (group.rows || []).map((row, index) => [index === 0 ? group.item : "", row[0] || "", row[1] || ""])
  ),
  columnWidths: [150, 220, 490],
  rowHeights: (specs || []).flatMap((group) => (group.rows || []).map(() => 34)),
});

const createId = () => `canvas-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultCanvasElements = (state: DataSheetState): CanvasElement[] => [
  { id: "default-heading", type: "heading", page: 0, x: CONTENT_LEFT, y: 138, width: 640, height: 72, content: state.productTitle || "Product Title", fontSize: 42 },
  { id: "default-features", type: "features", page: 0, x: 520, y: 250, width: 360, height: 360, content: (state.features || []).join("\n"), fontSize: 16 },
  { id: "default-hero-image", type: "imageBox", page: 0, x: CONTENT_LEFT, y: 250, width: 400, height: 300, content: "产品图片" },
  { id: "default-specs-heading", type: "heading", page: 0, x: CONTENT_LEFT, y: 594, width: 860, height: 42, content: "规格信息", fontSize: 24 },
  { id: "default-specs-table", type: "specsTable", page: 0, x: CONTENT_LEFT, y: 650, width: 860, height: 510, table: specsToTable(state.specs || []) },
  { id: "default-dimensions-heading", type: "heading", page: 1, x: CONTENT_LEFT, y: 140, width: 860, height: 42, content: "尺寸图", fontSize: 24 },
  { id: "default-dimensions-image", type: "imageBox", page: 1, x: CONTENT_LEFT, y: 200, width: 860, height: 310, content: "尺寸图片" },
  { id: "default-interface-heading", type: "heading", page: 1, x: CONTENT_LEFT, y: 540, width: 860, height: 42, content: "接口图", fontSize: 24 },
  { id: "default-interface-image", type: "imageBox", page: 1, x: CONTENT_LEFT, y: 600, width: 860, height: 280, content: "接口图片" },
  { id: "default-ordering-heading", type: "heading", page: 2, x: CONTENT_LEFT, y: 140, width: 860, height: 42, content: "订购信息", fontSize: 24 },
  { id: "default-ordering-table", type: "orderingTable", page: 2, x: CONTENT_LEFT, y: 206, width: 860, height: 780, table: cloneTable(state.ordering, 860) },
];

const newCanvasElement = (type: CanvasElement["type"], page: number, y: number, state: DataSheetState): CanvasElement => {
  const width = type.includes("Table") ? 720 : type === "imageBox" ? 640 : 360;
  return {
    id: createId(),
    type,
    page,
    x: CONTENT_LEFT,
    y,
    width,
    height: type.includes("Table") ? 280 : type === "imageBox" ? 260 : type === "heading" ? 56 : 140,
    content: type === "heading" ? "新标题" : type === "text" ? "在这里编辑文本" : type === "features" ? "新的产品特点" : type === "imageBox" ? "图片" : "",
    fontSize: type === "heading" ? 28 : 15,
    table: type === "orderingTable" ? cloneTable(state.ordering, width) : type === "specsTable" ? specsToTable(state.specs || []) : undefined,
  };
};

export default function ModulesTab() {
  const { state, setState, setStatusText, selectedCanvasId, setSelectedCanvasId } = useAppContext();
  const canvasElements = useMemo(
    () => (state.canvasElements?.length ? state.canvasElements : createDefaultCanvasElements(state)),
    [state]
  );
  const sortedElements = [...canvasElements].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const selectedElement = canvasElements.find((item) => item.id === selectedCanvasId) || null;

  const commitElements = (elements: CanvasElement[], message = "画布模块已同步") => {
    setState((prev) => ({ ...prev, canvasElements: elements }));
    setStatusText(message);
  };

  const updateElement = (id: string, patch: Partial<CanvasElement>) => {
    commitElements(canvasElements.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const focusCanvasElement = (id: string) => {
    requestAnimationFrame(() => {
      document.querySelector(`[data-canvas-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("canvas:update-selection-rect")), 360);
    });
  };

  const addElement = (type: CanvasElement["type"]) => {
    const activePage = selectedElement?.page ?? 0;
    const pageElements = canvasElements.filter((item) => item.page === activePage);
    const y = Math.min(1080, Math.max(CONTENT_TOP, ...pageElements.map((item) => item.y + item.height + 24)));
    const element = newCanvasElement(type, activePage, y, state);
    commitElements([...canvasElements, element], `已添加${moduleLabel[type]}`);
    setSelectedCanvasId(element.id);
    focusCanvasElement(element.id);
  };

  const selectElement = (id: string) => {
    setSelectedCanvasId(id);
    focusCanvasElement(id);
  };

  const duplicateElement = (element: CanvasElement) => {
    const copy = { ...structuredClone(element), id: createId(), x: element.x + 24, y: element.y + 24 };
    commitElements([...canvasElements, copy], "模块已复制");
    setSelectedCanvasId(copy.id);
    focusCanvasElement(copy.id);
  };

  const deleteElement = (id: string) => {
    commitElements(canvasElements.filter((item) => item.id !== id), "模块已删除");
    setSelectedCanvasId(null);
  };

  const updateNumber = (field: "page" | "x" | "y" | "width" | "height" | "fontSize", value: string) => {
    if (!selectedElement) return;
    const next = Number(value);
    if (Number.isNaN(next)) return;
    updateElement(selectedElement.id, { [field]: field === "page" ? Math.max(0, Math.round(next) - 1) : Math.max(0, next) });
  };

  const updateTableJson = (value: string) => {
    if (!selectedElement) return;
    try {
      const parsed = JSON.parse(value || "{}");
      if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.rows)) throw new Error("表格需要包含 columns 和 rows");
      updateElement(selectedElement.id, {
        table: {
          columns: parsed.columns,
          rows: parsed.rows,
          columnWidths: Array.isArray(parsed.columnWidths) ? parsed.columnWidths : undefined,
          rowHeights: Array.isArray(parsed.rowHeights) ? parsed.rowHeights : undefined,
        },
      });
    } catch (error) {
      setStatusText(`表格 JSON 错误：${error instanceof Error ? error.message : "格式无效"}`);
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-md border bg-background p-3">
        <div>
          <Label>添加画布模块</Label>
          <p className="mt-1 text-[11px] text-muted-foreground">添加到当前选中模块所在页面；没有选中时添加到第 1 页底部。</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(moduleLabel) as CanvasElement["type"][]).map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addElement(type)}>
              新增{moduleLabel[type]}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>画布模块列表</Label>
          <span className="text-[11px] text-muted-foreground">{sortedElements.length} 个模块</span>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {sortedElements.map((element) => (
            <button
              key={element.id}
              type="button"
              onClick={() => selectElement(element.id)}
              className={`w-full rounded-md border p-2 text-left text-xs hover:bg-muted ${selectedCanvasId === element.id ? "border-primary bg-muted" : "bg-background"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <strong>{moduleLabel[element.type]}</strong>
                <span className="text-muted-foreground">第 {element.page + 1} 页</span>
              </div>
              <div className="mt-1 truncate text-muted-foreground">{element.content || element.id}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-md border bg-background p-3">
        <div className="flex items-center justify-between gap-2">
          <Label>选中模块编辑</Label>
          {selectedElement && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => duplicateElement(selectedElement)}>
                复制
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => deleteElement(selectedElement.id)}>
                删除
              </Button>
            </div>
          )}
        </div>

        {!selectedElement ? (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">请选择画布上的模块，或从上方列表选择模块。</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>页码</Label>
                <Input type="number" min={1} value={selectedElement.page + 1} onChange={(event) => updateNumber("page", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>X</Label>
                <Input type="number" value={selectedElement.x} onChange={(event) => updateNumber("x", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Y</Label>
                <Input type="number" value={selectedElement.y} onChange={(event) => updateNumber("y", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>宽</Label>
                <Input type="number" value={selectedElement.width} onChange={(event) => updateNumber("width", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>高</Label>
                <Input type="number" value={selectedElement.height} onChange={(event) => updateNumber("height", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>字号</Label>
                <Input type="number" value={selectedElement.fontSize || 14} onChange={(event) => updateNumber("fontSize", event.target.value)} />
              </div>
            </div>

            {(selectedElement.type === "heading" || selectedElement.type === "text" || selectedElement.type === "imageBox") && (
              <div className="space-y-1">
                <Label>{selectedElement.type === "imageBox" ? "图片占位名称" : "文本内容"}</Label>
                <Textarea rows={4} value={selectedElement.content || ""} onChange={(event) => updateElement(selectedElement.id, { content: event.target.value })} />
              </div>
            )}

            {selectedElement.type === "features" && (
              <div className="space-y-1">
                <Label>产品特点，每行一条</Label>
                <Textarea rows={6} value={selectedElement.content || ""} onChange={(event) => updateElement(selectedElement.id, { content: event.target.value })} />
              </div>
            )}

            {selectedElement.type.includes("Table") && (
              <div className="space-y-1">
                <Label>表格 JSON</Label>
                <Textarea
                  key={selectedElement.id}
                  rows={9}
                  spellCheck={false}
                  className="font-mono text-xs"
                  defaultValue={JSON.stringify(selectedElement.table || { columns: [], rows: [] }, null, 2)}
                  onBlur={(event) => updateTableJson(event.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">规格表和订购表仍会优先同步“内容”页签里的核心数据；这里主要用于独立表格或调整宽高。</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
