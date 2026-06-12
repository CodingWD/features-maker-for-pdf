"use client";

import RichToolbar from "@/components/ui/RichToolbar";
import { useAppContext } from "@/components/StoreProvider";
import { SAMPLE_DATA_EN, SAMPLE_DATA_ZH } from "@/lib/types";
import { useState } from "react";

export default function AppToolbar() {
  const { lang, state, setState, setStatusText, isDirty, setIsDirty, currentDocumentId, setCurrentDocumentId, undo, redo, canUndo, canRedo } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setStatusText("保存中...");
    try {
      const payload = { title: state.productTitle || "未命名规格书", data: state };
      const response = await fetch(currentDocumentId ? `/api/documents/${currentDocumentId}` : "/api/documents", {
        method: currentDocumentId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "保存失败");
      if (!currentDocumentId && result.id) setCurrentDocumentId(Number(result.id));
      setIsDirty(false);
      setStatusText("已保存");
    } catch (error) {
      setStatusText(error instanceof Error ? `保存失败：${error.message}` : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (isDirty && !window.confirm("当前有未保存修改，确定恢复示例模板吗？")) return;
    setState(structuredClone(lang === "en" ? SAMPLE_DATA_EN : SAMPLE_DATA_ZH));
    setCurrentDocumentId(null);
    setStatusText("已恢复示例");
  };

  const handleResetCanvas = () => {
    setState((prev) => ({ ...prev, canvasElements: undefined }));
    setStatusText("已恢复默认画布模块");
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.productTitle || "data-sheet"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusText("JSON 已下载");
  };

  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center gap-3 px-4 print:hidden">
      <div className="min-w-[220px]">
        <p className="text-xs font-semibold text-muted-foreground uppercase leading-none">规格书生成系统</p>
        <h1 className="text-sm font-bold leading-tight">画布编辑器</h1>
      </div>

      <div className="h-8 w-px bg-border" />
      <RichToolbar />
      <div className="ml-auto flex items-center gap-2">
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80 disabled:opacity-50" onClick={undo} disabled={!canUndo}>撤销</button>
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80 disabled:opacity-50" onClick={redo} disabled={!canRedo}>重做</button>
        <button className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-60" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : isDirty ? "保存 *" : "保存"}
        </button>
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80" onClick={() => window.print()}>打印 / PDF</button>
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80" onClick={handleResetCanvas}>恢复画布</button>
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80" onClick={handleReset}>恢复示例</button>
        <button className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80" onClick={handleDownloadJson}>下载 JSON</button>
      </div>
    </header>
  );
}
