"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from "react";
import Moveable from "react-moveable";
import CanvasTableBlock from "@/components/canvas/CanvasTableBlock";
import { useAppContext } from "@/components/StoreProvider";
import type { CanvasElement, DataSheetState, ImageObject, OrderingTable, SpecRow } from "@/lib/types";
import "./preview-styles.css";

const CONTENT_LEFT = 50;
const CONTENT_TOP = 118;
const PAGE_SAFE_BOTTOM = 1210;
const TABLE_HEADER_HEIGHT = 36;

const createId = () => `canvas-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fitColumnWidths = (columns: string[], width = 860) => {
  const count = Math.max(columns.length, 1);
  const columnWidth = Math.max(54, Math.floor(width / count));
  return columns.map(() => columnWidth);
};

const normalizeColumnWidths = (columns: string[], widths: number[] | undefined, width = 860) => {
  const hasLegacyDefaults =
    widths?.length === columns.length &&
    widths.length > 0 &&
    widths.every((item) => Math.round(item) === 96) &&
    widths.reduce((total, item) => total + item, 0) > width;

  if (!widths || widths.length !== columns.length || hasLegacyDefaults) {
    return fitColumnWidths(columns, width);
  }

  return widths;
};

const normalizeRowHeights = (rows: string[][], heights: number[] | undefined, fallback = 44) =>
  !heights || heights.length !== rows.length ? rows.map(() => fallback) : heights;

const estimateCellLines = (value: string, columnWidth: number) => {
  const charsPerLine = Math.max(4, Math.floor(columnWidth / 8));
  return (value || "")
    .split(/\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(Array.from(line).length / charsPerLine)), 0);
};

const estimateRowHeights = (rows: string[][], columnWidths: number[], preferredHeights: number[] | undefined, fallback = 44) =>
  rows.map((row, rowIndex) => {
    const maxLines = Math.max(
      1,
      ...row.map((cell, colIndex) => estimateCellLines(cell || "", columnWidths[colIndex] || 96))
    );
    const naturalHeight = Math.max(fallback, maxLines * 18 + 20);
    return Math.max(preferredHeights?.[rowIndex] || 0, naturalHeight);
  });

const estimateHeaderHeight = (columns: string[], columnWidths: number[]) => {
  const maxLines = Math.max(
    1,
    ...columns.map((column, colIndex) => estimateCellLines(column || "", columnWidths[colIndex] || 96))
  );
  return Math.max(TABLE_HEADER_HEIGHT, maxLines * 18 + 20);
};

const getImageSrc = (image: DataSheetState["images"][keyof DataSheetState["images"]]) => {
  const getSrc = (item: ImageObject | string | undefined) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.layers?.[item.activeLayer || 0]?.src || item.src || "";
  };
  if (Array.isArray(image)) {
    return image.map((item) => getSrc(item)).find(Boolean) || "";
  }
  const item = image;
  if (!item) return "";
  if (typeof item === "string") return item;
  return getSrc(item);
};

type RenderedCanvasElement = CanvasElement & {
  renderId: string;
  sourceId: string;
  rowOffset?: number;
  isContinuation?: boolean;
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
    table: cloneTable(state.ordering, 860),
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
  const { state, setState, setStatusText, selectedCanvasId: selectedId, setSelectedCanvasId: setSelectedId } = useAppContext();
  const elements = useMemo(
    () => (state.canvasElements?.length ? state.canvasElements : defaultCanvasElements(state)),
    [state]
  );
  const [isTableResizing, setIsTableResizing] = useState(false);
  const moveableRef = useRef<Moveable | null>(null);
  const [moveableTarget, setMoveableTarget] = useState<HTMLElement | null>(null);
  const renderedElements = useMemo(() => {
    const buildTable = (element: CanvasElement) => {
      if (element.type === "orderingTable") {
        return { ...cloneTable(state.ordering, element.width), columnWidths: element.table?.columnWidths, rowHeights: element.table?.rowHeights };
      }
      if (element.type === "specsTable") {
        return { ...specsToTable(state.specs || []), columnWidths: element.table?.columnWidths, rowHeights: element.table?.rowHeights };
      }
      return element.table || { columns: [], rows: [] };
    };

    const output: RenderedCanvasElement[] = [];
    let insertedPages = 0;

    [...elements].sort((a, b) => a.page - b.page || a.y - b.y).forEach((element) => {
      const basePage = element.page + insertedPages;

      if (!element.type.includes("Table")) {
        output.push({ ...element, page: basePage, renderId: element.id, sourceId: element.id });
        return;
      }

      const table = buildTable(element);
      const columnWidths = normalizeColumnWidths(table.columns || [], table.columnWidths, element.width);
      const rows = table.rows || [];
      const rowHeights = estimateRowHeights(rows, columnWidths, table.rowHeights, element.type === "orderingTable" ? 44 : 36);
      const headerHeight = estimateHeaderHeight(table.columns || [], columnWidths);

      let page = basePage;
      let y = element.y;
      let rowStart = 0;
      let part = 0;

      while (rowStart < rows.length) {
        let available = PAGE_SAFE_BOTTOM - y;
        if (available < headerHeight + 28) {
          page += 1;
          insertedPages += 1;
          y = CONTENT_TOP;
          available = PAGE_SAFE_BOTTOM - y;
        }

        let used = headerHeight;
        let rowEnd = rowStart;
        while (rowEnd < rows.length && used + rowHeights[rowEnd] <= available) {
          used += rowHeights[rowEnd];
          rowEnd += 1;
        }
        if (rowEnd === rowStart) {
          used += rowHeights[rowEnd] || 36;
          rowEnd += 1;
        }

        output.push({
          ...element,
          page,
          y,
          height: Math.max(used + 12, headerHeight + 40),
          table: {
            columns: table.columns || [],
            rows: rows.slice(rowStart, rowEnd),
            columnWidths,
            rowHeights: rowHeights.slice(rowStart, rowEnd),
          },
          renderId: part === 0 ? element.id : `${element.id}__part_${part}`,
          sourceId: element.id,
          rowOffset: rowStart,
          isContinuation: part > 0,
        });

        rowStart = rowEnd;
        if (rowStart < rows.length) {
          page += 1;
          insertedPages += 1;
          y = CONTENT_TOP;
          part += 1;
        }
      }
    });

    return output;
  }, [elements, state.ordering, state.specs]);
  const selectedElement = useMemo(
    () => renderedElements.find((item) => item.renderId === selectedId) || null,
    [renderedElements, selectedId]
  );
  const moveableContainer = typeof document !== "undefined" ? document.body : null;

  const updateElements = (updater: (items: CanvasElement[]) => CanvasElement[]) => {
    setState((prev) => ({ ...prev, canvasElements: updater(prev.canvasElements || defaultCanvasElements(prev)) }));
  };

  const updateElement = (id: string, patch: Partial<CanvasElement>) => {
    updateElements((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    updateElements((items) => items.filter((item) => item.id !== selectedElement.sourceId));
    setSelectedId(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateMoveableRect = () => moveableRef.current?.updateRect();
    window.addEventListener("scroll", updateMoveableRect, true);
    window.addEventListener("resize", updateMoveableRect);
    window.addEventListener("canvas:update-selection-rect", updateMoveableRect);
    updateMoveableRect();
    return () => {
      window.removeEventListener("scroll", updateMoveableRect, true);
      window.removeEventListener("resize", updateMoveableRect);
      window.removeEventListener("canvas:update-selection-rect", updateMoveableRect);
    };
  }, [selectedId, renderedElements]);

  useEffect(() => {
    if (!selectedId) {
      setMoveableTarget(null);
      return;
    }

    let frame = 0;
    const updateTarget = () => {
      const nextTarget = document.querySelector<HTMLElement>(`[data-canvas-id="${selectedId}"]`);
      setMoveableTarget(nextTarget);
      requestAnimationFrame(() => moveableRef.current?.updateRect());
      window.setTimeout(() => moveableRef.current?.updateRect(), 120);
    };

    frame = requestAnimationFrame(updateTarget);
    return () => cancelAnimationFrame(frame);
  }, [selectedId, renderedElements]);

  const clearSelectionOnBlank = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".canvas-element") || target.closest(".moveable-control-box")) return;
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
    const currentWidths = normalizeColumnWidths(columns, element.table?.columnWidths, element.width);
    const columnWidths = currentWidths.map((item, index) => (index === colIndex ? Math.max(42, Math.round(width)) : item));

    updateElement(element.id, {
      table: {
        columns,
        rows,
        columnWidths,
        rowHeights: normalizeRowHeights(rows, element.table?.rowHeights, 36),
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
    const currentHeights = normalizeRowHeights(rows, element.table?.rowHeights, 36);
    const rowHeights = currentHeights.map((item, index) => (index === rowIndex ? Math.max(24, Math.round(height)) : item));

    updateElement(element.id, {
      table: {
        columns,
        rows,
        columnWidths: normalizeColumnWidths(columns, element.table?.columnWidths, element.width),
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
    const elementWidth = type.includes("Table") ? 720 : 320;
    const base: CanvasElement = {
      id: createId(),
      type,
      page,
      x: Math.max(CONTENT_LEFT, x),
      y: Math.max(CONTENT_TOP, y),
      width: elementWidth,
      height: type.includes("Table") ? 280 : 120,
      content: type === "heading" ? "新标题" : type === "text" ? "在这里编辑文本" : "",
      fontSize: type === "heading" ? 30 : 15,
      table:
        type === "orderingTable"
          ? cloneTable(state.ordering, elementWidth)
          : type === "specsTable"
            ? specsToTable(state.specs || [])
            : undefined,
    };
    updateElements((items) => [...items, base]);
    setSelectedId(base.id);
    setStatusText(`已添加${moduleLabel[type]}`);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, page: number) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/x-canvas-block") as CanvasElement["type"];
    if (!type) return;
    const pageRect = event.currentTarget.getBoundingClientRect();
    addElement(type, page, event.clientX - pageRect.left, event.clientY - pageRect.top);
  };

  useEffect(() => {
    const handleAddBlock = (event: Event) => {
      const type = (event as CustomEvent<CanvasElement["type"]>).detail;
      if (!type) return;

      const pages = Array.from(document.querySelectorAll<HTMLElement>(".canvas-page"));
      const viewportMiddle = window.innerHeight / 2;
      const visiblePage = pages.reduce(
        (best, page, index) => {
          const rect = page.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewportMiddle);
          return distance < best.distance ? { index, distance } : best;
        },
        { index: 0, distance: Number.POSITIVE_INFINITY }
      );

      const page = visiblePage.index;
      const pageElements = elements.filter((item) => item.page === page);
      const nextY = Math.min(
        PAGE_SAFE_BOTTOM - (type.includes("Table") ? 300 : 150),
        Math.max(CONTENT_TOP, ...pageElements.map((item) => item.y + item.height + 24))
      );
      addElement(type, page, CONTENT_LEFT, nextY);
    };

    window.addEventListener("canvas:add-block", handleAddBlock);
    return () => window.removeEventListener("canvas:add-block", handleAddBlock);
  }, [addElement, elements, state.ordering, state.specs]);

  const renderElement = (element: RenderedCanvasElement) => {
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
          data-canvas-id={element.renderId}
          data-selected={selectedId === element.renderId ? "true" : undefined}
          style={style}
          contentEditable
          suppressContentEditableWarning
          onMouseDown={() => setSelectedId(element.renderId)}
          onBlur={(event) => updateElement(element.id, { content: event.currentTarget.innerHTML })}
          dangerouslySetInnerHTML={{ __html: element.content || "" }}
        />
      );
    }

    if (element.type === "features") {
      return (
        <div
          className="canvas-element canvas-features"
          data-canvas-id={element.renderId}
          data-selected={selectedId === element.renderId ? "true" : undefined}
          style={style}
          onMouseDown={() => setSelectedId(element.renderId)}
        >
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
      const imageSrc =
        element.id === "default-hero-image"
          ? getImageSrc(state.images.hero)
          : element.id === "default-dimensions-image"
            ? getImageSrc(state.images.dimension)
            : element.id === "default-interface-image"
              ? getImageSrc(state.images.interface)
              : "";
      return (
        <div
          className="canvas-element canvas-image-box"
          data-canvas-id={element.renderId}
          data-selected={selectedId === element.renderId ? "true" : undefined}
          style={style}
          onPointerDownCapture={() => setSelectedId(element.renderId)}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={element.content || "产品图片"}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              onLoad={() => requestAnimationFrame(() => moveableRef.current?.updateRect())}
            />
          ) : (
            <span>{element.content || "Image"}</span>
          )}
        </div>
      );
    }

    return (
      <CanvasTableBlock
        element={element}
        table={element.table || { columns: [], rows: [] }}
        style={style}
        canvasId={element.renderId}
        rowOffset={element.rowOffset}
        isSelected={selectedId === element.renderId}
        onSelect={() => setSelectedId(element.renderId)}
        onHeaderChange={(colIndex, value) => updateTableHeader(element, colIndex, value)}
        onCellChange={(rowIndex, colIndex, value) => updateTableCell(element, rowIndex, colIndex, value)}
        onColumnResizeStart={(event, colIndex) => startColumnResize(event, element, colIndex)}
        onRowResizeStart={(event, rowIndex) => startRowResize(event, element, rowIndex)}
      />
    );
  };

  const pageCount = Math.max(2, ...renderedElements.map((item) => item.page + 1));

  return (
    <div className="canvas-stack" onMouseDown={clearSelectionOnBlank}>
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
          {renderedElements.filter((element) => element.page === page).map((element) => (
            <div key={element.renderId}>{renderElement(element)}</div>
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

      {moveableTarget && selectedElement && (
        <Moveable
          ref={moveableRef}
          key={selectedId}
          target={moveableTarget}
          container={moveableContainer}
          rootContainer={moveableContainer}
          useAccuratePosition
          draggable={!isTableResizing && !selectedElement?.isContinuation}
          resizable={!isTableResizing && !selectedElement?.isContinuation}
          keepRatio={false}
          throttleDrag={0}
          throttleResize={0}
          preventClickEventOnDrag
          renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
          onDrag={({ target: dragTarget, left, top }) => {
            dragTarget.style.left = `${left}px`;
            dragTarget.style.top = `${top}px`;
          }}
          onDragEnd={({ target: dragTarget }) => {
            if (!selectedElement) return;
            updateElement(selectedElement.sourceId, {
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
            if (!selectedElement) return;
            updateElement(selectedElement.sourceId, {
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
