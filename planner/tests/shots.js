/* Screenshots for visual review on phone and desktop, light and dark.
   Usage: node planner/tests/shots.js [path/to/board-shelf-planner.html]
   Needs Playwright (require('playwright')). Writes PNGs to planner/tests/out/ (git-ignored).
   Fails (exit 1) on page errors or horizontal scroll on a phone, and on a phone also when:
   a text input or select is under 16 px (browsers zoom on focus), a control is under 44 px high,
   or tapping a design does not leave its detail just under the sticky jump bar. */
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
    if(w<600){
      // Open every collapsible so controls inside them are measured too.
      await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
      const small=await p.evaluate(()=>{const r=[];const vis=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0;};
        for(const e of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea'))
          if(vis(e)&&parseFloat(getComputedStyle(e).fontSize)<16)r.push(`font ${getComputedStyle(e).fontSize}: ${e.id||e.className||e.tagName}`);
        for(const e of document.querySelectorAll('button,.chip,select,input:not([type=checkbox]):not([type=radio]):not([type=range]),summary,.jump a'))
          if(vis(e)&&e.getBoundingClientRect().height<44)r.push(`height ${Math.round(e.getBoundingClientRect().height)}: ${e.tagName.toLowerCase()} ${e.id||e.className} "${(e.textContent||e.placeholder||'').trim().slice(0,30)}"`);
        return [...new Set(r)];});
      if(small.length){bad++;console.log(`FAIL ${nm}/${scheme}: ${small.length} small control(s)`,small.slice(0,8));}
      await p.goto('file://'+file); await p.waitForTimeout(1500);
    }
    const card=await p.$('.card[data-id]'); if(card){await card.click();
      // Wait for the (smooth) scroll to settle, then check where the detail landed.
      let last=-1;for(let i=0;i<30;i++){await p.waitForTimeout(150);const y=await p.evaluate(()=>scrollY);if(y===last)break;last=y;}
      if(w<600){const top=await p.evaluate(()=>{const j=document.querySelector('.jump').getBoundingClientRect().bottom;return [Math.round(document.getElementById('detail').getBoundingClientRect().top),Math.round(j)];});
        if(top[0]<top[1]||top[0]>top[1]+40){bad++;console.log(`FAIL ${nm}/${scheme}: after tapping a design its detail is at ${top[0]} px (jump bar ends at ${top[1]} px)`);}}}
    const det=await p.$('#detail'); if(det){await det.scrollIntoViewIfNeeded(); await p.screenshot({path:path.join(out,`${nm}-${scheme}-detail.png`)});}
    await p.screenshot({path:path.join(out,`${nm}-${scheme}-full.png`),fullPage:true});
    if(errs.length){bad++;console.log(`FAIL ${nm}/${scheme}: page errors`,errs.slice(0,3));}
    console.log(`${nm}/${scheme}: scrollWidth ${sw}, errors ${errs.length}`); await p.close();
  }
  await b.close(); console.log(bad?`${bad} failure(s)`:'shots OK, see planner/tests/out/'); process.exit(bad?1:0);
})();
