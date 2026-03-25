"use strict";

/* ============================================
   CUTESY BOOTH — CLEAN APP LOGIC
   ============================================ */

const State = {
  currentScreen: 1,
  shots: [],
  stream: null,
  shooting: false,
  currentFilter: "",
  currentTemplate: 0,
  currentTheme: "cutesy",
};

const TEMPLATES = [
  {
    name: "Classic",
    colors: ["#1B3A2D", "#1B3A2D", "#1B3A2D", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Rosy",
    colors: ["#A63D5C", "#1B3A2D", "#A63D5C", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Garden",
    colors: ["#2D5C42", "#1B3A2D", "#2D5C42", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Gold",
    colors: ["#E8C84A", "#1B3A2D", "#E8C84A", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Blush",
    colors: ["#FDE8EF", "#A63D5C", "#FDE8EF", "#A63D5C"],
    shots: 4,
  },
  {
    name: "Forest",
    colors: ["#0F2419", "#2D5C42", "#0F2419", "#2D5C42"],
    shots: 4,
  },
  {
    name: "Petal",
    colors: ["#F0A0B8", "#1B3A2D", "#F0A0B8", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Moody",
    colors: ["#1A1A1A", "#1B3A2D", "#1A1A1A", "#1B3A2D"],
    shots: 4,
  },
  {
    name: "Cream",
    colors: ["#FFF8DC", "#2D5C42", "#FFF8DC", "#2D5C42"],
    shots: 4,
  },
  {
    name: "Noir",
    colors: ["#111111", "#222222", "#111111", "#222222"],
    shots: 4,
  },

  /* Example PNG template:
  {
    name: "My Frame",
    frame: "images/template1.png",
    shots: 4
  }
  */
];

/* ──────────────────────────────────────────
   THEME
────────────────────────────────────────── */
function setTheme(theme) {
  State.currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.checked = theme === "cutesy";
  const lm = document.getElementById("toggle-label-minimal");
  const lc = document.getElementById("toggle-label-cutesy");
  if (lm) lm.style.opacity = theme === "minimalist" ? "1" : "0.45";
  if (lc) lc.style.opacity = theme === "cutesy" ? "1" : "0.45";
  localStorage.setItem("cb-theme", theme);
}

/* ──────────────────────────────────────────
   SCREEN NAVIGATION
────────────────────────────────────────── */
function goTo(n) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const next = document.getElementById("s" + n);
  if (next) {
    next.classList.add("active");
    next.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  State.currentScreen = n;
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById("d" + i);
    if (!d) continue;
    d.classList.remove("active", "done");
    if (i + 1 < n) d.classList.add("done");
    if (i + 1 === n) d.classList.add("active");
  }
  if (n === 2) initMobileS2();
  if (n === 3) { startPrinting(); hideMobileStrip(true); }
  if (n === 4) { populateResult(); hideMobileStrip(false); }
  if (n === 1 || n === 2) hideMobileStrip(false);
}

/* ──────────────────────────────────────────
   FILTERS
────────────────────────────────────────── */
function setFilter(el, filterName) {
  document
    .querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));
  if (el) el.classList.add("active");

  State.currentFilter = filterName;
  const video = document.getElementById("video");
  if (video) video.className = filterName || "";

  document.querySelectorAll(".filter-card").forEach((c) => {
    c.classList.toggle("factive", c.dataset.filter === filterName);
  });
}

function openFilterModal() {
  openModal("filter-modal");
}

function setFilterFromModal(el, filterName) {
  document
    .querySelectorAll(".filter-card")
    .forEach((c) => c.classList.remove("factive"));
  if (el) el.classList.add("factive");

  State.currentFilter = filterName;
  const video = document.getElementById("video");
  if (video) video.className = filterName || "";

  document.querySelectorAll(".filter-chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.filter === filterName);
  });
}

/* ──────────────────────────────────────────
   TEMPLATES
────────────────────────────────────────── */
function buildTemplates() {
  const grid = document.getElementById("template-grid");
  if (!grid) return;

  grid.innerHTML = "";

  TEMPLATES.forEach((t, i) => {
    const card = document.createElement("div");
    card.className =
      "template-card" + (i === State.currentTemplate ? " tactive" : "");
    card.onclick = () => selectTemplate(i);

    if (t.frame) {
      card.innerHTML = `
        <div class="tc-frame-preview">
          <img src="${t.frame}" alt="${t.name}">
        </div>
        <div class="template-name">${t.name}</div>
        <div class="template-badge">${t.shots || 4} shots</div>
      `;
    } else {
      card.innerHTML = `
        <div class="tc-strip">
          ${(t.colors || [])
            .map((c) => `<div class="tc-frame" style="background:${c}"></div>`)
            .join("")}
        </div>
        <div class="template-name">${t.name}</div>
        <div class="template-badge">${t.shots || 4} shots</div>
      `;
    }

    grid.appendChild(card);
  });
}

function selectTemplate(i) {
  State.currentTemplate = i;

  document.querySelectorAll(".template-card").forEach((c, j) => {
    c.classList.toggle("tactive", j === i);
  });

  syncTemplateUI();
}

function prevTemplate() {
  State.currentTemplate =
    (State.currentTemplate - 1 + TEMPLATES.length) % TEMPLATES.length;
  syncTemplateUI();
}

function nextTemplate() {
  State.currentTemplate = (State.currentTemplate + 1) % TEMPLATES.length;
  syncTemplateUI();
}

function syncTemplateUI() {
  updateTemplateMini();
  updateStripPreview();
  showFrameOverlay(State.currentTemplate);
  applyTemplateToPrintPreview();
  applyTemplateToResultStrip();
  buildTemplates();
  resetShots(false);
}

function openTemplateModal() {
  buildTemplates();
  openModal("template-modal");
}

function updateTemplateMini() {
  const t = TEMPLATES[State.currentTemplate];
  const layout = State.currentLayout || "A";
  const mini = document.getElementById("tmpl-mini");
  if (!mini) return;

  // Reset styles
  mini.style.backgroundImage = "none";
  mini.style.backgroundSize = "";
  mini.style.backgroundRepeat = "";

  const c = (i) => t.colors?.[i] || t.colors?.[0] || "#1B3A2D";

  if (t.frame) {
    mini.style.backgroundImage = `url('${t.frame}')`;
    mini.style.backgroundSize = "100% 100%";
    mini.style.backgroundRepeat = "no-repeat";
    mini.innerHTML = "";
    applyLayoutToMini(mini, layout);
    return;
  }

  if (layout === "A" || layout === "C") {
    // 4 portrait frames stacked vertically
    mini.style.flexDirection = "column";
    mini.style.display = "flex";
    mini.style.gridTemplateColumns = "";
    mini.innerHTML = `
      <div class="t-frame-mini" style="background:${c(0)};flex:1"></div>
      <div class="t-frame-mini" style="background:${c(1)};flex:1"></div>
      <div class="t-frame-mini" style="background:${c(2)};flex:1"></div>
      <div class="t-frame-mini" style="background:${c(3)};flex:1"></div>
    `;
    if (layout === "C") {
      mini.style.background = "#fff";
      mini.style.padding = "4px 8px";
    } else {
      mini.style.background = "";
      mini.style.padding = "";
    }

  } else if (layout === "B") {
    // 2x2 grid
    mini.style.display = "grid";
    mini.style.gridTemplateColumns = "1fr 1fr";
    mini.style.gridTemplateRows = "1fr 1fr";
    mini.style.gap = "3px";
    mini.style.padding = "3px";
    mini.style.flexDirection = "";
    mini.style.background = "";
    mini.innerHTML = `
      <div class="t-frame-mini" style="background:${c(0)};border-radius:3px"></div>
      <div class="t-frame-mini" style="background:${c(1)};border-radius:3px"></div>
      <div class="t-frame-mini" style="background:${c(2)};border-radius:3px"></div>
      <div class="t-frame-mini" style="background:${c(3)};border-radius:3px"></div>
    `;

  } else if (layout === "D") {
    // 3 portrait frames + empty bottom space
    mini.style.display = "flex";
    mini.style.flexDirection = "column";
    mini.style.gridTemplateColumns = "";
    mini.style.background = "";
    mini.style.padding = "";
    mini.innerHTML = `
      <div class="t-frame-mini" style="background:${c(0)};flex:1"></div>
      <div class="t-frame-mini" style="background:${c(1)};flex:1"></div>
      <div class="t-frame-mini" style="background:${c(2)};flex:1"></div>
      <div class="t-frame-mini" style="background:transparent;flex:1.5;border:1px dashed rgba(255,255,255,0.2)"></div>
    `;
  }
}

function applyLayoutToMini(mini, layout) {
  // For frame image templates, just adjust shape
  if (layout === "B") {
    mini.style.display = "grid";
    mini.style.gridTemplateColumns = "1fr 1fr";
  } else {
    mini.style.display = "flex";
    mini.style.flexDirection = "column";
  }
}

function updateStripPreview() {
  const t = TEMPLATES[State.currentTemplate];
  const film = document.getElementById("sp-film");
  if (!film) return;

  if (t.frame) {
    film.style.backgroundImage = `url('${t.frame}')`;
    film.style.backgroundSize = "100% 100%";
    film.style.backgroundRepeat = "no-repeat";
    film.style.backgroundColor = "transparent";
  } else {
    film.style.backgroundImage = "none";
    film.style.backgroundColor = t.colors?.[0] || "#0F2419";

    for (let i = 0; i < 4; i++) {
      const frame = document.getElementById("sp" + i);
      if (frame) {
        frame.style.background = t.colors?.[i] || t.colors?.[0] || "#1B3A2D";
      }
    }
  }
}

function showFrameOverlay(i) {
  const overlay = document.getElementById("frame-overlay");
  if (!overlay) return;

  const t = TEMPLATES[i];

  if (t.frame) {
    overlay.style.display = "block";
    overlay.style.backgroundImage = `url('${t.frame}')`;
    overlay.style.backgroundSize = "100% 100%";
    overlay.style.backgroundRepeat = "no-repeat";
  } else {
    overlay.style.display = "none";
    overlay.style.backgroundImage = "none";
  }
}

function applyTemplateToPrintPreview() {
  const t = TEMPLATES[State.currentTemplate];
  const inner = document.getElementById("print-inner");
  if (!inner) return;

  if (t.frame) {
    inner.style.backgroundImage = `url('${t.frame}')`;
    inner.style.backgroundSize = "100% 100%";
    inner.style.backgroundRepeat = "no-repeat";
    inner.style.backgroundColor = "transparent";
  } else {
    inner.style.backgroundImage = "none";
    inner.style.backgroundColor = t.colors?.[0] || "#0F2419";

    for (let i = 0; i < 4; i++) {
      const frame = document.getElementById("ps" + i);
      if (frame) {
        frame.style.background = t.colors?.[i] || t.colors?.[0] || "#1B3A2D";
      }
    }
  }
}

function applyTemplateToResultStrip() {
  const t = TEMPLATES[State.currentTemplate];
  const strip = document.getElementById("result-strip");
  if (!strip) return;

  if (t.frame) {
    strip.style.backgroundImage = `url('${t.frame}')`;
    strip.style.backgroundSize = "100% 100%";
    strip.style.backgroundRepeat = "no-repeat";
    strip.style.backgroundColor = "transparent";
  } else {
    strip.style.backgroundImage = "none";
    strip.style.backgroundColor = t.colors?.[0] || "#0F2419";

    for (let i = 0; i < 4; i++) {
      const frame = document.getElementById("rs" + i);
      if (frame) {
        frame.style.background = t.colors?.[i] || t.colors?.[0] || "#1B3A2D";
      }
    }
  }
}

/* ──────────────────────────────────────────
   MODALS
────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
  if (id === "suggestions-modal") {
    const form = document.getElementById("suggestion-form");
    const success = document.getElementById("suggestion-success");
    if (form) form.style.display = "block";
    if (success) success.style.display = "none";
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

function openChoiceModal() {
  openModal("choice-modal");
}

/* ──────────────────────────────────────────
   CAMERA
────────────────────────────────────────── */
async function startCamera() {
  if (State.stream) {
    beginShooting();
    return;
  }

  try {
    State.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    const v = document.getElementById("video");
    if (v) v.srcObject = State.stream;

    const led = document.getElementById("led");
    const ledTxt = document.getElementById("led-txt");
    if (led) led.className = "led green";
    if (ledTxt) ledTxt.textContent = "LIVE";

    setStatus("Camera ready! 🎀");
    await sleep(400);
    beginShooting();
  } catch (err) {
    const led = document.getElementById("led");
    const ledTxt = document.getElementById("led-txt");
    if (led) led.className = "led red";
    if (ledTxt) ledTxt.textContent = "NO CAM";

    setStatus("Camera blocked — use Upload instead.");
    showToast("📷 Camera not available. Use Upload Photos.");
  }
}

async function beginShooting() {
  if (State.shooting) return;

  const totalShots = TEMPLATES[State.currentTemplate].shots || 4;
  if (State.shots.length >= totalShots) {
    showToast("Already complete. Reset first ↺");
    return;
  }

  State.shooting = true;

  const shootBtn = document.getElementById("shoot-btn");
  if (shootBtn) shootBtn.disabled = true;

  for (let i = State.shots.length; i < totalShots; i++) {
    updateIndicator(i, "current");
    setStatus(`Shot ${i + 1} of ${totalShots} — pose! 🎀`);
    await countdown(3);
    doFlash();

    const data = captureFrame();
    State.shots.push(data);
    updateStripFrame(i, data);
    updateIndicator(i, "done");
    setStatus(`✓ Shot ${i + 1} saved!`);

    if (i < totalShots - 1) await sleep(600);
  }

  State.shooting = false;

  if (shootBtn) {
    shootBtn.disabled = false;
    shootBtn.innerHTML = "🎞 Print My Strip!";
    shootBtn.onclick = () => goTo(3);
  }

  setStatus("All shots done! 🎉");
  showToast("Your strip is ready.");
}

function captureFrame() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("cap-canvas");

  const w = video.videoWidth || 720;
  const h = video.videoHeight || 960;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  applyCanvasFilter(ctx, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function applyCanvasFilter(ctx, w, h) {
  const filterName = State.currentFilter;
  if (!filterName) return;

  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const avg = (r + g + b) / 3;

    if (filterName === "bw") {
      px[i] = avg;
      px[i + 1] = avg;
      px[i + 2] = avg;
    }

    if (filterName === "sepia") {
      px[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      px[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      px[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }

    if (filterName === "fade") {
      px[i] = Math.min(255, r * 1.03 + 12);
      px[i + 1] = Math.min(255, g * 1.03 + 12);
      px[i + 2] = Math.min(255, b * 1.03 + 12);
    }

    if (filterName === "noir") {
      const v = avg * 0.92;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }

    if (filterName === "vivid") {
      px[i] = Math.min(255, avg + (r - avg) * 1.5);
      px[i + 1] = Math.min(255, avg + (g - avg) * 1.5);
      px[i + 2] = Math.min(255, avg + (b - avg) * 1.5);
    }
  }

  ctx.putImageData(d, 0, 0);
}

async function countdown(sec) {
  const el = document.getElementById("countdown");
  if (!el) return;

  let s = sec;
  el.style.opacity = "1";
  el.textContent = s;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      s--;
      if (s <= 0) {
        clearInterval(timer);
        el.style.opacity = "0";
        el.textContent = "";
        resolve();
      } else {
        el.textContent = s;
      }
    }, 1000);
  });
}

