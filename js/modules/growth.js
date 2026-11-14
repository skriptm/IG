/* Wachstum: Follower-Kurve, Conversions, Follows mit Follow-back, Entfolgen-Kandidaten, Aktivität */
App.register({
  id: "growth", title: "Wachstum", order: 2,
  icon: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  render(el, d, app) {
    const s = d.stats;
    if (!s) {
      el.innerHTML = app.card("Wachstum", '<p>Die Follower-Kurve und der Engagement-Verlauf kommen aus der Drive-Statistik des Engagement-Skills.</p><p class="note">⚠️ ' + app.esc(d.statsError || "Noch keine Daten") + "</p>") + followsFromInsights(d, app);
      drawInsightFollows(el, d, app);
      return;
    }
    const first = s.sessions[0], lastS = s.sessions[s.sessions.length - 1];
    const gain = lastS && first ? lastS.followers - first.followers : 0;
    const totalComments = s.sessions.reduce((a, x) => a + (x.comments || 0), 0);
    const conv = s.conversions.length;
    const back = s.follows.filter((f) => f.status === "back").length;
    const open = s.follows.filter((f) => f.status !== "back");
    const unf = open.filter((f) => app.daysAgo(f.ts) >= CONFIG.unfollowAfterDays);

    let html = app.card("Follower",
      '<div class="stats">' +
        app.stat("Follower", app.num(lastS.followers), (gain >= 0 ? "+" : "") + app.num(gain) + " seit " + app.fmtDate(first.ts)) +
        app.stat("Folge ich", app.num(lastS.following)) +
        app.stat("Conversions", app.num(conv), totalComments ? app.pct(conv / totalComments) + " der Kommentare" : "") +
        app.stat("Follow-back", s.follows.length ? back + "/" + s.follows.length : "–", s.follows.length ? app.pct(back / s.follows.length, 0) : "") +
      "</div>" + '<div class="chart-box" id="ch-followers"></div>');

    html += app.card("Aktivität pro Session", '<div class="legend"><i style="background:var(--accent)"></i>Kommentare <i style="background:var(--blue)"></i>Likes <i style="background:var(--green)"></i>Neue Follower</div><div class="chart-box" id="ch-sessions"></div>');

    // Ziel-Prognose
    const goal = (d.cfg && d.cfg.goal) || s.goal || {};
    if (goal.followers) {
      const spanDays = Math.max(1, (new Date(lastS.ts.replace(" ", "T")) - new Date(first.ts.replace(" ", "T"))) / 864e5);
      const perDay = gain / spanDays, left = goal.followers - lastS.followers;
      const eta = perDay > 0 ? Math.ceil(left / perDay) : null;
      const etaDate = eta != null ? new Date(Date.now() + eta * 864e5) : null;
      const onTrack = goal.date && etaDate ? etaDate <= new Date(goal.date) : null;
      html += app.card("Follower-Ziel",
        '<div class="stats">' + app.stat("Ziel", app.num(goal.followers), goal.date ? "bis " + app.fmtDate(goal.date) : "") +
        app.stat("Noch", app.num(Math.max(0, left)), app.d1(perDay) + " pro Tag") + "</div>" +
        '<div style="margin-top:10px">' + Charts.meter(lastS.followers, goal.followers) + "</div>" +
        app.note(left <= 0 ? "Ziel erreicht 🎉" : eta == null ? "Beim aktuellen Tempo nicht absehbar." : "Beim aktuellen Tempo erreicht am " + etaDate.toLocaleDateString("de-CH") + (onTrack == null ? "." : onTrack ? ", also rechtzeitig." : ", also später als geplant.")));
    }

    // Bringt das Skript Follower? (je Bereich)
    const area = (via, block) => block === "follow" ? "Follows" : !via ? "Ohne Angabe" : via[0] === "@" ? "Hubs" : via[0] === "#" ? "Hashtags" : /^Feed/.test(via) ? "Startseite" : /^Gegenbesuch/.test(via) ? "Gegenbesuch" : /^(Merkliste|Kernliste|Friends|Following)$/.test(via) ? "Kernliste & Merkliste" : "Sonstiges";
    const roi = {}; const get = (a) => roi[a] || (roi[a] = { area: a, comments: 0, conv: 0 });
    s.activity.forEach((a) => { if (a.act === "comment") get(area(a.via, a.block)).comments++; });
    s.conversions.forEach((c) => get(area(c.via, c.block)).conv++);
    const roiRows = Object.values(roi).sort((a, b) => b.comments - a.comments);
    if (roiRows.length) html += app.card("Bringt das Skript Follower?",
      '<p class="lead">Seit Messbeginn <b>' + app.num(totalComments) + "</b> Kommentare, <b>" + app.num(s.sessions.reduce((a, x) => a + (x.new || 0), 0)) + "</b> neue Follower, davon <b>" + conv + "</b> direkt zurückführbar.</p>" +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Bereich</th><th>Kommentare</th><th>Follower</th><th>pro Follower</th></tr></thead><tbody>' +
      roiRows.map((r) => "<tr><td>" + app.esc(r.area) + "</td><td>" + r.comments + "</td><td>" + r.conv + "</td><td>" + (r.conv ? app.d1(r.comments / r.conv) : "–") + "</td></tr>").join("") + "</tbody></table></div>" +
      app.note("„pro Follower“ = wie viele Kommentare ein Bereich im Schnitt für einen neuen Follower braucht. Weniger ist besser."));

    if (s.conversions.length) {
      html += app.card("Conversions <span class=\"pill\">" + conv + "</span>", '<ul class="list">' + s.conversions.map((c) =>
        '<li><a href="' + app.profile(c.h) + '" target="_blank" rel="noopener"><b>@' + app.esc(c.h) + '</b></a><span class="muted">über ' + app.esc(c.via || c.block || "–") + "</span><span class=\"right muted\">" + app.fmtDate(c.ts) + "</span></li>").join("") + "</ul>");
    }

    html += app.card("Gefolgt <span class=\"pill\">" + s.follows.length + "</span>", s.follows.length ? '<ul class="list">' + s.follows.map((f) =>
      '<li><a href="' + app.profile(f.h) + '" target="_blank" rel="noopener"><b>@' + app.esc(f.h) + "</b></a>" +
      '<span class="muted">' + (f.f ? app.num(f.f) + " Follower · " : "") + app.esc(f.via || "") + "</span>" +
      '<span class="right">' + (f.status === "back" ? '<span class="pill green">folgt zurück</span>' : '<span class="pill">' + app.daysAgo(f.ts) + " T. offen</span>") + "</span></li>").join("") + "</ul>" : '<p class="muted">Noch niemandem gefolgt.</p>');

    html += app.card("Entfolgen? <span class=\"pill" + (unf.length ? " accent" : "") + "\">" + unf.length + "</span>",
      unf.length ? '<p class="muted small">Seit mindestens ' + CONFIG.unfollowAfterDays + ' Tagen kein Follow-back.</p><ul class="list">' + unf.map((f) => '<li><a href="' + app.profile(f.h) + '" target="_blank" rel="noopener"><b>@' + app.esc(f.h) + '</b></a><span class="right muted">seit ' + app.fmtDate(f.ts) + "</span></li>").join("") + "</ul>"
        : '<p class="muted">Niemand – alle offenen Follows sind jünger als ' + CONFIG.unfollowAfterDays + " Tage.</p>");

    if (s.newFollowers.length) {
      html += app.card("Neue Follower <span class=\"pill\">" + s.newFollowers.length + "</span>", '<div class="chips">' + s.newFollowers.slice(0, 40).map((f) => '<a class="chip" href="' + app.profile(f.h) + '" target="_blank" rel="noopener">@' + app.esc(f.h) + "</a>").join("") + "</div>");
    }

    const acts = s.activity.filter((a) => a.act === "comment" && a.text).slice(0, 25);
    if (acts.length) {
      html += app.card("Letzte Kommentare von dir", '<ul class="list comments">' + acts.map((a) =>
        '<li><div><a href="https://www.instagram.com/p/' + encodeURIComponent(a.sc || "") + '/" target="_blank" rel="noopener"><b>@' + app.esc(a.h) + '</b></a> <span class="muted small">' + app.esc(a.via || a.block || "") + " · " + app.fmtDate(a.ts, true) + "</span></div><div class=\"ctext\">" + app.esc(a.text) + "</div></li>").join("") + "</ul>");
    }
    el.innerHTML = html;

    Charts.line(el.querySelector("#ch-followers"), s.sessions.map((x) => ({ x: app.fmtDate(x.ts), y: x.followers, tip: "<b>" + app.num(x.followers) + "</b> Follower<br>" + app.fmtDate(x.ts, true) })), { id: "fol" });
    Charts.bars(el.querySelector("#ch-sessions"), s.sessions.map((x) => ({ x: app.fmtDate(x.ts), parts: [{ v: x.comments, c: "var(--accent)" }, { v: x.likes, c: "var(--blue)" }, { v: x.new, c: "var(--green)" }],
      tip: app.fmtDate(x.ts, true) + "<br>💬 " + x.comments + " · ♥ " + x.likes + " · ➕ " + x.new + (x.conv ? " · 🎯 " + x.conv : "") })));

    function followsFromInsights() { return app.card("Follows laut Instagram", '<div class="chart-box" id="ch-ins-f"></div>'); }
    function drawInsightFollows(root) { Charts.bars(root.querySelector("#ch-ins-f"), d.insights.map((x) => ({ x: app.fmtDate(x.day), parts: [{ v: x.follows || 0, c: "var(--green)" }], tip: app.fmtDate(x.day) + ": +" + (x.follows || 0) + " / −" + (x.unfollows || 0) }))); }
  }
});
