// Builds the Arena bench: one HTML file that runs the game's own src/render/camera.js, board.js and fx.js
// on stand-in fighters. Usage: node tests/arena/build.mjs [out.html]   (default tests/arena/bench.single.html)
// The game files share one scope (see docs/OWNERS.md "How the build works"), so the bench joins them the
// same way, after a small stand-in for the game globals they read.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..', '..');
const out = process.argv[2] || join(here, 'bench.single.html');
const timing = JSON.parse(readFileSync(join(root, 'src/data/move_timing.json'), 'utf8'));
const balance = JSON.parse(readFileSync(join(root, 'src/data/balance.json'), 'utf8'));

// Stand-ins for what src/core/* provides in the game. Values mirror src/core/constants.js, dom.js and util.js.
const preamble = `
const COLS=8, ROWS=12, GATE=6, BENCH=${balance.slots.bench};
const TAU=Math.PI*2, SQ3=Math.sqrt(3);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const stage=$('stage'), cv=$('pit'), ctx=cv.getContext('2d');
const C={pit:'#15111c',ink:'#f1e9dc',muted:'#a99db6',sigil:'#f2b84b',ember:'#e86a3a',you:'#56c27a',foe:'#e0524a',mana:'#4d8df0'};
const FONT='"Spline Sans",system-ui,sans-serif', MONO='"Spline Sans Mono",ui-monospace,monospace';
const rnd=(a,b)=>a+Math.random()*(b-a);
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
const S={round:1,phase:'raid'}; let drag=null;
const HITSTOP_MS=${(timing.impact && timing.impact.hitstopMs) || 60};
`;
const files = ['src/render/camera.js', 'src/render/board.js', 'src/render/fx.js'].map(f => `/* ===== ${f} ===== */\n` + readFileSync(join(root, f), 'utf8'));
const script = [preamble, ...files, readFileSync(join(here, 'bench.js'), 'utf8')].join('\n');
const html = readFileSync(join(here, 'index.html'), 'utf8').replace('<script src="bench.js"></script>', () => '<script>\n' + script + '\n</script>');
writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
