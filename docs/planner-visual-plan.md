# Board Shelf Planner: visual redesign plan (warm, calm, wood, Android-first)

This plan is written so that a smaller model can carry out **one phase at a time** without guessing.
Each phase lists the exact edits, the values to use, and how to prove it worked.
Do the phases in order. One phase = one commit (or one small PR).

## 0. Context you need

- **The page:** `planner/board-shelf-planner.html` is the source of the published artifact
  <https://claude.ai/artifact/6kGHSw7nGeqGrewKvPBERR> (title "Board Shelf Planner").
  It is one self-contained HTML file (~350 KB, ~3600 lines): CSS at the top, then the markup,
  then two scripts.
- **The two scripts:**
  - `<script id="logic">` holds all planning, engineering and geometry code (generators, `planAll`, `shopPlan`, rigging).
    **Do not edit anything inside it** except where a phase explicitly says so (none do).
  - The second `<script>` (starts with `/* ---------- state ---------- */`) holds the UI: `renderStock`,
    `initFields`, `run`, `renderScene`, `renderCuts`, `renderDetail`, `renderDetailBuy`, `rigHtml`, `manualHtml`.
    This is where the visual work happens, together with the CSS.
- **IDs the JavaScript depends on:** never rename or remove these (moving them is fine):
  `#stockTbl #addRow #togglePaste #pasteBox #pasteTxt #doReplace #doAppend #pasteMsg #exNote`
  `#f-mat #f-load #f-wallW #f-maxH #f-gap #f-minD #f-kerf #f-ceil #f-person #f-sf #f-sfb`
  `#summary #warns #srcChips #chips #f-q #f-sort #cards #detail #guide #guideBody #copyGuide #guideMsg`
  and, created inside the detail view: `#copyCuts #copyMsg #cutText #copyMan #printMan #openGuide #manMsg #copyShop #shopMsg #manual`.
- **Classes the JavaScript writes:** `.card .card.none .thumb .nm .pl .cat .nums .badge .jig .srcb .chip .ct`
  `.detail .dhead .tag .scene .tiles .tile .sec .secrow .cols .parts .shopt .manual .rig .warn .life .wow`.
  Style them; do not rename them.
- **Saved state:** `localStorage` key `board-shelf-planner-v1` (object `S`). Add new keys to `S` only when
  a phase says so; always guard `localStorage` with `try/catch`.

### Artifact rules (the page is published as a claude.ai Artifact; these are hard requirements)

1. Colours are CSS custom properties ("tokens") on `:root`. Dark values go in **both**
   `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…}}` **and** `:root[data-theme="dark"]{…}`,
   with identical values. `body` keeps an explicit background.
2. External resources: stylesheets only from Google Fonts; scripts only from cdnjs/jsdelivr/unpkg with exact
   versions (this plan needs **no** scripts). **No image files**: textures are inline SVG data URIs.
3. Phone width: 16 px side gutter, **no horizontal page scroll** at 360 px.
4. Total page ≤ 16 MB (we are at 0.35 MB; textures add < 2 KB).

### Tests (run before and after every phase)

```bash
node planner/tests/smoke.js        # logic unchanged: 222 designs, 100 buy + 49 pro plan, finite geometry
node planner/tests/contrast.js     # WCAG contrast of the colour tokens, light and dark (fails today on purpose)
node planner/tests/shots.js        # Playwright: 360/412 px phones + desktop, light/dark, PNGs in planner/tests/out/
```

`shots.js` needs Playwright (`require('playwright')`; in Claude Code cloud sessions it is preinstalled, do not
reinstall it). Look at the PNGs after each phase: `phone412-*-top.png`, `*-detail.png`, `*-full.png`.

### Publishing (after the final phase, or when the user asks)

Use the Artifact tool: first `action: "read"` with `url: https://claude.ai/artifact/6kGHSw7nGeqGrewKvPBERR`
(required before updating it from a new conversation), then `publish` with that same `url` and
`file_path: planner/board-shelf-planner.html`. Do not create a new artifact.

