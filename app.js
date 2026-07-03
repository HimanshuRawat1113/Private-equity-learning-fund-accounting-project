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
  const res = await fetch('modules.json');
  MODULES = await res.json();
}

// ---- routing ----
function route() {
  const hash = window.location.hash.slice(1) || 'home';
  const app = document.getElementById('app');
  if (hash === 'home') renderHome(app);
  else if (hash === 'reference') renderReference(app);
  else if (hash === 'calculators') renderCalculators(app);
  else if (hash === 'progress') renderProgress(app);
  else if (hash.startsWith('ref-')) {
    const id = parseInt(hash.split('-')[1], 10);
    renderModule(app, id);
  }
  else if (hash.startsWith('module-')) {
    const id = parseInt(hash.split('-')[1], 10);
    renderModule(app, id);
  } else renderHome(app);
  document.querySelectorAll('nav.main a').forEach(a => a.classList.remove('active'));
  const navMap = {home:'nav-home', calculators:'nav-calc', reference:'nav-reference', ref:'nav-reference', progress:'nav-progress'};
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

// ---- progress tracking (localStorage) ----
const PROGRESS_KEY = 'peProgress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { modules: {} };
  } catch (e) { return { modules: {} }; }
}

function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
}

function recordQuizAttempt(moduleId, moduleTitle, score, total, wrongQuestions) {
  const p = loadProgress();
  if (!p.modules[moduleId]) p.modules[moduleId] = { title: moduleTitle, attempts: [], wrongCounts: {} };
  p.modules[moduleId].title = moduleTitle;
  p.modules[moduleId].attempts.push({ date: new Date().toISOString(), score, total });
  wrongQuestions.forEach(qText => {
    p.modules[moduleId].wrongCounts[qText] = (p.modules[moduleId].wrongCounts[qText] || 0) + 1;
  });
  saveProgress(p);
}

function getModuleStats(moduleId) {
  const p = loadProgress();
  const m = p.modules[moduleId];
  if (!m || !m.attempts.length) return null;
  const last = m.attempts[m.attempts.length - 1];
  const best = m.attempts.reduce((a, b) => (b.score/b.total > a.score/a.total ? b : a), m.attempts[0]);
  return { attempts: m.attempts.length, last, best };
}

