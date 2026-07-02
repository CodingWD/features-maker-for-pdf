import { useAppContext } from "@/components/StoreProvider";
import EditableImage from "./ui/EditableImage";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableModule } from "./ui/SortableModule";
import { ContentEditable } from "./ui/ContentEditable";
import "./preview-styles.css";

type SpecPageGroup = {
  groupIndex: number;
  startRowIndex: number;
  item: string;
  rows: string[][];
};

const stripHtml = (value?: string) => (value || "").replace(/<[^>]*>/g, "").trim();

const hasRenderableModuleContent = (module: any) => {
  if (!module) return false;
  if (module.type === "richText") return Boolean(stripHtml(module.content));
  if (module.type === "keyValueTable") {
    return (Array.isArray(module.groups) ? module.groups : []).some((group: any) =>
      stripHtml(group?.item) || (Array.isArray(group?.rows) ? group.rows : []).some((row: any[]) =>
        (Array.isArray(row) ? row : []).some((cell) => stripHtml(cell))
      )
    );
  }
  if (module.type === "comparisonTable") {
    return (Array.isArray(module.columns) ? module.columns : []).some(stripHtml) ||
      (Array.isArray(module.rows) ? module.rows : []).some((row: any[]) =>
        (Array.isArray(row) ? row : []).some((cell) => stripHtml(cell))
      );
  }
  if (module.type === "imageGallery") {
    return (Array.isArray(module.images) ? module.images : []).some((image: any) =>
      Boolean(image?.src || image?.layers?.some((layer: any) => layer?.src))
    );
  }
  return false;
};

