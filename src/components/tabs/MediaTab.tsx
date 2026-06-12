"use client";

import { useAppContext } from "@/components/StoreProvider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MediaTab() {
  const { state, updateField, setStatusText } = useAppContext();

  const handleImageUpload = (event: any, key: "hero" | "dimension" | "interface") => {
    const target = event.target;
    const files = Array.from(target.files);
    if (!files.length) return;
    
    const newLayers: any[] = [];
    let pending = files.length;
    
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        newLayers.push({ src: reader.result as string, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 });
        pending -= 1;
        if (pending === 0) {
          const currentImage = typeof state.images[key] === 'object' && !Array.isArray(state.images[key]) ? state.images[key] : {};
          
          if (files.length === 1) {
            updateField("images", {
              ...state.images,
              [key]: {
                ...currentImage,
                src: newLayers[0].src,
                layers: newLayers,
                activeLayer: 0
              }
            });
          } else {
            const newImageObjects = newLayers.map(layer => ({
              src: layer.src,
              caption: "",
              layers: [layer],
              activeLayer: 0,
              background: "transparent",
              border: false,
              boxWidth: "",
              boxHeight: ""
            }));
            updateField("images", {
              ...state.images,
              [key]: newImageObjects
            });
          }
          
          setStatusText(`已上传 ${files.length} 张图片`);
          if (target) target.value = "";
        }
      };
      reader.onerror = () => {
        pending -= 1;
        setStatusText("部分图片读取失败");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGalleryUpload = (event: any) => {
    const target = event.target;
    const files = Array.from(target.files);
    if (!files.length) return;
    const newImages: any[] = [];
    let pending = files.length;
    
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          src: reader.result,
          caption: file.name.replace(/\.[^.]+$/, ""),
          layers: [{ src: reader.result, fit: "contain", scale: 1, x: 0, y: 0, rotate: 0 }],
          activeLayer: 0,
          background: "#ffffff",
          border: true,
          boxWidth: "",
          boxHeight: ""
        });
        pending -= 1;
        if (pending === 0) {
          const galleryIndex = state.customModules.findIndex(m => m.type === "imageGallery");
          const newModules = [...state.customModules];
          if (galleryIndex === -1) {
            newModules.push({ type: "imageGallery", title: "Product Gallery 产品图片库", images: newImages } as any);
          } else {
            newModules[galleryIndex] = {
              ...newModules[galleryIndex],
              images: [...(newModules[galleryIndex].images || []), ...newImages]
            };
          }
          updateField("customModules", newModules);
          setStatusText(`已追加 ${files.length} 张图库图片`);
          if (target) target.value = "";
        }
      };
      reader.onerror = () => {
        pending -= 1;
        setStatusText("部分图片读取失败");
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="heroImage">产品主图 (支持多选)</Label>
        <Input id="heroImage" type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "hero")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dimensionImage">尺寸图 (支持多选)</Label>
        <Input id="dimensionImage" type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "dimension")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interfaceImage">接口图 (支持多选)</Label>
        <Input id="interfaceImage" type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "interface")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="galleryImages">追加产品图库，可多选</Label>
        <Input id="galleryImages" type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
        <p className="text-[11px] text-muted-foreground mt-2">未上传图片时会使用内置示意图。多选图库图片后，会自动新增或更新“产品图片库”模块。</p>
      </div>
    </div>
  );
}
