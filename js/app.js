/* ============================================
   CUTESY BOOTH — APP LOGIC
   app.js
   ============================================ */

'use strict';

// ── STATE ──
const State = {
  currentScreen: 1,
  shots: [],
  stream: null,
  shooting: false,
  currentFilter: '',
  currentTemplate: 0,
  currentTheme: 'cutesy',
};

// ── TEMPLATES ──
const TEMPLATES = [
  { name: 'Classic',  colors: ['#1B3A2D','#1B3A2D','#1B3A2D','#1B3A2D'] },
  { name: 'Rosy',     colors: ['#A63D5C','#1B3A2D','#A63D5C','#1B3A2D'] },
  { name: 'Garden',   colors: ['#2D5C42','#1B3A2D','#2D5C42','#1B3A2D'] },
  { name: 'Gold',     colors: ['#E8C84A','#1B3A2D','#E8C84A','#1B3A2D'] },
  { name: 'Blush',    colors: ['#FDE8EF','#A63D5C','#FDE8EF','#A63D5C'] },
  { name: 'Forest',   colors: ['#0F2419','#2D5C42','#0F2419','#2D5C42'] },
  { name: 'Petal',    colors: ['#F0A0B8','#1B3A2D','#F0A0B8','#1B3A2D'] },
  { name: 'Moody',    colors: ['#1a1a1a','#1B3A2D','#1a1a1a','#1B3A2D'] },
  { name: 'Cream',    colors: ['#FFF8DC','#2D5C42','#FFF8DC','#2D5C42'] },
  { name: 'Noir',     colors: ['#111111','#222222','#111111','#222222'] },
  { name: 'Spring',   colors: ['#FDE8EF','#E8C84A','#FDE8EF','#E8C84A'] },
  { name: 'Olive',    colors: ['#3D4A1E','#2D5C42','#3D4A1E','#2D5C42'] },
];

// ── CURSOR ──
const cursor = document.getElementById('cur');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  const interactive = e.target.closest('button, a, .choice-card, .filter-card, .template-card, .filter-chip, .t-arr, .social-btn, .scissors-btn, .theme-btn');
  if (interactive) cursor.classList.add('big');
  else cursor.classList.remove('big');
});


// ── THEME ──
function setTheme(theme) {
  State.currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  localStorage.setItem('cb-theme', theme);
}

// Load saved theme
(function initTheme() {
  const saved = localStorage.getItem('cb-theme') || 'cutesy';
  setTheme(saved);
})();


// ── SCREEN NAVIGATION ──
function goTo(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s' + n).classList.add('active');
  State.currentScreen = n;

  // update dots
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('d' + i);
    if (!d) continue;
    d.classList.remove('active', 'done');
    if (i + 1 < n)  d.classList.add('done');
    if (i + 1 === n) d.classList.add('active');
  }

  if (n === 3) startPrinting();
  if (n === 4) populateResult();
}


// ── FILTER ──
function setFilter(el, f) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  State.currentFilter = f;
  const v = document.getElementById('video');
  if (v) v.className = f || '';

  // sync filter modal
  document.querySelectorAll('.filter-card').forEach(c => {
    const match = c.dataset.filter === f;
    c.classList.toggle('factive', match);
  });
}

function openFilterModal() {
  openModal('filter-modal');
}

function setFilterFromModal(el, f) {
  document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('factive'));
  el.classList.add('factive');
  State.currentFilter = f;
  const v = document.getElementById('video');
  if (v) v.className = f || '';
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === f);
  });
}


// ── TEMPLATES ──
function buildTemplates() {
  const grid = document.getElementById('template-grid');
  if (!grid) return;
  grid.innerHTML = '';
  TEMPLATES.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'template-card' + (i === 0 ? ' tactive' : '');
    card.dataset.index = i;
    card.onclick = () => selectTemplate(i);
    card.innerHTML = `
      <div class="tc-strip">
        ${t.colors.map(c => `<div class="tc-frame" style="background:${c}"></div>`).join('')}
      </div>
      <div class="template-name">${t.name}</div>`;
    grid.appendChild(card);
  });
}

function selectTemplate(i) {
  State.currentTemplate = i;
  document.querySelectorAll('.template-card').forEach((c, j) => c.classList.toggle('tactive', j === i));
  updateTemplateMini();
  updateStripPreviewColors();
}

function updateTemplateMini() {
  const t = TEMPLATES[State.currentTemplate];
  const frames = document.querySelectorAll('#tmpl-mini .t-frame-mini');
  frames.forEach((f, i) => { f.style.background = t.colors[i] || '#1B3A2D'; });
}

function updateStripPreviewColors() {
  const t = TEMPLATES[State.currentTemplate];
  for (let i = 0; i < 4; i++) {
    const sp = document.getElementById('sp' + i);
    if (sp && !sp.querySelector('img')) sp.style.background = t.colors[i];
  }
}

function prevTemplate() {
  State.currentTemplate = (State.currentTemplate - 1 + TEMPLATES.length) % TEMPLATES.length;
  updateTemplateMini(); updateStripPreviewColors();
}