export default function SheetPreview() {
  const { state, setState, setStatusText } = useAppContext();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = parseInt(active.id);
      const newIndex = parseInt(over.id);
      const newModules = arrayMove(state.customModules || [], oldIndex, newIndex);
      setState(prev => ({ ...prev, customModules: newModules }));
    }
  };

  const handleModuleMove = (from: number, to: number) => {
    const newModules = arrayMove(state.customModules || [], from, to);
    setState(prev => ({ ...prev, customModules: newModules }));
  };

  const handleModuleDelete = (index: number) => {
    const newModules = [...(state.customModules || [])];
    newModules.splice(index, 1);
    setState(prev => ({ ...prev, customModules: newModules }));
  };

  const renderRich = (content?: string) => ({ __html: content || "" });

  const handleNestedInput = (path: string, html: string) => {
    const parts = path.split(".");
    setState((prevState: any) => {
      const newState = { ...prevState };
      let current = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (Array.isArray(current[part])) {
          current[part] = [...current[part]];
        } else {
          current[part] = { ...current[part] };
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = html;
      return newState;
    });
    setStatusText("富文本已同步");
  };

  const renderHeader = (isFirstPage = true) => (
    <header className="sheet-header">
      <div className="logo-mark flex items-center" aria-label="Company logo">
        <img src="/logo.svg" alt="Logo" className="w-[180px] h-auto object-contain" />
      </div>
      <div className="doc-title">
        <ContentEditable 
  tagName="span" 
  className="rich-editable" 
  onUpdate={(html) => handleNestedInput(isFirstPage ? "sheetTitle" : "productTitle", html)} 
  html={isFirstPage ? state.sheetTitle : state.productTitle}
/>
      </div>
    </header>
  );

  const renderFooter = () => (
    <footer className="sheet-footer">
      <div>
        <ContentEditable 
  tagName="div" 
  className="rich-editable" 
  onUpdate={(html) => handleNestedInput("companyEn", html)} 
  html={state.companyEn}
/>
        <ContentEditable 
  tagName="div" 
  className="footer-cn rich-editable" 
  onUpdate={(html) => handleNestedInput("companyCn", html)} 
  html={state.companyCn}
/>
      </div>
      <div className="footer-meta">
        <ContentEditable 
  tagName="div" 
  className="rich-editable" 
  onUpdate={(html) => handleNestedInput("docDate", html)} 
  html={state.docDate}
/>
        <ContentEditable 
  tagName="div" 
  className="rich-editable" 
  onUpdate={(html) => handleNestedInput("docVersion", html)} 
  html={state.docVersion}
/>
      </div>
    </footer>
  );

  const renderImageSlot = (imageState: any, path: string, baseClassName: string, fallbackText: string) => {
    if (Array.isArray(imageState)) {
      return (
        <div className={`image-gallery gallery-count-${Math.min(imageState.length, 4)} w-full`}>
          {imageState.map((img, idx) => (
            <div key={idx} className="gallery-item w-full">
              <EditableImage 
                className={`${baseClassName} w-full`}
                imageState={img}
                path={`${path}.${idx}`}
                onUpdate={handleNestedInput}
                fallbackText={`${fallbackText} ${idx + 1}`}
              />
              <div 
                className="gallery-caption rich-editable text-sm text-center text-muted-foreground mt-2"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleNestedInput(`${path}.${idx}.caption`, e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={renderRich(img.caption || "")}
                data-placeholder="在此输入图片注释..."
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 w-full h-full">
        <EditableImage 
          className={`${baseClassName} w-full h-full min-h-[200px]`}
          imageState={imageState} 
          path={path} 
          onUpdate={handleNestedInput} 
          fallbackText={fallbackText}
        />
        <div 
          className="gallery-caption rich-editable text-sm text-center text-muted-foreground"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleNestedInput(`${path}.caption`, e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={renderRich(imageState?.caption || "")}
          data-placeholder="在此输入图片注释..."
        />
      </div>
    );
  };
// 分页表格分页功能，正常的将表格分页成多页
  const splitSpecsForPages = () => {
    const specs = Array.isArray(state.specs) ? state.specs : [];
    const pages: SpecPageGroup[][] = [];
    let currentPage: SpecPageGroup[] = [];
    let rowsInPage = 0;
    let maxRows = 18;

    const pushPage = () => {
      if (!currentPage.length) return;
      pages.push(currentPage);
      currentPage = [];
      rowsInPage = 0;
      maxRows = 30;
    };

    specs.forEach((group, groupIndex) => {
      const rows = Array.isArray(group?.rows) ? group.rows : [];
      let startRowIndex = 0;

      while (startRowIndex < rows.length) {
        if (rowsInPage >= maxRows) pushPage();

        const remainingSlots = Math.max(maxRows - rowsInPage, 1);
        const pageRows = rows.slice(startRowIndex, startRowIndex + remainingSlots);

        currentPage.push({
          groupIndex,
          startRowIndex,
          item: group.item,
          rows: pageRows,
        });

        rowsInPage += pageRows.length;
        startRowIndex += pageRows.length;
      }
    });

    pushPage();
    return pages;
  };

  const renderSpecsTable = (pageGroups: SpecPageGroup[]) => (
    <table className="data-table">
      <thead>
        <tr><th>Item</th><th>Sub-Items</th><th>Descriptions</th></tr>
      </thead>
      <tbody>
        {pageGroups.map((group) => (
          group.rows.map((row, rIdx) => {
            const originalRowIndex = group.startRowIndex + rIdx;
            return (
              <tr key={`${group.groupIndex}-${originalRowIndex}`}>
                {rIdx === 0 && (
                  <td className="category-cell" rowSpan={group.rows.length}>
                    <div
                      className="rich-editable"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleNestedInput(`specs.${group.groupIndex}.item`, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={renderRich(group.startRowIndex > 0 ? `${group.item}<br/>续` : group.item)}
                    />
                  </td>
                )}
                <td className="sub-cell">
                  <div
                    className="rich-editable"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleNestedInput(`specs.${group.groupIndex}.rows.${originalRowIndex}.0`, e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={renderRich(row[0])}
                  />
                </td>
                <td>
                  <div
                    className="rich-editable"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleNestedInput(`specs.${group.groupIndex}.rows.${originalRowIndex}.1`, e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={renderRich(row[1])}
                  />
                </td>
              </tr>
            );
          })
        ))}
      </tbody>
    </table>
  );

  const specPages = splitSpecsForPages();
  const visibleModules = (Array.isArray(state.customModules) ? state.customModules : [])
    .map((module, index) => ({ module, index }))
    .filter(({ module }) => hasRenderableModuleContent(module));

  return (
    <div className="sheet-stack">
      {/* Page 1 */}
      <article className="sheet-page">
        <div className="sheet-content">
          {renderHeader(true)}
          <ContentEditable 
  tagName="h1" 
  className="product-heading rich-editable" 
  onUpdate={(html) => handleNestedInput("productTitle", html)} 
  html={state.productTitle}
/>
          <section className="hero-grid">
            {renderImageSlot(state.images?.hero, "images.hero", "hero-frame", "产品主图")}
            <div className="features">
              <h3>Features 产品特性</h3>
              <ul>
                {(Array.isArray(state.features) ? state.features : []).map((feature, i) => (
                  <li key={i}>
                    <span className="feature-check" aria-hidden="true"></span>
                    <span 
                      className="rich-editable" 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleNestedInput(`features.${i}`, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={renderRich(feature)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="section">
            <h3 className="section-title">Specifications 规格信息</h3>
            {renderSpecsTable(specPages[0] || [])}
          </section>
        </div>
        {renderFooter()}
      </article>

      {specPages.slice(1).map((pageGroups, pageIndex) => (
        <article className="sheet-page" key={`specs-continuation-${pageIndex}`}>
          <div className="sheet-content">
            {renderHeader(false)}
            <section className="section specs-continuation-section">
              <h3 className="section-title">Specifications 规格信息（续）</h3>
              {renderSpecsTable(pageGroups)}
            </section>
          </div>
          {renderFooter()}
        </article>
      ))}

      {/* Page 2 */}
      <article className="sheet-page second-page">
        <div className="sheet-content">
          {renderHeader(false)}

          <section className="section">
            <h3 className="section-title">Dimensions 尺寸</h3>
            <div className="relative w-full">
               <span className="unit-label absolute top-2 left-2 z-10">Unit: mm</span>
               {renderImageSlot(state.images?.dimension, "images.dimension", "image-frame drawing-frame", "尺寸图")}
            </div>
          </section>

          <section className="section">
            <h3 className="section-title">Interface 接口</h3>
            {renderImageSlot(state.images?.interface, "images.interface", "image-frame drawing-frame tall", "接口图")}
          </section>

          <section className="section">
            <h3 className="section-title">Ordering Information 订购信息</h3>
            <table className="data-table ordering-table">
              <thead>
                <tr>
                  {(Array.isArray(state.ordering?.columns) ? state.ordering.columns : []).map((col, i) => (
                    <th 
                      key={i} 
                      className="rich-editable" 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleNestedInput(`ordering.columns.${i}`, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={renderRich(col)} 
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(state.ordering?.rows) ? state.ordering.rows : []).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {(Array.isArray(row) ? row : []).map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className="rich-editable" 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleNestedInput(`ordering.rows.${rIdx}.${cIdx}`, e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={renderRich(cell)} 
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        {renderFooter()}
      </article>

      {/* Custom Modules */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleModules.map(({ index }) => index.toString())} strategy={verticalListSortingStrategy}>
          {visibleModules.map(({ module, index: mIdx }) => (
            <SortableModule 
              key={mIdx} 
              id={mIdx.toString()} 
              mIdx={mIdx} 
              onMove={handleModuleMove} 
              onDelete={handleModuleDelete} 
              totalModules={state.customModules.length}
            >
              <div className="sheet-content">
                {renderHeader(false)}
                <section className="section flex-1 mt-4">
                  <h3 
                    className="section-title rich-editable" 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleNestedInput(`customModules.${mIdx}.title`, e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={renderRich(module.title)}
                  />

                  {module.type === "richText" && (
                    <div 
                      className="rich-text-content rich-editable" 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleNestedInput(`customModules.${mIdx}.content`, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={renderRich(module.content || "")} 
                    />
                  )}

                  {module.type === "keyValueTable" && (
                    <table className="data-table">
                      <thead><tr><th>Item</th><th>Sub-Items</th><th>Descriptions</th></tr></thead>
                      <tbody>
                        {(Array.isArray(module.groups) ? module.groups : []).map((group: any, gIdx: number) => (
                          Array.isArray(group?.rows) ? group.rows.map((row: any, rIdx: number) => (
                            <tr key={`${gIdx}-${rIdx}`}>
                              {rIdx === 0 && (
                                <td className="category-cell" rowSpan={group.rows.length}>
                                  <div 
                                    className="rich-editable" 
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleNestedInput(`customModules.${mIdx}.groups.${gIdx}.item`, e.currentTarget.innerHTML)}
                                    dangerouslySetInnerHTML={renderRich(group.item)} 
                                  />
                                </td>
                              )}
                              <td className="sub-cell">
                                <div 
                                  className="rich-editable" 
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => handleNestedInput(`customModules.${mIdx}.groups.${gIdx}.rows.${rIdx}.0`, e.currentTarget.innerHTML)}
                                  dangerouslySetInnerHTML={renderRich(row[0])} 
                                />
                              </td>
                              <td>
                                <div 
                                  className="rich-editable" 
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => handleNestedInput(`customModules.${mIdx}.groups.${gIdx}.rows.${rIdx}.1`, e.currentTarget.innerHTML)}
                                  dangerouslySetInnerHTML={renderRich(row[1] || "")} 
                                />
                              </td>
                            </tr>
                          )) : null
                        ))}
                      </tbody>
                    </table>
                  )}

                  {module.type === "comparisonTable" && (
                    <table className="data-table module-comparison-table">
                      <thead>
                        <tr>
                          {(Array.isArray(module.columns) ? module.columns : []).map((col: string, cIdx: number) => (
                            <th
                              key={cIdx}
                              className="rich-editable"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleNestedInput(`customModules.${mIdx}.columns.${cIdx}`, e.currentTarget.innerHTML)}
                              dangerouslySetInnerHTML={renderRich(col)}
                            />
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(module.rows) ? module.rows : []).map((row: string[], rIdx: number) => (
                          <tr key={rIdx}>
                            {(Array.isArray(row) ? row : []).map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="rich-editable"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleNestedInput(`customModules.${mIdx}.rows.${rIdx}.${cIdx}`, e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={renderRich(cell || "")}
                              />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {module.type === "imageGallery" && (
                    <div className={`image-gallery gallery-count-${Math.min((module.images || []).length, 4)} mt-4`}>
                      {(Array.isArray(module.images) ? module.images : []).map((img: any, iIdx: number) => (
                        <div key={iIdx} className="gallery-item">
                          <EditableImage 
                            className="image-frame gallery-frame"
                            imageState={img} 
                            path={`customModules.${mIdx}.images.${iIdx}`} 
                            onUpdate={handleNestedInput} 
                            fallbackText="模块图片"
                          />
                          <div 
                            className="gallery-caption rich-editable"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleNestedInput(`customModules.${mIdx}.images.${iIdx}.caption`, e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={renderRich(img.caption)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                </section>
              </div>
              {renderFooter()}
            </SortableModule>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
