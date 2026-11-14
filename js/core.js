/* ============================================================
   IG Growth – Kern der App
   Neue Bereiche: eine Datei in js/modules/ anlegen und
   App.register({ id, title, icon, order, render(el, data, app) }) aufrufen.
   ============================================================ */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("ig." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ig." + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("ig." + k); } catch (e) {} }
  };

  /* ---------- kleine Helfer ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dec = (s) => { if (s == null) return ""; try { return decodeURIComponent(String(s)); } catch (e) { return String(s); } };
  const num = (n) => (n == null || isNaN(n) ? "–" : Number(n).toLocaleString("de-CH"));
  const d1 = (n) => (n == null || isNaN(n) ? "–" : Number(n).toLocaleString("de-CH", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const pct = (n, d = 1) => (n == null || isNaN(n) ? "–" : (n * 100).toFixed(d).replace(".", ",") + " %");
  const signed = (n) => (n == null || isNaN(n) ? "–" : (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n).toLocaleString("de-CH", { maximumFractionDigits: 1 }));
  const kv = (s) => { const o = {}; String(s || "").split(",").forEach((p) => { const i = p.lastIndexOf(":"); if (i > 0) o[p.slice(0, i).trim()] = Number(p.slice(i + 1)); }); return o; };
  const toDate = (d) => (d instanceof Date ? d : new Date(String(d).replace(" ", "T")));
  const localDay = (d) => { const x = toDate(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const today = () => localDay(new Date());
  const daysAgo = (ts) => Math.floor((Date.now() - toDate(ts).getTime()) / 864e5);
  const stamp = () => { const d = new Date(); return localDay(d) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const fmtDate = (ts, withTime) => {
    if (!ts) return "";
    const d = toDate(ts); if (isNaN(d)) return esc(ts);
    const o = { day: "2-digit", month: "2-digit" }; if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return d.toLocaleString("de-CH", o);
  };
  const rel = (ts) => {
    const d = toDate(ts); if (isNaN(d)) return "";
    const m = Math.round((Date.now() - d) / 6e4);
    if (m < 1) return "gerade eben"; if (m < 60) return "vor " + m + " Min.";
    const h = Math.round(m / 60); if (h < 24) return "vor " + h + " Std.";
    const t = Math.round(h / 24); return t === 1 ? "gestern" : "vor " + t + " Tagen";
  };
  const h = (tag, attrs, html) => { const el = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") el.className = attrs[k]; else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); } if (html != null) el.innerHTML = html; return el; };
  const OWN = ["andrelauinger", "vanandventure"];
  const isSpam = (t) => /send\s*me\s*this\s*post/i.test(t || "");

  /* ---------- lokale App-Einstellungen ---------- */
  const settings = {
    get code() { return LS.get("code", ""); },
    set code(v) { LS.set("code", v); },
    get goals() { return Object.assign({}, CONFIG.goals, LS.get("goals", {})); },
    set goals(v) { LS.set("goals", v); }
  };

  /* ---------- Make-Schnittstelle ---------- */
  async function call(params, timeout = 45000, post) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
    const all = Object.assign({ k: settings.code }, params);
    try {
      let r;
      if (post) {
        const body = new URLSearchParams(); Object.entries(all).forEach(([k, v]) => body.set(k, v == null ? "" : v));
        r = await fetch(CONFIG.api, { method: "POST", body, signal: ctl.signal, cache: "no-store" });
      } else {
        const u = new URL(CONFIG.api); Object.entries(all).forEach(([k, v]) => u.searchParams.set(k, v == null ? "" : v)); u.searchParams.set("_", Date.now());
        r = await fetch(u.toString(), { signal: ctl.signal, cache: "no-store" });
      }
      const txt = await r.text();
      let j; try { j = JSON.parse(txt); } catch (e) { throw new Error("Antwort war kein JSON (" + r.status + ")"); }
      if (r.status === 403 || j.error === "code") { const e = new Error("Zugangscode falsch"); e.code = 403; throw e; }
      if (!r.ok) throw new Error("Fehler " + r.status);
      return j;
    } catch (e) { if (e.name === "AbortError") throw new Error("Zeitüberschreitung"); throw e; }
    finally { clearTimeout(t); }
  }

  /* ---------- Rohdaten in handliche Form bringen ---------- */
  function normalize(raw) {
    const cfg = raw.cfg || null;
    const noGo = new Set(OWN.concat((cfg && cfg.nogo) || CONFIG.noGo).map((x) => String(x).toLowerCase().replace(/^@/, "")));

    const rawPosts = (raw.posts || []).map((r) => r.data || r).filter((p) => p && p.id);
    const lastRun = Math.max(0, ...rawPosts.map((p) => Date.parse(p.updated) || 0));
    const posts = rawPosts.filter((p) => p.product !== "STORY").map((p) => {
      const m = kv(p.metrics);
      const commentList = String(p.comments || "").split(";").filter(Boolean).map((c) => { const [hh, ts, text, id, rep] = c.split("|"); return { h: hh, ts, text: dec(text), id, replies: Number(rep) || 0 }; });
      const reach = m.reach || 0, inter = m.total_interactions || (Number(p.likes) || 0) + (Number(p.comments_count) || 0);
      const caption = dec(p.caption);
      return {
        id: p.id, ts: p.ts, link: p.permalink, sc: p.shortcode, caption, type: p.media_type, product: p.product,
        format: p.product === "REELS" || p.media_type === "VIDEO" ? "Reel" : p.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Bild",
        captionType: /^TRAVEL\s*\|\s*ADVENTURE/i.test(caption.trim()) ? "Template" : "Story",
        likes: Number(p.likes) || 0, comments: Number(p.comments_count) || 0, reach, views: m.views || 0, saves: m.saved || 0, shares: m.shares || 0,
        interactions: inter, er: reach ? inter / reach : null, signal: reach ? Math.round(((m.saved || 0) + (m.shares || 0)) / reach * 10000) / 10 : null,
        young: Date.now() - Date.parse(p.ts) < 48 * 3600e3, fresh: lastRun - (Date.parse(p.updated) || 0) < 2 * 3600e3, updated: p.updated, commentList
      };
    }).sort((a, b) => (a.ts < b.ts ? 1 : -1));

    // Kommentare unter eigenen Posts
    const allComments = [];
    posts.forEach((p) => p.commentList.forEach((c) => { if (c.h && !OWN.includes(c.h) && !isSpam(c.text)) allComments.push(Object.assign({ link: p.link, sc: p.sc, fresh: p.fresh }, c)); }));
    allComments.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    const openComments = allComments.filter((c) => c.fresh && !c.replies);
    const repliedBy = new Set(allComments.filter((c) => c.replies > 0).map((c) => c.h));

    const days = {};
    (raw.insights || []).forEach((r) => {
      const x = r.data || r; if (!x || !x.day) return;
      const d = days[x.day] || (days[x.day] = { day: x.day });
      const p = kv(x.parts);
      if (x.metric === "reach" && x.breakdown === "follow_type") { d.reach = x.total; d.reachFollower = p.FOLLOWER || 0; d.reachNon = p.NON_FOLLOWER || 0; }
      else if (x.metric === "reach" && x.breakdown === "media_product_type") {
        d.reachByFormat = p; d.reachAd = p.AD || 0; d.reachReel = p.REEL || 0; d.reachStory = p.STORY || 0;
        d.reachOrganic = (p.CAROUSEL_CONTAINER || 0) + (p.POST || 0) + (p.REEL || 0) + (p.STORY || 0) + (p.IGTV || 0);
        if (d.reach == null) d.reach = x.total;
      }
      else if (x.metric === "follows_and_unfollows") { d.follows = p.FOLLOWER || 0; d.unfollows = p.NON_FOLLOWER || 0; d.net = d.follows - d.unfollows; }
      else if (x.metric === "totals" || /_totals$/.test(r.key || "")) { Object.assign(d, { engaged: p.accounts_engaged, linkTaps: p.profile_links_taps, interactions: p.total_interactions, saves: p.saves, shares: p.shares }); }
    });
    const insights = Object.values(days).map((d) => Object.assign(d, { adPct: d.reach && d.reachAd != null ? d.reachAd / d.reach : null })).sort((a, b) => (a.day < b.day ? -1 : 1));

    const contacts = (raw.gb || []).map((r) => Object.assign({ key: r.key }, r.data || r)).filter((c) => c.h && !noGo.has(String(c.h).toLowerCase()))
      .map((c) => ({ h: c.h, ts: c.ts, src: c.src, text: dec(c.text), media: c.media, q: c.q && String(c.q).trim() ? String(c.q) : "", replied: repliedBy.has(c.h) }))
      .map((c) => Object.assign(c, { marked: !!c.q }))
      .sort((a, b) => (a.ts < b.ts ? 1 : -1));

    let stats = null;
    if (raw.stats && raw.stats.sessions) {
      const s = raw.stats;
      const sessions = (s.sessions || []).slice().sort((a, b) => (a.ts < b.ts ? -1 : 1));
      stats = {
        updated: s.updated, sessions, goal: s.goal || null,
        followers: sessions.length ? sessions[sessions.length - 1].followers : null,
        following: sessions.length ? sessions[sessions.length - 1].following : null,
        conversions: (s.conversions || []).slice().reverse(),
        activity: (s.activity || []).slice().reverse(),
        follows: (s.follows || []).slice().reverse(),
        newFollowers: (s.followers_recent || []).filter((f) => !f.baseline)
      };
    }
    return { posts, insights, contacts, stats, cfg, session: raw.session || {}, cfgUpdated: raw.cfgUpdated || null, allComments, openComments,
      fetched: raw.ts || new Date().toISOString(), igFetched: lastRun ? new Date(lastRun).toISOString() : null,
      statsError: raw.statsError || null, cfgError: raw.cfgError || null };
  }

  /* ---------- App-Gerüst ---------- */
  const modules = [];
  const App = {
    LS, esc, dec, num, d1, pct, signed, kv, localDay, today, daysAgo, fmtDate, rel, h, settings, call, stamp, OWN,
    data: null, current: null, busy: false,
    register(m) { modules.push(m); modules.sort((a, b) => (a.order || 99) - (b.order || 99)); },

    toast(msg, kind, ms) {
      const t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show " + (kind || "");
      clearTimeout(t._t); if (ms !== 0) t._t = setTimeout(() => (t.className = "toast"), ms || 2600);
    },

    /* deep = true: vorher Instagram neu abfragen (Aktualisieren-Knopf / Ziehen) */
    async load(deep) {
      if (this.busy) return; this.busy = true;
      const btn = document.getElementById("refresh-btn"); btn.classList.add("spin");
      try {
        if (!settings.code) { this.go("settings"); this.toast("Bitte zuerst den Zugangscode eintragen"); return; }
        if (deep) {
          this.toast("Instagram wird abgefragt …", "", 0);
          try { await call({ a: "refresh" }, 90000); } catch (e) { if (e.code === 403) throw e; this.toast("Instagram nicht erreichbar, zeige gespeicherte Daten", "bad"); }
        }
        const [all, stats, cfg, sess] = await Promise.allSettled([call({ a: "all" }), call({ a: "stats" }, 30000), call({ a: "cfg_get" }, 30000), call({ a: "sess_get" }, 30000)]);
        if (all.status === "rejected") throw all.reason;
        const raw = all.value;
        if (stats.status === "fulfilled" && stats.value && stats.value.sessions) raw.stats = stats.value;
        else raw.statsError = stats.status === "rejected" ? "Drive-Statistik nicht erreichbar" : "Noch keine Drive-Statistik";
        if (cfg.status === "fulfilled" && cfg.value && typeof cfg.value === "object" && Object.keys(cfg.value).length) raw.cfg = cfg.value;
        else { raw.cfgError = "Einstellungen nicht erreichbar"; const old = LS.get("cache", null); if (old && old.cfg) raw.cfg = old.cfg; }
        if (sess.status === "fulfilled" && sess.value) raw.session = sess.value;
        LS.set("cache", raw);
        this.data = normalize(raw);
        if (deep) this.toast("Aktuell ✓");
      } catch (e) {
        if (e.code === 403) { this.toast("Zugangscode falsch", "bad"); this.go("settings"); }
        else this.toast(navigator.onLine ? "Laden fehlgeschlagen: " + e.message : "Offline – zeige letzte Daten", "bad");
      } finally { this.busy = false; btn.classList.remove("spin"); this.renderHero(); if (!this.editing) this.render(); }
    },

    /* Einstellungen des Skills speichern */
    async saveCfg(cfg) {
      cfg = Object.assign({}, cfg, { updated: new Date().toISOString(), updated_by: "app" });
      await call({ a: "cfg_set", d: JSON.stringify(cfg) }, 30000, true);
      const raw = LS.get("cache", {}) || {}; raw.cfg = cfg; LS.set("cache", raw);
      if (this.data) { this.data.cfg = cfg; this.data.cfgError = null; }
      return cfg;
    },

    renderHero() {
      const sub = document.getElementById("hero-sub"), d = this.data;
      if (!d) { sub.textContent = settings.code ? "Noch keine Daten" : "Einrichtung nötig"; return; }
      const f = d.stats && d.stats.followers;
      sub.innerHTML = (f ? '<b class="count">' + num(f) + "</b> Follower" : "") +
        '<span class="live"><i class="dot"></i>Instagram ' + esc(d.igFetched ? rel(d.igFetched) : "–") + "</span>";
      const c = sub.querySelector(".count"); if (c) App.countUp(c, f);
      const pause = d.cfg && d.cfg.paused; document.getElementById("hero-pause").hidden = !pause;
    },

    countUp(el, to) {
      if (el.dataset.done == to) { el.textContent = num(to); return; }
      const from = Math.max(0, to - Math.min(to, 120)), t0 = performance.now(), dur = 1100;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = num(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(step); else el.dataset.done = to; };
      requestAnimationFrame(step);
    },

    buildTabs() {
      const bar = document.getElementById("tabbar"); bar.innerHTML = "";
      modules.forEach((m) => bar.appendChild(h("button", { class: "tab", "data-id": m.id, onclick: () => this.go(m.id) }, '<span class="tab-ic">' + m.icon + '</span><span class="tab-tx">' + esc(m.title) + "</span>")));
    },

    go(id, anchor) {
      if (!modules.find((m) => m.id === id)) id = modules[0].id;
      if (this.editing && id !== this.current && !confirm("Ungespeicherte Einstellungen verwerfen?")) return;
      this.editing = false;
      const sb = document.getElementById("savebar"); if (sb) sb.remove();
      this.current = id; LS.set("tab", id);
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.id === id));
      this.render();
      if (anchor) { const a = document.getElementById(anchor); if (a) { a.scrollIntoView({ behavior: "smooth", block: "start" }); return; } }
      window.scrollTo(0, 0);
    },

    render() {
      const m = modules.find((x) => x.id === this.current) || modules[0];
      const view = document.getElementById("view");
      view.innerHTML = ""; view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
      if (!this.data && m.needsData !== false) {
        view.appendChild(h("div", { class: "card glass empty" }, settings.code ? '<div class="spinner"></div><p>Daten werden geladen …</p>' : "<p>Trag unter „Einstellungen“ deinen Zugangscode ein.</p>"));
        return;
      }
      try { m.render(view, this.data, this); }
      catch (e) { console.error(e); view.appendChild(h("div", { class: "card glass empty" }, "<p>Dieser Bereich hatte einen Fehler.</p><small>" + esc(e.message) + "</small>")); }
      view.querySelectorAll("[data-anim]").forEach((el, i) => { el.style.animationDelay = Math.min(i, 8) * 60 + "ms"; });
      view.querySelectorAll(".glass").forEach((c) => c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); }));
    },

    /* Bausteine für Module */
    card(title, inner, opts) {
      opts = opts || {};
      return '<section class="card glass" data-anim' + (opts.id ? ' id="' + opts.id + '"' : "") + ">" + (title ? '<h2 class="card-title">' + title + "</h2>" : "") + inner + "</section>";
    },
    stat(label, value, sub, cls) { return '<div class="stat ' + (cls || "") + '"><div class="stat-l">' + label + '</div><div class="stat-v">' + value + "</div>" + (sub ? '<div class="stat-s">' + sub + "</div>" : "") + "</div>"; },
    note(text) { return '<p class="info">ⓘ ' + text + "</p>"; },
    profile(hh) { return "https://www.instagram.com/" + encodeURIComponent(hh) + "/"; },
    userLink(hh) { return '<a href="' + App.profile(hh) + '" target="_blank" rel="noopener"><b>@' + esc(hh) + "</b></a>"; },

    pullToRefresh() {
      let y0 = null, dy = 0; const ind = document.getElementById("ptr");
      window.addEventListener("touchstart", (e) => { y0 = window.scrollY <= 0 && !this.busy ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
      window.addEventListener("touchmove", (e) => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { ind.style.transform = "translate(-50%," + Math.min(dy * 0.5, 70) + "px) rotate(" + dy * 2 + "deg)"; ind.style.opacity = Math.min(1, dy / 110); ind.classList.toggle("ready", dy > 110); } }, { passive: true });
      window.addEventListener("touchend", () => { if (y0 != null && dy > 110) this.load(true); y0 = null; dy = 0; ind.style.transform = ""; ind.style.opacity = 0; ind.classList.remove("ready"); });
    },

    dust() {
      const cv = document.getElementById("dust"); if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const x = cv.getContext("2d"); let W, H, P;
      const rs = () => { const r = devicePixelRatio || 1; W = cv.width = cv.clientWidth * r; H = cv.height = cv.clientHeight * r; P = Array.from({ length: 38 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.5 + .4) * r, v: (Math.random() * .25 + .05) * r, a: Math.random() * .5 + .15 })); };
      rs(); addEventListener("resize", rs);
      const loop = () => { if (!document.hidden) { x.clearRect(0, 0, W, H); P.forEach((p) => { p.y -= p.v; p.x += Math.sin(p.y / 60) * .2; if (p.y < 0) { p.y = H; p.x = Math.random() * W; } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = "rgba(255,190,140," + p.a + ")"; x.fill(); }); } requestAnimationFrame(loop); };
      loop();
    },

    start() {
      this.buildTabs();
      const cached = LS.get("cache", null);
      if (cached) { try { this.data = normalize(cached); } catch (e) {} }
      const start = (location.hash || "").slice(1) || LS.get("tab", modules[0].id);
      this.go(start); this.renderHero();
      document.getElementById("refresh-btn").addEventListener("click", () => this.load(true));
      window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && id !== this.current) this.go(id); });
      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.load(); });
      this.pullToRefresh(); this.dust();
      this.load();
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then((r) => r.update()).catch(() => {});
    },
    normalize
  };
  window.App = App;
})();
