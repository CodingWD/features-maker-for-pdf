"use client";

import { Bold, Italic, List, RemoveFormatting, Underline } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export default function RichToolbar() {
  const handleCommand = (command: string) => {
    document.execCommand(command, false);
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      <Select defaultValue="Arial" onValueChange={(value) => document.execCommand("fontName", false, value ?? undefined)}>
        <SelectTrigger className="h-8 w-[118px] bg-background text-xs">
          <SelectValue placeholder="字体" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Arial">Arial</SelectItem>
          <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
          <SelectItem value="SimSun">宋体</SelectItem>
          <SelectItem value="SimHei">黑体</SelectItem>
          <SelectItem value="Times New Roman">Times</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="3" onValueChange={(value) => document.execCommand("fontSize", false, value ?? undefined)}>
        <SelectTrigger className="h-8 w-[82px] bg-background text-xs">
          <SelectValue placeholder="字号" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">小号</SelectItem>
          <SelectItem value="3">正文</SelectItem>
          <SelectItem value="4">中号</SelectItem>
          <SelectItem value="5">大号</SelectItem>
          <SelectItem value="6">标题</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex h-8 cursor-pointer items-center gap-1 rounded-md border bg-background px-2 text-xs hover:bg-muted/50">
        颜色
        <input
          type="color"
          defaultValue="#111318"
          className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
          onChange={(event) => document.execCommand("foreColor", false, event.target.value)}
        />
      </label>

      <div className="mx-1 h-4 w-px bg-border" />

      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" onClick={() => handleCommand("bold")} title="加粗">
        <Bold className="h-4 w-4" />
      </button>
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" onClick={() => handleCommand("italic")} title="斜体">
        <Italic className="h-4 w-4" />
      </button>
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" onClick={() => handleCommand("underline")} title="下划线">
        <Underline className="h-4 w-4" />
      </button>
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" onClick={() => handleCommand("insertUnorderedList")} title="项目符号">
        <List className="h-4 w-4" />
      </button>
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" onClick={() => handleCommand("removeFormat")} title="清除格式">
        <RemoveFormatting className="h-4 w-4" />
      </button>
    </div>
  );
}
