"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableModuleProps {
  id: string;
  mIdx: number;
  children: React.ReactNode;
  onMove: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  totalModules: number;
}

export function SortableModule({ id, mIdx, children, onMove, onDelete, totalModules }: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <article 
      ref={setNodeRef} 
      style={style} 
      className={`sheet-page module-page relative group ${isDragging ? "shadow-2xl border-primary" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && !isDragging && (
        <div className="module-controls absolute top-2 right-2 flex items-center bg-zinc-800 text-white rounded-md shadow-lg overflow-hidden z-50 text-xs">
          <div {...attributes} {...listeners} className="px-3 py-2 bg-zinc-700 cursor-grab active:cursor-grabbing border-r border-zinc-600 hover:bg-zinc-600">
            :: 拖拽排序
          </div>
          <button 
            className="px-3 py-2 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border-r border-zinc-600"
            disabled={mIdx === 0}
            onClick={() => onMove(mIdx, mIdx - 1)}
          >
            上移
          </button>
          <button 
            className="px-3 py-2 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border-r border-zinc-600"
            disabled={mIdx === totalModules - 1}
            onClick={() => onMove(mIdx, mIdx + 1)}
          >
            下移
          </button>
          <button 
            className="px-3 py-2 hover:bg-red-600 transition-colors"
            onClick={() => {
              if (window.confirm("确定删除此模块吗？")) {
                onDelete(mIdx);
              }
            }}
          >
            删除
          </button>
        </div>
      )}
      
      {children}
    </article>
  );
}
