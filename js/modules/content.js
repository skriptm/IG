/* Content: Kennzahlen, unbeantwortete Kommentare, Reichweite, Ranking, Formate, Captions, Monate, Konto-Insights */
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
        '<li><div style="flex:1;min-width:0">' + app.userLink(c.h) + ' <span class="muted small">' + app.esc(app.rel(c.ts)) + '</span><div class="ctext">' + app.esc(c.text) + '</div></div><a class="btn small" href="' + app.esc(c.link) + '" target="_blank" rel="noopener">Post</a></li>').join("") + "</ul>"
        : '<p class="muted">Alles beantwortet 🙂</p>'), { id: "open", tip: "Claude antwortet unter deinen letzten 12 Posts, Fragen gehen per Mail an dich. Eigene Accounts und Spam sind ausgeblendet. Mit ↻ oben fragst du Instagram neu ab." });

    html += app.card("Reichweite pro Tag", '<div class="legend"><i style="background:var(--sand)"></i>Follower <i style="background:var(--accent)"></i>Nicht-Follower <i style="background:#5a5550"></i>Werbung</div><div class="chart-box" id="ch-reach"></div>');

    const sorts = { signal: "Saves+Shares", reach: "Reichweite", er: "Engagement", ts: "Neueste" };
    html += app.card("Content-Ranking",
      '<div class="seg" id="seg">' + Object.entries(sorts).map(([kk, v]) => '<button data-k="' + kk + '" class="' + (me.state.sort === kk ? "on" : "") + '">' + v + "</button>").join("") + "</div>" +
      '<div id="ranking"></div>', { tip: "Blass = jünger als 48 Std., die Zahlen wachsen noch." });

    // Formate & Captions
    const group = (key) => { const m = {}; posts.filter((p) => !p.young && p.reach).forEach((p) => (m[p[key]] = m[p[key]] || []).push(p));
      return Object.entries(m).map(([g, a]) => { const r = a.reduce((s, p) => s + p.reach, 0); return { g, n: a.length, reach: Math.round(r / a.length), signal: r ? Math.round(a.reduce((s, p) => s + p.saves + p.shares, 0) / r * 10000) / 10 : null }; }).sort((a, b) => b.reach - a.reach); };
    const tbl = (rows, head) => '<div class="table-wrap"><table class="t"><thead><tr><th>' + head + "</th><th>Posts</th><th>Ø Reichweite</th><th>pro 1.000</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td>" + app.esc(r.g) + "</td><td>" + r.n + "</td><td>" + app.num(r.reach) + "</td><td>" + app.d1(r.signal) + "</td></tr>").join("") + "</tbody></table></div>";
    html += app.card("Was funktioniert", tbl(group("format"), "Format") + '<div style="margin-top:12px"></div>' + tbl(group("captionType"), "Caption"),
      { tip: "„pro 1.000“ = Saves + Shares je 1.000 erreichte Konten. Template = Caption beginnt mit „TRAVEL | ADVENTURE“, alles andere zählt als Story. Wenige Posts, eher Tendenz als Beweis." });

    html += app.card("Reichweite pro Monat", '<div class="chart-box" id="ch-months"></div>', { tip: "Ø Reichweite pro Post je Monat." });

    // Konto-Insights
    const L = ins[ins.length - 1];
    if (L) {
      html += app.card("Konto-Insights <small>" + app.fmtDate(L.day) + "</small>",
        '<p class="lead">Von <b>' + app.num(L.reach) + "</b> erreichten Konten kamen <b>" + app.pct(L.adPct) + "</b> über Werbung. Organisch waren es <b>" + app.num(L.reachOrganic) + "</b>, davon Reels <b>" + app.num(L.reachReel) + "</b> und Stories <b>" + app.num(L.reachStory) + "</b>.</p>" +
        '<div class="stats">' + app.stat("Nicht-Follower", app.num(L.reachNon), "Follower " + app.num(L.reachFollower)) + app.stat("Follows / Unf.", app.num(L.follows) + " / " + app.num(L.unfollows), "Netto " + app.signed(L.net)) +
        app.stat("Aktive Konten", app.num(L.engaged), "Interaktionen " + app.num(L.interactions)) + app.stat("Saves / Shares", app.num(L.saves) + " / " + app.num(L.shares), "Link-Klicks " + app.num(L.linkTaps)) + "</div>" +
        '<div class="table-wrap" style="margin-top:12px"><table class="t"><thead><tr><th>Tag</th><th>Reichw.</th><th>organisch</th><th>+ / −</th><th>🔖 / ↗</th></tr></thead><tbody>' +
        ins.slice().reverse().map((x) => "<tr><td>" + app.fmtDate(x.day) + "</td><td>" + app.num(x.reach) + "</td><td>" + app.num(x.reachOrganic) + "</td><td>+" + app.num(x.follows) + " / −" + app.num(x.unfollows) + "</td><td>" + app.num(x.saves) + " / " + app.num(x.shares) + "</td></tr>").join("") +
        "</tbody></table></div>", { tip: "„Werbung“ ist Reichweite aus bezahlten Anzeigen. „organisch“ ist, was dein Content allein schafft. „+ / −“ = neue Follower / Unfollows, 🔖 / ↗ = Saves / Shares." });
    }
    el.innerHTML = html;

    Charts.bars(el.querySelector("#ch-reach"), ins.map((x) => {
      const ad = x.reachAd || 0, non = Math.max(0, (x.reachNon || 0) - ad);
      return { x: app.fmtDate(x.day), parts: [{ v: x.reachFollower || 0, c: "var(--sand)" }, { v: non, c: "var(--accent)" }, { v: ad, c: "#5a5550" }],
        tip: app.fmtDate(x.day) + "<br><b>" + app.num(x.reach) + "</b> erreicht<br>" + app.num(x.reachFollower) + " Follower · " + app.num(x.reachNon) + " neu" + (ad ? "<br>davon Werbung " + app.num(ad) : "") };
    }));

    const months = {}; posts.filter((p) => p.reach && p.ts).forEach((p) => { const m = String(p.ts).slice(0, 7); const x = months[m] || (months[m] = { m, n: 0, r: 0, ss: 0 }); x.n++; x.r += p.reach; x.ss += p.saves + p.shares; });
    const mrows = Object.values(months).sort((a, b) => (a.m < b.m ? -1 : 1));
    const mon = (m) => new Date(m + "-01T12:00").toLocaleDateString("de-CH", { month: "short", year: "2-digit" });
    Charts.bars(el.querySelector("#ch-months"), mrows.map((x) => ({ x: mon(x.m), parts: [{ v: Math.round(x.r / x.n), c: "var(--accent)" }], tip: "<b>" + mon(x.m) + "</b><br>Ø " + app.num(Math.round(x.r / x.n)) + " Reichweite<br>" + x.n + " Posts · " + x.ss + " Saves+Shares" })), { height: 170 });

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
    el.querySelector("#reply-btn").onclick = async (e) => {
      if (!confirm("Offene Kommentare unter den letzten 12 Posts jetzt per KI beantworten?")) return;
      const b = e.currentTarget; b.disabled = true; b.textContent = "Läuft …";
      try { await app.call({ a: "reply" }); app.toast("Gestartet – in 1–2 Min. mit ↻ neu laden"); }
      catch (err) { app.toast("Konnte nicht starten: " + err.message, "bad"); }
      finally { b.disabled = false; b.textContent = "💬 Offene Kommentare jetzt beantworten"; }
    };
  }
});
