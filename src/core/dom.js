/* src/core/dom.js — owner: Engineering. Page elements, canvas context, theme colours. */
const $=id=>document.getElementById(id);
const stage=$('stage'), cv=$('pit'), ctx=cv.getContext('2d');
const css=getComputedStyle(document.documentElement);
const C={};['pit','stone','stone-hi','line','ink','muted','sigil','ember','you','foe','mana'].forEach(k=>C[k]=css.getPropertyValue('--'+k).trim());
const FONT=css.getPropertyValue('--body').trim(), MONO=css.getPropertyValue('--mono').trim();
const DMGC={phys:'#ffae5c',magic:'#8fb2ff',true:'#ffffff',heal:'#6fe38f'};
