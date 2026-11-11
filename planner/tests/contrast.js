/* Contrast check for the planner's colour tokens.
   Usage: node planner/tests/contrast.js [path/to/board-shelf-planner.html]
   Reads the light :root block and the :root[data-theme="dark"] block, prints WCAG ratios,
   exits with code 1 if any required pair is below its minimum. */
const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','board-shelf-planner.html');
const css=fs.readFileSync(file,'utf8');
const block=re=>{const m=css.match(re); if(!m) return {}; const o={}; for(const [,k,v] of m[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) o[k]=v; return o;};
const lightSrc=[...css.matchAll(/:root\{([^}]*)\}/g)].find(m=>m[1].includes('--bg'));
const light=lightSrc?block(new RegExp(':root\\{('+lightSrc[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\}')):{}, dark=block(/:root\[data-theme="dark"\]\{([^}]*)\}/);
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const pairs=[['ink','bg',7],['ink','panel',7],['muted','panel',4.5],['muted','bg',4.5],['accent','panel',4.5],['accent-ink','accent',4.5],['good','panel',4.5],['warn','panel',4.5],['line','panel',1.2]];
let bad=0;
for(const [nm,t] of [['light',light],['dark',dark]]){
  console.log(`-- ${nm}`);
  for(const [f,b,min] of pairs){ if(!t[f]||!t[b]){console.log(`  missing --${f} or --${b}`);bad++;continue;}
    const r=ratio(t[f],t[b]); const ok=r>=min; if(!ok) bad++; console.log(`  ${ok?'ok ':'LOW'} ${f} on ${b}: ${r.toFixed(2)} (min ${min})`);}
}
process.exit(bad?1:0);
