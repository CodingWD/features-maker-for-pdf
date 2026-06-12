const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/SheetPreview.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('ContentEditable')) {
  content = content.replace(
    'import EditableImage from "./ui/EditableImage";',
    'import EditableImage from "./ui/EditableImage";\nimport { ContentEditable } from "./ui/ContentEditable";'
  );
}

// Extract standard cases:
// <span 
//   className="..." 
//   contentEditable 
//   suppressContentEditableWarning
//   onInput={(e) => handleNestedInput("...", e.currentTarget.innerHTML)}
//   dangerouslySetInnerHTML={renderRich(...)}
// />

const regex = /<([a-z1-6]+)\s+([^>]*?)contentEditable\s+suppressContentEditableWarning\s+onInput={\(e\)\s*=>\s*([^}]+)e\.currentTarget\.innerHTML\)}\s+dangerouslySetInnerHTML={renderRich\(([^}]+)\)}\s*(?:placeholder="([^"]*)")?\s*\/>/g;

content = content.replace(regex, (match, tag, attrs, onInputPrefix, htmlArg, placeholderMatch) => {
  let placeholderAttr = placeholderMatch ? ` placeholder="${placeholderMatch}"` : '';
  
  return `<ContentEditable 
  tagName="${tag}" 
  ${attrs.trim()} 
  onUpdate={(html) => ${onInputPrefix.trim()} html)} 
  html={${htmlArg.trim()}}${placeholderAttr}
/>`;
});

content = content.replace(/\n\s*\n/g, '\n\n');

fs.writeFileSync(filePath, content);
console.log('Done!');
