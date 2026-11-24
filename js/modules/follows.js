/* Follows: Kennzahlen, Follow-Tabelle mit Status, Auswertung nach Quelle, Follower-Kurve und Follows pro Tag */
App.register({
  id: "follows", title: "Follows", order: 2.5,
  icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M19 8v6M16 11h6"/></svg>',
  filter: "all",
  render(el, d, app) {
    const s = d.stats;
    if (!s) { el.innerHTML = app.card("Follows", '<p class="note">⚠️ ' + app.esc(d.statsError || "Noch keine Daten") + "</p>"); return; }
    const me = this, lim = (d.cfg && d.cfg.limits) || {}, ud = app.unfDays();
    const rows = s.follows.map((f) => Object.assign({}, f, { st: app.followState(f), src: srcOf(f.via), text: f.c || commentOf(s, f.h) }));
    const cnt = (k) => rows.filter((r) => r.st.key === k).length;
    const back = cnt("back"), due = cnt("due"), today = rows.filter((r) => app.localDay(r.ts) === app.today()).length;
    const lastS = s.sessions[s.sessions.length - 1] || {};
    const cap = Number(lim.follow_day) || 25;

    const tile = (label, v, sub, cls) => '<div class="stat tile' + (cls ? " " + cls : "") + '"><div class="stat-l">' + label + '</div><div class="stat-v"><b class="cu" data-to="' + (Number(v) || 0) + '">0</b>' + (sub && sub.inline ? sub.inline : "") + "</div>" + (sub && sub.s ? '<div class="stat-s">' + sub.s + "</div>" : "") + "</div>";
    let html = '<section class="tiles" data-anim>' +
      tile("Follower", lastS.followers) +
      tile("Folge ich", lastS.following) +
      tile("Follows heute", today, { inline: '<small> / ' + cap + "</small>" }) +
      tile("Follow-backs", back, { s: rows.length ? app.pct(back / rows.length, 0) + " von " + rows.length : "" }, "good") +
      tile("Entfolgen fällig", due, { s: "ab " + ud + " Tagen" }, due ? "hot" : "") +
      "</section>";

    const F = [["all", "Alle", rows.length], ["open", "Offen", cnt("open")], ["due", "Fällig", due], ["back", "Zurück", back], ["unf", "Entfolgt", cnt("unf")]];
    html += app.card("Gefolgt",
      '<div class="seg" id="fl-seg">' + F.map((f) => '<button data-f="' + f[0] + '" class="' + (me.filter === f[0] ? "on" : "") + '">' + f[1] + " <i>" + f[2] + "</i></button>").join("") + "</div>" +
      '<ul class="list flist" id="fl-list"></ul>');

    // Auswertung nach Quelle: Gruppen (Hub, Hashtag, Feed, Sonstige) und darunter jede Quelle einzeln
    const groups = {};
    rows.forEach((r) => {
      const g = groups[r.src] || (groups[r.src] = { name: r.src, n: 0, back: 0, items: {} });
      const it = g.items[r.via || "–"] || (g.items[r.via || "–"] = { name: r.via || "–", n: 0, back: 0 });
      g.n++; it.n++; if (r.st.key === "back") { g.back++; it.back++; }
    });
    const G = Object.values(groups).sort((a, b) => b.n - a.n);
    const bar = (x, big) => '<div class="src-row' + (big ? " grp" : "") + '"><div class="src-h"><span>' + app.esc(x.name) + '</span><span class="muted small">' + x.n + " Follows · " + x.back + " zurück · <b>" + app.pct(x.back / x.n, 0) + "</b></span></div>" +
      '<div class="roi-bar"><i style="width:' + Math.round(x.back / x.n * 100) + '%"></i></div></div>';
    if (G.length) html += app.card("Was funktioniert?",
      '<div class="src">' + G.map((g) => bar(g, true) + Object.values(g.items).sort((a, b) => b.n - a.n).map((it) => G.length > 1 || Object.keys(g.items).length > 1 ? bar(it) : "").join("")).join("") + "</div>" +
      (rows.length < 30 ? app.note("Unter 30 Follows ist die Quote noch Zufall.") : ""),
      { tip: "Follow-back-Quote je Quelle. Offene Follows zählen mit, die Quote steigt also noch." });

    html += app.card("Follower & Follows pro Tag",
      '<div class="chart-box" id="ch-ff"></div><div class="legend"><i style="background:var(--accent)"></i>Follows <i style="background:var(--green)"></i>davon zurück</div><div class="chart-box" id="ch-fd"></div>');
    el.innerHTML = html;

    const list = el.querySelector("#fl-list");
    const draw = () => {
      const show = rows.filter((r) => me.filter === "all" || r.st.key === me.filter);
      list.innerHTML = show.length ? show.map((r, i) =>
        '<li style="--i:' + Math.min(i, 12) + '"><div class="fl-top">' + app.userLink(r.h) + (r.f ? '<span class="muted small">' + app.num(r.f) + "</span>" : "") + '<span class="right">' + r.st.pill + "</span></div>" +
        '<div class="fl-meta muted small">' + app.esc(r.via || r.src) + " · " + app.fmtDate(r.ts) + " · " + r.st.age + " T.</div>" +
        (r.text ? '<div class="ctext">' + (r.sc ? '<a href="https://www.instagram.com/p/' + encodeURIComponent(r.sc) + '/" target="_blank" rel="noopener">' + app.esc(r.text) + "</a>" : app.esc(r.text)) + "</div>" : "") + "</li>").join("")
        : '<li class="muted">Keine Einträge.</li>';
    };
    draw();
    el.querySelector("#fl-seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      me.filter = b.dataset.f; el.querySelectorAll("#fl-seg button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });

    Charts.line(el.querySelector("#ch-ff"), s.sessions.map((x) => ({ x: app.fmtDate(x.ts), y: x.followers, tip: "<b>" + app.num(x.followers) + "</b> Follower<br>" + app.fmtDate(x.ts, true) })), { id: "ff" });
    const byDay = {};
    rows.forEach((r) => { const k = app.localDay(r.ts), b = byDay[k] || (byDay[k] = { n: 0, back: 0 }); b.n++; if (r.st.key === "back") b.back++; });
    Charts.bars(el.querySelector("#ch-fd"), Object.keys(byDay).sort().map((k) => ({ x: app.fmtDate(k), parts: [{ v: byDay[k].back, c: "var(--green)" }, { v: byDay[k].n - byDay[k].back, c: "var(--accent)" }],
      tip: "<b>" + app.fmtDate(k) + "</b><br>" + byDay[k].n + " Follows · " + byDay[k].back + " zurück" })));
    el.querySelectorAll(".cu").forEach((x, i) => setTimeout(() => app.countUp(x, Number(x.dataset.to)), 150 + i * 70));
  }
});

function srcOf(via) {
  via = String(via || "");
  return via[0] === "#" ? "Hashtags" : via[0] === "@" ? "Hubs" : /feed|startseite/i.test(via) ? "Feed" : "Sonstige";
}
/* Ersatz für ältere Follows ohne gespeicherten Kommentar: letzter Kommentar an dieses Profil */
function commentOf(s, h) { const a = s.activity.find((x) => x.act === "comment" && x.h === h && x.text); return a ? a.text : ""; }
