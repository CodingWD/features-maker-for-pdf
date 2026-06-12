"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/components/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomModule, ImageObject, SpecRow } from "@/lib/types";

const createImage = (caption = "模块图片"): ImageObject => ({
  src: "",
  caption,
  layers: [],
  activeLayer: 0,
  background: "linear-gradient(180deg, #1296d8 0%, #d8f5ff 100%)",
  border: true,
  boxWidth: "",
  boxHeight: "",
});

const stripHtml = (value?: string) => (value || "").replace(/<[^>]*>/g, "").trim();

const stripJsonWrapper = (value: string) => {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const hasModuleContent = (module: CustomModule) => {
  if (module.type === "richText") return Boolean(stripHtml(module.content));
  if (module.type === "keyValueTable") {
    return (module.groups || []).some((group) =>
      stripHtml(group.item) || group.rows.some((row) => row.some((cell) => stripHtml(cell)))
    );
  }
  if (module.type === "comparisonTable") {
    return (module.columns || []).some(stripHtml) || (module.rows || []).some((row) => row.some((cell) => stripHtml(cell)));
  }
  if (module.type === "imageGallery") {
    return (module.images || []).some((image) => Boolean(image.src || image.layers?.length || stripHtml(image.caption)));
  }
  return false;
};

const moduleTypeLabel: Record<CustomModule["type"], string> = {
  richText: "富文本",
  keyValueTable: "属性表",
  comparisonTable: "对比表",
  imageGallery: "图片组",
};

export default function ModulesTab() {
  const { state, updateField, setStatusText } = useAppContext();
  const modules = Array.isArray(state.customModules) ? state.customModules : [];
  const [moduleJsonDraft, setModuleJsonDraft] = useState("");

  useEffect(() => {
    setModuleJsonDraft(JSON.stringify(modules, null, 2));
  }, [modules]);

  const setModules = (nextModules: CustomModule[]) => {
    updateField("customModules", nextModules);
    setStatusText("模块已同步");
  };

  const updateModule = (index: number, patch: Partial<CustomModule>) => {
    setModules(modules.map((module, moduleIndex) => (moduleIndex === index ? ({ ...module, ...patch } as CustomModule) : module)));
  };

  const deleteModule = (index: number) => {
    setModules(modules.filter((_, moduleIndex) => moduleIndex !== index));
  };

  const removeEmptyModules = () => {
    setModules(modules.filter(hasModuleContent));
  };

  const parseModuleJson = (value: string) => {
    const parsed = JSON.parse(stripJsonWrapper(value || "[]"));
    if (!Array.isArray(parsed)) throw new Error("模块 JSON 必须是数组");
    return parsed as CustomModule[];
  };

  const handleJsonChange = (value: string) => {
    setModuleJsonDraft(value);
    try {
      setModules(parseModuleJson(value));
    } catch (error: unknown) {
      setStatusText(`JSON 错误：${error instanceof Error ? error.message : "格式无效"}`);
    }
  };

  const addModule = (type: CustomModule["type"]) => {
    const newModule: CustomModule = {
      type,
      title: moduleTypeLabel[type],
      ...(type === "richText" ? { content: "在这里编辑模块内容。" } : {}),
      ...(type === "keyValueTable" ? { groups: [{ item: "分组", rows: [["子项", "说明"]] }] } : {}),
      ...(type === "comparisonTable" ? { columns: ["项目", "参数"], rows: [["示例", "说明"]] } : {}),
      ...(type === "imageGallery" ? { images: [createImage()] } : {}),
    };

    setModules([...modules, newModule]);
  };

  const updateGroupJson = (index: number, value: string) => {
    try {
      const groups = JSON.parse(stripJsonWrapper(value || "[]"));
      if (!Array.isArray(groups)) throw new Error("属性表 groups 必须是数组");
      updateModule(index, { groups: groups as SpecRow[] });
    } catch (error: unknown) {
      setStatusText(`JSON 错误：${error instanceof Error ? error.message : "格式无效"}`);
    }
  };

  const updateComparisonJson = (index: number, value: string) => {
    try {
      const parsed = JSON.parse(stripJsonWrapper(value || "{}"));
      if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.rows)) {
        throw new Error("对比表需要包含 columns 和 rows");
      }
      updateModule(index, { columns: parsed.columns, rows: parsed.rows });
    } catch (error: unknown) {
      setStatusText(`JSON 错误：${error instanceof Error ? error.message : "格式无效"}`);
    }
  };

  const updateImageCaption = (moduleIndex: number, imageIndex: number, caption: string) => {
    const moduleData = modules[moduleIndex];
    const images = [...(moduleData.images || [])];
    images[imageIndex] = { ...(images[imageIndex] || createImage()), caption };
    updateModule(moduleIndex, { images });
  };

  const addImageSlot = (moduleIndex: number) => {
    const moduleData = modules[moduleIndex];
    updateModule(moduleIndex, { images: [...(moduleData.images || []), createImage(`图片 ${((moduleData.images || []).length + 1)}`)] });
  };

  const deleteImageSlot = (moduleIndex: number, imageIndex: number) => {
    const moduleData = modules[moduleIndex];
    updateModule(moduleIndex, { images: (moduleData.images || []).filter((_, index) => index !== imageIndex) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => addModule("richText")}>新增文本模块</Button>
        <Button variant="outline" size="sm" onClick={() => addModule("imageGallery")}>新增图片模块</Button>
        <Button variant="outline" size="sm" onClick={() => addModule("keyValueTable")}>新增属性表</Button>
        <Button variant="outline" size="sm" onClick={() => addModule("comparisonTable")}>新增对比表</Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>模块管理</Label>
          <Button variant="outline" size="sm" onClick={removeEmptyModules} disabled={!modules.length}>
            清理空模块
          </Button>
        </div>

        {modules.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无扩展模块。</p>
        ) : (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={index} className="rounded-md border bg-background p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={module.title || ""}
                    onChange={(event) => updateModule(index, { title: event.target.value })}
                    placeholder="模块标题"
                    className="h-8"
                  />
                  <Button variant="outline" size="sm" onClick={() => deleteModule(index)}>
                    删除
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  模块 {index + 1} · {moduleTypeLabel[module.type]}
                </div>

                {module.type === "richText" && (
                  <div className="space-y-1">
                    <Label>文本内容</Label>
                    <Textarea
                      rows={5}
                      value={module.content || ""}
                      onChange={(event) => updateModule(index, { content: event.target.value })}
                      placeholder="填写模块内容"
                    />
                  </div>
                )}

                {module.type === "keyValueTable" && (
                  <div className="space-y-1">
                    <Label>属性表 groups JSON</Label>
                    <Textarea
                      key={`groups-${index}-${JSON.stringify(module.groups || [])}`}
                      rows={7}
                      spellCheck={false}
                      className="font-mono text-xs"
                      defaultValue={JSON.stringify(module.groups || [], null, 2)}
                      onBlur={(event) => updateGroupJson(index, event.target.value)}
                    />
                  </div>
                )}

                {module.type === "comparisonTable" && (
                  <div className="space-y-1">
                    <Label>对比表 JSON</Label>
                    <Textarea
                      key={`comparison-${index}-${JSON.stringify({ columns: module.columns || [], rows: module.rows || [] })}`}
                      rows={7}
                      spellCheck={false}
                      className="font-mono text-xs"
                      defaultValue={JSON.stringify({ columns: module.columns || [], rows: module.rows || [] }, null, 2)}
                      onBlur={(event) => updateComparisonJson(index, event.target.value)}
                    />
                  </div>
                )}

                {module.type === "imageGallery" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>图片说明</Label>
                      <Button variant="outline" size="sm" onClick={() => addImageSlot(index)}>
                        增加图片位
                      </Button>
                    </div>
                    {(module.images || []).map((image, imageIndex) => (
                      <div key={imageIndex} className="flex items-center gap-2">
                        <Input
                          value={image.caption || ""}
                          onChange={(event) => updateImageCaption(index, imageIndex, event.target.value)}
                          placeholder={`图片 ${imageIndex + 1} 说明`}
                        />
                        <Button variant="outline" size="sm" onClick={() => deleteImageSlot(index, imageIndex)}>
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="modulesInput">模块 JSON</Label>
        <Textarea
          id="modulesInput"
          rows={12}
          spellCheck={false}
          className="font-mono text-xs"
          value={moduleJsonDraft}
          onChange={(event) => handleJsonChange(event.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          JSON 合法时会立即同步；格式错误时会保留输入，修正后再同步。
        </p>
      </div>
    </div>
  );
}
