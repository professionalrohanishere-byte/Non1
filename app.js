(function () {
  "use strict";

  const MODULES = [
    { key: "tasks",    label: "TASKS",    desig: "OP-01", icon: "✓", placeholder: "Log a new directive…", hasStatus: true },
    { key: "thoughts", label: "THOUGHTS", desig: "OP-02", icon: "✴", placeholder: "Capture a passing thought…", hasStatus: false },
    { key: "plans",    label: "PLANS",    desig: "OP-03", icon: "⌖", placeholder: "Chart a plan…", hasStatus: true },
    { key: "dreams",   label: "DREAMS",   desig: "OP-04", icon: "✦", placeholder: "Record a dream, big or small…", hasStatus: false },
    { key: "projects", label: "PROJECTS", desig: "OP-05", icon: "▲", placeholder: "Initiate a new project…", hasStatus: true },
  ];

  const STORAGE_PREFIX = "personalos:";
  let active = "tasks";
  let data = {};

  /* ---------------- storage (local device only) ---------------- */
  function loadAll() {
    MODULES.forEach((m) => {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + m.key);
        data[m.key] = raw ? JSON.parse(raw) : [];
      } catch (e) {
        data[m.key] = [];
      }
    });
  }
  function save(key) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data[key]));
    } catch (e) {
      console.error("storage failed", e);
    }
  }

  /* ---------------- boot sequence ---------------- */
  function boot() {
    const bootScreen = document.getElementById("boot-screen");
    const app = document.getElementById("app");
    const pctEl = document.getElementById("boot-pct");
    const barEl = document.getElementById("boot-bar-fill");
    let pct = 0;
    const t = setInterval(() => {
      pct += Math.random() * 22;
      if (pct >= 100) {
        pct = 100;
        clearInterval(t);
        setTimeout(() => {
          bootScreen.classList.add("hidden");
          app.classList.remove("hidden");
          init();
        }, 250);
      }
      pctEl.textContent = Math.floor(pct) + "%";
      barEl.style.width = pct + "%";
    }, 90);
  }

  /* ---------------- clock ---------------- */
  function tickClock() {
    const el = document.getElementById("clock");
    function update() {
      const now = new Date();
      const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
      const time = now.toLocaleTimeString(undefined, { hour12: false });
      el.textContent = date + " · " + time;
    }
    update();
    setInterval(update, 1000);
  }

  /* ---------------- status ring (SVG) ---------------- */
  function renderRing() {
    const total = MODULES.reduce((s, m) => s + data[m.key].length, 0);
    const done = MODULES.reduce((s, m) => s + data[m.key].filter((i) => i.done).length, 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const size = 96, r = size / 2 - 8, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    document.getElementById("ring-slot").innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
          <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(79,216,255,0.12)" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#g)" stroke-width="2.5"
            stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
            style="transition:stroke-dashoffset 0.7s ease"/>
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4fd8ff"/>
              <stop offset="100%" stop-color="#ffb020"/>
            </linearGradient>
          </defs>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-family:Orbitron,sans-serif;font-size:19px;font-weight:700;color:#67e0ff;">${pct}%</span>
          <span style="font-size:8px;letter-spacing:0.2em;color:rgba(79,216,255,0.5);">SYNCED</span>
        </div>
      </div>`;
  }

  /* ---------------- nav rendering ---------------- */
  function renderNav() {
    const nav = document.getElementById("nav-buttons");
    nav.innerHTML = "";
    MODULES.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = "nav-btn" + (m.key === active ? " active" : "");
      btn.innerHTML = `
        <span class="icon">${m.icon}</span>
        <span class="txt">
          <div class="label">${m.label}</div>
          <div class="desig">${m.desig}</div>
        </span>
        <span class="count">${data[m.key].length}</span>`;
      btn.onclick = () => setActive(m.key);
      nav.appendChild(btn);
    });

    const mnav = document.getElementById("mobile-nav");
    mnav.innerHTML = "";
    MODULES.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = "mobile-nav-btn" + (m.key === active ? " active" : "");
      btn.innerHTML = `${m.icon} ${m.label}`;
      btn.onclick = () => setActive(m.key);
      mnav.appendChild(btn);
    });
  }

  function setActive(key) {
    active = key;
    renderNav();
    renderPanel();
  }

  /* ---------------- main panel ---------------- */
  function renderPanel() {
    const mod = MODULES.find((m) => m.key === active);
    document.getElementById("panel-icon").textContent = mod.icon;
    document.getElementById("panel-title").textContent = mod.label;
    document.getElementById("panel-meta").textContent = `${mod.desig} · ${data[mod.key].length} LOGGED`;
    document.getElementById("entry-input").placeholder = mod.placeholder;
    renderList();
  }

  function renderList() {
    const mod = MODULES.find((m) => m.key === active);
    const list = document.getElementById("entry-list");
    const items = data[mod.key];
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">NO ENTRIES — CHANNEL IS OPEN</div>`;
      return;
    }
    items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "entry" + (it.done ? " done" : "");
      const marker = mod.hasStatus
        ? `<button class="entry-toggle" data-id="${it.id}">${it.done ? "✔" : "○"}</button>`
        : `<span class="entry-dot"></span>`;
      row.innerHTML = `
        ${marker}
        <span class="entry-text">${escapeHtml(it.text)}</span>
        <button class="entry-del" data-id="${it.id}">✕</button>`;
      list.appendChild(row);
    });

    list.querySelectorAll(".entry-toggle").forEach((b) =>
      b.addEventListener("click", () => toggleItem(active, b.dataset.id))
    );
    list.querySelectorAll(".entry-del").forEach((b) =>
      b.addEventListener("click", () => deleteItem(active, b.dataset.id))
    );
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  /* ---------------- overview rail ---------------- */
  function renderOverview() {
    const el = document.getElementById("overview-bars");
    el.innerHTML = "";
    MODULES.forEach((m) => {
      const list = data[m.key];
      const done = list.filter((i) => i.done).length;
      const pct = m.hasStatus ? (list.length ? Math.round((done / list.length) * 100) : 0) : (list.length ? 100 : 0);
      const item = document.createElement("div");
      item.className = "overview-item";
      item.innerHTML = `
        <div class="overview-top"><span>${m.label}</span><span>${m.hasStatus ? done + "/" + list.length : list.length}</span></div>
        <div class="overview-track"><div class="overview-fill" style="width:${pct}%"></div></div>`;
      el.appendChild(item);
    });
  }

  /* ---------------- mutations ---------------- */
  function addItem() {
    const input = document.getElementById("entry-input");
    const text = input.value.trim();
    if (!text) return;
    const item = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 7), text, done: false, createdAt: new Date().toISOString() };
    data[active].unshift(item);
    save(active);
    input.value = "";
    renderAll();
  }
  function toggleItem(key, id) {
    data[key] = data[key].map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    save(key);
    renderAll();
  }
  function deleteItem(key, id) {
    data[key] = data[key].filter((it) => it.id !== id);
    save(key);
    renderAll();
  }

  function renderAll() {
    renderNav();
    renderPanel();
    renderOverview();
    renderRing();
  }

  /* ---------------- init ---------------- */
  function init() {
    loadAll();
    tickClock();
    renderAll();

    document.getElementById("log-btn").addEventListener("click", addItem);
    document.getElementById("entry-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addItem();
    });
  }

  boot();

  /* ---------------- register service worker ---------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((e) => console.warn("SW failed", e));
    });
  }
})();
