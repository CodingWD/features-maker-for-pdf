"use client";

import React, { useEffect, useRef } from "react";

interface ContentEditableProps extends Omit<React.HTMLAttributes<HTMLElement>, "onInput" | "children"> {
  html: string;
  onUpdate: (html: string) => void;
  tagName?: React.ElementType;
}

export const ContentEditable = React.memo(function ContentEditable({
  html,
  onUpdate,
  tagName: Tag = "div",
  className,
  ...props
}: ContentEditableProps) {
  const elRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || document.activeElement === el || el.innerHTML === html) return;
    el.innerHTML = html || "";
  }, [html]);

  return (
    <Tag
      ref={elRef}
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={() => {
        if (elRef.current) onUpdate(elRef.current.innerHTML);
      }}
      {...props}
    />
  );
});
