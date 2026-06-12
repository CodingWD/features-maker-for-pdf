"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicTab from "./tabs/BasicTab";
import ContentTab from "./tabs/ContentTab";
import MediaTab from "./tabs/MediaTab";
import ModulesTab from "./tabs/ModulesTab";
import HistoryTab from "./tabs/HistoryTab";
import CanvasBlockPalette from "./CanvasBlockPalette";
import { useAppContext } from "./StoreProvider";
import { SAMPLE_DATA_EN, SAMPLE_DATA_ZH } from "@/lib/types";

export default function EditorPanel({ className }: { className?: string }) {
  const { lang, loadTemplate, setCurrentDocumentId, setStatusText } = useAppContext();

  const applyTemplate = (nextLang: "zh" | "en") => {
    loadTemplate(nextLang, structuredClone(nextLang === "en" ? SAMPLE_DATA_EN : SAMPLE_DATA_ZH));
    setCurrentDocumentId(null);
    setStatusText(nextLang === "en" ? "已加载英文模板" : "已加载中文模板");
  };

  return (
    <aside className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">模板</p>
          <h2 className="text-lg font-bold tracking-tight">模板与模块</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => applyTemplate("zh")}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${lang === "zh" ? "border-primary bg-background text-primary" : "bg-background text-muted-foreground hover:text-foreground"}`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => applyTemplate("en")}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${lang === "en" ? "border-primary bg-background text-primary" : "bg-background text-muted-foreground hover:text-foreground"}`}
          >
            英文
          </button>
        </div>

        <CanvasBlockPalette />
      </div>

      <Tabs defaultValue="basic" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 pt-2 border-b">
          <TabsList className="w-full justify-start h-10 bg-transparent p-0">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-10 px-3">基础</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-10 px-3">内容</TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-10 px-3">图片</TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-10 px-3">模块</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-10 px-3">历史</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="basic" className="m-0 h-full"><BasicTab /></TabsContent>
          <TabsContent value="content" className="m-0 h-full"><ContentTab /></TabsContent>
          <TabsContent value="media" className="m-0 h-full"><MediaTab /></TabsContent>
          <TabsContent value="modules" className="m-0 h-full"><ModulesTab /></TabsContent>
          <TabsContent value="history" className="m-0 h-full"><HistoryTab /></TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
