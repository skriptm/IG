/* Einstellungen: Skill-Einstellungen (in Make gespeichert) + App */
App.register({
  id: "settings", title: "Einstellungen", order: 9, needsData: false,
  icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  tab: "basis", draft: null, base: null,
  TABS: [["basis", "Basis"], ["accounts", "Accounts"], ["hashtags", "Hashtags"], ["limits", "Limits & Zeiten"], ["ziel", "Ziel & Stil"], ["merkliste", "Merkliste"], ["app", "App"]],
  LIMITS: [["day", "Kommentare / Tag"], ["hour", "Kommentare / Std."], ["follow_day", "Follows / Tag"], ["follow_session", "Follows / Session"], ["follow_min", "Folgen ab Followern"], ["engage_min", "Engagement ab Foll."], ["engage_max", "Engagement bis Foll."]],
  BUDGET: [["core", "Kernliste"], ["feed", "Startseite"], ["hubs", "Hubs"], ["hashtags", "Hashtags"]],

  norm(c) {
    c = JSON.parse(JSON.stringify(c || {}));
    ["nogo", "hashtags", "hubs", "friends", "watchlist", "taboo", "examples"].forEach((k) => { if (!Array.isArray(c[k])) c[k] = []; });
    c.limits = Object.assign({ day: 20, hour: 10, follow_day: 5, follow_session: 3, follow_min: 10000, engage_min: 200, engage_max: 150000 }, c.limits);
    c.budget = Object.assign({ core: 5, feed: 7, hubs: 5, hashtags: 3 }, c.budget);
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

    if (me.tab !== "app" && !c) {
      pane.innerHTML = app.card("Einstellungen", '<p class="muted">' + (d && d.cfgError ? app.esc(d.cfgError) : "Werden geladen …") + "</p>");
      me.bar(el, app); return;
    }

    const chips = (key, prefix, cls) => '<div class="chips" data-list="' + key + '">' + (c[key].length ? c[key].map((v, i) => '<span class="chip ' + (cls || "") + '">' + app.esc(prefix + v) + '<button data-del="' + key + '" data-i="' + i + '" aria-label="entfernen">×</button></span>').join("") : '<span class="muted small">Noch leer.</span>') + "</div>";
    const adder = (key, ph) => '<div class="add"><input data-add="' + key + '" placeholder="' + ph + '" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn small" data-addbtn="' + key + '">+ Hinzufügen</button></div><div class="err" data-err="' + key + '"></div>';
    const sw = (key, on, bad) => '<label class="switch' + (bad ? " bad" : "") + '"><input type="checkbox" data-sw="' + key + '"' + (on ? " checked" : "") + "><span></span></label>";
    const numf = (path, label, v) => '<label class="field"><span>' + label + '</span><input type="number" inputmode="numeric" min="0" data-num="' + path + '" value="' + v + '"></label>';

    if (me.tab === "basis") {
      html += app.card("Pause", '<div class="switchrow"><span>' + (c.paused ? '<span class="pill red">Pausiert, keine Sessions</span>' : '<span class="pill green">Aktiv, Sessions laufen</span>') + "</span>" + sw("paused", c.paused, true) + "</div>" + app.note("Ist die Pause an, startet der Skill keine Session, z. B. im Urlaub."));
      html += app.card("No-Go-Accounts", chips("nogo", "@", "nogo") + adder("nogo", "@handle oder Profil-Link") + app.note("Werden nie geliked, kommentiert oder gefolgt."));
      html += app.card("Tabu-Wörter", chips("taboo", "") + adder("taboo", "z. B. mega Bild") + app.note("Wörter, Floskeln oder Emojis, die nie in einem Kommentar landen dürfen."));
    }
    if (me.tab === "accounts") {
      html += app.card("Kernliste <span class=\"pill\">" + c.friends.length + "</span>", chips("friends", "@") + adder("friends", "@handle") + app.note("Deine 15–20 wichtigsten Leute. Jede Session wird ihr neuester Post geliked und kommentiert."));
      html += app.card("Priority-Hubs <span class=\"pill\">" + c.hubs.length + "</span>", chips("hubs", "@") + adder("hubs", "@handle") + app.note("Täglich besucht, aus ihren Kommentarspalten kommen die Hub-Kommentatoren."));
    }
    if (me.tab === "hashtags") {
      html += app.card("Hashtags <span class=\"pill\">" + c.hashtags.length + "</span>", chips("hashtags", "#") + adder("hashtags", "#hashtag") + app.note("Die Reihenfolge ist die Rotation. So viele, wie das Hashtag-Budget zulässt."));
    }
    if (me.tab === "limits") {
      html += app.card("Limits", '<div class="grid2">' + me.LIMITS.map(([k, l]) => numf("limits." + k, l, c.limits[k])).join("") + "</div>" + app.note("Sicherheitsgrenzen gegen Action-Sperren. Lieber vorsichtig erhöhen."));
      const sum = Object.values(c.budget).reduce((a, b) => a + Number(b || 0), 0);
      html += app.card("Kommentar-Budget", '<div class="grid2">' + me.BUDGET.map(([k, l]) => numf("budget." + k, l, c.budget[k])).join("") + numf("feed_repeat_days", "Startseite: Sperrfrist Tage", c.feed_repeat_days) + "</div>" +
        app.note("Summe: " + sum + " von " + c.limits.day + " pro Tag" + (sum > c.limits.day ? ", mehr als das Tageslimit, der Rest verfällt." : ".")));
      html += app.card("Ruhezeiten", '<div class="switchrow"><span>' + (c.quiet.on ? "Ruhe von " + app.esc(c.quiet.from) + " bis " + app.esc(c.quiet.to) : "Keine Ruhezeiten") + "</span>" + sw("quiet.on", c.quiet.on) + "</div>" +
        '<div class="grid2" style="margin-top:12px"><label class="field"><span>Ruhe ab</span><input type="time" data-time="quiet.from" value="' + app.esc(c.quiet.from) + '"></label><label class="field"><span>Ruhe bis</span><input type="time" data-time="quiet.to" value="' + app.esc(c.quiet.to) + '"></label></div>' + app.note("In diesem Fenster startet keine Session (Schweizer Zeit)."));
    }
    if (me.tab === "ziel") {
      html += app.card("Follower-Ziel", '<div class="grid2">' + numf("goal.followers", "Ziel (Follower)", c.goal.followers || "") + '<label class="field"><span>Bis wann</span><input type="date" data-date="goal.date" value="' + app.esc(c.goal.date || "") + '"></label></div>' + app.note("Der Wachstum-Tab rechnet aus deinem Tempo hoch, wann du es erreichst."));
      html += app.card("Beispielkommentare", chips("examples", "") + adder("examples", "z. B. wo stand der Van da? 😮‍💨") + app.note("So klingst du. Der Skill nimmt sie als Vorbild für Ton und Länge, kopiert sie aber nicht."));
      html += app.card("Top-Fans automatisch merken", '<div class="switchrow"><span>' + (c.fans_to_watchlist ? "An" : "Aus") + "</span>" + sw("fans_to_watchlist", c.fans_to_watchlist) + "</div>" + app.note("Wer oft bei dir kommentiert, aber 14 Tage nichts von dir bekommen hat, landet auf der Merkliste."));
    }
    if (me.tab === "merkliste") {
      html += app.card("Merkliste <span class=\"pill\">" + c.watchlist.length + "</span>", chips("watchlist", "@") + adder("watchlist", "@handle oder Profil-Link") + app.note("Die nächste Session besucht sie zuerst (liken + kommentieren) und nimmt sie danach von der Liste."));
    }
    if (me.tab === "app") {
      const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      if (!standalone) html += app.card("📲 Als App installieren", '<ol class="steps"><li>In <b>Safari</b> öffnen</li><li><b>Teilen</b> <span class="kbd">⬆︎</span> antippen</li><li><b>„Zum Home-Bildschirm“</b></li></ol>');
      html += app.card("Zugang", '<label class="field"><span>Zugangscode</span><input id="code" type="password" autocomplete="off" placeholder="Code eingeben" value="' + app.esc(app.settings.code) + '"></label><button class="btn primary" id="save-code" style="margin-top:10px">Speichern & laden</button>' + app.note("Bleibt nur auf diesem Gerät."));
      const g = app.settings.goals;
      html += app.card("Tagesziele in der App", '<div class="grid2"><label class="field"><span>Likes</span><input id="g-likes" type="number" inputmode="numeric" min="1" value="' + g.likes + '"></label><label class="field"><span>Neue Follower</span><input id="g-new" type="number" inputmode="numeric" min="1" value="' + g.newFollowers + '"></label></div><button class="btn" id="save-goals" style="margin-top:10px">Speichern</button>' + app.note("Das Kommentar-Ziel kommt aus „Limits & Zeiten“."));
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
    const rule = { nogo: [clean.handle, true], friends: [clean.handle, true], hubs: [clean.handle, true], watchlist: [clean.handle, true], hashtags: [clean.tag, true], taboo: [clean.text(60), false], examples: [clean.text(140), false] };
    pane.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { c[b.dataset.del].splice(Number(b.dataset.i), 1); changed(); });
    const add = (key) => {
      const inp = pane.querySelector('[data-add="' + key + '"]'); const [fn, split] = rule[key];
      const parts = split ? inp.value.split(/[\s,;]+/).filter(Boolean) : [inp.value.trim()].filter(Boolean); if (!parts.length) return;
      const bad = [];
      parts.forEach((p) => { const v = fn(p); if (!v) return bad.push(p); if (c[key].includes(v)) return;
        const clash = key !== "nogo" && key !== "watchlist" && ["friends", "hubs", "nogo"].filter((o) => o !== key).find((o) => c[o].includes(v));
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
      pane.querySelector("#save-goals").onclick = () => { const v = (id) => Math.max(1, parseInt(pane.querySelector("#" + id).value, 10) || 1); app.settings.goals = { likes: v("g-likes"), newFollowers: v("g-new") }; app.toast("Gespeichert"); };
      pane.querySelector("#reload-app").onclick = async () => { if ("caches" in window) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); } location.reload(); };
      pane.querySelector("#reset").onclick = () => { if (confirm("Zwischengespeicherte Daten löschen? Der Zugangscode bleibt.")) { app.LS.del("cache"); app.data = null; app.load(true); } };
    }
    me.bar(el, app);
  },

  bar(el, app) {
    const me = this; let bar = document.getElementById("savebar");
    if (!me.dirty()) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement("div"); bar.id = "savebar"; bar.className = "savebar"; document.getElementById("app").appendChild(bar); }
    bar.innerHTML = '<span>Ungespeicherte Änderungen</span><button class="btn" id="sb-undo">Verwerfen</button><button class="btn primary" id="sb-save">Speichern</button>';
    bar.querySelector("#sb-undo").onclick = () => { me.draft = me.norm(me.base); app.editing = false; me.pane(el, app.data, app); };
    bar.querySelector("#sb-save").onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = "Speichere …";
      try { const saved = await app.saveCfg(me.draft); me.base = me.norm(saved); me.draft = me.norm(saved); app.editing = false; app.renderHero(); me.pane(el, app.data, app); app.toast("Gespeichert ✓ – gilt ab der nächsten Session"); }
      catch (err) { b.disabled = false; b.textContent = "Speichern"; app.toast("Nicht gespeichert: " + err.message, "bad"); }
    };
  }
});
