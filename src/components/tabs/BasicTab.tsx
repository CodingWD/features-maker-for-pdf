"use client";

import { useAppContext } from "@/components/StoreProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BasicTab() {
  const { state, updateField } = useAppContext();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productTitle">产品标题</Label>
        <Input 
          id="productTitle" 
          value={state.productTitle} 
          onChange={(e) => updateField("productTitle", e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyEn">英文公司名</Label>
        <Input 
          id="companyEn" 
          value={state.companyEn} 
          onChange={(e) => updateField("companyEn", e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyCn">中文公司名</Label>
        <Input 
          id="companyCn" 
          value={state.companyCn} 
          onChange={(e) => updateField("companyCn", e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="docDate">日期</Label>
          <Input 
            id="docDate" 
            value={state.docDate} 
            onChange={(e) => updateField("docDate", e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="docVersion">版本</Label>
          <Input 
            id="docVersion" 
            value={state.docVersion} 
            onChange={(e) => updateField("docVersion", e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sheetTitle">规格书标题</Label>
        <Input 
          id="sheetTitle" 
          value={state.sheetTitle} 
          onChange={(e) => updateField("sheetTitle", e.target.value)} 
        />
      </div>
    </div>
  );
}