## 1. What is wrong today (baseline, phone 412 px)

1. Cold grey industrial look (grey `#E6E9EA` / near-black `#111517`, orange `#C94D1A`), uppercase condensed
   headings: the opposite of "calm and warm".
2. On a phone the long intro paragraph and the two input panels ("Your boards", "Room and load", ~1300 px)
   come before any design. You must scroll a long way to see a design.
3. The board table is cramped: names are cut off ("Pine boarc"), five inputs per row.
4. Ten-plus filter chips wrap into many lines; chips are ~30 px high (too small to tap reliably).
5. The design list is a horizontal carousel on phones: hard to browse 222 designs.
6. Every recalculation redraws up to 222 SVG thumbnails at once: slow on mid-range Android.
7. Tapping a card does not bring the detail into view on a phone.
8. The detail view is one very long page (scene, tiles, shopping list, rigging, parts, manual).
9. Odd empty tile in the tiles grid when the count is odd.

## 2. Design direction

**Mood:** a workshop on a quiet evening. Light mode is pale oak and warm paper; dark mode is walnut and lamplight.
Low contrast in the background, high contrast in the text. No pure white, no pure black, no grey-blue.

### 2.1 Colour tokens (contrast-checked: all pass `contrast.js`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#EFE6DA` | `#1D1712` | page base under the texture |
| `--panel` | `#FBF6EF` | `#28201A` | cards, panels, detail |
| `--panel-2` | `#F3EBE0` | `#30271F` | hover, inner wells, table stripes |
| `--ink` | `#2E261F` | `#EFE4D6` | text |
| `--muted` | `#6B5D4F` | `#B4A38F` | secondary text |
| `--line` | `#DDD0BF` | `#41352A` | borders |
| `--accent` | `#A0552A` | `#DB8C55` | links, selected, badges (terracotta / lamplight) |
| `--accent-ink` | `#FFF8F0` | `#231509` | text on accent |
| `--good` | `#47733F` | `#8EC284` | "from your boards", OK |
| `--warn` | `#8C5F1C` | `#DDAA5E` | warnings, jigsaw tags |
| `--wall` | `#EEE6DB` | `#2B231C` | 3D scene wall |
| `--floor` | `#D9C9B4` | `#231C16` | 3D scene floor |
| `--offcut` | `#F1E3CC` | `#3B3025` | cut plan offcuts |
| `--hatch` | `#A8957F` | `#7D6B58` | cut plan waste hatching |
| `--shadow` | `0 1px 2px rgba(60,40,20,.08), 0 6px 18px rgba(60,40,20,.08)` | `0 1px 2px rgba(0,0,0,.35), 0 8px 22px rgba(0,0,0,.30)` | panels, cards |
| `--radius` | `12px` | `12px` | panels, cards, detail |
| `--radius-s` | `8px` | `8px` | inputs, buttons, tiles |

Life-safety warning (`.warn.life`) keeps `--accent` for its border; normal `.warn` uses `--warn`.

### 2.2 Typography

Replace the Google Fonts `<link>` (line 5) with:

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

and set
`--f-display:'Lora',Georgia,serif; --f-body:'Nunito Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;` (keep `--f-mono`).
Headings lose `text-transform:uppercase`: `h1` 30–40 px weight 600, `h2` 20 px weight 600, `h3` 16 px weight 600
in `--muted`. Small labels that are uppercase mono today (`.tile .k`, `.fields label`, table `th`) stay mono but
drop to `letter-spacing:.04em` and `text-transform:none`. Card name `.card .nm`: Lora 16 px, weight 600, no uppercase.

### 2.3 Wood texture (generated, no image files)

Two layers on `body`: a fractal-noise **grain** stretched along x (horizontal boards) plus faint **plank seams**
every 160 px. Both are tokens so dark mode swaps them. These exact values were rendered and checked on a
412 px phone in both themes:

