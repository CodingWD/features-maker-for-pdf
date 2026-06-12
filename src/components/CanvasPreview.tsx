"use client";

import { useMemo, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from "react";
import Moveable from "react-moveable";
import CanvasTableBlock from "@/components/canvas/CanvasTableBlock";
import { useAppContext } from "@/components/StoreProvider";
import type { CanvasElement, DataSheetState, OrderingTable, SpecRow } from "@/lib/types";
import "./preview-styles.css";

const CONTENT_LEFT = 50;
const CONTENT_TOP = 118;

const createId = () => `canvas-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const cloneTable = (table: OrderingTable) => ({
  columns: [...(table?.columns || [])],
  rows: (table?.rows || []).map((row) => [...row]),
  columnWidths: (table?.columns || []).map(() => 96),
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

const defaultCanvasElements = (state: DataSheetState): CanvasElement[] => [
  {
    id: "default-heading",
    type: "heading",
    page: 0,
    x: CONTENT_LEFT,
    y: 138,
    width: 640,
    height: 72,
    content: state.productTitle || "Product Title",
    fontSize: 42,
  },
  {
    id: "default-features",
    type: "features",
    page: 0,
    x: 520,
    y: 250,
    width: 360,
    height: 360,
    content: (state.features || []).join("\n"),
    fontSize: 16,
  },
  {
    id: "default-hero-image",
    type: "imageBox",
    page: 0,
    x: CONTENT_LEFT,
    y: 250,
    width: 400,
    height: 300,
    content: "产品图片",
  },
  {
    id: "default-specs-heading",
    type: "heading",
    page: 0,
    x: CONTENT_LEFT,
    y: 594,
    width: 860,
    height: 42,
    content: "规格信息",
    fontSize: 24,
  },
  {
    id: "default-specs-table",
    type: "specsTable",
    page: 0,
    x: CONTENT_LEFT,
    y: 650,
    width: 860,
    height: 510,
    table: specsToTable(state.specs || []),
  },
  {
    id: "default-dimensions-heading",
    type: "heading",
    page: 1,
    x: CONTENT_LEFT,
    y: 140,
    width: 860,
    height: 42,
    content: "尺寸图",
    fontSize: 24,
  },
  {
    id: "default-dimensions-image",
    type: "imageBox",
    page: 1,
    x: CONTENT_LEFT,
    y: 200,
    width: 860,
    height: 310,
    content: "尺寸图片",
  },
  {
    id: "default-interface-heading",
    type: "heading",
    page: 1,
    x: CONTENT_LEFT,
    y: 540,
    width: 860,
    height: 42,
    content: "接口图",
    fontSize: 24,
  },
  {
    id: "default-interface-image",
    type: "imageBox",
    page: 1,
    x: CONTENT_LEFT,
    y: 600,
    width: 860,
    height: 280,
    content: "接口图片",
  },
  {
    id: "default-ordering-heading",
    type: "heading",
    page: 2,
    x: CONTENT_LEFT,
    y: 140,
    width: 860,
    height: 42,
    content: "订购信息",
    fontSize: 24,
  },
  {
    id: "default-ordering-table",
    type: "orderingTable",
    page: 2,
    x: CONTENT_LEFT,
    y: 206,
    width: 860,
    height: 780,
    table: cloneTable(state.ordering),
  },
];

const moduleLabel: Record<CanvasElement["type"], string> = {
  heading: "标题",
  text: "文本框",
  features: "产品特点",
  specsTable: "规格表",
  orderingTable: "订购表",
  imageBox: "图片框",
};

export default function CanvasPreview() {
  const { state, setState, setStatusText } = useAppContext();
  const elements = useMemo(
    () => (state.canvasElements?.length ? state.canvasElements : defaultCanvasElements(state)),
    [state]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTableResizing, setIsTableResizing] = useState(false);
  const target =
    typeof document !== "undefined" && selectedId
      ? document.querySelector<HTMLElement>(`[data-canvas-id="${selectedId}"]`)
      : null;

  const updateElements = (updater: (items: CanvasElement[]) => CanvasElement[]) => {
    setState((prev) => ({ ...prev, canvasElements: updater(prev.canvasElements || defaultCanvasElements(prev)) }));
  };

  const updateElement = (id: string, patch: Partial<CanvasElement>) => {
    updateElements((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    updateElements((items) => items.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const updateTableCell = (element: CanvasElement, rowIndex: number, colIndex: number, value: string) => {
    if (element.type === "orderingTable") {
      setState((prev) => {
        const rows = prev.ordering.rows.map((row, rIdx) =>
          rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell)) : row
        );
        return {
          ...prev,
          ordering: { ...prev.ordering, rows },
          canvasElements: (prev.canvasElements || []).map((item) =>
            item.id === element.id ? { ...item, table: { columns: prev.ordering.columns, rows } } : item
          ),
        };
      });
      return;
    }

    updateElement(element.id, {
      table: {
        columns: element.table?.columns || [],
        rows: (element.table?.rows || []).map((row, rIdx) =>
          rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell)) : row
        ),
      },
    });
  };

  const updateTableHeader = (element: CanvasElement, colIndex: number, value: string) => {
    if (element.type === "orderingTable") {
      setState((prev) => {
        const columns = prev.ordering.columns.map((cell, cIdx) => (cIdx === colIndex ? value : cell));
        return {
          ...prev,
          ordering: { ...prev.ordering, columns },
          canvasElements: (prev.canvasElements || []).map((item) =>
            item.id === element.id ? { ...item, table: { columns, rows: prev.ordering.rows } } : item
          ),
        };
      });
      return;
    }

    updateElement(element.id, {
      table: {
        columns: (element.table?.columns || []).map((cell, cIdx) => (cIdx === colIndex ? value : cell)),
        rows: element.table?.rows || [],
      },
    });
  };

  const updateTableColumnWidth = (element: CanvasElement, colIndex: number, width: number) => {
    const columns =
      element.type === "orderingTable"
        ? state.ordering.columns
        : element.type === "specsTable"
          ? specsToTable(state.specs || []).columns
          : element.table?.columns || [];
    const rows =
      element.type === "orderingTable"
        ? state.ordering.rows
        : element.type === "specsTable"
          ? specsToTable(state.specs || []).rows
          : element.table?.rows || [];
    const currentWidths = element.table?.columnWidths || columns.map(() => 96);
    const columnWidths = currentWidths.map((item, index) => (index === colIndex ? Math.max(42, Math.round(width)) : item));

    updateElement(element.id, {
      table: {
        columns,
        rows,
        columnWidths,
        rowHeights: element.table?.rowHeights || rows.map(() => 36),
      },
    });
  };

  const updateTableRowHeight = (element: CanvasElement, rowIndex: number, height: number) => {
    const columns =
      element.type === "orderingTable"
        ? state.ordering.columns
        : element.type === "specsTable"
          ? specsToTable(state.specs || []).columns
          : element.table?.columns || [];
    const rows =
      element.type === "orderingTable"
        ? state.ordering.rows
        : element.type === "specsTable"
          ? specsToTable(state.specs || []).rows
          : element.table?.rows || [];
    const currentHeights = element.table?.rowHeights || rows.map(() => 36);
    const rowHeights = currentHeights.map((item, index) => (index === rowIndex ? Math.max(24, Math.round(height)) : item));

    updateElement(element.id, {
      table: {
        columns,
        rows,
        columnWidths: element.table?.columnWidths || columns.map(() => 96),
        rowHeights,
      },
    });
  };

  const startColumnResize = (event: ReactMouseEvent, element: CanvasElement, colIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    setIsTableResizing(true);
    const startX = event.clientX;
    const currentWidth = element.table?.columnWidths?.[colIndex] ?? event.currentTarget.parentElement?.getBoundingClientRect().width ?? 96;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTableColumnWidth(element, colIndex, currentWidth + moveEvent.clientX - startX);
    };
    const handleMouseUp = () => {
      setIsTableResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const startRowResize = (event: ReactMouseEvent, element: CanvasElement, rowIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    setIsTableResizing(true);
    const startY = event.clientY;
    const currentHeight = element.table?.rowHeights?.[rowIndex] ?? event.currentTarget.parentElement?.getBoundingClientRect().height ?? 36;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTableRowHeight(element, rowIndex, currentHeight + moveEvent.clientY - startY);
    };
    const handleMouseUp = () => {
      setIsTableResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const addElement = (type: CanvasElement["type"], page: number, x: number, y: number) => {
    const base: CanvasElement = {
      id: createId(),
      type,
      page,
      x: Math.max(CONTENT_LEFT, x),
      y: Math.max(CONTENT_TOP, y),
      width: type.includes("Table") ? 720 : 320,
      height: type.includes("Table") ? 280 : 120,
      content: type === "heading" ? "新标题" : type === "text" ? "在这里编辑文本" : "",
      fontSize: type === "heading" ? 30 : 15,
      table:
        type === "orderingTable"
          ? cloneTable(state.ordering)
          : type === "specsTable"
            ? specsToTable(state.specs || [])
            : undefined,
    };
    updateElements((items) => [...items, base]);
    setSelectedId(base.id);
    setStatusText(`${moduleLabel[type]} added`);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, page: number) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/x-canvas-block") as CanvasElement["type"];
    if (!type) return;
    const pageRect = event.currentTarget.getBoundingClientRect();
    addElement(type, page, event.clientX - pageRect.left, event.clientY - pageRect.top);
  };

  const renderElement = (element: CanvasElement) => {
    const style = {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
    };

    if (element.type === "heading" || element.type === "text") {
      return (
        <div
          className={`canvas-element ${element.type === "heading" ? "canvas-heading" : "canvas-text"}`}
          data-canvas-id={element.id}
          style={style}
          contentEditable
          suppressContentEditableWarning
          onMouseDown={() => setSelectedId(element.id)}
          onBlur={(event) => updateElement(element.id, { content: event.currentTarget.innerHTML })}
          dangerouslySetInnerHTML={{ __html: element.content || "" }}
        />
      );
    }

    if (element.type === "features") {
      return (
        <div className="canvas-element canvas-features" data-canvas-id={element.id} style={style} onMouseDown={() => setSelectedId(element.id)}>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateElement(element.id, { content: event.currentTarget.innerText })}
          >
            {(element.content || "").split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      );
    }

    if (element.type === "imageBox") {
      return (
        <div className="canvas-element canvas-image-box" data-canvas-id={element.id} style={style} onMouseDown={() => setSelectedId(element.id)}>
          <span>{element.content || "Image"}</span>
        </div>
      );
    }

    const displayTable =
      element.type === "orderingTable"
        ? { ...cloneTable(state.ordering), columnWidths: element.table?.columnWidths, rowHeights: element.table?.rowHeights }
        : element.type === "specsTable"
          ? { ...specsToTable(state.specs || []), columnWidths: element.table?.columnWidths, rowHeights: element.table?.rowHeights }
          : element.table || { columns: [], rows: [] };

    return (
      <CanvasTableBlock
        element={element}
        table={displayTable}
        style={style}
        onSelect={() => setSelectedId(element.id)}
        onHeaderChange={(colIndex, value) => updateTableHeader(element, colIndex, value)}
        onCellChange={(rowIndex, colIndex, value) => updateTableCell(element, rowIndex, colIndex, value)}
        onColumnResizeStart={(event, colIndex) => startColumnResize(event, element, colIndex)}
        onRowResizeStart={(event, rowIndex) => startRowResize(event, element, rowIndex)}
      />
    );
  };

  const pageCount = Math.max(2, ...elements.map((item) => item.page + 1));

  return (
    <div className="canvas-stack" onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}>
      {Array.from({ length: pageCount }).map((_, page) => (
        <article
          key={page}
          className="sheet-page canvas-page"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, page)}
        >
          <header className="canvas-base-header">
            <img src="/logo.svg" alt="Logo" />
            <div>{page === 0 ? state.sheetTitle : state.productTitle}</div>
          </header>
          {elements.filter((element) => element.page === page).map((element) => (
            <div key={element.id}>{renderElement(element)}</div>
          ))}
          <footer className="sheet-footer canvas-base-footer">
            <div>
              <div>{state.companyEn}</div>
              <div className="footer-cn">{state.companyCn}</div>
            </div>
            <div className="footer-meta">
              <div>{state.docDate}</div>
              <div>{state.docVersion}</div>
            </div>
          </footer>
        </article>
      ))}

      {target && (
        <Moveable
          target={target}
          draggable={!isTableResizing}
          resizable={!isTableResizing}
          keepRatio={false}
          throttleDrag={0}
          throttleResize={0}
          renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
          onDrag={({ target: dragTarget, left, top }) => {
            dragTarget.style.left = `${left}px`;
            dragTarget.style.top = `${top}px`;
          }}
          onDragEnd={({ target: dragTarget }) => {
            if (!selectedId) return;
            updateElement(selectedId, {
              x: parseFloat(dragTarget.style.left || "0"),
              y: parseFloat(dragTarget.style.top || "0"),
            });
          }}
          onResize={({ target: resizeTarget, width, height, drag }) => {
            resizeTarget.style.width = `${width}px`;
            resizeTarget.style.height = `${height}px`;
            resizeTarget.style.left = `${drag.left}px`;
            resizeTarget.style.top = `${drag.top}px`;
          }}
          onResizeEnd={({ target: resizeTarget }) => {
            if (!selectedId) return;
            updateElement(selectedId, {
              x: parseFloat(resizeTarget.style.left || "0"),
              y: parseFloat(resizeTarget.style.top || "0"),
              width: parseFloat(resizeTarget.style.width || "0"),
              height: parseFloat(resizeTarget.style.height || "0"),
            });
          }}
        />
      )}

      {selectedId && (
        <div className="canvas-floating-actions print:hidden">
          <button type="button" onClick={deleteSelected}>删除选中元素</button>
        </div>
      )}
    </div>
  );
}
