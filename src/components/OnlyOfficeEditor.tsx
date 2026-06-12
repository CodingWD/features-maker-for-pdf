"use client";

import { useEffect, useRef, useState } from "react";
import "./preview-styles.css";

type OnlyOfficePayload = {
  configured: boolean;
  documentServerUrl: string;
  scriptUrl: string;
  config: Record<string, unknown>;
};

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (placeholderId: string, config: Record<string, unknown>) => unknown;
    };
  }
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

export default function OnlyOfficeEditor() {
  const editorRef = useRef<unknown>(null);
  const [payload, setPayload] = useState<OnlyOfficePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const response = await fetch("/api/onlyoffice/config", { cache: "no-store" });
        const nextPayload = (await response.json()) as OnlyOfficePayload;
        if (cancelled) return;
        setPayload(nextPayload);

        if (!nextPayload.configured) return;
        await loadScript(nextPayload.scriptUrl);
        if (cancelled) return;
        if (!window.DocsAPI) throw new Error("ONLYOFFICE DocsAPI 不可用");
        editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", nextPayload.config);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "ONLYOFFICE 初始化失败");
      }
    };

    init();
    return () => {
      cancelled = true;
      editorRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="onlyoffice-placeholder">
        <h2>ONLYOFFICE 加载失败</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="onlyoffice-placeholder">
        <h2>正在加载文档编辑器</h2>
        <p>正在准备文档编辑环境...</p>
      </div>
    );
  }

  if (!payload.configured) {
    return (
      <div className="onlyoffice-placeholder">
        <div className="onlyoffice-page-mock">
          <div className="onlyoffice-page-header">
            <img src="/logo.svg" alt="Logo" />
            <span>规格书</span>
          </div>
          <h1>ONLYOFFICE 文档编辑器</h1>
          <p>右侧区域已准备好嵌入类 Word 编辑器。</p>
          <table>
            <tbody>
              <tr><th>功能</th><th>状态</th></tr>
              <tr><td>DOCX 模板接口</td><td>已就绪</td></tr>
              <tr><td>页眉页脚</td><td>已就绪</td></tr>
              <tr><td>ONLYOFFICE 文档服务</td><td>未配置</td></tr>
            </tbody>
          </table>
          <div className="onlyoffice-page-footer">Shenzhen Yanxiang Technology Co., Limited · Ver. 1.0</div>
        </div>
        <div className="onlyoffice-config-note">
          <h2>配置文档服务地址</h2>
          <p>添加下面的环境变量，然后重启 Next.js：</p>
          <code>NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080</code>
          <p>如果 ONLYOFFICE 跑在 Docker 中，还需要设置它能访问当前应用的公开地址：</p>
          <code>NEXT_PUBLIC_APP_PUBLIC_URL=http://host.docker.internal:3001</code>
        </div>
      </div>
    );
  }

  return <div id="onlyoffice-editor" className="onlyoffice-editor" />;
}