// ---- progress dashboard ----
function renderProgress(app) {
  const p = loadProgress();
  const coreModules = MODULES.filter(m => m.kind === 'module');
  const attemptedIds = Object.keys(p.modules).map(Number);
  const totalAttempted = attemptedIds.length;

  // aggregate weak areas: collect all wrongCounts across modules, sort by count
  let allWrong = [];
  Object.entries(p.modules).forEach(([mid, data]) => {
    Object.entries(data.wrongCounts || {}).forEach(([qText, count]) => {
      allWrong.push({ moduleId: mid, moduleTitle: data.title, qText, count });
    });
  });
  allWrong.sort((a,b) => b.count - a.count);
  const topWeak = allWrong.slice(0, 8);

  const rows = coreModules.map(m => {
    const stats = getModuleStats(m.id);
    if (!stats) {
      return `<tr><td>${m.title}</td><td class="dim">Not attempted</td><td class="dim">&mdash;</td><td class="dim">&mdash;</td></tr>`;
    }
    const lastPct = Math.round(100*stats.last.score/stats.last.total);
    const bestPct = Math.round(100*stats.best.score/stats.best.total);
    return `<tr>
      <td><a href="#module-${m.id}">${m.title}</a></td>
      <td>${stats.attempts}</td>
      <td>${stats.last.score}/${stats.last.total} (${lastPct}%)</td>
      <td class="${bestPct>=80?'good':bestPct>=50?'mid':'low'}">${stats.best.score}/${stats.best.total} (${bestPct}%)</td>
    </tr>`;
  }).join('');

  app.innerHTML = `
    <div class="section wrap">
      <h2>Your progress</h2>
      <p class="sub">${totalAttempted} of ${coreModules.length} modules attempted &middot; stored only in this browser, nowhere else</p>

      ${totalAttempted === 0 ? `
        <div class="empty-progress">
          <p>No quiz attempts yet. Open any module and complete its MCQs &mdash; your scores will show up here automatically.</p>
          <a class="btn" href="#module-1">Start Module 1 &rarr;</a>
        </div>
      ` : `
        <table class="progress-table">
          <thead><tr><th>Module</th><th>Attempts</th><th>Last score</th><th>Best score</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        ${topWeak.length ? `
        <h2 style="margin-top:40px">Weak areas</h2>
        <p class="sub">Questions you've gotten wrong most often &mdash; worth another look</p>
        <div class="weak-list">
          ${topWeak.map(w => `
            <div class="weak-item">
              <div class="weak-q">${w.qText}</div>
              <div class="weak-meta"><a href="#module-${w.moduleId}">${w.moduleTitle}</a> &middot; missed ${w.count}&times;</div>
            </div>
          `).join('')}
        </div>` : ''}
      `}
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
  const wrongQuestions = [];
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
          wrongQuestions.push(q.q);
        }
        answered++;
        if (answered === m.mcqs.length) {
          document.getElementById('score-banner').innerHTML =
            `<div class="score-banner">Score: ${score} / ${m.mcqs.length} (${Math.round(100*score/m.mcqs.length)}%) &middot; saved to your progress</div>`;
          recordQuizAttempt(m.id, m.title, score, m.mcqs.length, wrongQuestions);
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

      <div class="calc-card">
        <h3>Management fee step-down calculator</h3>
        <div class="desc">See how the fee base shift (committed &rarr; invested capital) plus a rate step-down changes annual fee income across the fund's life.</div>
        <div class="calc-grid">
          <div class="field"><label>Committed capital (&#8377; cr)</label><input id="fee-committed" type="number" value="1000"></div>
          <div class="field"><label>Fee rate, investment period (%)</label><input id="fee-rate1" type="number" value="2" step="0.1"></div>
          <div class="field"><label>Fee rate, after step-down (%)</label><input id="fee-rate2" type="number" value="1.5" step="0.1"></div>
          <div class="field"><label>Remaining invested capital after step-down (&#8377; cr)</label><input id="fee-remaining" type="number" value="500"></div>
        </div>
        <div id="fee-result"></div>
      </div>

      <div class="calc-card">
        <h3>Equalization calculator</h3>
        <div class="desc">A late-joining LP's catch-up contribution plus equalization interest, so they land in the same position as Day 1 LPs.</div>
        <div class="calc-grid">
          <div class="field"><label>Capital already called from Day-1 LPs (&#8377; cr)</label><input id="eq-called" type="number" value="20"></div>
          <div class="field"><label>Late LP's commitment as % of fund</label><input id="eq-pct" type="number" value="10" step="0.1"></div>
          <div class="field"><label>Months since Day-1 call</label><input id="eq-months" type="number" value="6"></div>
          <div class="field"><label>Equalization interest rate (% annual)</label><input id="eq-rate" type="number" value="8" step="0.1"></div>
        </div>
        <div id="eq-result"></div>
      </div>

      <div class="calc-card">
        <h3>Capital call &amp; distribution tracker</h3>
        <div class="desc">Log calls and distributions for one LP and watch their capital account roll forward, same shape as Module 6.3.</div>
        <div class="calc-grid">
          <div class="field"><label>LP ownership % of fund</label><input id="cc-pct" type="number" value="5" step="0.1"></div>
          <div class="field"><label>Fund-level capital called this period (&#8377; cr)</label><input id="cc-called" type="number" value="40"></div>
          <div class="field"><label>Fund-level unrealized gain this period (&#8377; cr)</label><input id="cc-gain" type="number" value="15"></div>
          <div class="field"><label>Fund-level distribution this period (&#8377; cr)</label><input id="cc-dist" type="number" value="10"></div>
        </div>
        <div class="calc-grid">
          <div class="field"><label>LP opening capital account balance (&#8377; cr)</label><input id="cc-opening" type="number" value="10"></div>
        </div>
        <div id="cc-result"></div>
      </div>

      <div class="calc-card">
        <h3>J-curve visualizer</h3>
        <div class="desc">Enter yearly net cash flow (calls negative, distributions positive) and watch the cumulative J-curve shape build.</div>
        <div class="calc-grid">
          <div class="field"><label>Year 1 net cash flow (&#8377; cr)</label><input id="jc-y1" type="number" value="-20"></div>
          <div class="field"><label>Year 2 net cash flow (&#8377; cr)</label><input id="jc-y2" type="number" value="-15"></div>
          <div class="field"><label>Year 3 net cash flow (&#8377; cr)</label><input id="jc-y3" type="number" value="-5"></div>
          <div class="field"><label>Year 4 net cash flow (&#8377; cr)</label><input id="jc-y4" type="number" value="10"></div>
          <div class="field"><label>Year 5 net cash flow (&#8377; cr)</label><input id="jc-y5" type="number" value="30"></div>
          <div class="field"><label>Year 6 net cash flow (&#8377; cr)</label><input id="jc-y6" type="number" value="45"></div>
        </div>
        <div id="jc-result"></div>
      </div>
    </div>
  `;
  const wfInputs = ['wf-capital','wf-proceeds','wf-hurdle','wf-carry'];
  wfInputs.forEach(id => document.getElementById(id).addEventListener('input', calcWaterfall));
  calcWaterfall();

  const irrInputs = ['irr-in','irr-out','irr-years'];
  irrInputs.forEach(id => document.getElementById(id).addEventListener('input', calcIrr));
  calcIrr();

  const feeInputs = ['fee-committed','fee-rate1','fee-rate2','fee-remaining'];
  feeInputs.forEach(id => document.getElementById(id).addEventListener('input', calcFeeStepDown));
  calcFeeStepDown();

  const eqInputs = ['eq-called','eq-pct','eq-months','eq-rate'];
  eqInputs.forEach(id => document.getElementById(id).addEventListener('input', calcEqualization));
  calcEqualization();

  const ccInputs = ['cc-pct','cc-called','cc-gain','cc-dist','cc-opening'];
  ccInputs.forEach(id => document.getElementById(id).addEventListener('input', calcCapitalAccount));
  calcCapitalAccount();

  const jcInputs = ['jc-y1','jc-y2','jc-y3','jc-y4','jc-y5','jc-y6'];
  jcInputs.forEach(id => document.getElementById(id).addEventListener('input', calcJCurve));
  calcJCurve();
}

