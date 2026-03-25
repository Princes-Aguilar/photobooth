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
  if (n === 3) startPrinting();
  if (n === 4) populateResult();
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
  const mini = document.getElementById("tmpl-mini");
  if (!mini) return;

  if (t.frame) {
    mini.style.backgroundImage = `url('${t.frame}')`;
    mini.style.backgroundSize = "100% 100%";
    mini.style.backgroundRepeat = "no-repeat";
    mini.innerHTML = "";
  } else {
    mini.style.backgroundImage = "none";
    mini.innerHTML = `
      <div class="t-frame-mini" style="background:${t.colors?.[0] || "#1B3A2D"}"></div>
      <div class="t-frame-mini" style="background:${t.colors?.[1] || t.colors?.[0] || "#1B3A2D"}"></div>
      <div class="t-frame-mini" style="background:${t.colors?.[2] || t.colors?.[0] || "#1B3A2D"}"></div>
      <div class="t-frame-mini" style="background:${t.colors?.[3] || t.colors?.[0] || "#1B3A2D"}"></div>
    `;
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

  for (let i = 0; i < 4; i++) {
    const ps = document.getElementById("ps" + i);
    if (!ps) continue;

    if (State.shots[i]) {
      ps.innerHTML = `<img src="${State.shots[i]}" style="width:100%;height:100%;object-fit:cover;" alt="print ${i + 1}">`;
    } else {
      ps.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:.2;font-size:20px;">○</div>';
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
  const dateEl = document.getElementById("rs-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  for (let i = 0; i < 4; i++) {
    const rf = document.getElementById("rs" + i);
    if (!rf) continue;

    if (State.shots[i]) {
      rf.className = "rs-frame";
      rf.innerHTML = `<img src="${State.shots[i]}" alt="photo ${i + 1}">`;
    } else {
      rf.className = "rs-frame";
      rf.innerHTML = "○";
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
    let c, ctx, W, H, positions, bgColor, radius = 10;

    bgColor = t.colors?.[0] || "#0F2419";

    if (layout === "A") {
      // Classic vertical strip — 4 stacked portrait frames
      W = 500; 
      const PAD = 18, TOP = 48, BOT = 28, GAP = 10;
      const FW = W - PAD * 2;
      const FH = Math.round(FW * (4 / 3));
      H = TOP + 4 * FH + 3 * GAP + BOT;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      positions = Array.from({ length: 4 }, (_, i) => ({
        x: PAD, y: TOP + i * (FH + GAP), w: FW, h: FH,
        color: t.colors?.[i] || bgColor
      }));

    } else if (layout === "B") {
      // 2x2 grid — square output
      W = 1000; H = 1000;
      const PAD = 20, GAP = 12;
      const FW = (W - PAD * 2 - GAP) / 2;
      const FH = (H - PAD * 2 - GAP) / 2;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      positions = [
        { x: PAD,        y: PAD,        w: FW, h: FH, color: t.colors?.[0] || bgColor },
        { x: PAD+FW+GAP, y: PAD,        w: FW, h: FH, color: t.colors?.[1] || bgColor },
        { x: PAD,        y: PAD+FH+GAP, w: FW, h: FH, color: t.colors?.[2] || bgColor },
        { x: PAD+FW+GAP, y: PAD+FH+GAP, w: FW, h: FH, color: t.colors?.[3] || bgColor },
      ];

    } else if (layout === "C") {
      // Bordered strip — white background wide border
      W = 500;
      const BORDER = 40, GAP = 8, TOP = 60, BOT = 70;
      const FW = W - BORDER * 2;
      const FH = Math.round(FW * (4 / 3));
      H = TOP + 4 * FH + 3 * GAP + BOT;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      // White background
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      positions = Array.from({ length: 4 }, (_, i) => ({
        x: BORDER, y: TOP + i * (FH + GAP), w: FW, h: FH,
        color: t.colors?.[i] || "#f0f0f0"
      }));

    } else if (layout === "D") {
      // 3 small stacked top + 1 large bottom
      W = 500;
      const PAD = 18, TOP = 48, BOT = 28, GAP = 10;
      const FW = W - PAD * 2;
      const FH_SM = Math.round(FW * (3 / 4)); // landscape small
      const FH_LG = Math.round(FW * (4 / 3)); // portrait large
      H = TOP + 3 * FH_SM + 2 * GAP + GAP + FH_LG + BOT;
      c = document.createElement("canvas"); c.width = W; c.height = H;
      ctx = c.getContext("2d");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      const yLarge = TOP + 3 * FH_SM + 3 * GAP;
      positions = [
        { x: PAD, y: TOP,                    w: FW, h: FH_SM, color: t.colors?.[0] || bgColor },
        { x: PAD, y: TOP + FH_SM + GAP,      w: FW, h: FH_SM, color: t.colors?.[1] || bgColor },
        { x: PAD, y: TOP + 2*(FH_SM + GAP),  w: FW, h: FH_SM, color: t.colors?.[2] || bgColor },
        { x: PAD, y: yLarge,                 w: FW, h: FH_LG, color: t.colors?.[3] || bgColor },
      ];
    }

    // Fill frame background colors
    if (!t.frame) {
      positions.forEach(({ x, y, w, h, color }) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      });
    }

    // Brand label (not on grid layout)
    if (layout !== "B") {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `bold ${layout === "C" ? "13px" : "15px"} Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("✦ Cutesy Booth", W / 2, layout === "C" ? 40 : 30);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.font = "11px monospace";
      ctx.fillText("cutesyphotobooth.com", W / 2, H - (layout === "C" ? 20 : 10));
    } else {
      // Grid: watermark bottom center
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("cutesyphotobooth.com", W / 2, H - 8);
    }

    const promises = State.shots.map((src, i) => {
      if (!positions[i]) return Promise.resolve();
      const { x, y, w, h } = positions[i];
      return drawPhoto(ctx, src, x, y, w, h, radius);
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
  // Update shots count based on layout
  // All layouts use 4 shots for now
  updateResultPreviewLayout();
}

function updateResultPreviewLayout() {
  // Update the template-mini preview shape to match layout
  const mini = document.getElementById("tmpl-mini");
  if (!mini) return;
  mini.dataset.layout = State.currentLayout || "A";
}

/* ── MOBILE STEP SYSTEM ── */
function isMobile() { return window.innerWidth <= 600; }

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