```css
/* light: pale oak */
--tex:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='320'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0035 0.11' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.16 0.55 0 0 0 -0.18'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
--seams:repeating-linear-gradient(180deg,transparent 0 158px,rgba(90,60,30,.10) 158px 160px);
/* dark: walnut (put in BOTH dark blocks) */
--tex:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='320'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0035 0.11' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.62 0 0 0 0 0.46 0 0 0 0 0.30 0.16 0 0 0 -0.05'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
--seams:repeating-linear-gradient(180deg,transparent 0 158px,rgba(0,0,0,.22) 158px 160px);
```

Rules:
- The texture only ever sits **behind** panels. Text never sits directly on the texture except the page title.
- Panels and cards are nearly opaque: `background:var(--panel); background:color-mix(in srgb,var(--panel) 94%,transparent);`
  (the first line is the fallback for old browsers).
- **Never** `background-attachment:fixed` (janky or ignored on Android Chrome).
- A "Plain background" option (phase 3) sets `--tex:none; --seams:none` for slow phones and printing.
- Tuning range if it looks too strong or weak: change only the last row of `feColorMatrix`
  (`0.55 … -0.18` light, `0.16 … -0.05` dark). Bigger first number = stronger grain.

### 2.4 Shapes and motion

Radius 12 px on panels, cards and detail; 8 px on inputs, buttons, tiles and chips stay pill-shaped. Soft `--shadow` on
panels and cards; selected card: `outline:2px solid var(--accent); outline-offset:2px` (no heavy inset).
Transitions 150 ms on background, border and shadow only; wrap them in
`@media (prefers-reduced-motion: no-preference){…}`. No animated textures.

## 3. Phases

### Phase 1: warm palette and type (CSS only)

1. In the first `:root{…}` that holds `--bg` (around line 8), replace the colour tokens with the **Light** column
   of 2.1 and add `--shadow`, `--radius`, `--radius-s`, `--tex`, `--seams` (light values from 2.3).
   Replace the fonts per 2.2.
2. Replace both dark blocks (`@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…}}` and
   `:root[data-theme="dark"]{…}`) with the **Dark** column plus the dark `--tex`/`--seams`. Keep `color-scheme:dark`.
3. Headings (2.2): edit the `h1,h2,h3`, `h1`, `h2`, `h3`, `.card .nm`, `.tile .k`, `.fields label`,
   `#stockTbl th`, `.parts th` rules.
4. `.panel`, `.card`, `.detail`: `border-radius:var(--radius)`, `box-shadow:var(--shadow)`.
   `input,select,textarea,button.b,.tile`: `border-radius:var(--radius-s)`.
5. The 3D drawing materials: in `const BASE={…}` (UI script) change only these to warmer tones:
   `metal:'#6B625A', steel:'#5E5750', cable:'#9C8E80', concrete:'#A39A90', fabric:'#8A7F95'`. Leave wood colours.
6. Scene stroke: in `renderScene` replace `stroke="rgba(45,28,10,.45)"` with `stroke="rgba(60,35,15,.38)"`.
7. **Accept when:** `contrast.js` exits 0; `smoke.js` passes; in the PNGs the page is warm in both themes and no
   heading is all-caps. The header bottom rule (`.top{border-bottom:2px solid var(--ink)}`) becomes
   `1px solid var(--line)`.

### Phase 2: wood background

1. `body`: `background-color:var(--bg); background-image:var(--seams),var(--tex); background-repeat:repeat;`
   (keep the existing padding rules).
2. Panels and cards: opaque-ish backgrounds per 2.3. `.scene` keeps `background:var(--panel-2)` (no texture behind the drawing).
3. Header: no texture change on desktop; phones get the short header in phase 4.
4. `@media print{…}`: add `body{background:#fff!important;background-image:none!important}`.
5. **Accept when:** on `phone412-light-top.png` the grain is visible but faint between panels; on the dark PNG it
   reads as dark walnut, not stripes; text contrast unchanged; `shots.js` exit 0.