function calcFeeStepDown() {
  const committed = parseFloat(document.getElementById('fee-committed').value) || 0;
  const rate1 = parseFloat(document.getElementById('fee-rate1').value) || 0;
  const rate2 = parseFloat(document.getElementById('fee-rate2').value) || 0;
  const remaining = parseFloat(document.getElementById('fee-remaining').value) || 0;

  const feeBefore = committed * (rate1/100);
  const feeAfter = remaining * (rate2/100);
  const pctChange = feeBefore > 0 ? ((feeAfter - feeBefore) / feeBefore * 100) : 0;

  document.getElementById('fee-result').innerHTML = `
    <div class="tier-result"><span>Annual fee, investment period (on committed capital)</span><span class="lp">&#8377;${feeBefore.toFixed(2)} cr/yr</span></div>
    <div class="tier-result"><span>Annual fee, after step-down (on remaining invested capital)</span><span class="gp">&#8377;${feeAfter.toFixed(2)} cr/yr</span></div>
    <div class="check-line">Fee income change after step-down: ${pctChange.toFixed(1)}% &middot; this is exactly the Module 8.1 worked example, with your own numbers</div>
  `;
}

function calcEqualization() {
  const called = parseFloat(document.getElementById('eq-called').value) || 0;
  const pct = parseFloat(document.getElementById('eq-pct').value) || 0;
  const months = parseFloat(document.getElementById('eq-months').value) || 0;
  const rate = parseFloat(document.getElementById('eq-rate').value) || 0;

  const catchUp = called * (pct/100);
  const interest = catchUp * (rate/100) * (months/12);
  const total = catchUp + interest;

  document.getElementById('eq-result').innerHTML = `
    <div class="tier-result"><span>Catch-up contribution</span><span class="lp">&#8377;${catchUp.toFixed(3)} cr</span></div>
    <div class="tier-result"><span>Equalization interest (${months} months at ${rate}%)</span><span class="gp">&#8377;${interest.toFixed(3)} cr</span></div>
    <div class="check-line">Total the late LP must pay in: &#8377;${total.toFixed(3)} cr &middot; the interest portion compensates early LPs for the time their capital was at risk alone</div>
  `;
}