function doFlash() {
  const f = document.getElementById("flash");
  if (!f) return;
  f.style.opacity = "1";
  setTimeout(() => {
    f.style.opacity = "0";
  }, 120);
}

/* ──────────────────────────────────────────
   UPLOAD
────────────────────────────────────────── */
function triggerUpload() {
  const input = document.getElementById("upload-input");
  if (input) input.click();
}

function setupUploadHandler() {
  const input = document.getElementById("upload-input");
  if (!input) return;

  input.addEventListener("change", function () {
    const files = Array.from(this.files || []).slice(0, 4);
    if (!files.length) return;

    resetShots(false);

    let loaded = 0;

    files.forEach((file, i) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const c = document.getElementById("cap-canvas");
          const ctx = c.getContext("2d");

          c.width = img.width;
          c.height = img.height;
          ctx.drawImage(img, 0, 0);

          applyCanvasFilter(ctx, img.width, img.height);

          const data = c.toDataURL("image/jpeg", 0.92);
          State.shots[i] = data;
          updateStripFrame(i, data);
          updateIndicator(i, "done");

          loaded++;

          if (loaded === files.length) {
            const btn = document.getElementById("shoot-btn");
            if (btn) {
              btn.innerHTML = "🎞 Print My Strip!";
              btn.onclick = () => goTo(3);
            }
            setStatus(`${files.length} photos loaded 🎀`);
            showToast("Photos ready.");
          }
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });

    this.value = "";
  });
}