function nextTemplate() {
  State.currentTemplate = (State.currentTemplate + 1) % TEMPLATES.length;
  updateTemplateMini(); updateStripPreviewColors();
}

function openTemplateModal() {
  buildTemplates();
  openModal('template-modal');
}


// ── MODAL HELPERS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});


// ── CAMERA ──
async function startCamera() {
  if (State.stream) {
    beginShooting();
    return;
  }
  try {
    State.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    const v = document.getElementById('video');
    v.srcObject = State.stream;
    const led = document.getElementById('led');
    led.className = 'led green';
    document.getElementById('led-txt').textContent = 'LIVE';
    setStatus('Camera ready! 🎀');
    await sleep(600);
    beginShooting();
  } catch (err) {
    const led = document.getElementById('led');
    led.className = 'led red';
    document.getElementById('led-txt').textContent = 'NO CAM';
    setStatus('Camera blocked — try Upload instead.');
    showToast('📷 Camera not available. Use Upload Photos!');
  }
}

async function beginShooting() {
  if (State.shooting) return;
  if (State.shots.length >= 4) { showToast('Already 4 shots! Reset first ↺'); return; }
  State.shooting = true;
  const shootBtn = document.getElementById('shoot-btn');
  if (shootBtn) shootBtn.disabled = true;

  for (let i = State.shots.length; i < 4; i++) {
    updateIndicator(i, 'current');
    setStatus(`Shot ${i + 1} of 4 — pose! 🎀`);
    await countdown(3);
    doFlash();
    const data = captureFrame();
    State.shots.push(data);
    updateStripPreview(i, data);
    updateIndicator(i, 'done');
    setStatus(`✓ Shot ${i + 1} saved!`);
    if (i < 3) await sleep(700);
  }

  State.shooting = false;
  if (shootBtn) {
    shootBtn.disabled = false;
    shootBtn.innerHTML = '🎞 Print My Strip!';
    shootBtn.onclick = () => goTo(3);
  }
  setStatus('All 4 shots done! 🎉');
  showToast('4 shots ready! Print your strip 🎀');
}

function captureFrame() {
  const v = document.getElementById('video');
  const c = document.getElementById('cap-canvas');
  const w = v.videoWidth || 640;
  const h = v.videoHeight || 480;
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(w, 0); ctx.scale(-1, 1);
  ctx.drawImage(v, 0, 0, w, h);
  ctx.restore();
  applyCanvasFilter(ctx, w, h);
  return c.toDataURL('image/jpeg', 0.9);
}

