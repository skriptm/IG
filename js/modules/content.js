/* Content: Kennzahlen, unbeantwortete Kommentare, Reichweite pro Tag, Funnel, Ranking, Was funktioniert (Formate, Captions, Reels), Hub-Features, Zielgruppe */
App.register({
  id: "content", title: "Content", order: 3,
  icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="16" cy="8" r="1.6"/></svg>',
  state: { sort: "signal" },
  render(el, d, app) {
    const me = this, ins = d.insights, posts = d.posts, k = App.kpi(d);
    const delta = (v) => (v == null ? "" : '<span class="' + (v >= 0 ? "up" : "down") + '">' + app.signed(Math.round(v * 1000) / 10) + " %</span>");

    let html = app.card("Kennzahlen",
      '<div class="stats">' +
        app.stat("Reichweite / Post", app.num(k.reachRecent), delta(k.reachDelta) + " vs. davor") +
        app.stat("Saves+Shares / 1.000", app.d1(k.signalRecent), "davor " + app.d1(k.signalPrev)) +
        app.stat("% der Follower", app.pct(k.reachShare), "10–30 % üblich") +
        app.stat("Posts erfasst", app.num(posts.length), d.igFetched ? "Stand " + app.rel(d.igFetched) : "") +
      "</div>", { tip: "Median der letzten 5 Posts gegen die 5 davor. Posts unter 48 Stunden zählen noch nicht mit." });

    // Unbeantwortete Kommentare
    html += app.card("Unbeantwortet <span class=\"pill" + (d.openComments.length ? " accent" : "") + "\">" + d.openComments.length + "</span>",
      '<button class="btn primary" id="reply-btn" style="margin-bottom:10px">💬 Offene Kommentare jetzt beantworten</button>' +
      (d.openComments.length ? '<ul class="list comments">' + d.openComments.map((c) =>
        '<li><div style="flex:1;min-width:0">' + app.userLink(c.h) + ' <span class="muted small">' + app.esc(app.rel(c.ts)) + '</span><div class="ctext">' + app.esc(c.text) + '</div></div><a class="btn small" href="' + app.esc(c.link) + '" target="_blank" rel="noopener">Post</a><button class="btn small ghost hide-c" data-id="' + app.esc(c.id) + '" aria-label="Ausblenden">✕</button></li>').join("") + "</ul>"
        : '<p class="muted">Alles beantwortet 🙂</p>'), { id: "open", tip: "Claude antwortet unter deinen letzten 12 Posts, Fragen gehen per Mail an dich. Eigene Accounts und Spam sind ausgeblendet. ✕ blendet einen Kommentar hier aus (bei Instagram bleibt er stehen). Mit ↻ oben fragst du Instagram neu ab." });

    html += app.card("Reichweite pro Tag", '<div class="legend"><i style="background:var(--sand)"></i>Follower <i style="background:var(--accent)"></i>Nicht-Follower <i style="background:#5a5550"></i>Werbung</div><div class="chart-box" id="ch-reach"></div>');
    html += funnelCard(d, app);

    const sorts = { signal: "Saves+Shares", reach: "Reichweite", er: "Engagement", ts: "Neueste" };
    html += app.card("Content-Ranking",
      '<div class="seg" id="seg">' + Object.entries(sorts).map(([kk, v]) => '<button data-k="' + kk + '" class="' + (me.state.sort === kk ? "on" : "") + '">' + v + "</button>").join("") + "</div>" +
      '<div id="ranking"></div>', { tip: "Blass = jünger als 48 Std., die Zahlen wachsen noch." });

    // Formate & Captions
    const group = (key) => { const m = {}; posts.filter((p) => !p.young && p.reach).forEach((p) => (m[p[key]] = m[p[key]] || []).push(p));
      return Object.entries(m).map(([g, a]) => { const r = a.reduce((s, p) => s + p.reach, 0); return { g, n: a.length, reach: Math.round(r / a.length), signal: r ? Math.round(a.reduce((s, p) => s + p.saves + p.shares, 0) / r * 10000) / 10 : null }; }).sort((a, b) => b.reach - a.reach); };
    const tbl = (rows, head) => '<div class="table-wrap"><table class="t"><thead><tr><th>' + head + "</th><th>Posts</th><th>Ø Reichweite</th><th>pro 1.000</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td>" + app.esc(r.g) + "</td><td>" + r.n + "</td><td>" + app.num(r.reach) + "</td><td>" + app.d1(r.signal) + "</td></tr>").join("") + "</tbody></table></div>";
    const reels = posts.filter((p) => p.watchAvg != null);
    const reelTbl = reels.length ? '<h4 class="sub">Reels</h4><div class="table-wrap"><table class="t"><thead><tr><th>Reel</th><th>Ø Wiedergabe</th><th>Aufrufe</th><th>Reichweite</th></tr></thead><tbody>' +
      reels.map((p) => '<tr><td><a href="' + app.esc(p.link) + '" target="_blank" rel="noopener">' + app.fmtDate(p.ts) + "</a></td><td><b>" + app.d1(p.watchAvg) + " s</b></td><td>" + app.num(p.views) + "</td><td>" + app.num(p.reach) + "</td></tr>").join("") + "</tbody></table></div>" : "";
    html += app.card("Was funktioniert", tbl(group("format"), "Format") + '<div style="margin-top:12px"></div>' + tbl(group("captionType"), "Caption") + reelTbl,
      { tip: "„pro 1.000“ = Saves + Shares je 1.000 erreichte Konten. Template = Caption beginnt mit „TRAVEL | ADVENTURE“, alles andere zählt als Story. Ø Wiedergabe = wie lange ein Reel im Schnitt läuft, je länger, desto eher zeigt Instagram es Nicht-Followern. Wenige Posts, eher Tendenz als Beweis." });
    html += subsCard(d, app);

    // Zielgruppe (Follower-Demografie)
    const dm = d.demo || {};
    if (dm.age || dm.country) {
      const top = (arr, n) => (arr || []).slice().sort((x, y) => y.v - x.v).slice(0, n), tot = (arr) => (arr || []).reduce((s2, e) => s2 + e.v, 0) || 1;
      let land; try { land = new Intl.DisplayNames(["de"], { type: "region" }); } catch (e) { land = null; }
      const bars = (arr, n, name) => { const t = tot(arr), rows = n ? top(arr, n) : arr, mx = Math.max(1, ...rows.map((e) => e.v));
        return rows.map((e) => '<div class="roi-row"><div class="roi-h"><span>' + app.esc(name ? name(e.k) : e.k) + '</span><span class="muted small">' + app.pct(e.v / t) + '</span></div><div class="roi-bar"><i style="width:' + Math.round(e.v / mx * 100) + '%"></i></div></div>').join(""); };
      const g = {}; (dm.gender || []).forEach((e) => (g[e.k] = e.v)); const known = (g.F || 0) + (g.M || 0);
      html += app.card("Zielgruppe <small>" + app.fmtDate(dm.day) + "</small>", '<details class="more"><summary>Anzeigen</summary>' +
        (known ? '<div class="stats">' + app.stat("Männer", app.pct((g.M || 0) / known)) + app.stat("Frauen", app.pct((g.F || 0) / known)) + app.stat("Top-Alter", app.esc((top(dm.age, 1)[0] || {}).k || "–")) + app.stat("Top-Land", app.esc((top(dm.country, 1)[0] || {}).k || "–")) + "</div>" : "") +
        (dm.age ? '<h4 class="sub">Alter</h4>' + bars(dm.age, 0) : "") +
        (dm.country ? '<h4 class="sub">Länder</h4>' + bars(dm.country, 6, (k2) => { try { return land ? land.of(k2) : k2; } catch (e) { return k2; } }) : "") +
        (dm.city ? '<h4 class="sub">Städte</h4>' + bars(dm.city, 6, (k2) => k2.split(",")[0]) : "") + "</details>",
        { tip: "Wer dir folgt, laut Instagram. Geschlecht nur von Followern, bei denen Instagram es kennt. Länder und Städte: Anteil unter den von Instagram gelieferten Top-Einträgen. Genau diese Zahlen fragen Marken bei Kooperationen ab." });
    }
    el.innerHTML = html;

    Charts.bars(el.querySelector("#ch-reach"), ins.map((x) => {
      const ad = x.reachAd || 0, non = Math.max(0, (x.reachNon || 0) - ad);
      return { x: app.fmtDate(x.day), parts: [{ v: x.reachFollower || 0, c: "var(--sand)" }, { v: non, c: "var(--accent)" }, { v: ad, c: "#5a5550" }],
        tip: app.fmtDate(x.day) + "<br><b>" + app.num(x.reach) + "</b> erreicht<br>" + app.num(x.reachFollower) + " Follower · " + app.num(x.reachNon) + " neu" + (ad ? "<br>davon Werbung " + app.num(ad) : "") };
    }));

    const list = el.querySelector("#ranking");
    const draw = () => {
      const kk = me.state.sort, arr = posts.slice().sort((a, b) => (kk === "ts" ? (a.ts < b.ts ? 1 : -1) : (b[kk] ?? -1) - (a[kk] ?? -1)));
      const mx = Math.max(1, ...arr.map((p) => p.reach));
      list.innerHTML = app.more(arr.map((p, i) =>
        '<li class="' + (p.young ? "young" : "") + '"><a href="' + app.esc(p.link) + '" target="_blank" rel="noopener"><span class="rank">' + (i + 1) + "</span>" +
        '<div class="rk-main"><div class="rk-top"><span class="tag">' + p.format + '</span> <span class="tag sand">' + p.captionType + "</span> " + app.fmtDate(p.ts) + "</div>" +
        '<div class="rk-cap">' + app.esc((p.caption.split("\n")[0] || "Ohne Caption").slice(0, 70)) + "</div>" + Charts.meter(p.reach, mx) +
        '<div class="rk-nums">👁 ' + app.num(p.reach) + " · ♥ " + app.num(p.likes) + " · 💬 " + app.num(p.comments) + " · 🔖 " + app.num(p.saves) + " · ↗ " + app.num(p.shares) + " · " + app.d1(p.signal) + "/1.000</div></div></a></li>"), 5, "ranking");
    };
    draw();
    el.querySelector("#seg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; me.state.sort = b.dataset.k; el.querySelectorAll("#seg button").forEach((x) => x.classList.toggle("on", x === b)); draw(); });
    bindSubs(el, d, app);
    el.querySelectorAll(".hide-c").forEach((b) => (b.onclick = () => app.hideComment(b.dataset.id)));
    el.querySelector("#reply-btn").onclick = async (e) => {
      if (!confirm("Offene Kommentare unter den letzten 12 Posts jetzt per KI beantworten?")) return;
      const b = e.currentTarget; b.disabled = true; b.textContent = "Läuft …";
      try { await app.call({ a: "reply" }); app.toast("Gestartet – in 1–2 Min. mit ↻ neu laden"); }
      catch (err) { app.toast("Konnte nicht starten: " + err.message, "bad"); }
      finally { b.disabled = false; b.textContent = "💬 Offene Kommentare jetzt beantworten"; }
    };
  }
});