/* ──────────────────────────────────────────
   UI HELPERS
────────────────────────────────────────── */
function updateStripFrame(i, src) {
  const sp = document.getElementById("sp" + i);
  if (!sp) return;

  sp.className = "sp-frame";
  sp.innerHTML = `<img src="${src}" alt="shot ${i + 1}">`;
}

function updateIndicator(i, state) {
  const el = document.getElementById("si" + i);
  if (!el) return;

  el.className = "shot-ind";
  if (state === "done") el.classList.add("done");
  if (state === "current") el.classList.add("current");
}

function setStatus(msg) {
  const el = document.getElementById("status-txt");
  if (el) el.textContent = msg;
}

function resetShots(showMessage = true) {
  State.shots = [];
  State.shooting = false;

  for (let i = 0; i < 4; i++) {
    const sp = document.getElementById("sp" + i);
    if (sp) {
      sp.innerHTML = "○";
      sp.className = "sp-frame";
    }
    updateIndicator(i, "");
  }

  updateStripPreview();
  applyTemplateToPrintPreview();
  applyTemplateToResultStrip();

  const btn = document.getElementById("shoot-btn");
  if (btn) {
    btn.innerHTML = "📸 Start Shooting";
    btn.onclick = openChoiceModal;
    btn.disabled = false;
  }

  setStatus("ready to shoot!");
  if (showMessage) showToast("Reset! Ready for new shots 🎀");
}

