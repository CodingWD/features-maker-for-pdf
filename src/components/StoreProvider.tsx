"use client";

import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { DataSheetState, SAMPLE_DATA_EN, SAMPLE_DATA_ZH } from "@/lib/types";

interface AppContextType {
  lang: "en" | "zh";
  setLang: (lang: "en" | "zh") => void;
  loadTemplate: (lang: "en" | "zh", template: DataSheetState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  state: DataSheetState;
  setState: Dispatch<SetStateAction<DataSheetState>>;
  updateField: <K extends keyof DataSheetState>(field: K, value: DataSheetState[K]) => void;
  statusText: string;
  setStatusText: (text: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  currentDocumentId: number | null;
  setCurrentDocumentId: (id: number | null) => void;
  selectedCanvasId: string | null;
  setSelectedCanvasId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<"en" | "zh">("zh");
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [statusText, setStatusText] = useState("已同步");
  const [db, setDb] = useState<{ en: DataSheetState; zh: DataSheetState }>({
    en: SAMPLE_DATA_EN,
    zh: SAMPLE_DATA_ZH,
  });
  const [history, setHistory] = useState<{ past: DataSheetState[]; future: DataSheetState[] }>({
    past: [],
    future: [],
  });

  const state = db[lang];

  const setState: Dispatch<SetStateAction<DataSheetState>> = (action) => {
    const currentState = db[lang];
    const nextState = typeof action === "function" ? action(currentState) : action;
    setHistory((prevHistory) => ({
      past: [...prevHistory.past.slice(-49), structuredClone(currentState)],
      future: [],
    }));
    setDb((prevDb) => {
      return { ...prevDb, [lang]: nextState };
    });
    setIsDirty(true);
  };

  const setLang = (nextLang: "en" | "zh") => {
    setLangState(nextLang);
    setStatusText(nextLang === "en" ? "已选择英文模板" : "已选择中文模板");
  };

  const loadTemplate = (nextLang: "en" | "zh", template: DataSheetState) => {
    setHistory((prevHistory) => ({
      past: [...prevHistory.past.slice(-49), structuredClone(db[nextLang])],
      future: [],
    }));
    setDb((prevDb) => ({ ...prevDb, [nextLang]: template }));
    setLangState(nextLang);
    setIsDirty(true);
  };

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      const previous = prevHistory.past.at(-1);
      if (!previous) return prevHistory;
      setDb((prevDb) => ({
        ...prevDb,
        [lang]: structuredClone(previous),
      }));
      setIsDirty(true);
      setStatusText("已撤销");
      return {
        past: prevHistory.past.slice(0, -1),
        future: [structuredClone(db[lang]), ...prevHistory.future].slice(0, 50),
      };
    });
  }, [db, lang]);

  const redo = useCallback(() => {
    setHistory((prevHistory) => {
      const next = prevHistory.future[0];
      if (!next) return prevHistory;
      setDb((prevDb) => ({
        ...prevDb,
        [lang]: structuredClone(next),
      }));
      setIsDirty(true);
      setStatusText("已重做");
      return {
        past: [...prevHistory.past, structuredClone(db[lang])].slice(-50),
        future: prevHistory.future.slice(1),
      };
    });
  }, [db, lang]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA";

      if (isTextEditing) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  const updateField = <K extends keyof DataSheetState>(field: K, value: DataSheetState[K]) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        loadTemplate,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        state,
        setState,
        updateField,
        statusText,
        setStatusText,
        isDirty,
        setIsDirty,
        currentDocumentId,
        setCurrentDocumentId,
        selectedCanvasId,
        setSelectedCanvasId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
}