/* Funnel: erreichte Nicht-Follower → Profilaufrufe → neue Follower (Konto-Insights der letzten 7 Tage) */
function funnelCard(d, app) {
  const W = App.week(d), c = W && W.cur;
  if (!c || !c.pvDays) return "";
  const r1 = c.pvReachNonOrg ? c.pv / c.pvReachNonOrg : null, r2 = c.pv ? c.pvFollows / c.pv : null;
  const step = (label, v, sub) => '<div class="fn-step"><div class="fn-l">' + label + '</div><div class="fn-v">' + app.num(v) + "</div>" + (sub ? '<div class="fn-s">' + sub + "</div>" : "") + "</div>";
  const arrow = (r) => '<div class="fn-arrow">↓ <b>' + (r == null ? "–" : app.pct(r)) + "</b></div>";
  return app.card("Funnel <small>" + (c.pvDays === 1 ? app.fmtDate(c.pvFrom) : app.fmtDate(c.pvFrom) + "–" + app.fmtDate(c.to)) + "</small>",
    '<div class="funnel">' + step("Erreicht, folgen dir nicht", c.pvReachNonOrg, "organisch") + arrow(r1) + step("Profilaufrufe", c.pv) + arrow(r2) + step("Neue Follower", c.pvFollows) + "</div>" +
    (c.pvDays < 7 ? app.note("Profilaufrufe werden erst seit " + app.fmtDate(c.pvFrom) + " erfasst. Nach einer Woche ist der Funnel aussagekräftig.") : ""),
    { tip: "Wie viele Nicht-Follower, die deinen Content gesehen haben, auf dein Profil gehen, und wie viele davon folgen. Ist die erste Quote niedrig, liegt es am Content. Ist die zweite niedrig, liegt es am Profil (Bio, Highlights, oberste Posts)." });
}