/* ──────────────────────────────────────────
   PRINTING
────────────────────────────────────────── */
function startPrinting() {
  const inner = document.getElementById("print-inner");
  if (inner) inner.classList.remove("printing");

  const layout = State.currentLayout || "A";
  const shotCount = layout === "D" ? 3 : 4;
  const t = TEMPLATES[State.currentTemplate];

  // Rebuild print frame structure for current layout
  updateResultPreviewLayout();

  for (let i = 0; i < shotCount; i++) {
    const ps = document.getElementById("ps" + i);
    if (!ps) continue;
    if (State.shots[i]) {
      ps.innerHTML = `<img src="${State.shots[i]}" style="width:100%;height:100%;object-fit:cover;" alt="print ${i + 1}">`;
    } else {
      ps.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:.2;font-size:20px;">○</div>';
    }
    if (!t.frame) {
      ps.style.setProperty("background", t.colors?.[i] || t.colors?.[0] || "#1B3A2D", "important");
    }
  }

  applyTemplateToPrintPreview();

  setTimeout(() => {
    if (inner) inner.classList.add("printing");
  }, 250);

  let n = 5;
  const numEl = document.getElementById("print-num");
  if (numEl) numEl.textContent = n;

  const pickupWrap = document.getElementById("pickup-wrap");
  if (pickupWrap) pickupWrap.classList.remove("show");

  const timer = setInterval(() => {
    n--;
    if (numEl) numEl.textContent = n <= 0 ? "✓" : n;

    if (n <= 0) {
      clearInterval(timer);
      if (pickupWrap) pickupWrap.classList.add("show");
    }
  }, 1000);
}

