/* Smoke test: the planning logic must still produce the same catalogue after visual changes.
   Usage: node planner/tests/smoke.js [path/to/board-shelf-planner.html]   (exit 1 on failure) */
const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','board-shelf-planner.html');
const js=fs.readFileSync(file,'utf8').match(/<script id="logic">([\s\S]*?)<\/script>/)[1];
const m={exports:{}}; new Function('module',js)(m);
const {planAll}=m.exports;
const base={kerf:3,wallW:2400,maxH:2000,gap:300,minD:180,mat:'softwood',load:'books',ceil:2600,person:100,sf:5,sfb:'MBS'};
const example=[{name:'Pine board',x:2000,y:200,z:18,q:4},{name:'Pine board',x:2400,y:300,z:18,q:2},{name:'Shelf blank',x:1200,y:250,z:18,q:3},{name:'Lath',x:2000,y:45,z:18,q:2}];
let fail=0; const must=(c,msg)=>{if(!c){fail++;console.log('FAIL',msg);}};
for(const [nm,stock] of [['example',example],['empty',[]]]){
  const t0=Date.now(), P=planAll({...base,stock}), ms=Date.now()-t0, R=P.results;
  const own=R.filter(r=>r.mode!=='buy'), buy=R.filter(r=>r.mode==='buy'&&!r.pro), pro=R.filter(r=>r.pro);
  console.log(`${nm}: ${R.length} designs (${own.filter(r=>!r.none).length}/${own.length} own, ${buy.filter(r=>!r.none).length}/${buy.length} buy, ${pro.filter(r=>!r.none).length}/${pro.length} pro) in ${ms} ms`);
  must(R.length===222,`${nm}: expected 222 designs, got ${R.length}`);
  must(buy.filter(r=>!r.none).length===100,`${nm}: all 100 buy designs should plan`);
  must(pro.filter(r=>!r.none).length===49,`${nm}: all 49 pro designs should plan`);
  if(nm==='example') must(own.filter(r=>!r.none).length>=68,`example: at least 68 own-board designs should fit`);
  R.filter(r=>!r.none).forEach(r=>must(isFinite(r.area)&&r.boxes.every(b=>Object.values(b.bb).every(isFinite)),`${nm}/${r.id}: non-finite geometry`));
}
console.log(fail?`${fail} failure(s)`:'smoke OK'); process.exit(fail?1:0);