/* Hub-Features: Einreichungen bei Hubs mitverfolgen. Gespeichert in den Skill-Einstellungen (Make, Feld subs), damit sie auf allen Geräten gleich sind. */
function subsCard(d, app) {
  const cfg = d.cfg;
  if (!cfg) return app.card("Hub-Features", '<p class="muted">Einstellungen nicht geladen.</p>');
  const subs = Array.isArray(cfg.subs) ? cfg.subs : [], esc = app.esc;
  const stOf = (x) => x.st || (app.daysAgo(x.d) > 14 ? "nein" : "");
  const n = subs.length, f = subs.filter((x) => stOf(x) === "ja").length;
  const net = (day) => { const i = d.insights.find((z) => z.day === day); return i && i.follows != null ? i.follows - (i.unfollows || 0) : null; };
  const byHub = {}; subs.forEach((x) => { const b = byHub[x.hub] || (byHub[x.hub] = { hub: x.hub, n: 0, f: 0 }); b.n++; if (stOf(x) === "ja") b.f++; });
  const hubRows = Object.values(byHub).sort((a, b) => b.f / b.n - a.f / a.n || b.n - a.n);
  const form = '<div class="subs-form"><select id="sub-post">' + d.posts.slice(0, 12).map((p) => '<option value="' + esc(p.sc) + '">' + app.fmtDate(p.ts) + " · " + esc((p.caption.split("\n")[0] || "Ohne Caption").slice(0, 38)) + "</option>").join("") + "</select>" +
    '<div class="add" style="margin-top:8px"><input id="sub-hub" list="sub-hubs" placeholder="@hub" autocomplete="off" autocapitalize="off" spellcheck="false"><datalist id="sub-hubs">' + (cfg.hubs || []).map((h) => '<option value="@' + esc(h) + '">').join("") + '</datalist><button class="btn small" id="sub-add">+ Eingereicht</button></div></div>';
  const list = n ? '<ul class="list subs">' + subs.slice().reverse().map((x) => {
    const st = stOf(x), p = d.posts.find((q) => q.sc === x.sc), nn = st === "ja" && x.fd ? net(x.fd) : null;
    return '<li data-id="' + esc(x.id) + '"><div class="c-main">' + app.viaLink("@" + x.hub) + ' <span class="muted small">' + app.fmtDate(x.d) + (p ? ' · <a href="' + esc(p.link) + '" target="_blank" rel="noopener">Post</a>' : "") + "</span>" +
      (nn != null ? '<div class="muted small">Am Feature-Tag ' + app.signed(nn) + " Follower netto</div>" : "") + '</div><span class="right">' +
      (st === "ja" ? '<span class="pill green">gefeatured</span>' : st === "nein" ? '<span class="pill">nicht</span>' : '<button class="btn small" data-st="ja">✓ Feature</button><button class="btn small ghost" data-st="nein">Nein</button>') +
      '<button class="btn small ghost" data-st="del" aria-label="löschen">✕</button></span></li>';
  }).join("") + "</ul>" : '<p class="muted">Noch nichts eingereicht.</p>';
  const stats = hubRows.length > 1 ? '<h4 class="sub">Quote je Hub</h4>' + hubRows.map((b) => '<div class="src-h"><span>' + app.viaLink("@" + b.hub) + '</span><span class="muted small">' + b.f + " von " + b.n + "</span></div>").join("") : "";
  return app.card("Hub-Features" + (n ? ' <span class="pill' + (f ? " green" : "") + '">' + f + " / " + n + "</span>" : ""), form + list + stats,
    { id: "subs", tip: "Trag ein, welchen Post du bei welchem Hub eingereicht hast (getaggt oder Hub-Hashtag). Wird er gezeigt, auf „✓ Feature“ tippen. Ohne Feature nach 14 Tagen zählt er als „nicht“. Die Session meldet Features, die sie bei Hub-Besuchen sieht, im Dashboard." });
}
function bindSubs(el, d, app) {
  const box = el.querySelector("#subs"); if (!box || !d.cfg) return;
  const cur = () => (Array.isArray(d.cfg.subs) ? d.cfg.subs.slice() : []);
  const save = async (subs, msg) => {
    try { await app.saveCfg(Object.assign({}, d.cfg, { subs: subs.slice(-100) })); app.toast(msg); app.render(); }
    catch (e) { app.toast("Nicht gespeichert: " + e.message, "bad"); }
  };
  const add = box.querySelector("#sub-add");
  if (add) add.onclick = () => {
    const sc = box.querySelector("#sub-post").value, hub = box.querySelector("#sub-hub").value.trim().replace(/^@/, "").toLowerCase();
    if (!sc || !/^[a-z0-9._]{1,30}$/.test(hub)) return app.toast("Post und @hub wählen", "bad");
    const s = cur(); if (s.some((x) => x.sc === sc && x.hub === hub)) return app.toast("Schon eingetragen");
    s.push({ id: Date.now().toString(36), sc, hub, d: app.today(), st: "" }); save(s, "Eingetragen ✓");
  };
  box.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => {
    const id = b.closest("li").dataset.id, s = cur(), i = s.findIndex((x) => x.id === id); if (i < 0) return;
    if (b.dataset.st === "del") { if (!confirm("Eintrag löschen?")) return; s.splice(i, 1); }
    else s[i] = Object.assign({}, s[i], { st: b.dataset.st, fd: b.dataset.st === "ja" ? app.today() : "" });
    save(s, "Gespeichert ✓");
  }));
}