/* ──────────────────────────────────────────
   RESULT
────────────────────────────────────────── */
function populateResult() {
  const layout = State.currentLayout || "A";
  const shotCount = layout === "D" ? 3 : 4;

  // Rebuild result strip structure for current layout
  updateResultPreviewLayout();

  const dateEl = document.getElementById("rs-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  const t = TEMPLATES[State.currentTemplate];

  for (let i = 0; i < shotCount; i++) {
    const rf = document.getElementById("rs" + i);
    if (!rf) continue;
    if (State.shots[i]) {
      rf.className = "rs-frame";
      rf.innerHTML = `<img src="${State.shots[i]}" alt="photo ${i + 1}">`;
    } else {
      rf.className = "rs-frame";
      rf.innerHTML = "○";
    }
    if (!t.frame) {
      const frameColor = t.colors?.[i] || t.colors?.[0] || "#1B3A2D";
      rf.style.setProperty("background", frameColor, "important");
      rf.style.setProperty("outline", `4px solid ${frameColor}`, "important");
      rf.style.setProperty("outline-offset", "-1px", "important");
    }
  }

  applyTemplateToResultStrip();
}

/* ──────────────────────────────────────────
   DOWNLOAD / PRINT
────────────────────────────────────────── */
/* ── Build canvas — layout aware ── */
function drawPhoto(ctx, src, x, y, w, h, radius) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
      else ctx.rect(x, y, w, h);
      ctx.clip();
      const scale = Math.max(w / img.width, h / img.height);
      const dx = x + (w - img.width * scale) / 2;
      const dy = y + (h - img.height * scale) / 2;
      ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
      ctx.restore();
      res();
    };
    img.onerror = () => res();
    img.src = src;
  });
}