### Phase 3: theme toggle (follow the phone, override with a button)

1. Markup: in `<header class="wrap top">`, after the `.mark` div, add
   ```html
   <div class="themeBox"><button class="b themeBtn" id="themeBtn" type="button" aria-label="Colour theme: follows the phone">◐</button>
   <label class="plainBg"><input type="checkbox" id="plainBg"> Plain background</label></div>
   ```
2. CSS: `.themeBtn{min-width:44px;min-height:44px;border-radius:999px}`; `.plainBg{font-size:13px;color:var(--muted);display:flex;gap:6px;align-items:center}`;
   `:root[data-plain="1"]{--tex:none;--seams:none}`.
3. JS (top of the UI script, before `renderStock()` is first called):
   ```js
   const THEME_KEY='bsp-theme', PLAIN_KEY='bsp-plain';
   const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
   const lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
   function setThemeColor(){let m=document.querySelector('meta[name="theme-color"]');
     if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}
     m.content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#EFE6DA';}
   function applyTheme(t){const r=document.documentElement;
     if(t==='light'||t==='dark') r.setAttribute('data-theme',t); else r.removeAttribute('data-theme');
     const b=document.getElementById('themeBtn'); if(b){b.textContent=t==='light'?'☀':t==='dark'?'☾':'◐';
       b.setAttribute('aria-label','Colour theme: '+(t||'follows the phone'));}
     setThemeColor();}
   applyTheme(lsGet(THEME_KEY));
   if(lsGet(PLAIN_KEY)==='1') document.documentElement.setAttribute('data-plain','1');
   document.getElementById('themeBtn').addEventListener('click',()=>{
     const cur=lsGet(THEME_KEY), next=cur===null||cur===''?'light':cur==='light'?'dark':'';
     if(next) lsSet(THEME_KEY,next); else {try{localStorage.removeItem(THEME_KEY);}catch(e){}}
     applyTheme(next||null);});
   const pb=document.getElementById('plainBg'); pb.checked=lsGet(PLAIN_KEY)==='1';
   pb.addEventListener('change',()=>{if(pb.checked)document.documentElement.setAttribute('data-plain','1');
     else document.documentElement.removeAttribute('data-plain'); lsSet(PLAIN_KEY,pb.checked?'1':'0');});
   matchMedia('(prefers-color-scheme: dark)').addEventListener('change',setThemeColor);
   ```
   The cycle is: follows phone → light → dark → follows phone. `theme-color` makes Android's status bar match the page.
4. **Accept when:** with `colorScheme:'dark'` emulated and no saved theme the page is dark; one tap → light,
   two taps → dark, three → follows phone again; the choice survives a reload; plain background removes the grain;
   `<meta name="theme-color">` changes with the theme (check with `document.querySelector('meta[name=theme-color]').content`).

### Phase 4: phone layout (≤ 900 px), Android first

Do the steps in this order; test after each.

1. **Short header on phones.** Wrap the long `.lede` text: keep the first sentence visible, move the rest into
   `<details class="more"><summary>What it does</summary>…</details>` inside the header. Hide `.mark` below 600 px.
2. **Designs first.** Below 900 px, use CSS order so `.main` comes before `aside`:
   `@media (max-width:900px){.layout{display:flex;flex-direction:column}.layout>.main{order:1}.layout>aside{order:2}}`.
   Then add a slim sticky bar at the top on phones:
   ```html
   <nav class="jump" aria-label="Sections"><a href="#cards">Designs</a><a href="#detail">Selected</a><a href="#h-stock">Boards</a><a href="#h-room">Room &amp; load</a></nav>
   ```
   placed directly after `<header>`; CSS: hidden above 900 px; below: `position:sticky;top:0;z-index:5;display:flex;gap:4px;
   overflow-x:auto;padding:8px 0;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(6px)`;
   links are 44 px high pills (`.chip` look). Add `scroll-margin-top:64px` to `#cards,#detail,#h-stock,#h-room`.
