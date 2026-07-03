// ---- tiny markdown renderer (headings, bold, tables, images, lists, hr) ----
function mdToHtml(md) {
  // strip the MCQ section (rendered separately by quiz engine)
  md = md.split(/\n---\n\n## Practice MCQs/)[0];
  md = md.split(/\n---\n\n## MCQs/)[0];

  const lines = md.split('\n');
  let html = '';
  let inTable = false, tableRows = [];
  let inList = false;

  function flushTable() {
    if (!tableRows.length) return;
    let out = '<table><thead><tr>';
    const header = tableRows[0].split('|').map(c => c.trim()).filter(Boolean);
    header.forEach(h => out += `<th>${h}</th>`);
    out += '</tr></thead><tbody>';
    for (let i = 2; i < tableRows.length; i++) {
      const cells = tableRows[i].split('|').map(c => c.trim()).filter((c,idx,arr)=> !(idx===0 && c==='') && !(idx===arr.length-1 && c===''));
      out += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
    }
    out += '</tbody></table>';
    html += out;
    tableRows = [];
    inTable = false;
  }

  function inline(t) {
    t = t.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">');
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
    t = t.replace(/`(.*?)`/g, '<code>$1</code>');
    return t;
  }

  for (let raw of lines) {
    const line = raw;
    if (/^\|/.test(line.trim())) {
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }
    if (/^#### /.test(line)) { html += `<h4>${inline(line.slice(5))}</h4>`; continue; }
    if (/^### /.test(line)) { html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (/^## /.test(line)) { html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (/^# /.test(line)) { html += `<h1>${inline(line.slice(2))}</h1>`; continue; }
    if (/^---$/.test(line.trim())) { html += '<hr>'; continue; }
    if (/^\s*-\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^\s*-\s+/, ''))}</li>`;
      continue;
    } else if (inList) { html += '</ul>'; inList = false; }
    if (line.trim() === '') { html += ''; continue; }
    html += `<p>${inline(line)}</p>`;
  }
  if (inTable) flushTable();
  if (inList) html += '</ul>';
  return html;
}

// ---- data ----
let MODULES = [];
async function loadData() {
  const res = await fetch('data/modules.json');
  MODULES = await res.json();
}

// ---- routing ----
function route() {
  const hash = window.location.hash.slice(1) || 'home';
  const app = document.getElementById('app');
  if (hash === 'home') renderHome(app);
  else if (hash === 'reference') renderReference(app);
  else if (hash === 'calculators') renderCalculators(app);
  else if (hash.startsWith('ref-')) {
    const id = parseInt(hash.split('-')[1], 10);
    renderModule(app, id);
  }
  else if (hash.startsWith('module-')) {
    const id = parseInt(hash.split('-')[1], 10);
    renderModule(app, id);
  } else renderHome(app);
  document.querySelectorAll('nav.main a').forEach(a => a.classList.remove('active'));
  const navMap = {home:'nav-home', calculators:'nav-calc', reference:'nav-reference', ref:'nav-reference'};
  const navId = navMap[hash.split('-')[0]] || (hash==='home'?'nav-home':'nav-modules');
  const el = document.getElementById(navId);
  if (el) el.classList.add('active');
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);

// ---- home ----
function renderHome(app) {
  const coreModules = MODULES.filter(m => m.kind === 'module');
  const totalMcqs = MODULES.reduce((s,m) => s + m.mcqs.length, 0);
  app.innerHTML = `
    <section class="hero">
      <div class="wrap">
        <div class="eyebrow">Fund Ops &middot; Gurgaon</div>
        <h1>Private equity fund<br>accounting, <em>ledger by ledger.</em></h1>
        <p class="lede">Fourteen modules built from real interview prep &mdash; capital calls to carried interest, worked in actual rupee crores, not textbook placeholders.</p>
        <a class="btn" href="#module-1">Start with Module 1 &rarr;</a>
        <a class="btn ghost" href="#calculators" style="margin-left:10px">Open calculators</a>
        <a class="btn ghost" href="#reference" style="margin-left:10px">Full statements &amp; worked examples</a>
        <div class="stat-strip">
          <div class="stat"><div class="num">${coreModules.length}</div><div class="label">Modules</div></div>
          <div class="stat"><div class="num">${totalMcqs}</div><div class="label">Practice MCQs</div></div>
          <div class="stat"><div class="num">&#8377;0</div><div class="label">Cost to study</div></div>
        </div>
      </div>
    </section>
    <section class="section wrap">
      <h2>The curriculum</h2>
      <p class="sub">Sequenced the way the work actually goes &mdash; foundations, then mechanics, then the money.</p>
      <div class="module-grid">
        ${coreModules.map(m => `
          <a href="#module-${m.id}" class="module-card ${m.id===7?'flagship':''}" style="display:block;color:inherit">
            <div class="idx">MODULE ${String(m.id).padStart(2,'0')}${m.id===7?' &middot; FLAGSHIP':''}</div>
            <h3>${m.title}</h3>
            <div class="meta">${m.mcqs.length} MCQs</div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

// ---- reference section ----
function renderReference(app) {
  const refs = MODULES.filter(m => m.kind === 'reference');
  app.innerHTML = `
    <div class="section wrap">
      <h2>Reference &amp; worked examples</h2>
      <p class="sub">Full financial statement sets and the American waterfall deep-dive &mdash; supplementary to the core 14 modules, built to be traced line by line.</p>
      <div class="module-grid">
        ${refs.map(m => `
          <a href="#ref-${m.id}" class="module-card" style="display:block;color:inherit">
            <div class="idx">REFERENCE</div>
            <h3>${m.title}</h3>
            <div class="meta">${m.mcqs.length ? m.mcqs.length + ' MCQs' : 'Worked example'}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

// ---- module detail + quiz ----
function renderModule(app, id) {
  const m = MODULES.find(x => x.id === id);
  if (!m) { app.innerHTML = '<div class="wrap">Not found.</div>'; return; }
  const isRef = m.kind === 'reference';
  const bodyHtml = mdToHtml(m.content_md);
  const backHref = isRef ? '#reference' : '#home';
  const backLabel = isRef ? '&larr; All reference pages' : '&larr; All modules';
  const heading = isRef ? m.title : `Module ${m.id} &mdash; ${m.title}`;
  app.innerHTML = `
    <div class="module-detail wrap">
      <a class="back-link" href="${backHref}">${backLabel}</a>
      <h1>${heading}</h1>
      <div class="content-body">${bodyHtml}</div>
      ${m.mcqs.length ? `
      <div class="quiz-panel" id="quiz-panel">
        <h2>Practice MCQs</h2>
        <div class="quiz-meta">${m.mcqs.length} questions &middot; instant feedback</div>
        <div id="quiz-body"></div>
      </div>` : ''}
    </div>
  `;
  if (m.mcqs.length) renderQuiz(m);
}

function renderQuiz(m) {
  const body = document.getElementById('quiz-body');
  if (!m.mcqs.length) { body.innerHTML = '<p style="color:var(--ink-soft);font-size:13px">No MCQs parsed for this module yet.</p>'; return; }
  let score = 0, answered = 0;
  body.innerHTML = m.mcqs.map((q, qi) => `
    <div class="q-block" data-qi="${qi}">
      <div class="q-text">${qi+1}. ${q.q}</div>
      ${q.options.map((opt,oi) => `<button class="opt" data-oi="${oi}">${String.fromCharCode(65+oi)}) ${opt}</button>`).join('')}
    </div>
  `).join('') + '<div id="score-banner"></div>';

  body.querySelectorAll('.q-block').forEach(block => {
    const qi = parseInt(block.dataset.qi, 10);
    const q = m.mcqs[qi];
    block.querySelectorAll('.opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (block.dataset.done) return;
        block.dataset.done = '1';
        const oi = parseInt(btn.dataset.oi, 10);
        block.querySelectorAll('.opt').forEach(b => b.classList.add('disabled'));
        if (oi === q.answer) { btn.classList.add('correct'); score++; }
        else {
          btn.classList.add('wrong');
          block.querySelectorAll('.opt')[q.answer].classList.add('correct');
        }
        answered++;
        if (answered === m.mcqs.length) {
          document.getElementById('score-banner').innerHTML =
            `<div class="score-banner">Score: ${score} / ${m.mcqs.length} (${Math.round(100*score/m.mcqs.length)}%)</div>`;
        }
      });
    });
  });
}

// ---- calculators ----
function renderCalculators(app) {
  app.innerHTML = `
    <div class="section wrap">
      <h2>Calculators</h2>
      <p class="sub">Interactive workings for the core PE calculations.</p>

      <div class="calc-card">
        <h3>Waterfall &amp; carried interest calculator</h3>
        <div class="desc">Enter fund size, exit proceeds, hurdle and carry to see the four tiers split live.</div>
        <div class="calc-grid">
          <div class="field"><label>Capital invested (&#8377; cr)</label><input id="wf-capital" type="number" value="100"></div>
          <div class="field"><label>Exit proceeds (&#8377; cr)</label><input id="wf-proceeds" type="number" value="160"></div>
          <div class="field"><label>Hurdle rate (%)</label><input id="wf-hurdle" type="number" value="8"></div>
          <div class="field"><label>Carry (%)</label><input id="wf-carry" type="number" value="20"></div>
        </div>
        <div id="wf-result"></div>
      </div>

      <div class="calc-card">
        <h3>IRR / MOIC quick calculator</h3>
        <div class="desc">Single cash-in, single cash-out over N years. For multi-cashflow IRR, use a spreadsheet's XIRR.</div>
        <div class="calc-grid">
          <div class="field"><label>Capital invested (&#8377; cr)</label><input id="irr-in" type="number" value="100"></div>
          <div class="field"><label>Total returned (&#8377; cr)</label><input id="irr-out" type="number" value="250"></div>
          <div class="field"><label>Holding period (years)</label><input id="irr-years" type="number" value="5"></div>
        </div>
        <div id="irr-result"></div>
      </div>
    </div>
  `;
  const wfInputs = ['wf-capital','wf-proceeds','wf-hurdle','wf-carry'];
  wfInputs.forEach(id => document.getElementById(id).addEventListener('input', calcWaterfall));
  calcWaterfall();

  const irrInputs = ['irr-in','irr-out','irr-years'];
  irrInputs.forEach(id => document.getElementById(id).addEventListener('input', calcIrr));
  calcIrr();
}

function calcWaterfall() {
  const capital = parseFloat(document.getElementById('wf-capital').value) || 0;
  const proceeds = parseFloat(document.getElementById('wf-proceeds').value) || 0;
  const hurdleRate = parseFloat(document.getElementById('wf-hurdle').value) || 0;
  const carryRate = parseFloat(document.getElementById('wf-carry').value) || 0;

  let remaining = proceeds;
  const t1 = Math.min(remaining, capital); remaining -= t1;
  const hurdleAmt = capital * (hurdleRate/100);
  const t2 = Math.min(remaining, hurdleAmt); remaining -= t2;

  const totalProfitSoFar = t2; // profit recognized so far above capital
  // total profit if fund ended right now = proceeds - capital
  const totalProfit = Math.max(0, proceeds - capital);
  const gpTargetCarry = totalProfit * (carryRate/100);
  // catch-up: give 100% to GP until GP carry = target, bounded by remaining cash
  const t3 = Math.min(remaining, gpTargetCarry);
  remaining -= t3;
  const gpSoFar = t3;

  // tier 4: split remaining 80/20 (using carryRate/100-carryRate split)
  const t4gp = remaining * (carryRate/100);
  const t4lp = remaining - t4gp;

  const totalGp = gpSoFar + t4gp;
  const totalLp = t1 + t2 + t4lp;
  const impliedCarryPct = totalProfit > 0 ? (totalGp/totalProfit*100) : 0;

  document.getElementById('wf-result').innerHTML = `
    <div class="tier-result"><span>Tier 1 &mdash; Return of capital</span><span class="lp">&#8377;${t1.toFixed(2)} cr &rarr; LP</span></div>
    <div class="tier-result"><span>Tier 2 &mdash; Preferred return (${hurdleRate}%)</span><span class="lp">&#8377;${t2.toFixed(2)} cr &rarr; LP</span></div>
    <div class="tier-result"><span>Tier 3 &mdash; GP catch-up</span><span class="gp">&#8377;${t3.toFixed(2)} cr &rarr; GP</span></div>
    <div class="tier-result"><span>Tier 4 &mdash; ${100-carryRate}/${carryRate} split</span><span>&#8377;${t4lp.toFixed(2)} cr LP / &#8377;${t4gp.toFixed(2)} cr GP</span></div>
    <div class="check-line">Total to LP: &#8377;${totalLp.toFixed(2)} cr &middot; Total to GP: &#8377;${totalGp.toFixed(2)} cr &middot; Implied GP carry = ${impliedCarryPct.toFixed(1)}% of total profit (target ${carryRate}%)</div>
  `;
}

function calcIrr() {
  const cin = parseFloat(document.getElementById('irr-in').value) || 0;
  const cout = parseFloat(document.getElementById('irr-out').value) || 0;
  const years = parseFloat(document.getElementById('irr-years').value) || 1;
  const moic = cin > 0 ? cout/cin : 0;
  const irr = cin > 0 && years > 0 ? (Math.pow(cout/cin, 1/years) - 1) * 100 : 0;
  document.getElementById('irr-result').innerHTML = `
    <div class="tier-result"><span>MOIC</span><span>${moic.toFixed(2)}x</span></div>
    <div class="tier-result"><span>IRR (annualized)</span><span>${irr.toFixed(1)}%</span></div>
  `;
}

// ---- boot ----
loadData().then(route);