function buildStripCanvas() {
  return new Promise((resolve) => {
    const t = TEMPLATES[State.currentTemplate];
    const layout = State.currentLayout || "A";
    const bgColor = t.colors?.[0] || "#0F2419";
    const radius = 10;
    let c, ctx, W, H, positions;

    // ── LAYOUT A: Classic strip — 4 portrait frames stacked (3:4 each) ──
    if (layout === "A") {
      W = 500;
      const PAD = 18, TOP = 48, BOT = 28, GAP = 10;
      const FW = W - PAD * 2;                   // 464px
      const FH = Math.round(FW * (4 / 3));       // 619px  ← matches 3:4 viewfinder
      H = TOP + 4 * FH + 3 * GAP + BOT;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      positions = Array.from({ length: 4 }, (_, i) => ({
        x: PAD, y: TOP + i * (FH + GAP), w: FW, h: FH,
        color: t.colors?.[i] || bgColor
      }));
      // Brand label
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 15px Georgia,serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Cutesy Booth", W / 2, 32);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "11px monospace";
      ctx.fillText("cutesyphotobooth.com", W / 2, H - 10);

    // ── LAYOUT B: 2x2 grid — each cell 3:4 portrait, large bottom border ──
    } else if (layout === "B") {
      W = 1000;
      const PAD = 30, GAP = 16, BOT_BORDER = 220;
      const FW = (W - PAD * 2 - GAP) / 2;       // each cell width
      const FH = Math.round(FW * (4 / 3));       // each cell height — 3:4 portrait
      H = PAD + 2 * FH + GAP + BOT_BORDER;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      positions = [
        { x: PAD,        y: PAD,        w: FW, h: FH, color: t.colors?.[0] || bgColor },
        { x: PAD+FW+GAP, y: PAD,        w: FW, h: FH, color: t.colors?.[1] || bgColor },
        { x: PAD,        y: PAD+FH+GAP, w: FW, h: FH, color: t.colors?.[2] || bgColor },
        { x: PAD+FW+GAP, y: PAD+FH+GAP, w: FW, h: FH, color: t.colors?.[3] || bgColor },
      ];
      // Branding in large bottom border
      const brandY = PAD + 2 * FH + GAP;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 44px Georgia,serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Cutesy Booth", W / 2, brandY + 90);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "22px monospace";
      ctx.fillText("cutesyphotobooth.com", W / 2, brandY + 140);

    // ── LAYOUT C: Bordered strip — white bg, 4 portrait frames, wide border ──
    } else if (layout === "C") {
      W = 500;
      const SIDE = 40, TOP = 60, BOT = 60, GAP = 8;
      const FW = W - SIDE * 2;                   // narrower frame
      const FH = Math.round(FW * (4 / 3));       // 3:4 portrait ← matches viewfinder
      H = TOP + 4 * FH + 3 * GAP + BOT;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      positions = Array.from({ length: 4 }, (_, i) => ({
        x: SIDE, y: TOP + i * (FH + GAP), w: FW, h: FH,
        color: t.colors?.[i] || "#e8e8e8"
      }));
      // Dark branding on white
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "bold 14px Georgia,serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Cutesy Booth", W / 2, 38);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.font = "10px monospace";
      ctx.fillText("cutesyphotobooth.com", W / 2, H - 18);

    // ── LAYOUT D: 3 portrait frames stacked + extra large bottom space for name/website ──
    } else if (layout === "D") {
      W = 500;
      const PAD = 18, TOP = 48, GAP = 10;
      const BOT_SPACE = 400;                     // extra large — room for name + website
      const FW = W - PAD * 2;
      const FH = Math.round(FW * (4 / 3));       // 3:4 portrait ← matches viewfinder
      H = TOP + 3 * FH + 2 * GAP + BOT_SPACE;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      positions = Array.from({ length: 3 }, (_, i) => ({
        x: PAD, y: TOP + i * (FH + GAP), w: FW, h: FH,
        color: t.colors?.[i] || bgColor
      }));
      // Brand label top
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 15px Georgia,serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Cutesy Booth", W / 2, 32);
      // Small watermark at very bottom
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "11px monospace";
      ctx.fillText("cutesyphotobooth.com", W / 2, H - 16);
    }

    // Fill frame backgrounds
    if (!t.frame) {
      positions.forEach(({ x, y, w, h, color }) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      });
    }

    // Draw photos
    const promises = positions.map(({ x, y, w, h }, i) => {
      if (!State.shots[i]) return Promise.resolve();
      return drawPhoto(ctx, State.shots[i], x, y, w, h, radius);
    });

    Promise.all(promises).then(() => {
      if (t.frame) {
        const fi = new Image();
        fi.onload = () => { ctx.drawImage(fi, 0, 0, W, H); resolve(c); };
        fi.onerror = () => resolve(c);
        fi.src = t.frame;
      } else {
        resolve(c);
      }
    });
  });
}

function downloadStrip() {
  if (!State.shots.length) {
    showToast("No photos yet! Shoot first 📸");
    return;
  }
  buildStripCanvas().then((c) => saveCanvas(c));
}

function saveCanvas(c) {
  const a = document.createElement("a");
  a.download = `cutesybooth-${Date.now()}.jpg`;
  a.href = c.toDataURL("image/jpeg", 0.92);
  a.click();
  showToast("Strip saved! 🎀");
}

