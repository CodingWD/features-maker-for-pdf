"use client";

import { AppProvider } from "@/components/StoreProvider";
import AppToolbar from "@/components/AppToolbar";
import EditorPanel from "@/components/EditorPanel";
import PreviewPanel from "@/components/PreviewPanel";

export default function Home() {
  return (
    <AppProvider>
      <main className="flex h-screen w-full flex-col bg-background overflow-hidden text-foreground print:h-auto print:overflow-visible">
        <AppToolbar />
        <div className="flex min-h-0 flex-1">
          <EditorPanel className="w-[450px] shrink-0 border-r bg-muted/20 print:hidden" />
          <PreviewPanel className="flex-1 bg-muted/10 overflow-y-auto print:overflow-visible" />
        </div>
      </main>
    </AppProvider>
  );
}
