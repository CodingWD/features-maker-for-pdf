"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/components/StoreProvider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HistoryTab() {
  const { state, setState, setStatusText, setIsDirty, currentDocumentId, setCurrentDocumentId } = useAppContext();
  const [documentTitle, setDocumentTitle] = useState(state.productTitle || "未命名规格书");
  const [documents, setDocuments] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [versionName, setVersionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVersions = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setStatusText("保存中...");
    try {
      const payload = { title: documentTitle || "未命名规格书", data: state };
      let res;
      if (currentDocumentId) {
        res = await fetch(`/api/documents/${currentDocumentId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setCurrentDocumentId(data.id);
      }
      setIsDirty(false);
      setStatusText("保存成功");
      fetchDocuments();
    } catch (err) {
      setStatusText("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    setStatusText("另存为新文档中...");
    try {
      const payload = { title: documentTitle || "未命名规格书", data: state };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setCurrentDocumentId(data.id);
      setIsDirty(false);
      setStatusText("另存为新文档成功");
      fetchDocuments();
      setVersions([]);
    } catch (err) {
      setStatusText("另存为新文档失败");
    }
  };

  const handleOpenDoc = async () => {
    if (!selectedDocId) return;
    setStatusText("加载中...");
    try {
      const res = await fetch(`/api/documents/${selectedDocId}`);
      const data = await res.json();
      setState(data.data);
      setDocumentTitle(data.title);
      setCurrentDocumentId(data.id);
      setIsDirty(false);
      setStatusText("文档加载成功");
      fetchVersions(data.id);
    } catch (err) {
      setStatusText("加载失败");
    }
  };

  const handleSaveVersion = async () => {
    if (!currentDocumentId) {
      setStatusText("请先保存文档，才能保存历史版本");
      return;
    }
    if (!versionName.trim()) {
      setStatusText("请输入版本名称");
      return;
    }
    setStatusText("保存版本中...");
    try {
      const payload = { versionName, data: state };
      await fetch(`/api/documents/${currentDocumentId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      setStatusText("版本保存成功");
      setVersionName("");
      fetchVersions(currentDocumentId);
    } catch (err) {
      setStatusText("版本保存失败");
    }
  };

  const handleOpenVersion = async () => {
    if (!selectedVersionId) return;
    setStatusText("加载版本中...");
    try {
      const res = await fetch(`/api/versions/${selectedVersionId}`);
      const data = await res.json();
      setState(data.data);
      setIsDirty(false);
      setStatusText("版本加载成功");
    } catch (err) {
      setStatusText("版本加载失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="documentTitle">文档名称</Label>
        <Input 
          id="documentTitle" 
          value={documentTitle} 
          onChange={(e) => setDocumentTitle(e.target.value)} 
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">{isSaving ? "保存中..." : "保存当前"}</Button>
        <Button variant="secondary" onClick={handleSaveAsNew} className="flex-1">另存为新文档</Button>
        <Button variant="outline" onClick={fetchDocuments} className="flex-1">刷新历史</Button>
      </div>

      <div className="space-y-2">
        <Label>历史规格书</Label>
        <select 
          className="w-full border rounded-md p-2 bg-background h-32" 
          size={6}
          onChange={(e) => setSelectedDocId(Number(e.target.value))}
          value={selectedDocId || ""}
        >
          {documents.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.title} ({new Date(doc.updatedAt).toLocaleString()})</option>
          ))}
        </select>
        <Button variant="secondary" className="w-full" onClick={handleOpenDoc} disabled={!selectedDocId}>打开选中文档</Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="versionName">版本名称</Label>
        <Input 
          id="versionName" 
          placeholder="例如：客户A确认版"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
        />
        <Button variant="secondary" onClick={handleSaveVersion} className="w-full">保存为历史版本</Button>
      </div>

      <div className="space-y-2">
        <Label>当前文档版本</Label>
        <select 
          className="w-full border rounded-md p-2 bg-background h-24" 
          size={5}
          onChange={(e) => setSelectedVersionId(Number(e.target.value))}
          value={selectedVersionId || ""}
        >
          {versions.map(v => (
            <option key={v.id} value={v.id}>{v.versionName} ({new Date(v.createdAt).toLocaleString()})</option>
          ))}
        </select>
        <Button variant="secondary" className="w-full" onClick={handleOpenVersion} disabled={!selectedVersionId}>打开选中版本</Button>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2">保存会记录当前所有编辑状态，包括图片缩放、位置、背景和扩展模块。</p>
    </div>
  );
}
