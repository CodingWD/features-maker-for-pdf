const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/SheetPreview.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex2 = /<(div|span|h1|h3|th|td)\s+className="([^"]*rich-editable[^"]*)"\s+contentEditable\s+suppressContentEditableWarning\s+onInput={\(e\)\s*=>\s*([^}]+)e\.currentTarget\.innerHTML\)}\s+dangerouslySetInnerHTML={renderRich\(([^}]+)\)}\s*(?:placeholder="([^"]*)")?\s*\/>/g;

content = content.replace(regex2, (match, tag, className, onInputPrefix, htmlArg, placeholderMatch) => {
  let placeholderAttr = placeholderMatch ? ` placeholder="${placeholderMatch}"` : '';
  return `<ContentEditable 
  tagName="${tag}" 
  className="${className}" 
  onUpdate={(html) => ${onInputPrefix.trim()} html)} 
  html={${htmlArg.trim()}}${placeholderAttr}
/>`;
});

content = content.replace(/\n\s*\n/g, '\n\n');

fs.writeFileSync(filePath, content);
console.log('Done 2!');
