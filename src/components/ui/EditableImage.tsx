"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import { ImageObject } from "@/lib/types";

interface EditableImageProps {
  imageState: ImageObject | string | any;
  path: string;
  className?: string;
  fallbackText?: string;
  onUpdate: (path: string, newState: any) => void;
}

export default function EditableImage({ imageState, path, className = "", fallbackText = "图片", onUpdate }: EditableImageProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [moveableTarget, setMoveableTarget] = useState<HTMLDivElement | null>(null);

  const setImageTarget = useCallback((node: HTMLDivElement | null) => {
    targetRef.current = node;
    setMoveableTarget(node);
  }, []);
  
  // Normalize state
  const imgObj: ImageObject = typeof imageState === "string" ? {
    src: imageState,
    caption: "",
    layers: [{ src: imageState, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 }],
    activeLayer: 0,
    background: "transparent",
    border: false,
    boxWidth: "",
    boxHeight: ""
  } : (imageState || {
    src: "",
    caption: "",
    layers: [],
    activeLayer: 0,
    background: "transparent",
    border: false,
    boxWidth: "",
    boxHeight: ""
  });

  const activeLayer = imgObj.layers?.[imgObj.activeLayer] || { src: imgObj.src, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateLayer = (updates: any) => {
    const newLayers = [...(imgObj.layers || [])];
    if (newLayers.length === 0) {
      newLayers.push({ src: imgObj.src, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0, ...updates });
    } else {
      newLayers[imgObj.activeLayer || 0] = { ...newLayers[imgObj.activeLayer || 0], ...updates };
    }
    onUpdate(path, { ...imgObj, layers: newLayers });
  };

  const handleBackgroundChange = (color: string) => {
    onUpdate(path, { ...imgObj, background: color });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`} 
      style={{ 
        background: imgObj.background,
        border: imgObj.border ? "1px solid #24272c" : "none",
        ...(imgObj.boxWidth ? { width: imgObj.boxWidth } : {}),
        ...(imgObj.boxHeight ? { height: imgObj.boxHeight } : {}),
      }}
      onClick={() => setIsSelected(true)}
    >
      {/* 悬浮工具栏 */}
      {isSelected && (
        <div className="absolute top-0 left-0 -translate-y-full flex items-center gap-1 bg-zinc-800 text-white p-1 rounded-md shadow-lg z-50 mb-1 text-xs whitespace-nowrap">
          <button className="px-2 py-1 hover:bg-zinc-700 rounded" onClick={(e) => { e.stopPropagation(); handleUpdateLayer({ fit: "contain" }); }}>完整</button>
          <button className="px-2 py-1 hover:bg-zinc-700 rounded" onClick={(e) => { e.stopPropagation(); handleUpdateLayer({ fit: "cover" }); }}>填满</button>
          <button className="px-2 py-1 hover:bg-zinc-700 rounded" onClick={(e) => { e.stopPropagation(); handleUpdateLayer({ scale: (activeLayer.scale || 1) + 0.1 }); }}>放大</button>
          <button className="px-2 py-1 hover:bg-zinc-700 rounded" onClick={(e) => { e.stopPropagation(); handleUpdateLayer({ scale: Math.max(0.1, (activeLayer.scale || 1) - 0.1) }); }}>缩小</button>
          <label className="flex items-center gap-1 px-2 py-1 hover:bg-zinc-700 rounded cursor-pointer">
            底色
            <input type="color" className="w-4 h-4 p-0 border-0" value={imgObj.background || "#ffffff"} onChange={(e) => handleBackgroundChange(e.target.value)} />
          </label>
          
          {(imgObj.layers && imgObj.layers.length > 1) && (
            <>
              <div className="w-px h-4 bg-zinc-600 mx-1"></div>
              <button 
                className="px-2 py-1 hover:bg-zinc-700 rounded disabled:opacity-50" 
                disabled={(imgObj.activeLayer || 0) === 0}
                onClick={(e) => { e.stopPropagation(); onUpdate(path, { ...imgObj, activeLayer: (imgObj.activeLayer || 0) - 1 }); }}
              >
                上一张
              </button>
              <span className="text-[10px] text-zinc-400">{(imgObj.activeLayer || 0) + 1}/{imgObj.layers.length}</span>
              <button 
                className="px-2 py-1 hover:bg-zinc-700 rounded disabled:opacity-50" 
                disabled={(imgObj.activeLayer || 0) >= imgObj.layers.length - 1}
                onClick={(e) => { e.stopPropagation(); onUpdate(path, { ...imgObj, activeLayer: (imgObj.activeLayer || 0) + 1 }); }}
              >
                下一张
              </button>
            </>
          )}
        </div>
      )}

      {/* 图片容器 */}
      <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
        {(activeLayer.src || imgObj.src) ? (
          <div 
            ref={setImageTarget}
            className="absolute"
            style={{
              width: "100%",
              height: "100%",
              transform: `translate(${activeLayer.x || 0}px, ${activeLayer.y || 0}px) scale(${activeLayer.scale || 1}) rotate(${activeLayer.rotate || 0}deg)`
            }}
          >
            <img 
              src={activeLayer.src || imgObj.src} 
              alt="" 
              draggable={false}
              className="w-full h-full pointer-events-none" 
              style={{ objectFit: activeLayer.fit as any || "contain" }}
            />
          </div>
        ) : (
          <div className="text-muted-foreground border-2 border-dashed flex items-center justify-center w-full h-full">
            {fallbackText}
          </div>
        )}
      </div>

      {isSelected && (activeLayer.src || imgObj.src) && (
        <Moveable
          target={moveableTarget}
          draggable={true}
          resizable={false}
          rotatable={true}
          snappable={true}
          onDrag={e => {
            e.target.style.transform = e.transform;
          }}
          onDragEnd={e => {
            const transform = e.target.style.transform;
            // Extract translate x/y
            const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
            if (match) {
              handleUpdateLayer({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
            }
          }}
          onRotate={e => {
            e.target.style.transform = e.transform;
          }}
          onRotateEnd={e => {
             const transform = e.target.style.transform;
             const match = transform.match(/rotate\(([-\d.]+)deg\)/);
             if (match) {
               handleUpdateLayer({ rotate: parseFloat(match[1]) });
             }
          }}
        />
      )}
    </div>
  );
}
