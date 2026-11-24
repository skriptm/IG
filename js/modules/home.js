/* Übersicht: Heute, Woche, Zu tun, Session, Fokus, neuester Post */

/* Gemeinsame Kennzahlen (auch vom Content-Tab genutzt) */
App.kpi = function (d) {
  const ps = d.posts.filter((p) => !p.young && p.reach).sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
  const sig = (a) => { const r = a.reduce((s, p) => s + p.reach, 0); return r ? Math.round(a.reduce((s, p) => s + p.saves + p.shares, 0) / r * 10000) / 10 : null; };
  const recent = ps.slice(0, 5), prev = ps.slice(5, 10);
  const rR = med(recent.map((p) => p.reach)), rP = med(prev.map((p) => p.reach));
  const f = d.stats && d.stats.followers;
  const cap = {}; d.posts.filter((p) => !p.young && p.reach).forEach((p) => { (cap[p.captionType] = cap[p.captionType] || []).push(p); });
  const capAvg = (k) => (cap[k] && cap[k].length ? Math.round(cap[k].reduce((s, p) => s + p.reach, 0) / cap[k].length) : null);
  return { reachRecent: rR, reachPrev: rP, reachDelta: rR != null && rP ? (rR / rP - 1) : null, signalRecent: sig(recent), signalPrev: sig(prev),
    reachShare: rR != null && f ? rR / f : null, storyAvg: capAvg("Story"), tplAvg: capAvg("Template") };
};

/* 7-Tage-Fenster aus den Konto-Insights, plus Vorwoche falls komplett */
App.week = function (d) {
  const ins = d.insights.filter((x) => x.day); if (!ins.length) return null;
  const add = (day, n) => { const x = new Date(day + "T12:00"); x.setDate(x.getDate() + n); return App.localDay(x); };
  const last = ins[ins.length - 1].day;
  const win = (from, to) => {
    const a = ins.filter((x) => x.day >= from && x.day <= to); if (!a.length) return null;
    const sum = (k) => a.reduce((s, x) => s + (Number(x[k]) || 0), 0), pvA = a.filter((x) => x.profileViews != null);
    const follows = sum("follows"), unfollows = sum("unfollows");
    return { from: a[0].day, to: a[a.length - 1].day, n: a.length, follows, unfollows, net: follows - unfollows, reach: sum("reach"), reachOrg: a.reduce((s, x) => s + (x.reachOrganic != null ? x.reachOrganic : Math.max(0, (x.reach || 0) - (x.reachAd || 0))), 0),
      reachNonOrg: a.reduce((s, x) => s + Math.max(0, (x.reachNon || 0) - (x.reachAd || 0)), 0), inter: sum("interactions"),
      pv: pvA.reduce((s, x) => s + (Number(x.profileViews) || 0), 0), pvDays: pvA.length, pvFrom: pvA.length ? pvA[0].day : null,
      pvReachNonOrg: pvA.reduce((s, x) => s + Math.max(0, (x.reachNon || 0) - (x.reachAd || 0)), 0), pvFollows: pvA.reduce((s, x) => s + (Number(x.follows) || 0), 0) };
  };
  const cur = win(add(last, -6), last), prev = win(add(last, -13), add(last, -7));
  return { cur, prev: prev && prev.n === 7 ? prev : null, fullFrom: add(ins[0].day, 13) };
};

