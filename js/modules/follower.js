/* Follower: alles, was die Engagement-Sessions bewirken. Kacheln, Quellen-Auswertung, Gefolgt-Liste, Follower-Kurve,
   Aktivität pro Session, Conversions, neue Follower, letzte Kommentare */
App.register({
  id: "follower", title: "Follower", order: 2,
  icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M19 8v6M16 11h6"/></svg>',
  filter: "all",
  render(el, d, app) {
    const s = d.stats;
    if (!s) { el.innerHTML = app.card("Follower", '<p class="note">⚠️ ' + app.esc(d.statsError || "Noch keine Daten") + "</p>"); return; }
    const me = this, lim = (d.cfg && d.cfg.limits) || {}, ud = app.unfDays();
    const rows = s.follows.map((f) => Object.assign({}, f, { st: app.followState(f), text: f.c || commentOf(s, f.h) }));
    const cnt = (k) => rows.filter((r) => r.st.key === k).length;
    const back = cnt("back"), due = cnt("due"), today = rows.filter((r) => app.localDay(r.ts) === app.today()).length;
    const first = s.sessions[0] || {}, lastS = s.sessions[s.sessions.length - 1] || {};
    const cap = Number(lim.follow_day) || 25;

    const tile = (label, v, sub, cls) => '<div class="stat tile' + (cls ? " " + cls : "") + '"><div class="stat-l">' + label + '</div><div class="stat-v"><b class="cu" data-to="' + (Number(v) || 0) + '">0</b>' + (sub && sub.inline ? sub.inline : "") + "</div>" + (sub && sub.s ? '<div class="stat-s">' + sub.s + "</div>" : "") + "</div>";
    const gain = (lastS.followers || 0) - (first.followers || 0);
    let html = '<section class="tiles" data-anim>' +
      tile("Follower", lastS.followers, { s: app.signed(gain) + " seit " + app.fmtDate(first.ts) }) +
      tile("Folge ich", lastS.following) +
      tile("Follows heute", today, { inline: "<small> / " + cap + "</small>" }) +
      tile("Follow-backs", back, { s: rows.length ? app.pct(back / rows.length, 0) + " von " + rows.length : "" }, "good") +
      tile("Entfolgen fällig", due, { s: "ab " + ud + " Tagen" }, due ? "hot" : "") +
      "</section>";

    // Welche Quelle bringt was? Kommentare → Follower (Conversions) und Follows → Follow-backs, je Gruppe und einzeln
    const src = {};
    const get = (via) => {
      via = String(via || ""); const g = grpOf(via);
      const G = src[g] || (src[g] = { name: g, c: 0, conv: 0, f: 0, back: 0, items: {} });
      const one = (via[0] === "#" || via[0] === "@") && via !== "@hub" ? (G.items[via] || (G.items[via] = { name: via, c: 0, conv: 0, f: 0, back: 0 })) : null;
      return [G, one].filter(Boolean);
    };
    s.activity.forEach((a) => { if (a.act === "comment") get(a.via).forEach((x) => x.c++); });
    s.conversions.forEach((c) => get(c.via).forEach((x) => x.conv++));
    rows.forEach((r) => get(r.via).forEach((x) => { x.f++; if (r.st.key === "back") x.back++; }));
    // Sortierung: wer am meisten Follower bringt (Conversions + Follow-backs) oben, bei Gleichstand die bessere Quote
    const won = (x) => x.conv + x.back, rate = (x) => (x.c + x.f ? won(x) / (x.c + x.f) : 0);
    const best = (a, b) => won(b) - won(a) || rate(b) - rate(a);
    const G = Object.values(src).sort(best);
    const srcRow = (x, big) => '<div class="src-row' + (big ? " grp" : "") + '"><div class="src-h"><span>' + (big ? app.esc(x.name) : app.viaLink(x.name)) + '</span><span class="pill' + (won(x) ? " green" : "") + '">+' + won(x) + "</span></div>" +
      '<div class="src-m">' +
        (x.c ? '<span>💬 ' + x.c + " → <b>" + x.conv + "</b> Follower" + (x.c >= 30 ? " · " + app.d1(x.conv / x.c * 100) + "/100" : "") + "</span>" : "") +
        (x.f ? '<span>➕ ' + x.f + " → <b>" + x.back + "</b> zurück · " + app.pct(x.back / x.f, 0) + "</span>" : "") +
      "</div>" + (x.f ? '<div class="roi-bar"><i style="width:' + Math.round(x.back / x.f * 100) + '%"></i></div>' : "") + "</div>";
    if (G.length) html += app.card("Welche Quelle bringt was?",
      '<div class="src">' + G.map((g) => srcRow(g, true) + Object.values(g.items).sort(best).map((it) => srcRow(it)).join("")).join("") + "</div>" +
      app.note("💬 Kommentare → neue Follower daraus. ➕ Follows → davon zurückgefolgt (Balken). Unter 30 ist der Wert noch Zufall."),
      { tip: "Pro Quelle zwei Wege zu Followern: Kommentieren (Conversion) und Folgen (Follow-back). +Zahl = Follower insgesamt, danach ist sortiert. Offene Follows zählen mit, die Quote steigt also noch." });

    const F = [["all", "Alle", rows.length], ["open", "Offen", cnt("open")], ["due", "Fällig", due], ["back", "Zurück", back], ["unf", "Entfolgt", cnt("unf")]];
    html += app.card("Gefolgt",
      '<div class="seg" id="fl-seg">' + F.map((f) => '<button data-f="' + f[0] + '" class="' + (me.filter === f[0] ? "on" : "") + '">' + f[1] + " <i>" + f[2] + "</i></button>").join("") + "</div>" +
      '<ul class="list flist" id="fl-list"></ul>');

    html += app.card("Follower & Follows pro Tag",
      '<div class="chart-box" id="ch-ff"></div><div class="legend"><i style="background:var(--accent)"></i>Follows <i style="background:var(--green)"></i>davon zurück</div><div class="chart-box" id="ch-fd"></div>');

    html += app.card("Aktivität pro Session", '<div class="legend"><i style="background:var(--accent)"></i>Kommentare <i style="background:var(--sand)"></i>Likes <i style="background:var(--green)"></i>Neue Follower</div><div class="chart-box" id="ch-sessions"></div>');

    if (s.conversions.length) html += app.card("Conversions <span class=\"pill\">" + s.conversions.length + "</span>", app.more(s.conversions.map((c) =>
      "<li>" + app.userLink(c.h) + '<span class="muted">über ' + app.viaLink(c.via || c.block || "–") + '</span><span class="right muted">' + app.fmtDate(c.ts) + "</span></li>")),
      { tip: "Neue Follower, mit denen das Skript in den 14 Tagen davor Kontakt hatte." });

    if (s.newFollowers.length) html += app.card("Neue Follower <span class=\"pill\">" + s.newFollowers.length + "</span>", app.more(s.newFollowers.slice(0, 40).map((f) => '<a class="chip" href="' + app.profile(f.h) + '" target="_blank" rel="noopener">@' + app.esc(f.h) + "</a>"), 12, "chips"));

    const acts = s.activity.filter((a) => a.act === "comment" && a.text).slice(0, 25);
    if (acts.length) html += app.card("Letzte Kommentare von dir", app.more(acts.map((a) =>
      '<li><div><a href="https://www.instagram.com/p/' + encodeURIComponent(a.sc || "") + '/" target="_blank" rel="noopener"><b>@' + app.esc(a.h) + '</b></a> <span class="muted small">' + app.viaLink(a.via || a.block || "") + " · " + app.fmtDate(a.ts, true) + '</span></div><div class="ctext">' + app.esc(a.text) + "</div></li>"), 5, "list comments"));
    el.innerHTML = html;

    const list = el.querySelector("#fl-list");
    const draw = () => {
      const show = rows.filter((r) => me.filter === "all" || r.st.key === me.filter);
      list.innerHTML = show.length ? show.map((r, i) =>
        '<li style="--i:' + Math.min(i, 12) + '"><div class="fl-top">' + app.userLink(r.h) + (r.f ? '<span class="muted small">' + app.num(r.f) + "</span>" : "") + '<span class="right">' + r.st.pill + "</span></div>" +
        '<div class="fl-meta muted small">' + (r.via ? app.viaLink(r.via) : "–") + " · " + app.fmtDate(r.ts) + " · " + r.st.age + " T.</div>" +
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
    Charts.bars(el.querySelector("#ch-sessions"), s.sessions.map((x) => ({ x: app.fmtDate(x.ts), parts: [{ v: x.comments, c: "var(--accent)" }, { v: x.likes, c: "var(--sand)" }, { v: x.new, c: "var(--green)" }],
      tip: app.fmtDate(x.ts, true) + "<br>💬 " + x.comments + " · ♥ " + x.likes + " · ➕ " + x.new + (x.conv ? " · 🎯 " + x.conv : "") })));
    el.querySelectorAll(".cu").forEach((x, i) => setTimeout(() => app.countUp(x, Number(x.dataset.to)), 150 + i * 70));
  }
});

/* Quelle → Gruppe (gleiche Einteilung für Kommentare, Conversions und Follows) */
function grpOf(via) {
  return via[0] === "#" ? "Hashtags" : via[0] === "@" ? "Hubs" : /feed|startseite/i.test(via) ? "Feed" : /^gegenbesuch/i.test(via) ? "Gegenbesuch"
    : /^(merkliste|kernliste|friends|following)$/i.test(via) ? "Kernliste & Merkliste" : "Sonstige";
}
/* Ersatz für ältere Follows ohne gespeicherten Kommentar: letzter Kommentar an dieses Profil */
function commentOf(s, h) { const a = s.activity.find((x) => x.act === "comment" && x.h === h && x.text); return a ? a.text : ""; }
