"use client";

import { Label } from "@/components/ui/label";
import type { CanvasElement } from "@/lib/types";

const canvasBlocks: { type: CanvasElement["type"]; label: string }[] = [
  { type: "heading", label: "标题" },
  { type: "text", label: "文本框" },
  { type: "features", label: "产品特点" },
  { type: "specsTable", label: "规格表" },
  { type: "orderingTable", label: "订购表" },
  { type: "imageBox", label: "图片框" },
];

export default function CanvasBlockPalette() {
  return (
    <div className="space-y-2">
      <Label>画布模块</Label>
      <div className="grid grid-cols-2 gap-2">
        {canvasBlocks.map((block) => (
          <button
            key={block.type}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-canvas-block", block.type);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="rounded-md border bg-background px-3 py-2 text-left text-xs font-medium hover:border-primary hover:bg-muted"
          >
            {block.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">拖到右侧画布后，可选中移动、缩放或删除。</p>
    </div>
  );
}
