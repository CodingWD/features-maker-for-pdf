"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/components/StoreProvider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const stripJsonWrapper = (value: string) => {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const normalizeOrdering = (parsed: any) => {
  const candidate = Array.isArray(parsed) ? parsed[0] : parsed;
  if (candidate?.ordering?.columns && candidate?.ordering?.rows) {
    return candidate.ordering;
  }
  if (candidate?.columns && candidate?.rows) {
    return {
      columns: candidate.columns,
      rows: candidate.rows,
    };
  }
  throw new Error("订购信息需要包含 columns 和 rows");
};

const normalizeSpecs = (parsed: any) => {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.specs)) return parsed.specs;
  throw new Error("规格信息需要是数组，或包含 specs 数组");
};

export default function ContentTab() {
  const { state, updateField, setStatusText } = useAppContext();
  const [featuresDraft, setFeaturesDraft] = useState("");
  const [specsDraft, setSpecsDraft] = useState("");
  const [orderingDraft, setOrderingDraft] = useState("");

  useEffect(() => {
    setFeaturesDraft((state.features || []).join("\n"));
    setSpecsDraft(JSON.stringify(state.specs || [], null, 2));
    setOrderingDraft(JSON.stringify(state.ordering || { columns: [], rows: [] }, null, 2));
  }, [state.features, state.specs, state.ordering]);

  const handleFeaturesChange = (value: string) => {
    setFeaturesDraft(value);
    updateField("features", value.split("\n").filter(Boolean));
  };

  const handleJsonChange = (field: "specs" | "ordering", value: string) => {
    try {
      const parsed = JSON.parse(stripJsonWrapper(value || (field === "specs" ? "[]" : "{}")));
      updateField(field, field === "specs" ? normalizeSpecs(parsed) : normalizeOrdering(parsed));
      setStatusText("已同步");
    } catch (error: any) {
      setStatusText(`JSON 格式错误：${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="featuresInput">产品特性，每行一条</Label>
        <Textarea 
          id="featuresInput" 
          rows={8}
          value={featuresDraft}
          onChange={(e) => handleFeaturesChange(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">右侧预览区域内的标题、特性、表格单元格和页脚都可以直接点击编辑，并支持上方富文本按钮。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specsInput">规格信息 JSON</Label>
        <Textarea 
          id="specsInput" 
          rows={12}
          spellCheck={false}
          className="font-mono text-xs"
          value={specsDraft}
          onChange={(e) => {
            setSpecsDraft(e.target.value);
            handleJsonChange("specs", e.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderingInput">订购信息 JSON</Label>
        <Textarea 
          id="orderingInput" 
          rows={9}
          spellCheck={false}
          className="font-mono text-xs"
          value={orderingDraft}
          onChange={(e) => {
            setOrderingDraft(e.target.value);
            handleJsonChange("ordering", e.target.value);
          }}
        />
      </div>
    </div>
  );
}
