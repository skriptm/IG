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
  const pct = (n, d = 1) => (n == null || isNaN(n) ? "–" : (n * 100).toFixed(d).replace(".", ",") + " %");
  const kv = (s) => { const o = {}; String(s || "").split(",").forEach((p) => { const i = p.lastIndexOf(":"); if (i > 0) o[p.slice(0, i).trim()] = Number(p.slice(i + 1)); }); return o; };
  const day = (d) => (d instanceof Date ? d : new Date(String(d).replace(" ", "T"))).toISOString().slice(0, 10);
  const localDay = (d) => { const x = d instanceof Date ? d : new Date(String(d).replace(" ", "T")); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const today = () => localDay(new Date());
  const daysAgo = (ts) => Math.floor((Date.now() - new Date(String(ts).replace(" ", "T")).getTime()) / 864e5);
  const fmtDate = (ts, withTime) => {
    if (!ts) return "";
    const d = new Date(String(ts).replace(" ", "T"));
    if (isNaN(d)) return esc(ts);
    const o = { day: "2-digit", month: "2-digit" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return d.toLocaleString("de-CH", o);
  };
  const rel = (ts) => {
    const d = new Date(String(ts).replace(" ", "T")); if (isNaN(d)) return "";
    const m = Math.round((Date.now() - d) / 6e4);
    if (m < 1) return "gerade eben"; if (m < 60) return "vor " + m + " Min.";
    const h = Math.round(m / 60); if (h < 24) return "vor " + h + " Std.";
    const t = Math.round(h / 24); return t === 1 ? "gestern" : "vor " + t + " Tagen";
  };
  const h = (tag, attrs, html) => { const el = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") el.className = attrs[k]; else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); } if (html != null) el.innerHTML = html; return el; };

  /* ---------- Einstellungen ---------- */
  const settings = {
    get code() { return LS.get("code", ""); },
    set code(v) { LS.set("code", v); },
    get goals() { return Object.assign({}, CONFIG.goals, LS.get("goals", {})); },
    set goals(v) { LS.set("goals", v); },
    get noGo() { return LS.get("noGo", CONFIG.noGo); },
    set noGo(v) { LS.set("noGo", v); }
  };

  /* ---------- Daten aus Make holen ---------- */
  async function call(params, timeout = 45000) {
    const u = new URL(CONFIG.api);
    Object.entries(Object.assign({ k: settings.code }, params)).forEach(([k, v]) => u.searchParams.set(k, v == null ? "" : v));
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(u.toString(), { signal: ctl.signal, cache: "no-store" });
      const txt = await r.text();
      let j; try { j = JSON.parse(txt); } catch (e) { throw new Error("Antwort war kein JSON (" + r.status + ")"); }
      if (r.status === 403 || j.error === "code") { const e = new Error("Zugangscode falsch"); e.code = 403; throw e; }
      if (!r.ok) throw new Error("Fehler " + r.status);
      return j;
    } finally { clearTimeout(t); }
  }

  /* ---------- Rohdaten in handliche Form bringen ---------- */
  function normalize(raw) {
    const noGo = new Set(settings.noGo.map((x) => x.toLowerCase().replace(/^@/, "")));
    const posts = (raw.posts || []).map((r) => r.data || r).filter((p) => p && p.id).map((p) => {
      const m = kv(p.metrics);
      const comments = String(p.comments || "").split(";").filter(Boolean).map((c) => { const [hh, ts, text, id] = c.split("|"); return { h: hh, ts, text: dec(text), id }; });
      const reach = m.reach || 0, inter = m.total_interactions || (p.likes || 0) + (p.comments_count || 0);
      return {
        id: p.id, ts: p.ts, link: p.permalink, sc: p.shortcode, caption: dec(p.caption), type: p.media_type, product: p.product,
        likes: p.likes || 0, comments: p.comments_count || 0, reach, views: m.views || 0, saves: m.saved || 0, shares: m.shares || 0,
        interactions: inter, er: reach ? inter / reach : null, commentList: comments
      };
    }).sort((a, b) => (a.ts < b.ts ? 1 : -1));

    const days = {};
    (raw.insights || []).map((r) => r.data || r).filter((x) => x && x.day).forEach((x) => {
      const d = days[x.day] || (days[x.day] = { day: x.day });
      const parts = kv(x.parts);
      if (x.metric === "reach" && x.breakdown === "follow_type") { d.reach = x.total; d.reachFollower = parts.FOLLOWER || 0; d.reachNon = parts.NON_FOLLOWER || 0; }
      else if (x.metric === "reach" && x.breakdown === "media_product_type") { d.reachByFormat = parts; }
      else if (x.metric === "follows_and_unfollows") { d.follows = parts.FOLLOWER || 0; d.unfollows = parts.NON_FOLLOWER || 0; }
      else if (x.metric === "totals" || /totals$/.test(x.key || "")) { Object.assign(d, { engaged: parts.accounts_engaged, linkTaps: parts.profile_links_taps, interactions: parts.total_interactions, saves: parts.saves, shares: parts.shares }); }
      else { Object.assign(d, parts); }
    });
    // "totals" haben in Make keinen metric-Wert, daher auch über den Schlüssel einsammeln
    (raw.insights || []).forEach((r) => { const x = r.data || r; if (r.key && /_totals$/.test(r.key) && x.day) { const p = kv(x.parts); Object.assign(days[x.day] || (days[x.day] = { day: x.day }), { engaged: p.accounts_engaged, linkTaps: p.profile_links_taps, interactions: p.total_interactions, saves: p.saves, shares: p.shares }); } });
    const insights = Object.values(days).sort((a, b) => (a.day < b.day ? -1 : 1));

    const contacts = (raw.gb || []).map((r) => Object.assign({ key: r.key }, r.data || r)).filter((c) => c.h && !noGo.has(String(c.h).toLowerCase()))
      .map((c) => ({ h: c.h, ts: c.ts, src: c.src, text: dec(c.text), media: c.media, marked: !!(c.q && String(c.q).trim()) , q: c.q }))
      .sort((a, b) => (a.ts < b.ts ? 1 : -1));

    let stats = null;
    if (raw.stats && raw.stats.sessions) {
      const s = raw.stats;
      const sessions = (s.sessions || []).slice().sort((a, b) => (a.ts < b.ts ? -1 : 1));
      stats = {
        updated: s.updated, sessions,
        followers: sessions.length ? sessions[sessions.length - 1].followers : null,
        following: sessions.length ? sessions[sessions.length - 1].following : null,
        conversions: (s.conversions || []).slice().reverse(),
        activity: (s.activity || []).slice().reverse(),
        follows: (s.follows || []).slice().reverse(),
        newFollowers: (s.followers_recent || []).filter((f) => !f.baseline)
      };
    }
    return { posts, insights, contacts, stats, fetched: raw.ts || new Date().toISOString(), statsError: raw.statsError || null };
  }

  /* ---------- App-Gerüst ---------- */
  const modules = [];
  const App = {
    LS, esc, dec, num, pct, kv, day, localDay, today, daysAgo, fmtDate, rel, h, settings, call,
    data: null, current: null,
    register(m) { modules.push(m); modules.sort((a, b) => (a.order || 99) - (b.order || 99)); },

    toast(msg, kind) {
      const t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show " + (kind || "");
      clearTimeout(t._t); t._t = setTimeout(() => (t.className = "toast"), 2600);
    },

    async load(force) {
      const btn = document.getElementById("refresh-btn"); btn.classList.add("spin");
      try {
        if (!settings.code) { this.go("settings"); this.toast("Bitte zuerst den Zugangscode eintragen"); return; }
        const raw = await call({ a: "all" });
        // Stats (Drive) separat, damit ein Fehler dort den Rest nicht blockiert
        try { const s = await call({ a: "stats" }, 30000); if (s && s.sessions) raw.stats = s; else if (s && s.stats) raw.stats = s.stats; else raw.statsError = "Noch keine Drive-Verbindung"; }
        catch (e) { raw.statsError = e.code === 403 ? "Zugangscode falsch" : "Drive-Daten nicht erreichbar"; }
        LS.set("cache", raw);
        this.data = normalize(raw);
        if (force) this.toast("Aktualisiert");
      } catch (e) {
        if (e.code === 403) { this.toast("Zugangscode falsch", "bad"); this.go("settings"); }
        else this.toast(navigator.onLine ? "Laden fehlgeschlagen: " + e.message : "Offline – zeige letzte Daten", "bad");
      } finally { btn.classList.remove("spin"); this.renderHero(); this.render(); }
    },

    renderHero() {
      const sub = document.getElementById("hero-sub"), d = this.data;
      if (!d) { sub.textContent = settings.code ? "Noch keine Daten" : "Einrichtung nötig"; return; }
      const f = d.stats && d.stats.followers;
      sub.innerHTML = (f ? '<b class="count" data-to="' + f + '">' + num(f) + "</b> Follower · " : "") + "Stand " + esc(rel(d.fetched));
      const c = sub.querySelector(".count"); if (c) App.countUp(c, f);
    },

    countUp(el, to) {
      const from = Math.max(0, to - Math.min(to, 120)), t0 = performance.now(), dur = 900;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = num(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    },

    buildTabs() {
      const bar = document.getElementById("tabbar"); bar.innerHTML = "";
      modules.forEach((m) => {
        const b = h("button", { class: "tab", "data-id": m.id, onclick: () => this.go(m.id) }, '<span class="tab-ic">' + m.icon + '</span><span class="tab-tx">' + esc(m.title) + "</span>");
        bar.appendChild(b);
      });
    },

    go(id) {
      if (!modules.find((m) => m.id === id)) id = modules[0].id;
      this.current = id; LS.set("tab", id);
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.id === id));
      this.render(); window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    },

    render() {
      const m = modules.find((x) => x.id === this.current) || modules[0];
      const view = document.getElementById("view");
      view.innerHTML = ""; view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
      if (!this.data && m.needsData !== false) {
        view.appendChild(h("div", { class: "card empty" }, settings.code ? '<div class="spinner"></div><p>Daten werden geladen …</p>' : "<p>Trag in den Einstellungen deinen Zugangscode ein.</p>"));
        return;
      }
      try { m.render(view, this.data, this); }
      catch (e) { console.error(e); view.appendChild(h("div", { class: "card empty" }, "<p>Dieser Bereich hatte einen Fehler.</p><small>" + esc(e.message) + "</small>")); }
      view.querySelectorAll("[data-anim]").forEach((el, i) => { el.style.animationDelay = i * 50 + "ms"; });
    },

    /* Bausteine für Module */
    card(title, inner, extra) { return '<section class="card glass" data-anim' + (extra ? " " + extra : "") + ">" + (title ? '<h2 class="card-title">' + title + "</h2>" : "") + inner + "</section>"; },
    stat(label, value, sub, cls) { return '<div class="stat ' + (cls || "") + '"><div class="stat-v">' + value + '</div><div class="stat-l">' + label + "</div>" + (sub ? '<div class="stat-s">' + sub + "</div>" : "") + "</div>"; },
    profile(hh) { return "https://www.instagram.com/" + encodeURIComponent(hh) + "/"; },

    start() {
      this.buildTabs();
      const cached = LS.get("cache", null);
      if (cached) { try { this.data = normalize(cached); } catch (e) {} }
      const start = (location.hash || "").slice(1) || LS.get("tab", modules[0].id);
      this.go(start); this.renderHero();
      document.getElementById("refresh-btn").addEventListener("click", () => this.load(true));
      window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && id !== this.current) this.go(id); });
      document.addEventListener("visibilitychange", () => { if (!document.hidden && this.data && daysAgo(this.data.fetched) >= 0 && (Date.now() - new Date(this.data.fetched)) > 10 * 60e3) this.load(); });
      this.load();
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
    },
    normalize
  };
  window.App = App;
})();
