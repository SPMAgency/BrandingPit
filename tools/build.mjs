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
const body = [dataJs, ...man.order.map(f => read(f.file).replace(/\n$/, ''))].join('\n');

const tpl = read('src/index.html');
if (!tpl.includes('/*@@SCRIPT@@*/')) throw new Error('src/index.html lost its /*@@SCRIPT@@*/ marker');
const html = tpl.replace('/*@@SCRIPT@@*/', () => body);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html: ${man.order.length} files, ${(html.length / 1024).toFixed(1)} KB`);
