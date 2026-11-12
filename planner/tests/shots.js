/* Screenshots for visual review on phone and desktop, light and dark.
   Usage: node planner/tests/shots.js [path/to/board-shelf-planner.html]
   Needs Playwright (require('playwright')). Writes PNGs to planner/tests/out/ (git-ignored).
   Fails (exit 1) on page errors or horizontal scroll on a phone. */
const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const file=path.resolve(process.argv[2]||path.join(__dirname,'..','board-shelf-planner.html'));
const out=path.join(__dirname,'out'); fs.mkdirSync(out,{recursive:true});
const sizes=[['phone360',360,800,3],['phone412',412,915,2.625],['desktop',1280,900,1]];
(async()=>{
  const b=await chromium.launch(); let bad=0;
  for(const [nm,w,h,dpr] of sizes) for(const scheme of ['light','dark']){
    const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:dpr,isMobile:w<600,hasTouch:w<600,colorScheme:scheme});
    const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto('file://'+file); await p.waitForTimeout(2500);
    const sw=await p.evaluate(()=>document.documentElement.scrollWidth);
    if(w<600&&sw>w){bad++;console.log(`FAIL ${nm}/${scheme}: horizontal scroll (${sw} > ${w})`);}
    await p.screenshot({path:path.join(out,`${nm}-${scheme}-top.png`)});
    const card=await p.$('.card[data-id]'); if(card){await card.click(); await p.waitForTimeout(600);}
    const det=await p.$('#detail'); if(det){await det.scrollIntoViewIfNeeded(); await p.screenshot({path:path.join(out,`${nm}-${scheme}-detail.png`)});}
    await p.screenshot({path:path.join(out,`${nm}-${scheme}-full.png`),fullPage:true});
    if(errs.length){bad++;console.log(`FAIL ${nm}/${scheme}: page errors`,errs.slice(0,3));}
    console.log(`${nm}/${scheme}: scrollWidth ${sw}, errors ${errs.length}`); await p.close();
  }
  await b.close(); console.log(bad?`${bad} failure(s)`:'shots OK, see planner/tests/out/'); process.exit(bad?1:0);
})();