App.register({
  id: "home", title: "Übersicht", order: 1,
  icon: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  render(el, d, app) {
    const s = d.stats, T = app.today(), cfg = d.cfg || {};
    const todaySessions = s ? s.sessions.filter((x) => app.localDay(x.ts) === T) : [];
    const sum = (k) => todaySessions.reduce((a, x) => a + (x[k] || 0), 0);
    const commentDays = new Set(s ? s.activity.filter((a) => a.act === "comment").map((a) => String(a.ts).slice(0, 10)) : []);
    let streak = 0; const dt = new Date(); if (!commentDays.has(app.localDay(dt))) dt.setDate(dt.getDate() - 1);
    while (commentDays.has(app.localDay(dt))) { streak++; dt.setDate(dt.getDate() - 1); }
    const week = []; for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); week.push(commentDays.has(app.localDay(x))); }

    const gbOpen = d.contacts.filter((c) => !c.marked).length, gbQ = d.contacts.filter((c) => c.marked).length;
    const k = App.kpi(d);

    // Session auf Knopfdruck + Tagesverbrauch
    const usedC = sum("comments"), usedL = sum("likes"), usedF = sum("follows");
    const ss = d.session || {}, st = ss.status || "";
    const running = st === "läuft" && app.daysAgo(ss.at) === 0 && (Date.now() - new Date(String(ss.at).replace(" ", "T"))) < 90 * 60e3;
    const stLine = running ? '<span class="pill green">● läuft seit ' + app.esc(String(ss.at || "").slice(11)) + "</span>"
      : st === "fertig" ? '<span class="pill">✓ zuletzt fertig ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? '<div class="muted small" style="margin-top:6px">' + app.esc(ss.summary) + "</div>" : "")
      : st === "fehler" ? '<span class="pill red">Fehler ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? '<div class="muted small" style="margin-top:6px">' + app.esc(ss.summary) + "</div>" : "")
      : '<span class="muted small">Heute noch keine Session.</span>';
    const L = cfg.limits || {}, dayCap = L.day || 40, hourCap = L.hour || 10, followCap = L.follow_day || 5;
    // Stundenbudget: Kommentare der letzten 60 Minuten (rollierend)
    const hourTs = s ? s.activity.filter((a) => a.act === "comment" && a.ts).map((a) => app.toDate(a.ts).getTime()).filter((t) => !isNaN(t) && Date.now() - t < 3600e3).sort((x, y) => x - y) : [];
    const usedH = Math.min(hourTs.length, hourCap);
    const rounds = todaySessions.length + (running ? 1 : 0);
    const segs = Array.from({ length: hourCap }, (_, i) => '<i class="' + (i < usedH ? "on" : "") + '" style="--i:' + i + '"></i>').join("");
    const cSession = app.card("Engagement-Session" + (rounds ? ' <span class="pill accent rounds">' + rounds + (rounds === 1 ? " Runde" : " Runden") + " heute</span>" : ""),
      '<div style="margin-bottom:12px">' + stLine + "</div>" +
      '<div class="hourbox' + (usedH >= hourCap ? " full" : "") + '">' +
        '<div class="hb-top"><span class="stat-l">Diese Stunde</span><span class="hb-v"><b class="cu" data-to="' + usedH + '">0</b><small> / ' + hourCap + " Kommentare</small></span></div>" +
        '<div class="segs">' + segs + "</div>" +
        '<div class="hb-sub" id="hb-sub"></div>' +
      "</div>" +
      (cfg.paused ? app.note("Engagement ist pausiert (Einstellungen → Basis).") : ""), { id: "session", tip: "Start im Claude-Chat mit „Session starten“. Sicherheitsnetz: " + dayCap + " Kommentare am Tag, " + hourCap + " pro Stunde, danach nur noch Likes." });

    const newF = sum("new");
    const cToday = app.card("Heute",
      '<div class="rings">' +
        Charts.ring(usedC, dayCap, "Kommentare", "var(--accent)") +
        Charts.ring(usedL, null, "Likes", "var(--sand)") +
        Charts.ring(usedF, followCap, "Gefolgt", "var(--sand)") +
      "</div>" +
      '<div class="gain' + (newF ? " pos" : "") + '"><span class="g-ic">' + (newF ? "✦" : "·") + '</span><span><b class="cu" data-to="' + newF + '">0</b> neue Follower heute</span><small>Ergebnis</small></div>' +
      '<div class="streak"><span class="flame">' + (streak ? "🔥" : "🌫️") + '</span><div style="flex:1"><b>' + streak + "</b> " + (streak === 1 ? "Tag" : "Tage") + " Streak" +
      "<small>aktiv an " + week.filter(Boolean).length + " von 7 Tagen</small>" +
      '<div class="days">' + week.map((on, i) => "<i" + (on ? ' class="on"' : "") + ' style="--i:' + i + '"></i>').join("") + "</div></div></div>" +
      (d.statsError ? '<p class="note">⚠️ ' + app.esc(d.statsError) + "</p>" : ""));

    // Zu tun
    const cTodo = app.card("Zu tun",
      '<div class="todo">' +
        '<a href="#" data-go="content" data-anchor="open"><div><div class="t-l">Unbeantwortet</div><div class="t-s">Kommentare unter deinen Posts</div></div><span class="badge' + (d.openComments.length ? " hot" : "") + '">' + d.openComments.length + "</span></a>" +
        '<a href="#" data-go="contacts"><div><div class="t-l">Gegenbesuch</div><div class="t-s">' + (gbQ ? gbQ + " vorgemerkt" : "warten auf Like + Kommentar") + '</div></div><span class="badge' + (gbOpen ? " hot" : "") + '">' + gbOpen + "</span></a>" +
      "</div>");

    // Hub-Alarm: neue Posts von Hubs und Kernliste, pro Account nur der neueste
    const done = new Set(s ? s.activity.filter((x) => x.sc).map((x) => x.sc) : []), seenH = new Set();
    const fresh = (d.fresh || []).filter((x) => !seenH.has(x.h) && seenH.add(x.h));
    const openF = fresh.filter((x) => !done.has(x.sc));
    const cFresh = d.freshAt ? app.card("Neu bei Hubs & Kernliste <span class=\"pill" + (openF.length ? " accent" : "") + "\">" + openF.length + "</span>",
      fresh.length ? app.more(fresh.map((x) => '<li><a href="' + app.esc(x.link) + '" target="_blank" rel="noopener"><b>@' + app.esc(x.h) + "</b></a>" +
        '<span class="muted">' + (x.hub ? "Hub" : "Kernliste") + " · " + app.esc(app.rel(x.ts)) + "</span>" +
        '<span class="right">' + (done.has(x.sc) ? '<span class="pill green">✓ kommentiert</span>' : '<span class="pill">offen</span>') + "</span></li>")) : '<p class="muted">Keine neuen Posts in den letzten 26 Stunden.</p>',
      { tip: "Make prüft täglich um 18:45 alle Hubs und die Kernliste. Die nächste Session arbeitet diese Liste zuerst ab. Stand: " + app.fmtDate(d.freshAt, true) + ". Konten ohne Business-Profil fehlen hier." }) : "";

    // Fokus diese Woche
    const adv = [];
    if (k.storyAvg && k.tplAvg) adv.push(k.storyAvg > k.tplAvg * 1.15 ? "Posts mit Story-Caption erreichen im Schnitt <b>" + app.num(k.storyAvg) + "</b> Konten, mit Template-Caption <b>" + app.num(k.tplAvg) + "</b>. Teste die nächsten 3 Posts mit einer kleinen Geschichte statt dem Standard-Block." : "Story- und Template-Captions liegen bei der Reichweite nah beieinander. Die Caption ist gerade nicht der größte Hebel.");
    if (k.signalRecent != null) adv.push(k.signalRecent < 10 ? "Auf 1.000 erreichte Konten kommen nur <b>" + app.d1(k.signalRecent) + "</b> Saves und Shares. Posts, die man speichert oder weiterschickt (Spot-Infos, Anfahrt, beste Uhrzeit, Ausrüstung), heben diesen Wert am stärksten." : "Saves und Shares liegen bei <b>" + app.d1(k.signalRecent) + "</b> pro 1.000 Reichweite. Mehr Posts in dieser Art machen.");
    if (k.reachShare != null && k.reachShare < 0.1) adv.push("Nur <b>" + app.pct(k.reachShare) + "</b> deiner Follower sehen einen Post. Reels sind der Weg zu Leuten, die dir noch nicht folgen.");
    const cFocus = adv.length ? app.card("Fokus diese Woche", '<p class="advice1">' + adv[0] + "</p>") : "";

    let cWeek = "";
    const W = App.week(d);
    if (W) {
      const cmp = (a, b, signed) => (b == null ? "" : a == null ? "" : (() => { const df = a - b; return '<span class="' + (df >= 0 ? "up" : "down") + '">' + (df >= 0 ? "▲ " : "▼ ") + (signed ? app.num(Math.abs(df)) : (b ? Math.abs(Math.round((df / b) * 100)) + " %" : "–")) + "</span> vs. Vorwoche"; })());
      const c = W.cur, pv = W.prev;
      cWeek = app.card("Diese Woche <small>" + app.fmtDate(c.from) + "–" + app.fmtDate(c.to) + "</small>",
        '<div class="stats">' +
          app.stat("Netto-Follower", '<span class="' + (c.net >= 0 ? "up" : "down") + '">' + app.signed(c.net) + "</span>", pv ? cmp(c.net, pv.net, true) : "+" + app.num(c.follows) + " / −" + app.num(c.unfollows)) +
          app.stat("Reichweite organisch", app.num(c.reachOrg), pv ? cmp(c.reachOrg, pv.reachOrg) : "Ø " + app.num(Math.round(c.reachOrg / c.n)) + " pro Tag") +
          app.stat("Interaktionen", app.num(c.inter), pv ? cmp(c.inter, pv.inter) : "") +
          app.stat("Profilaufrufe", c.pvDays ? app.num(c.pv) : "–", c.pvDays ? (pv && pv.pvDays === 7 ? cmp(c.pv, pv.pv) : c.pvDays < c.n ? "seit " + app.fmtDate(c.pvFrom) : "") : "ab morgen") +
        "</div>" + (pv ? "" : app.note("Vergleich mit der Vorwoche ab " + app.fmtDate(W.fullFrom) + ", vorher fehlen die Daten.")),
        { tip: "Summe der letzten 7 Tage mit Daten. Netto = neue Follower minus Unfollows. Organisch = ohne Reichweite aus Werbung. Reichweite ist die Summe der Tageswerte, dieselbe Person kann an mehreren Tagen zählen." });
    }

    const p = d.posts[0];
    const cPost = p ? app.card("Neuester Post",
      '<a class="post-hero" href="' + app.esc(p.link) + '" target="_blank" rel="noopener"><div class="post-meta"><span class="tag">' + p.format + "</span> " + app.fmtDate(p.ts, true) + "</div>" +
      '<div class="post-cap">' + app.esc(p.caption.split("\n")[0] || "Ohne Caption") + "</div>" +
      '<div class="stats mini">' + app.stat("Reichw.", app.num(p.reach)) + app.stat("Likes", app.num(p.likes)) + app.stat("Komm.", app.num(p.comments)) + app.stat("Saves", app.num(p.saves)) + app.stat("Shares", app.num(p.shares)) + "</div></a>") : "";
    // Reihenfolge: erst Ergebnis (Heute, Woche), dann Aufgaben, dann Technik
    el.innerHTML = cToday + cWeek + cTodo + cFresh + cSession + cFocus + cPost;
    el.querySelectorAll(".cu").forEach((x, i) => setTimeout(() => app.countUp(x, Number(x.dataset.to)), 150 + i * 70));

    // Stunden-Countdown, läuft live mit
    clearInterval(App._hourTimer);
    const hbSub = el.querySelector("#hb-sub");
    const tickHour = () => {
      if (!hbSub || !document.body.contains(hbSub)) return clearInterval(App._hourTimer);
      const live = hourTs.filter((t) => Date.now() - t < 3600e3), free = hourCap - Math.min(live.length, hourCap);
      const mins = (t) => Math.max(1, Math.ceil((t + 3600e3 - Date.now()) / 60e3));
      if (!live.length) hbSub.innerHTML = '<span class="ok">● volles Stundenbudget</span>';
      else if (free <= 0) hbSub.innerHTML = '<span class="warn">● voll</span> · nächster Kommentar in <b>' + mins(live[live.length - hourCap]) + " min</b>";
      else hbSub.innerHTML = '<span class="ok">● noch ' + free + " frei</span> · ältester fällt raus in " + mins(live[0]) + " min";
    };
    tickHour(); App._hourTimer = setInterval(tickHour, 30e3);

    el.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); app.go(a.dataset.go, a.dataset.anchor); }));
  }
});
