/* Übersicht: Session, Tagesringe, Streak, Zu tun, Fokus, neuester Post */

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

App.register({
  id: "home", title: "Übersicht", order: 1,
  icon: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  render(el, d, app) {
    const g = app.settings.goals, s = d.stats, T = app.today(), cfg = d.cfg || {};
    const dayGoal = (cfg.limits && cfg.limits.day) || g.comments;
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
    const running = (st === "gestartet" || st === "läuft") && app.daysAgo(ss.at) === 0 && (Date.now() - new Date(String(ss.at).replace(" ", "T"))) < 90 * 60e3;
    const stLine = st === "gestartet" && running ? '<span class="pill accent">● startet … ' + app.esc(String(ss.at || "").slice(11)) + "</span>"
      : st === "läuft" && running ? '<span class="pill green">● läuft seit ' + app.esc(String(ss.at || "").slice(11)) + "</span>"
      : st === "fertig" ? '<span class="pill">✓ zuletzt fertig ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? '<div class="muted small" style="margin-top:6px">' + app.esc(ss.summary) + "</div>" : "")
      : st === "fehler" ? '<span class="pill red">Fehler ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? '<div class="muted small" style="margin-top:6px">' + app.esc(ss.summary) + "</div>" : "")
      : '<span class="muted small">Heute noch keine Session.</span>';
    const L = cfg.limits || {}, dayCap = L.day || 40, hourCap = L.hour || 10, followCap = L.follow_day || 5;
    // Stundenbudget: Kommentare der letzten 60 Minuten (rollierend)
    const hourTs = s ? s.activity.filter((a) => a.act === "comment" && a.ts).map((a) => app.toDate(a.ts).getTime()).filter((t) => !isNaN(t) && Date.now() - t < 3600e3).sort((x, y) => x - y) : [];
    const usedH = Math.min(hourTs.length, hourCap);
    const rounds = Math.max(todaySessions.length + (running ? 1 : 0), d.starts || 0);
    const segs = Array.from({ length: hourCap }, (_, i) => '<i class="' + (i < usedH ? "on" : "") + '" style="--i:' + i + '"></i>').join("");
    let html = app.card("Engagement-Session" + (rounds ? ' <span class="pill accent rounds">' + rounds + (rounds === 1 ? " Runde" : " Runden") + " heute</span>" : ""),
      '<div style="margin-bottom:12px">' + stLine + "</div>" +
      '<div class="hourbox' + (usedH >= hourCap ? " full" : "") + '">' +
        '<div class="hb-top"><span class="stat-l">Diese Stunde</span><span class="hb-v"><b class="cu" data-to="' + usedH + '">0</b><small> / ' + hourCap + " Kommentare</small></span></div>" +
        '<div class="segs">' + segs + "</div>" +
        '<div class="hb-sub" id="hb-sub"></div>' +
      "</div>" +
      (cfg.paused ? app.note("Engagement ist pausiert (Einstellungen → Basis).") : ""), { id: "session", tip: "Start im Claude-Chat mit „Session starten“. Sicherheitsnetz: " + dayCap + " Kommentare am Tag, " + hourCap + " pro Stunde, danach nur noch Likes." });

    const newF = sum("new");
    html += app.card("Heute",
      '<div class="rings">' +
        Charts.ring(usedC, dayCap, "Kommentare", "var(--accent)") +
        Charts.ring(usedL, null, "Likes", "var(--sand)") +
        Charts.ring(usedF, followCap, "Gefolgt", "var(--blue)") +
      "</div>" +
      '<div class="gain' + (newF ? " pos" : "") + '"><span class="g-ic">' + (newF ? "✦" : "·") + '</span><span><b class="cu" data-to="' + newF + '">0</b> neue Follower heute</span><small>Ergebnis</small></div>' +
      '<div class="streak"><span class="flame">' + (streak ? "🔥" : "🌫️") + '</span><div style="flex:1"><b>' + streak + "</b> " + (streak === 1 ? "Tag" : "Tage") + " Streak" +
      "<small>aktiv an " + week.filter(Boolean).length + " von 7 Tagen</small>" +
      '<div class="days">' + week.map((on, i) => "<i" + (on ? ' class="on"' : "") + ' style="--i:' + i + '"></i>').join("") + "</div></div></div>" +
      (d.statsError ? '<p class="note">⚠️ ' + app.esc(d.statsError) + "</p>" : ""));

    // Zu tun + Ticker
    const latest = d.allComments.slice(0, 12);
    html += app.card("Zu tun",
      '<div class="todo">' +
        '<a href="#" data-go="content" data-anchor="open"><div><div class="t-l">Unbeantwortet</div><div class="t-s">Kommentare unter deinen Posts</div></div><span class="badge' + (d.openComments.length ? " hot" : "") + '">' + d.openComments.length + "</span></a>" +
        '<a href="#" data-go="contacts"><div><div class="t-l">Gegenbesuch</div><div class="t-s">' + (gbQ ? gbQ + " vorgemerkt" : "warten auf Like + Kommentar") + '</div></div><span class="badge' + (gbOpen ? " hot" : "") + '">' + gbOpen + "</span></a>" +
      "</div>" +
      (latest.length ? '<div class="ticker"><div class="track" style="--dur:' + Math.max(25, latest.length * 6) + 's">' + [...latest, ...latest].map((c) => "<span><b>@" + app.esc(c.h) + "</b> " + app.esc(c.text) + "</span>").join("") + "</div></div>" : ""));

    // Fokus diese Woche
    const adv = [];
    if (k.storyAvg && k.tplAvg) adv.push(k.storyAvg > k.tplAvg * 1.15 ? "Posts mit Story-Caption erreichen im Schnitt <b>" + app.num(k.storyAvg) + "</b> Konten, mit Template-Caption <b>" + app.num(k.tplAvg) + "</b>. Teste die nächsten 3 Posts mit einer kleinen Geschichte statt dem Standard-Block." : "Story- und Template-Captions liegen bei der Reichweite nah beieinander. Die Caption ist gerade nicht der größte Hebel.");
    if (k.signalRecent != null) adv.push(k.signalRecent < 10 ? "Auf 1.000 erreichte Konten kommen nur <b>" + app.d1(k.signalRecent) + "</b> Saves und Shares. Posts, die man speichert oder weiterschickt (Spot-Infos, Anfahrt, beste Uhrzeit, Ausrüstung), heben diesen Wert am stärksten." : "Saves und Shares liegen bei <b>" + app.d1(k.signalRecent) + "</b> pro 1.000 Reichweite. Mehr Posts in dieser Art machen.");
    if (k.reachShare != null && k.reachShare < 0.1) adv.push("Nur <b>" + app.pct(k.reachShare) + "</b> deiner Follower sehen einen Post. Reels sind der Weg zu Leuten, die dir noch nicht folgen.");
    if (adv.length) html += app.card("Fokus diese Woche", '<p class="advice1">' + adv[0] + "</p>");

    const p = d.posts[0];
    if (p) html += app.card("Neuester Post",
      '<a class="post-hero" href="' + app.esc(p.link) + '" target="_blank" rel="noopener"><div class="post-meta"><span class="tag">' + p.format + "</span> " + app.fmtDate(p.ts, true) + "</div>" +
      '<div class="post-cap">' + app.esc(p.caption.split("\n")[0] || "Ohne Caption") + "</div>" +
      '<div class="stats mini">' + app.stat("Reichw.", app.num(p.reach)) + app.stat("Likes", app.num(p.likes)) + app.stat("Komm.", app.num(p.comments)) + app.stat("Saves", app.num(p.saves)) + app.stat("Shares", app.num(p.shares)) + "</div></a>");
    el.innerHTML = html;
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

    const sb = el.querySelector("#sess-start");
    if (sb) sb.onclick = async () => {
      if (!confirm("Jetzt eine Engagement-Session auf dem Laptop starten?")) return;
      sb.disabled = true; sb.textContent = "Starte …";
      try {
        const r = await app.call({ a: "start" }, 40000);
        if (r.ok) { d.session = { status: "gestartet", at: app.stamp() }; d.starts = (d.starts || 0) + 1; app.toast("Session gestartet ✓ – Ergebnis kommt per Push"); }
        else { d.session = { status: "fehler", at: app.stamp(), summary: r.code === 401 ? "Start-Token fehlt oder ist ungültig (Make)" : "Claude hat den Start abgelehnt (Code " + r.code + ")" }; app.toast("Start fehlgeschlagen", "bad"); }
        const raw = app.LS.get("cache", null); if (raw) { raw.session = d.session; raw.starts = app.localDay(new Date()) + "|" + d.starts; app.LS.set("cache", raw); }
      } catch (err) { app.toast("Start fehlgeschlagen: " + err.message, "bad"); }
      app.render();
    };

    el.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); app.go(a.dataset.go, a.dataset.anchor); }));
  }
});