3. **Collapsible input panels on phones.** Turn the two `<section class="panel">` in `aside` into
   `<details class="panel" open>` with the `<h2>` inside a `<summary>`. In the UI script after `initFields()`:
   `if(matchMedia('(max-width:900px)').matches&&!S.example) document.querySelectorAll('aside details.panel').forEach(d=>d.open=false);`
   (first-time visitors with the example stock still see them open).
4. **Board table as stacked rows ≤ 560 px.** In `renderStock` add `placeholder="Name"`, `"Length"`, `"Width"`,
   `"Thickness"`, `"Qty"` to the five inputs (keep their `aria-label`s). CSS:
   ```css
   @media (max-width:560px){
     #stockTbl thead{display:none}
     #stockTbl tr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) 44px;gap:6px;padding:8px 0;border-bottom:1px solid var(--line)}
     #stockTbl td{padding:0}
     #stockTbl td:first-child{grid-column:1/-1}
     #stockTbl input{font-size:16px;min-height:44px}
     .c-name,.c-num,.c-qty{width:100%}
     .x{min-width:44px;min-height:44px}
   }
   ```
5. **Chips scroll sideways instead of wrapping ≤ 600 px:**
   `#srcChips,#chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}` and `.chip{flex:0 0 auto;min-height:40px}`.
   `.filters` stacks: search input full width (`.search{width:100%}`), sort below.
6. **Cards: two-column grid on phones** (replace the carousel rule at line ~65):
   `@media (max-width:560px){.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}.card{flex:none}.card .thumb{height:96px}}`.
7. **Tap → show the design.** In the `#cards` click handler, after `renderDetail()`:
   `if(matchMedia('(max-width:900px)').matches) document.getElementById('detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});`
8. **Tiles:** `.tiles{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}` leaves a gap; on phones use
   `repeat(2,minmax(0,1fr))` and give the last tile `grid-column:1/-1` when the count is odd
   (`.tile:last-child:nth-child(odd){grid-column:1/-1}`).
9. **Touch targets:** every `button.b`, `.chip`, `select`, `input` ≥ 44 px high on phones; inputs use `font-size:16px`.
10. **Accept when:** on `phone360-*-top.png` the first screen shows the title, the jump bar and the start of the
    design list; no horizontal scroll at 360 px; board rows show full names; tapping a card scrolls to its detail;
    desktop layout (1280 px) looks the same as after phase 2.

### Phase 5: faster on Android

1. **Lazy thumbnails.** In `run()`, the card template contains `<div class="thumb">${renderScene(r,true)}</div>`.
   Replace it with `<div class="thumb" data-thumb="${r.id}"></div>`. After `$('#cards').innerHTML=…`, add:
   ```js
   if(window._thumbIO) window._thumbIO.disconnect();
   const draw=el=>{const r=PLAN.results.find(x=>x.id===el.dataset.thumb); if(r&&!el.firstChild) el.innerHTML=renderScene(r,true);};
   if('IntersectionObserver' in window){
     window._thumbIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){draw(e.target);window._thumbIO.unobserve(e.target);}}),{rootMargin:'300px'});
     document.querySelectorAll('[data-thumb]').forEach(el=>window._thumbIO.observe(el));
   } else document.querySelectorAll('[data-thumb]').forEach(draw);
   ```
2. **Show 24 at a time.** Render only the first `S.shown||24` cards of `shown`, then a full-width button
   `<button class="b more" id="moreCards">Show 24 more (N left)</button>`; clicking adds 24 and re-renders the
   cards only. Reset to 24 when a filter, search or sort changes. Keep `none` cards at the end as today.
