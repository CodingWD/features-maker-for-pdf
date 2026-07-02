"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import type { CanvasElement } from "@/lib/types";

export type CanvasTableData = {
  columns: string[];
  rows: string[][];
  columnWidths?: number[];
  rowHeights?: number[];
};

type CanvasTableBlockProps = {
  element: CanvasElement;
  table: CanvasTableData;
  style: CSSProperties;
  canvasId?: string;
  rowOffset?: number;
  isSelected?: boolean;
  onSelect: () => void;
  onHeaderChange: (colIndex: number, value: string) => void;
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void;
  onColumnResizeStart: (event: ReactMouseEvent, colIndex: number) => void;
  onRowResizeStart: (event: ReactMouseEvent, rowIndex: number) => void;
};

export default function CanvasTableBlock({
  element,
  table,
  style,
  canvasId,
  rowOffset = 0,
  isSelected,
  onSelect,
  onHeaderChange,
  onCellChange,
  onColumnResizeStart,
  onRowResizeStart,
}: CanvasTableBlockProps) {
  const columnWidths = table.columnWidths || table.columns.map(() => 96);
  const estimateCellLines = (value: string, columnWidth: number) => {
    const charsPerLine = Math.max(4, Math.floor(columnWidth / 8));
    return (value || "")
      .split(/\n/)
      .reduce((total, line) => total + Math.max(1, Math.ceil(Array.from(line).length / charsPerLine)), 0);
  };
  const rowHeights = table.rows.map((row, rowIndex) => {
    const maxLines = Math.max(1, ...row.map((cell, colIndex) => estimateCellLines(cell || "", columnWidths[colIndex] || 96)));
    return Math.max(table.rowHeights?.[rowIndex] || 0, maxLines * 18 + 20, 36);
  });

  return (
    <div
      className="canvas-element canvas-table-wrap"
      data-canvas-id={canvasId || element.id}
      data-selected={isSelected ? "true" : undefined}
      style={style}
      onMouseDown={onSelect}
    >
      <table className="data-table canvas-table">
        <colgroup>
          {table.columns.map((_, colIndex) => (
            <col key={colIndex} style={{ width: columnWidths[colIndex] || 96 }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {table.columns.map((column, colIndex) => (
              <th
                key={colIndex}
                className="canvas-table-cell"
                contentEditable
                suppressContentEditableWarning
                onBlur={(event) => onHeaderChange(colIndex, event.currentTarget.innerText)}
              >
                {column}
                <span
                  className="canvas-col-resize-handle"
                  contentEditable={false}
                  onMouseDown={(event) => onColumnResizeStart(event, colIndex)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ height: rowHeights[rowIndex] || 36 }}>
              {table.columns.map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="canvas-table-cell"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => onCellChange(rowOffset + rowIndex, colIndex, event.currentTarget.innerText)}
                >
                  {row[colIndex] || ""}
                  {colIndex === 0 && (
                    <span
                      className="canvas-row-resize-handle"
                      contentEditable={false}
                      onMouseDown={(event) => onRowResizeStart(event, rowOffset + rowIndex)}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
