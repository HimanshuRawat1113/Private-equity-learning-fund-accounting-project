# PE Fund Accountant — Study Site (v1 scaffold)

A free, static, no-backend study site for PE fund accounting, built from 14 modules of course content.

## What's here
- `index.html` — the single-page app shell
- `assets/style.css` — the design system (ledger/workpaper theme)
- `assets/app.js` — routing, markdown renderer, quiz engine, calculators
- `data/modules.json` — all 14 modules + 164 MCQs, structured data
- `diagram_*.svg` — the three waterfall diagrams, referenced inside Module 7's content

## How to run locally
This is a static site — no build step, no npm install needed.
Just open `index.html` in a browser, OR for local dev with working fetch():
```
cd pe-site
python3 -m http.server 8000
```
Then visit http://localhost:8000

## How to deploy for free
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo → Deploy (no config needed, it's static)
3. You'll get a free `yourproject.vercel.app` link

## What to add next
- More calculators (IRR/MOIC is done; add capital call tracker, J-curve visualizer)
- Progress tracking (localStorage-based quiz score history)
- The footer block: social links, UPI/tip button, email capture form
- Long-form SEO reference articles as separate pages
- A custom domain (optional, ~₹800-1200/yr)

## Known limitations in this v1
- Module 7's diagram images use relative paths — make sure the .svg files stay in the same folder as index.html when deployed
- The markdown renderer is intentionally simple (headings, tables, bold, images, lists) — it does not handle every markdown edge case
- Quiz progress is not saved between sessions yet
