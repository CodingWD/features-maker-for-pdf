"use client";

import { useRef, type ChangeEvent } from "react";
import { useAppContext } from "@/components/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomModule, ImageObject } from "@/lib/types";

type ImageKey = "hero" | "dimension" | "interface";

const imageGroups: { key: ImageKey; label: string; hint: string }[] = [
  { key: "hero", label: "产品主图", hint: "用于首页产品展示，可保留多张备选图。" },
  { key: "dimension", label: "尺寸图", hint: "用于尺寸图页面，可多图管理。" },
  { key: "interface", label: "接口图", hint: "用于接口图页面，可多图管理。" },
];

const emptyImage = (caption = "产品图片"): ImageObject => ({
  src: "",
  caption,
  layers: [],
  activeLayer: 0,
  background: "#ffffff",
  border: true,
  boxWidth: "",
  boxHeight: "",
});

const fileToImage = (file: File): Promise<ImageObject> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        src: reader.result as string,
        caption: file.name.replace(/\.[^.]+$/, ""),
        layers: [{ src: reader.result as string, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 }],
        activeLayer: 0,
        background: "#ffffff",
        border: true,
        boxWidth: "",
        boxHeight: "",
      });
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

const normalizeImages = (value: ImageObject | ImageObject[] | string | undefined, fallback: string): ImageObject[] => {
  const hasImageSource = (image: ImageObject) => Boolean(image.src || image.layers?.some((layer) => layer.src));
  if (Array.isArray(value)) return value.filter(hasImageSource);
  if (typeof value === "string") return value ? [{ ...emptyImage(fallback), src: value, layers: [{ src: value, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 }] }] : [];
  if (value && hasImageSource(value)) return [value];
  return [];
};

function FilePickerButton({
  label,
  multiple = false,
  onChange,
  className = "h-10 w-full",
}: {
  label: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button type="button" variant="outline" className={className} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" tabIndex={-1} onChange={onChange} />
    </>
  );
}

export default function MediaTab() {
  const { state, updateField, setStatusText } = useAppContext();

  const updateImageGroup = (key: ImageKey, images: ImageObject[]) => {
    updateField("images", {
      ...state.images,
      [key]: images.length <= 1 ? (images[0] || emptyImage(imageGroups.find((group) => group.key === key)?.label)) : images,
    });
    setStatusText("图片已同步");
  };

  const getGroupImages = (key: ImageKey) =>
    normalizeImages(state.images?.[key], imageGroups.find((group) => group.key === key)?.label || "产品图片");

  const addImages = async (event: ChangeEvent<HTMLInputElement>, key: ImageKey) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      const nextImages = await Promise.all(files.map(fileToImage));
      updateImageGroup(key, [...getGroupImages(key), ...nextImages]);
      setStatusText(`已添加 ${files.length} 张图片`);
    } catch {
      setStatusText("部分图片读取失败");
    } finally {
      event.target.value = "";
    }
  };

  const replaceImage = async (event: ChangeEvent<HTMLInputElement>, key: ImageKey, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await fileToImage(file);
      const images = getGroupImages(key);
      images[index] = image;
      updateImageGroup(key, images);
      setStatusText("图片已替换");
    } catch {
      setStatusText("图片读取失败");
    } finally {
      event.target.value = "";
    }
  };

  const renameImage = (key: ImageKey, index: number, caption: string) => {
    const images = getGroupImages(key);
    images[index] = { ...images[index], caption };
    updateImageGroup(key, images);
  };

  const deleteImage = (key: ImageKey, index: number) => {
    updateImageGroup(key, getGroupImages(key).filter((_, imageIndex) => imageIndex !== index));
    setStatusText("图片已删除");
  };

  const galleryIndex = state.customModules.findIndex((module) => module.type === "imageGallery");
  const galleryModule = galleryIndex >= 0 ? state.customModules[galleryIndex] : null;
  const galleryImages = galleryModule?.images || [];

  const updateGallery = (images: ImageObject[]) => {
    const modules = [...state.customModules];
    if (galleryIndex >= 0) {
      modules[galleryIndex] = { ...modules[galleryIndex], images };
    } else {
      modules.push({ type: "imageGallery", title: "产品图片库", images } as CustomModule);
    }
    updateField("customModules", modules);
    setStatusText("产品图库已同步");
  };

  const addGalleryImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      updateGallery([...galleryImages, ...(await Promise.all(files.map(fileToImage)))]);
      setStatusText(`已追加 ${files.length} 张图库图片`);
    } catch {
      setStatusText("部分图库图片读取失败");
    } finally {
      event.target.value = "";
    }
  };

  const renameGalleryImage = (index: number, caption: string) => {
    const images = [...galleryImages];
    images[index] = { ...images[index], caption };
    updateGallery(images);
  };

  const replaceGalleryImage = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const images = [...galleryImages];
      images[index] = await fileToImage(file);
      updateGallery(images);
    } catch {
      setStatusText("图片读取失败");
    } finally {
      event.target.value = "";
    }
  };

  const deleteGalleryImage = (index: number) => {
    updateGallery(galleryImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const renderThumb = (
    image: ImageObject,
    actions: { onRename: (caption: string) => void; onDelete: () => void; onReplace: (event: ChangeEvent<HTMLInputElement>) => void },
    index: number
  ) => (
    <div key={index} className="rounded-md border bg-background p-2 space-y-2">
      <div className="aspect-[4/3] overflow-hidden rounded border bg-muted">
        {image.src ? (
          <img src={image.src} alt={image.caption || "产品图片"} className="h-full w-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">暂无图片</div>
        )}
      </div>
      <Input value={image.caption || ""} onChange={(event) => actions.onRename(event.target.value)} placeholder="图片名称" className="h-8 text-xs" />
      <div className="grid grid-cols-2 gap-2">
        <FilePickerButton label="替换" onChange={actions.onReplace} className="h-8 w-full text-xs" />
        <Button type="button" variant="outline" size="sm" onClick={actions.onDelete}>
          删除
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {imageGroups.map((group) => {
        const images = getGroupImages(group.key);
        return (
          <section key={group.key} className="space-y-3 rounded-md border bg-background p-3">
            <div className="space-y-1">
              <Label>{group.label}</Label>
              <p className="text-[11px] text-muted-foreground">{group.hint}</p>
            </div>
            <FilePickerButton label="添加图片" multiple onChange={(event) => addImages(event, group.key)} />
            {images.length ? (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) =>
                  renderThumb(
                    image,
                    {
                      onRename: (caption) => renameImage(group.key, index, caption),
                      onDelete: () => deleteImage(group.key, index),
                      onReplace: (event) => replaceImage(event, group.key, index),
                    },
                    index
                  )
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">暂无图片，上传后会显示缩略图。</p>
            )}
          </section>
        );
      })}

      <section className="space-y-3 rounded-md border bg-background p-3">
        <div className="space-y-1">
          <Label>产品图库</Label>
          <p className="text-[11px] text-muted-foreground">用于产品图片库模块，可批量追加，也可单张替换、命名、删除。</p>
        </div>
        <FilePickerButton label="添加图库图片" multiple onChange={addGalleryImages} />
        {galleryImages.length ? (
          <div className="grid grid-cols-2 gap-3">
            {galleryImages.map((image, index) =>
              renderThumb(
                image,
                {
                  onRename: (caption) => renameGalleryImage(index, caption),
                  onDelete: () => deleteGalleryImage(index),
                  onReplace: (event) => replaceGalleryImage(event, index),
                },
                index
              )
            )}
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">暂无图库图片。</p>
        )}
      </section>
    </div>
  );
}