3. **Accept when:** on the 360 px phone, the first `run()` builds ≤ 24 thumbnails (count `.thumb svg` right after
   load); scrolling fills the rest; `shots.js` and `smoke.js` pass. Measure in Chrome DevTools with 4× CPU throttling:
   the time from a stock edit to repainted cards should drop well below the current value (write both numbers in the commit message).

### Phase 6: calmer detail view

1. **Collapsible sections.** In `renderDetail` and `renderDetailBuy`, wrap these blocks in
   `<details class="dsec" open>` with the heading moved into `<summary>`: "Cut plan", "Parts / Hardware",
   "Shopping list", "Rigging calculation" (in `rigHtml`), "Build manual". Keep the buttons that sit in `.secrow`
   inside the details body (not in `<summary>`), so the IDs stay unique. After `innerHTML` is set:
   `if(matchMedia('(max-width:900px)').matches) document.querySelectorAll('#detail .dsec').forEach((d,i)=>{if(i>1&&!d.querySelector('.life'))d.open=false;});`
   The life-safety section (`.warn.life`) always stays open.
2. **Scene on phones:** `.scene svg{max-height:340px}` below 600 px; scene background `var(--panel-2)`.
3. **Floor and wall:** in `renderScene` give the floor a soft gradient. Add once, near the top of the body,
   a hidden global defs SVG (never repeat ids inside each scene):
   ```html
   <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
     <linearGradient id="bspFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--floor)"/><stop offset="1" style="stop-color:var(--wall)"/></linearGradient>
   </defs></svg>
   ```
   and change the floor polygon to `style="fill:url(#bspFloor)"`.
4. **Accept when:** on the 412 px detail screenshot the first screen shows the drawing and the tiles; sections
   below are collapsed with clear summaries; the life-safety warning is visible for pro designs that carry people.

### Phase 7: polish and accessibility

1. Focus: `:focus-visible{outline:2px solid var(--accent);outline-offset:2px}` on buttons, chips, cards, summaries.
2. `@media (prefers-reduced-motion: reduce){*{scroll-behavior:auto!important;transition:none!important}}`.
3. Print (`@media print`): plain white, no texture, all `details` forced open
   (`details{display:block}details>*{display:block}` is not enough; add a `beforeprint` listener that sets
   `open=true` on every `details`).
4. Re-run `contrast.js` and check `.card .pl`, `.hint`, `.tile .s` (they use `--muted`) on `--panel`.
5. **Accept when:** keyboard tabbing shows a visible ring everywhere; printing a design shows the manual expanded.

### Phase 8: QA and publish

1. Run all three tests. Open every PNG in `planner/tests/out/` and check: warm in both themes, grain faint,
   no all-caps headings, no horizontal scroll, detail readable.
2. Spot-check 5 designs on a 360 px phone: one board design, one buy design, one pro design with
   life-safety, one with a jigsaw tag, one that does not fit.
3. Publish per section 0 and give the user the link.

## 4. Out of scope (do not do)

- Any change inside `<script id="logic">` (engineering, packing, rigging maths).
- Photo textures or image files.
- New frameworks, build steps or external scripts.
- Renaming IDs or classes listed in section 0.

## 5. Risks and how to avoid them

| Risk | Avoid it by |
|---|---|
| Texture makes text hard to read | Text only on `--panel`; run `contrast.js`; keep grain alpha in the ranges above |
| Dark texture looks striped | Use the exact dark values in 2.3; do not raise the `0.16` factor above `0.22` |
| Duplicate SVG ids from 222 thumbnails | Global defs SVG once (phase 6.3), never ids inside `renderScene` |
| Lazy thumbnails missing after a filter change | Disconnect and re-observe in every `run()` (phase 5.1) |
| Collapsed panels hide errors | `#warns` stays outside any `details`; life-safety stays open |
| Android status bar colour wrong after toggling | `setThemeColor()` runs in `applyTheme` and on system change |
| Breaking the planner while restyling | `smoke.js` after every phase; never edit the logic script |