function applyCanvasFilter(ctx, w, h) {
  if (!State.currentFilter) return;
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  const f = State.currentFilter;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i], g = px[i + 1], b = px[i + 2];
    if (f === 'bw' || f === 'noir') {
      const gr = 0.299 * r + 0.587 * g + 0.114 * b;
      px[i] = px[i + 1] = px[i + 2] = f === 'noir' ? Math.min(255, gr * 1.4 * 0.88) : gr;
    } else if (f === 'sepia') {
      px[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      px[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      px[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    } else if (f === 'fade') {
      px[i]     = Math.min(255, r * 0.85 + 30);
      px[i + 1] = Math.min(255, g * 0.82 + 28);
      px[i + 2] = Math.min(255, b * 0.78 + 35);
    } else if (f === 'vivid') {
      const avg = (r + g + b) / 3;
      px[i]     = Math.min(255, avg + (r - avg) * 1.5);
      px[i + 1] = Math.min(255, avg + (g - avg) * 1.5);
      px[i + 2] = Math.min(255, avg + (b - avg) * 1.5);
    }
  }
  ctx.putImageData(d, 0, 0);
}

async function countdown(sec) {
  const el = document.getElementById('countdown');
  let s = sec;
  el.style.opacity = '1';
  el.textContent = s;
  return new Promise(res => {
    const t = setInterval(() => {
      s--;
      if (s <= 0) { clearInterval(t); el.style.opacity = '0'; el.textContent = ''; res(); }
      else el.textContent = s;
    }, 1000);
  });
}

function doFlash() {
  const f = document.getElementById('flash');
  f.style.opacity = '1';
  setTimeout(() => f.style.opacity = '0', 120);
}


// ── UPLOAD ──
function triggerUpload() {
  document.getElementById('upload-input').click();
}

document.getElementById('upload-input').addEventListener('change', function () {
  const files = Array.from(this.files).slice(0, 4);
  if (!files.length) return;
  resetShots(false);
  let loaded = 0;
  files.forEach((file, i) => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('cap-canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        applyCanvasFilter(ctx, img.width, img.height);
        const data = c.toDataURL('image/jpeg', 0.9);
        State.shots[i] = data;
        updateStripPreview(i, data);
        updateIndicator(i, 'done');
        loaded++;
        if (loaded === files.length) {
          setStatus(`${files.length} photos loaded 🎀`);
          if (files.length === 4) {
            const btn = document.getElementById('shoot-btn');
            if (btn) { btn.innerHTML = '🎞 Print My Strip!'; btn.onclick = () => goTo(3); }
            showToast('4 photos ready! 🎀');
          }
        }
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
  this.value = '';
});


// ── UI HELPERS ──
function updateStripPreview(i, src) {
  const sp = document.getElementById('sp' + i);
  if (!sp) return;
  sp.className = 'sp-frame';
  sp.innerHTML = `<img src="${src}" alt="shot ${i + 1}">`;
}

function updateIndicator(i, state) {
  const el = document.getElementById('si' + i);
  if (!el) return;
  el.className = 'shot-ind';
  if (state === 'done')    el.classList.add('done');
  if (state === 'current') el.classList.add('current');
}

function setStatus(msg) {
  const el = document.getElementById('status-txt');
  if (el) el.textContent = msg;
}

function resetShots(showMsg = true) {
  State.shots = [];
  State.shooting = false;
  for (let i = 0; i < 4; i++) {
    const sp = document.getElementById('sp' + i);
    if (sp) { sp.innerHTML = '○'; sp.className = 'sp-frame'; }
    updateIndicator(i, '');
  }
  const btn = document.getElementById('shoot-btn');
  if (btn) { btn.innerHTML = '📸 Start Shooting'; btn.onclick = openChoiceModal; btn.disabled = false; }
  setStatus('ready to shoot!');
  if (showMsg) showToast('Reset! Ready for new shots 🎀');
}

function openChoiceModal() {
  openModal('choice-modal');
}


// ── PRINTING ──
function startPrinting() {
  // reset print slot
  const inner = document.getElementById('print-inner');
  if (inner) inner.classList.remove('printing');

  // populate frames
  for (let i = 0; i < 4; i++) {
    const ps = document.getElementById('ps' + i);
    if (!ps) continue;
    if (State.shots[i]) ps.innerHTML = `<img src="${State.shots[i]}" style="width:100%;height:100%;object-fit:cover;">`;
    else ps.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:.2;font-size:20px;">○</div>';
  }

  // animate strip sliding out
  setTimeout(() => { if (inner) inner.classList.add('printing'); }, 300);

  // countdown
  let n = 5;
  const numEl = document.getElementById('print-num');
  if (numEl) numEl.textContent = n;
  const pickupWrap = document.getElementById('pickup-wrap');
  if (pickupWrap) pickupWrap.classList.remove('show');

  const t = setInterval(() => {
    n--;
    if (numEl) numEl.textContent = n <= 0 ? '✓' : n;
    if (n <= 0) {
      clearInterval(t);
      if (pickupWrap) pickupWrap.classList.add('show');
    }
  }, 1000);
}


// ── RESULT ──
function populateResult() {
  const dateEl = document.getElementById('rs-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  for (let i = 0; i < 4; i++) {
    const rf = document.getElementById('rs' + i);
    if (!rf) continue;
    if (State.shots[i]) {
      rf.className = 'rs-frame';
      rf.innerHTML = `<img src="${State.shots[i]}" alt="photo ${i + 1}">`;
    }
  }
}


// ── DOWNLOAD ──
function downloadStrip() {
  if (State.shots.length === 0) { showToast('No photos yet! Shoot first 📸'); return; }
  const W = 500, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const t = TEMPLATES[State.currentTemplate];

  // background
  ctx.fillStyle = '#0F2419';
  ctx.roundRect(0, 0, W, H, 12);
  ctx.fill();

  // header
  ctx.fillStyle = '#E8C84A';
  ctx.font = 'bold italic 18px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ Cutesy Booth ✦', W / 2, 28);
  ctx.fillStyle = 'rgba(168,213,181,.35)';
  ctx.font = '10px monospace';
  ctx.fillText(new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }), W / 2, 44);

  const ph = (H - 90) / 4 - 10;
  const promises = State.shots.map((src, i) => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const py = 54 + i * (ph + 10);
      ctx.fillStyle = t.colors[i];
      ctx.roundRect(20, py, W - 40, ph, 4);
      ctx.fill();
      const sc = Math.min((W - 40) / img.width, ph / img.height);
      const dx = 20 + ((W - 40) - img.width * sc) / 2;
      const dy = py + (ph - img.height * sc) / 2;
      ctx.drawImage(img, dx, dy, img.width * sc, img.height * sc);
      ctx.fillStyle = 'rgba(168,213,181,.3)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('0' + (i + 1), W - 26, py + 14);
      res();
    };
    img.src = src;
  }));

  Promise.all(promises).then(() => {
    ctx.fillStyle = 'rgba(168,213,181,.2)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('cutesyphotobooth.com', W / 2, H - 8);
    const a = document.createElement('a');
    a.download = `cutesybooth-${Date.now()}.jpg`;
    a.href = c.toDataURL('image/jpeg', 0.92);
    a.click();
    showToast('Strip saved! Tag us @cutesybooth 🎀');
  });
}

function printStrip() {
  showToast('Opening print dialog 🖨');
  setTimeout(() => window.print(), 500);
}


// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}


// ── UTILS ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  updateTemplateMini();
  buildTemplates();
  setStatus('ready to shoot!');
});