function printStrip() {
  if (!State.shots.length) {
    showToast("No photos yet! Shoot first 📸");
    return;
  }
  showToast("Preparing print... 🖨");
  buildStripCanvas().then((c) => {
    const dataUrl = c.toDataURL("image/jpeg", 0.95);
    const win = window.open("", "_blank", "width=420,height=900");
    win.document.write(`<!DOCTYPE html><html><head><title>Cutesy Booth</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html,body { background:#fff; display:flex; justify-content:center; }
img { display:block; width:auto; max-width:100%; max-height:100vh; object-fit:contain; }
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  img { height:100%; max-height:277mm; max-width:90mm; }
}
</style></head><body>
<img src="${dataUrl}" alt="Cutesy Booth Strip">
<script>window.onload=function(){ setTimeout(function(){ window.print(); },400); };<\/script>
</body></html>`);
    win.document.close();
  });
}

/* ── LAYOUT SYSTEM ── */
// A = classic strip, B = 2x2 grid, C = bordered strip, D = 3+1
State.currentLayout = "A";

function setLayout(layout, btn) {
  State.currentLayout = layout;
  document.querySelectorAll(".layout-card").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  updateResultPreviewLayout();
  updateTemplateMini(); // update frame preview shape
}

function updateResultPreviewLayout() {
  const layout = State.currentLayout || "A";
  const shotCount = layout === "D" ? 3 : 4;

  // ── Update S2 sidebar strip preview ──
  const spFilm = document.querySelector(".sp-film");
  if (spFilm) {
    if (layout === "B") {
      // 2x2 grid in sidebar strip
      spFilm.style.display = "grid";
      spFilm.style.gridTemplateColumns = "1fr 1fr";
      spFilm.style.gridTemplateRows = "1fr 1fr";
      spFilm.style.gap = "3px";
      spFilm.style.padding = "4px";
      spFilm.style.flexDirection = "";
    } else {
      // vertical strip
      spFilm.style.display = "flex";
      spFilm.style.flexDirection = "column";
      spFilm.style.gridTemplateColumns = "";
      spFilm.style.gridTemplateRows = "";
      spFilm.style.gap = "";
      spFilm.style.padding = "";
    }
  }

  // ── Update S3 print preview frames ──
  const printInner = document.getElementById("print-inner");
  if (printInner) {
    // Rebuild frames
    let html = "";
    const count = shotCount;
    if (layout === "B") {
      printInner.style.display = "grid";
      printInner.style.gridTemplateColumns = "1fr 1fr";
      printInner.style.gap = "4px";
      printInner.style.padding = "4px";
      printInner.style.flexDirection = "";
      for (let i = 0; i < 4; i++) {
        html += `<div class="ps-frame" id="ps${i}">○</div>`;
      }
    } else {
      printInner.style.display = "";
      printInner.style.gridTemplateColumns = "";
      printInner.style.gap = "";
      printInner.style.padding = "";
      printInner.style.flexDirection = "";
      for (let i = 0; i < count; i++) {
        html += `<div class="ps-frame" id="ps${i}">○</div>`;
      }
      if (layout === "D") {
        // Large bottom space
        html += `<div class="ps-frame ps-frame-space" id="ps-space"></div>`;
      }
    }
    printInner.innerHTML = html;
  }

  // ── Update S4 result strip ──
  const resultStrip = document.getElementById("result-strip");
  if (resultStrip) {
    // Set layout data attribute for CSS
    resultStrip.dataset.layout = layout;

    // Adjust grid for layout B
    if (layout === "B") {
      resultStrip.style.display = "grid";
      resultStrip.style.gridTemplateColumns = "1fr 1fr";
      resultStrip.style.gridTemplateRows = "auto 1fr 1fr";
      resultStrip.style.gap = "4px";
      resultStrip.style.padding = "8px";
    } else {
      resultStrip.style.display = "flex";
      resultStrip.style.flexDirection = "column";
      resultStrip.style.gridTemplateColumns = "";
      resultStrip.style.gridTemplateRows = "";
      resultStrip.style.gap = "";
      resultStrip.style.padding = "";
    }

    // Rebuild result frames
    const header = `<div class="rs-header" ${layout === "B" ? 'style="grid-column:1/-1"' : ""}>
      <div class="rs-brand">✦ Cutesy Booth</div>
      <div class="rs-date" id="rs-date">${document.getElementById("rs-date")?.textContent || ""}</div>
    </div>`;

    let frames = "";
    for (let i = 0; i < shotCount; i++) {
      frames += `<div class="rs-frame" id="rs${i}">○</div>`;
    }

    const footer = layout === "D"
      ? `<div class="rs-frame rs-frame-space"></div>
         <div class="rs-footer" style="text-align:center">cutesyphotobooth.com</div>`
      : `<div class="rs-footer" ${layout === "B" ? 'style="grid-column:1/-1"' : ""}>cutesyphotobooth.com</div>`;

    resultStrip.innerHTML = header + frames + footer;
  }
}

