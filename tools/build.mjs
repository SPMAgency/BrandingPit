// Owner: Engineering. Joins src/ into one self-contained HTML file: dist/index.html.
// No dependencies. Usage: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const man = JSON.parse(read('src/manifest.json'));
const data = {};
for (const name of man.data) {
  const obj = JSON.parse(read(`src/data/${name}.json`));
  delete obj._note;
  data[name] = obj;
}
// JSON is valid JS; escape "</" so no string can close the script tag.
const dataJs = 'const DATA=' + JSON.stringify(data).replace(/<\//g, '<\\/') + ';';
// A file marked "module": true is written as an ES module for its own tests; the
// build drops its import lines and the export keyword, so it joins the shared scope.
const asScript = src => src
  .replace(/^\s*import\s[^;]*;?\s*$/gm, '')
  .replace(/^(\s*)export\s+(default\s+)?(?=(async\s+)?(function|const|let|class)\b)/gm, '$1')
  .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
const body = [dataJs, ...man.order.map(f => {
  const src = read(f.file).replace(/\n$/, '');
  return f.module ? asScript(src) : src;
})].join('\n');

const tpl = read('src/index.html');
if (!tpl.includes('/*@@SCRIPT@@*/')) throw new Error('src/index.html lost its /*@@SCRIPT@@*/ marker');
const html = tpl.replace('/*@@SCRIPT@@*/', () => body);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html: ${man.order.length} files, ${(html.length / 1024).toFixed(1)} KB`);
