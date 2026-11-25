/* Einstellungen in vier Gruppen: Engagement (Pause, Limits, Budget, Ruhezeiten), Listen (Kernliste, Hubs, Hashtags, No-Go, Tabu, Beispielkommentare), Betrieb (Make-Credits, was wo läuft), App (Ziel, Installieren, Zugang, Version) */
App.register({
  id: "settings", title: "Einstellungen", order: 9, needsData: false,
  icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  tab: "engagement", draft: null, base: null,
  TABS: [["engagement", "Engagement"], ["listen", "Listen"], ["betrieb", "Betrieb"], ["app", "App"]],
  LIMITS: [["day", "Kommentare / Tag"], ["hour", "Kommentare / Std."], ["follow_day", "Follows / Tag"], ["follow_session", "Follows / Session"], ["follow_min", "Folgen ab Followern"], ["follow_max", "Folgen bis Followern"], ["following_max", "Gefolgt höchstens"], ["unfollow_days", "Entfolgen nach Tagen"], ["unfollow_day", "Entfolgen / Tag"], ["unfollow_session", "Entfolgen / Session"], ["engage_min", "Engagement ab Foll."], ["engage_max", "Engagement bis Foll."]],
  BUDGET: [["core", "Kernliste"], ["feed", "Startseite"], ["hubs", "Hubs"], ["hashtags", "Hashtags"]],

  norm(c) {
    c = JSON.parse(JSON.stringify(c || {}));
    ["nogo", "hashtags", "hubs", "friends", "watchlist", "taboo", "examples"].forEach((k) => { if (!Array.isArray(c[k])) c[k] = []; });
    c.limits = Object.assign({ day: 40, hour: 14, follow_day: 25, follow_session: 6, follow_min: 2000, follow_max: 50000, following_max: 1500, unfollow_days: 7, unfollow_day: 10, unfollow_session: 5, engage_min: 200, engage_max: 150000 }, c.limits);
    c.budget = Object.assign({ core: 3, feed: 1, hubs: 1, hashtags: 0 }, c.budget);
    c.quiet = Object.assign({ on: true, from: "22:00", to: "07:00" }, c.quiet);
    c.goal = Object.assign({ followers: 0, date: "" }, c.goal);
    if (typeof c.fans_to_watchlist !== "boolean") c.fans_to_watchlist = true;
    if (!(Number(c.feed_repeat_days) >= 0)) c.feed_repeat_days = 3;
    c.paused = !!c.paused;
    return c;
  },
  strip(c) { const x = JSON.parse(JSON.stringify(c)); delete x.updated; delete x.updated_by; return JSON.stringify(x); },

  render(el, d, app) {
    const me = this;
    if (!app.settings.code) me.tab = "app";
    if (d && d.cfg && (!me.draft || !app.editing)) { me.base = me.norm(d.cfg); me.draft = me.norm(d.cfg); }
    el.innerHTML = '<div class="seg sticky" id="stabs">' + me.TABS.map(([k, l]) => '<button data-t="' + k + '" class="' + (me.tab === k ? "on" : "") + '">' + l + "</button>").join("") + '</div><div id="spane"></div>';
    el.querySelector("#stabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; me.tab = b.dataset.t; el.querySelectorAll("#stabs button").forEach((x) => x.classList.toggle("on", x === b)); me.pane(el, d, app); window.scrollTo(0, 0); });
    me.pane(el, d, app);
  },

  dirty() { return this.draft && this.base && this.strip(this.draft) !== this.strip(this.base); },

  pane(el, d, app) {
    const me = this, pane = el.querySelector("#spane"), c = me.draft;
    const y = window.scrollY;
    const changed = () => { app.editing = me.dirty(); me.pane(el, d, app); };
    let html = "";

    if (me.tab !== "app" && me.tab !== "betrieb" && !c) {
      pane.innerHTML = app.card("Einstellungen", '<p class="muted">' + (d && d.cfgError ? app.esc(d.cfgError) : "Werden geladen …") + "</p>");
      me.bar(el, app); return;
    }

    const chips = (key, prefix, cls) => '<div class="chips" data-list="' + key + '">' + (c[key].length ? c[key].map((v, i) => '<span class="chip ' + (cls || "") + '">' + (prefix ? app.viaLink(prefix + v) : app.esc(v)) + '<button data-del="' + key + '" data-i="' + i + '" aria-label="entfernen">×</button></span>').join("") : '<span class="muted small">Noch leer.</span>') + "</div>";
    const adder = (key, ph) => '<div class="add"><input data-add="' + key + '" placeholder="' + ph + '" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn small" data-addbtn="' + key + '">+ Hinzufügen</button></div><div class="err" data-err="' + key + '"></div>';
    const sw = (key, on, bad) => '<label class="switch' + (bad ? " bad" : "") + '"><input type="checkbox" data-sw="' + key + '"' + (on ? " checked" : "") + "><span></span></label>";
    const numf = (path, label, v) => '<label class="field"><span>' + label + '</span><input type="number" inputmode="numeric" min="0" data-num="' + path + '" value="' + v + '"></label>';

    if (me.tab === "engagement") {
      html += app.card("Pause", '<div class="switchrow"><span>' + (c.paused ? '<span class="pill red">Pausiert, keine Sessions</span>' : '<span class="pill green">Aktiv, Sessions laufen</span>') + "</span>" + sw("paused", c.paused, true) + "</div>", { tip: "Ist die Pause an, startet der Skill keine Session, z. B. im Urlaub." });
      html += app.card("Limits", '<div class="grid2">' + me.LIMITS.map(([k, l]) => numf("limits." + k, l, c.limits[k])).join("") + "</div>", { tip: "Sicherheitsgrenzen gegen Action-Sperren. Lieber vorsichtig erhöhen." });
      const sum = Object.values(c.budget).reduce((a, b) => a + Number(b || 0), 0);
      html += app.card("Kommentar-Budget", '<div class="grid2">' + me.BUDGET.map(([k, l]) => numf("budget." + k, l, c.budget[k])).join("") + numf("feed_repeat_days", "Startseite: Sperrfrist Tage", c.feed_repeat_days) + "</div>" +
        app.note("Summe: " + sum + " von " + c.limits.day + " pro Tag" + (sum > c.limits.day ? ", mehr als das Tageslimit, der Rest verfällt." : ".")));
      html += app.card("Ruhezeiten", '<div class="switchrow"><span>' + (c.quiet.on ? "Ruhe von " + app.esc(c.quiet.from) + " bis " + app.esc(c.quiet.to) : "Keine Ruhezeiten") + "</span>" + sw("quiet.on", c.quiet.on) + "</div>" +
        '<div class="grid2" style="margin-top:12px"><label class="field"><span>Ruhe ab</span><input type="time" data-time="quiet.from" value="' + app.esc(c.quiet.from) + '"></label><label class="field"><span>Ruhe bis</span><input type="time" data-time="quiet.to" value="' + app.esc(c.quiet.to) + '"></label></div>', { tip: "In diesem Fenster startet keine Session (Schweizer Zeit)." });
    }
    if (me.tab === "listen") {
      html += app.card("Kernliste <span class=\"pill\">" + c.friends.length + "</span>", chips("friends", "@") + adder("friends", "@handle"), { tip: "Deine 15–20 wichtigsten Leute. Jede Session wird ihr neuester Post geliked und kommentiert." });
      html += app.card("Priority-Hubs <span class=\"pill\">" + c.hubs.length + "</span>", chips("hubs", "@") + adder("hubs", "@handle"), { tip: "Täglich besucht, aus ihren Kommentarspalten kommen die Hub-Kommentatoren." });
      html += app.card("Hashtags <span class=\"pill\">" + c.hashtags.length + "</span>", chips("hashtags", "#") + adder("hashtags", "#hashtag"), { tip: "Die Reihenfolge ist die Rotation. So viele, wie das Hashtag-Budget zulässt." });
      html += app.card("No-Go-Accounts", chips("nogo", "@", "nogo") + adder("nogo", "@handle oder Profil-Link"), { tip: "Werden nie geliked, kommentiert oder gefolgt." });
      html += app.card("Tabu-Wörter", chips("taboo", "") + adder("taboo", "z. B. mega Bild"), { tip: "Wörter, Floskeln oder Emojis, die nie in einem Kommentar landen dürfen." });
      html += app.card("Beispielkommentare", chips("examples", "") + adder("examples", "z. B. Mega Stimmung 😍"), { tip: "So klingst du. Der Skill nimmt sie als Vorbild für Ton und Länge, kopiert sie aber nicht." });
    }
    if (me.tab === "betrieb") html += me.betrieb(d, app);
    if (me.tab === "app") {
      html += app.card("Follower-Ziel", '<div class="grid2">' + numf("goal.followers", "Ziel (Follower)", c.goal.followers || "") + '<label class="field"><span>Bis wann</span><input type="date" data-date="goal.date" value="' + app.esc(c.goal.date || "") + '"></label></div>', { tip: "Die Übersicht rechnet aus deinem Tempo hoch, wann du es erreichst." });
      const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      if (!standalone) html += app.card("📲 Als App installieren", '<ol class="steps"><li>In <b>Safari</b> öffnen</li><li><b>Teilen</b> <span class="kbd">⬆︎</span> antippen</li><li><b>„Zum Home-Bildschirm“</b></li></ol>');
      html += app.card("Zugang", '<label class="field"><span>Zugangscode</span><input id="code" type="password" autocomplete="off" placeholder="Code eingeben" value="' + app.esc(app.settings.code) + '"></label><button class="btn primary" id="save-code" style="margin-top:10px">Speichern & laden</button>', { tip: "Bleibt nur auf diesem Gerät." });
      html += app.card("App", '<ul class="list"><li><span>Version</span><span class="right muted">' + CONFIG.version + "</span></li><li><span>Daten geladen</span><span class=\"right muted\">" + (d ? app.esc(app.rel(d.fetched)) : "–") + "</span></li><li><span>Instagram abgefragt</span><span class=\"right muted\">" + (d && d.igFetched ? app.esc(app.rel(d.igFetched)) : "–") + "</span></li><li><span>Einstellungen geändert</span><span class=\"right muted\">" + (c && c.updated ? app.esc(app.rel(c.updated)) : "–") + "</span></li></ul>" +
        '<div class="actions" style="margin-top:10px"><button class="btn" id="reload-app">App neu laden</button><button class="btn danger" id="reset">Zwischenspeicher leeren</button></div>');
    }
    pane.innerHTML = html;
    window.scrollTo(0, y);

    // Ereignisse
    const clean = {
      handle: (v) => { const x = String(v || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "").toLowerCase(); return /^[a-z0-9._]{1,30}$/.test(x) ? x : null; },
      tag: (v) => { const x = String(v || "").trim().replace(/^#/, "").toLowerCase(); return /^[\p{L}\p{N}_]{1,60}$/u.test(x) ? x : null; },
      text: (max) => (v) => { const x = String(v || "").trim(); return x && x.length <= max ? x : null; }
    };
    const rule = { nogo: [clean.handle, true], friends: [clean.handle, true], hubs: [clean.handle, true], hashtags: [clean.tag, true], taboo: [clean.text(60), false], examples: [clean.text(140), false] };
    pane.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { c[b.dataset.del].splice(Number(b.dataset.i), 1); changed(); });
    const add = (key) => {
      const inp = pane.querySelector('[data-add="' + key + '"]'); const [fn, split] = rule[key];
      const parts = split ? inp.value.split(/[\s,;]+/).filter(Boolean) : [inp.value.trim()].filter(Boolean); if (!parts.length) return;
      const bad = [];
      parts.forEach((p) => { const v = fn(p); if (!v) return bad.push(p); if (c[key].includes(v)) return;
        const clash = key !== "nogo" && ["friends", "hubs", "nogo"].filter((o) => o !== key).find((o) => c[o].includes(v));
        if (clash) return bad.push(p + " (steht schon bei " + ({ friends: "Kernliste", hubs: "Hubs", nogo: "No-Go" })[clash] + ")");
        c[key].push(v); });
      changed();
      if (bad.length) { const e = pane.querySelector('[data-err="' + key + '"]'); if (e) e.textContent = "Nicht übernommen: " + bad.join(", "); }
    };
    pane.querySelectorAll("[data-addbtn]").forEach((b) => b.onclick = () => add(b.dataset.addbtn));
    pane.querySelectorAll("[data-add]").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(i.dataset.add); } }));
    const setPath = (path, v) => { const ks = path.split("."); let o = c; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = v; };
    pane.querySelectorAll("[data-sw]").forEach((i) => i.onchange = () => { setPath(i.dataset.sw, i.checked); changed(); });
    pane.querySelectorAll("[data-num]").forEach((i) => i.onchange = () => { const v = Math.max(0, Math.round(Number(i.value))); if (Number.isFinite(v)) setPath(i.dataset.num, v); changed(); });
    pane.querySelectorAll("[data-time]").forEach((i) => i.onchange = () => { if (/^\d{2}:\d{2}$/.test(i.value)) setPath(i.dataset.time, i.value); changed(); });
    pane.querySelectorAll("[data-date]").forEach((i) => i.onchange = () => { setPath(i.dataset.date, i.value || ""); changed(); });

    if (me.tab === "app") {
      pane.querySelector("#save-code").onclick = () => { app.settings.code = pane.querySelector("#code").value.trim(); app.toast("Gespeichert"); app.data = null; app.LS.del("cache"); app.go("home"); app.load(true); };
      pane.querySelector("#reload-app").onclick = async () => { if ("caches" in window) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); } location.reload(); };
      pane.querySelector("#reset").onclick = () => { if (confirm("Zwischengespeicherte Daten löschen? Der Zugangscode bleibt.")) { app.LS.del("cache"); app.data = null; app.load(true); } };
    }
    me.bar(el, app);
  },

  betrieb(d, app) {
    const u = d && d.usage, DAY = 864e5, now = Date.now(), row = (a, b, cls) => "<li><span>" + a + '</span><span class="right ' + (cls || "muted") + '">' + b + "</span></li>";
    let html;
    if (!u) html = app.card("Make-Credits", '<p class="muted">Noch keine Zahlen. Kommen nach dem ersten Nachtlauf.</p>');
    else {
      const left = Math.max(0, u.limit - u.used), since = Math.max(1, (now - new Date(u.last)) / DAY), rest = Math.max(1, (new Date(u.reset) - now) / DAY),
        avg = Math.round(u.used / since), allow = Math.floor(left / rest), end = Math.round(u.used + avg * rest), ok = end <= u.limit,
        day = (x) => new Date(x).toLocaleDateString("de-CH", { day: "numeric", month: "numeric" });
      html = app.card("Make-Credits " + (ok ? '<span class="pill green">reicht</span>' : '<span class="pill red">reicht nicht</span>'),
        '<div class="goal"><div class="goal-h"><span>' + app.num(u.used) + " von " + app.num(u.limit) + '</span><span class="muted small">Reset ' + day(u.reset) + "</span></div>" + Charts.meter(u.used, u.limit) + "</div>" +
        '<ul class="list">' + row("Übrig", app.num(left)) + row("Schnitt pro Tag", app.num(avg)) + row("Erlaubt pro Tag bis Reset", app.num(allow), avg > allow ? "red" : "muted") +
        row("Hochrechnung bis Reset", app.num(end), ok ? "muted" : "red") + row("Stand", app.esc(app.rel(u.ts))) + "</ul>");
    }
    const names = new Map(CONFIG.runs.map((r) => [r.id, r])), sc = u ? u.sc : [], seen = new Set(sc.map((x) => x.id));
    const make = sc.map((x) => { const r = names.get(x.id); return row((r ? app.esc(r.name) : "Szenario " + x.id) + (r ? '<br><span class="muted small">' + app.esc(r.when) + "</span>" : ""), app.num(x.ops)); })
      .concat(CONFIG.runs.filter((r) => !seen.has(r.id)).map((r) => row(app.esc(r.name) + '<br><span class="muted small">' + app.esc(r.when) + "</span>", u ? "0" : "–")));
    html += app.card("Läuft über Make", '<ul class="list">' + make.join("") + "</ul>", { tip: "Credits seit dem letzten Reset, pro Szenario." });
    html += app.card("Läuft ohne Make", '<ul class="list">' + CONFIG.ownRuns.map((r) => row(app.esc(r.name) + '<br><span class="muted small">' + app.esc(r.when) + "</span>", '<span class="pill">' + app.esc(r.where) + "</span>")).join("") + "</ul>", { tip: "Kostet keine Make-Credits." });
    return html;
  },

  bar(el, app) {
    const me = this; let bar = document.getElementById("savebar");
    if (!me.dirty()) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement("div"); bar.id = "savebar"; bar.className = "savebar"; document.getElementById("app").appendChild(bar); }
    bar.innerHTML = '<span>Ungespeicherte Änderungen</span><button class="btn" id="sb-undo">Verwerfen</button><button class="btn primary" id="sb-save">Speichern</button>';
    bar.querySelector("#sb-undo").onclick = () => { me.draft = me.norm(me.base); app.editing = false; me.pane(el, app.data, app); };
    bar.querySelector("#sb-save").onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = "Speichere …";
      try { const cur = (app.data && app.data.cfg) || {}; if (Array.isArray(cur.watchlist)) me.draft.watchlist = cur.watchlist.slice(); if (typeof cur.fans_to_watchlist === "boolean") me.draft.fans_to_watchlist = cur.fans_to_watchlist; if (Array.isArray(cur.subs)) me.draft.subs = cur.subs.slice();
        const saved = await app.saveCfg(me.draft); me.base = me.norm(saved); me.draft = me.norm(saved); app.editing = false; app.renderHero(); me.pane(el, app.data, app); app.toast("Gespeichert ✓ – gilt ab der nächsten Session"); }
      catch (err) { b.disabled = false; b.textContent = "Speichern"; app.toast("Nicht gespeichert: " + err.message, "bad"); }
    };
  }
});