/* ── MOBILE STEP SYSTEM ── */
function isMobile() { return window.innerWidth <= 600; }

function hideMobileStrip(hide) {
  if (!isMobile()) return;
  const strip = document.querySelector(".strip-preview-panel");
  if (strip) strip.style.display = hide ? "none" : "";
}

function mobileProceedToCamera() {
  const s2 = document.getElementById("s2");
  if (!s2) return;
  s2.classList.remove("mobile-step-1");
  s2.classList.add("mobile-step-2");
  s2.scrollTop = 0;
}

function mobileBackToFilters() {
  const s2 = document.getElementById("s2");
  if (!s2) return;
  s2.classList.remove("mobile-step-2");
  s2.classList.add("mobile-step-1");
  s2.scrollTop = 0;
}

function initMobileS2() {
  const s2 = document.getElementById("s2");
  if (!s2) return;
  if (isMobile()) {
    s2.classList.add("mobile-step-1");
    s2.classList.remove("mobile-step-2");
  } else {
    s2.classList.remove("mobile-step-1", "mobile-step-2");
  }
}

/* ── SUGGESTIONS ── */
let suggestionRating = 0;

function rateSuggestion(value) {
  suggestionRating = value;
  document.querySelectorAll(".star-btn").forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.value) <= value);
  });
}

function submitSuggestion() {
  const text = document.getElementById("suggestion-text")?.value.trim();
  if (!text) { showToast("Please write your suggestion first 🎀"); return; }
  const name = document.getElementById("suggestion-name")?.value.trim();
  const suggestions = JSON.parse(localStorage.getItem("cb-suggestions") || "[]");
  suggestions.push({
    name: name || "Anonymous", text,
    rating: suggestionRating,
    date: new Date().toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })
  });
  localStorage.setItem("cb-suggestions", JSON.stringify(suggestions));
  const form = document.getElementById("suggestion-form");
  const success = document.getElementById("suggestion-success");
  if (form) form.style.display = "none";
  if (success) success.style.display = "block";
  setTimeout(() => {
    const n = document.getElementById("suggestion-name");
    const t = document.getElementById("suggestion-text");
    const c = document.getElementById("suggestion-chars");
    if (n) n.value = "";
    if (t) t.value = "";
    if (c) c.textContent = "0";
    suggestionRating = 0;
    document.querySelectorAll(".star-btn").forEach(b => b.classList.remove("active"));
  }, 500);
}

/* ──────────────────────────────────────────
   TOAST / UTILS
────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2400);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const cursorEl = document.getElementById("cur");
  if (cursorEl) {
    document.addEventListener("mousemove", (e) => {
      cursorEl.style.left = e.clientX + "px";
      cursorEl.style.top = e.clientY + "px";
    });

    document.addEventListener("mouseover", (e) => {
      const hit = e.target.closest(
        "button, a, .choice-card, .filter-card, .template-card, .filter-chip, .t-arr, .social-btn, .scissors-btn, .theme-btn, .logo, .footer-link",
      );
      cursorEl.classList.toggle("big", !!hit);
    });
  }

  const saved = localStorage.getItem("cb-theme") || "cutesy";
  setTheme(saved);

  // Suggestion textarea character counter
  const suggText = document.getElementById("suggestion-text");
  const suggChars = document.getElementById("suggestion-chars");
  if (suggText && suggChars) {
    suggText.addEventListener("input", () => { suggChars.textContent = suggText.value.length; });
  }

  // Close suggestion modal on overlay click
  const suggModal = document.getElementById("suggestions-modal");
  if (suggModal) suggModal.addEventListener("click", (e) => { if (e.target === suggModal) closeModal("suggestions-modal"); });

  // Handle resize for mobile S2
  window.addEventListener("resize", () => { if (State.currentScreen === 2) initMobileS2(); });

  setupUploadHandler();
  updateTemplateMini();
  updateStripPreview();
  showFrameOverlay(State.currentTemplate);
  buildTemplates();
  setStatus("ready to shoot!");
});