function calcCapitalAccount() {
  const pct = parseFloat(document.getElementById('cc-pct').value) || 0;
  const called = parseFloat(document.getElementById('cc-called').value) || 0;
  const gain = parseFloat(document.getElementById('cc-gain').value) || 0;
  const dist = parseFloat(document.getElementById('cc-dist').value) || 0;
  const opening = parseFloat(document.getElementById('cc-opening').value) || 0;

  const lpCalled = called * (pct/100);
  const lpGain = gain * (pct/100);
  const lpDist = dist * (pct/100);
  const closing = opening + lpCalled + lpGain - lpDist;

  document.getElementById('cc-result').innerHTML = `
    <div class="tier-result"><span>Opening balance</span><span>&#8377;${opening.toFixed(2)} cr</span></div>
    <div class="tier-result"><span>+ Capital contributions (${pct}% of &#8377;${called} cr)</span><span class="lp">+&#8377;${lpCalled.toFixed(2)} cr</span></div>
    <div class="tier-result"><span>+ Allocated unrealized gains</span><span class="lp">+&#8377;${lpGain.toFixed(2)} cr</span></div>
    <div class="tier-result"><span>&minus; Distributions received</span><span class="gp">&minus;&#8377;${lpDist.toFixed(2)} cr</span></div>
    <div class="check-line">Closing balance: &#8377;${closing.toFixed(2)} cr &middot; same roll-forward shape as Module 6.3</div>
  `;
}

function calcJCurve() {
  const years = ['jc-y1','jc-y2','jc-y3','jc-y4','jc-y5','jc-y6'].map(id => parseFloat(document.getElementById(id).value) || 0);
  let cumulative = 0;
  const points = years.map(y => { cumulative += y; return cumulative; });
  const maxAbs = Math.max(...points.map(Math.abs), 1);
  const w = 60, gap = 12, baseY = 80;

  const bars = points.map((v, i) => {
    const h = Math.abs(v) / maxAbs * 60;
    const x = i * (w + gap);
    const y = v >= 0 ? baseY - h : baseY;
    const color = v >= 0 ? 'var(--ledger-green)' : 'var(--ledger-red)';
    return `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" fill="${color}" rx="2"></rect>
            <text x="${x + w/2}" y="${baseY + 16}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink-soft)">Y${i+1}</text>
            <text x="${x + w/2}" y="${v>=0 ? y - 6 : y + h + 14}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ink)">${v.toFixed(0)}</text>`;
  }).join('');

  const totalWidth = points.length * (w + gap) - gap;
  document.getElementById('jc-result').innerHTML = `
    <svg viewBox="0 -70 ${totalWidth} 170" width="100%" height="180" style="margin-top:8px">
      <line x1="0" y1="80" x2="${totalWidth}" y2="80" stroke="var(--paper-line)" stroke-width="1"></line>
      ${bars}
    </svg>
    <div class="check-line">Cumulative fund value over time &middot; green = above zero, red = below &mdash; this is the J-curve shape from Module 9.3, built from your own numbers</div>
  `;
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
