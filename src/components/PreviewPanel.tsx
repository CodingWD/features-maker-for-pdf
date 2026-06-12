"use client";

import CanvasPreview from "@/components/CanvasPreview";
import { useAppContext } from "@/components/StoreProvider";

export default function PreviewPanel({ className }: { className?: string }) {
  const { statusText } = useAppContext();

  return (
    <section className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-5 py-2 border-b bg-background print:hidden">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">画布</p>
        <span className="text-xs text-muted-foreground">{statusText}</span>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center overflow-y-auto print:p-0 print:overflow-visible">
        <CanvasPreview />
      </div>
    </section>
  );
}
