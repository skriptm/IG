/* Übersicht: Tagesringe, Streak, Zu tun, Fokus, Kennzahlen, Schnellaktionen */

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

    const last = d.insights[d.insights.length - 1] || {}, prev = d.insights[d.insights.length - 2] || {};
    const trend = (a, b) => (a == null || b == null || !b ? "" : '<span class="' + (a >= b ? "up" : "down") + '">' + (a >= b ? "▲" : "▼") + " " + Math.abs(Math.round(((a - b) / b) * 100)) + " %</span>");
    const gbOpen = d.contacts.filter((c) => !c.marked).length, gbQ = d.contacts.filter((c) => c.marked).length;
    const k = App.kpi(d);

    // Session auf Knopfdruck
    const ss = d.session || {}, st = ss.status || "";
    const nextCheck = () => { const n = new Date(); const t = new Date(n); t.setMinutes(8, 0, 0); if (t <= n) t.setHours(t.getHours() + 1);
      if (t.getHours() < 7) t.setHours(7, 8); if (t.getHours() > 21) { t.setDate(t.getDate() + 1); t.setHours(7, 8); }
      return t.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) + (t.getDate() !== n.getDate() ? " (morgen)" : ""); };
    const stLine = st === "angefordert" ? '<span class="pill accent">angefordert ' + app.esc(String(ss.at || "").slice(11)) + '</span> <span class="muted small">startet um ' + nextCheck() + "</span>"
      : st === "läuft" ? '<span class="pill green">● läuft seit ' + app.esc(String(ss.at || "").slice(11)) + "</span>"
      : st === "fertig" ? '<span class="pill">✓ fertig ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? ' <span class="muted small">' + app.esc(ss.summary) + "</span>" : "")
      : st === "fehler" ? '<span class="pill red">Fehler ' + app.esc(app.fmtDate(ss.at, true)) + "</span>" + (ss.summary ? ' <span class="muted small">' + app.esc(ss.summary) + "</span>" : "")
      : '<span class="muted small">Noch keine Session über die App gestartet.</span>';
    const busySess = st === "angefordert" || st === "läuft";
    let html = app.card("Engagement-Session",
      '<div style="margin-bottom:12px">' + stLine + "</div>" +
      (st === "angefordert" ? '<div class="btnrow"><button class="btn" id="sess-cancel">Anforderung zurückziehen</button></div>'
        : '<button class="btn primary" id="sess-start"' + (busySess || cfg.paused ? " disabled" : "") + ">▶︎ Session starten</button>") +
      app.note(cfg.paused ? "Engagement ist pausiert (Einstellungen → Basis)." : "Läuft auf dem Windows-Laptop. Die Session startet bei der nächsten Nachschau (stündlich um :08, 7–21 Uhr) und hält sich an alle Limits."), { id: "session" });

    html += app.card("Heute",
      '<div class="rings">' +
        Charts.ring(sum("comments"), dayGoal, "Kommentare", "var(--accent)") +
        Charts.ring(sum("likes"), g.likes, "Likes", "var(--sand)") +
        Charts.ring(sum("new"), g.newFollowers, "Neue Follower", "var(--green)") +
      "</div>" +
      '<div class="streak"><span class="flame">' + (streak ? "🔥" : "🌫️") + '</span><div style="flex:1"><b>' + streak + "</b> " + (streak === 1 ? "Tag" : "Tage") + " Streak" +
      "<small>" + (todaySessions.length ? todaySessions.length + " Session(s) heute" : "Heute noch keine Session") + "</small>" +
      '<div class="days">' + week.map((on) => "<i" + (on ? ' class="on"' : "") + "></i>").join("") + "</div></div></div>" +
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
    if (d.openComments.length) adv.push("<b>" + d.openComments.length + "</b> Kommentare unter deinen Posts sind noch unbeantwortet. Antworte zuerst dort: Gespräche unter dem eigenen Post zählen mehr als Kommentare bei anderen.");
    if (k.storyAvg && k.tplAvg) adv.push(k.storyAvg > k.tplAvg * 1.15 ? "Posts mit Story-Caption erreichen im Schnitt <b>" + app.num(k.storyAvg) + "</b> Konten, mit Template-Caption <b>" + app.num(k.tplAvg) + "</b>. Teste die nächsten 3 Posts mit einer kleinen Geschichte statt dem Standard-Block." : "Story- und Template-Captions liegen bei der Reichweite nah beieinander. Die Caption ist gerade nicht der größte Hebel.");
    if (k.signalRecent != null) adv.push(k.signalRecent < 10 ? "Auf 1.000 erreichte Konten kommen nur <b>" + app.d1(k.signalRecent) + "</b> Saves und Shares. Posts, die man speichert oder weiterschickt (Spot-Infos, Anfahrt, beste Uhrzeit, Ausrüstung), heben diesen Wert am stärksten." : "Saves und Shares liegen bei <b>" + app.d1(k.signalRecent) + "</b> pro 1.000 Reichweite. Mehr Posts in dieser Art machen.");
    if (k.reachShare != null && k.reachShare < 0.1) adv.push("Nur <b>" + app.pct(k.reachShare) + "</b> deiner Follower sehen einen Post. Reels sind der Weg zu Leuten, die dir noch nicht folgen.");
    if (adv.length) html += app.card("Fokus diese Woche", '<ul class="advice">' + adv.map((a) => "<li>" + a + "</li>").join("") + "</ul>");

    html += app.card("Gestern auf Instagram",
      '<div class="stats">' +
        app.stat("Reichweite", app.num(last.reach), trend(last.reach, prev.reach)) +
        app.stat("Nicht-Follower", last.reach ? app.pct(last.reachNon / last.reach, 0) : "–", "der Reichweite") +
        app.stat("Follows", app.num(last.follows), last.unfollows != null ? "−" + app.num(last.unfollows) + " Unfollows" : "") +
        app.stat("Interaktionen", app.num(last.interactions), trend(last.interactions, prev.interactions)) +
      "</div>" + (last.day ? app.note("Stand " + app.fmtDate(last.day) + ", Make erfasst jeden Abend um 23:40.") : ""));

    html += app.card("Schnellaktionen",
      '<div class="actions">' +
        '<button class="btn primary" id="act-reply">💬 Offene Kommentare jetzt beantworten</button>' +
        '<a class="btn" href="https://www.instagram.com/' + CONFIG.account + '/" target="_blank" rel="noopener">📷 Instagram öffnen</a>' +
      "</div>" + app.note("Claude antwortet unter deinen letzten 12 Posts. Fragen gehen per Mail an dich."));

    const p = d.posts[0];
    if (p) html += app.card("Neuester Post",
      '<a class="post-hero" href="' + app.esc(p.link) + '" target="_blank" rel="noopener"><div class="post-meta"><span class="tag">' + p.format + "</span> " + app.fmtDate(p.ts, true) + "</div>" +
      '<div class="post-cap">' + app.esc(p.caption.split("\n")[0] || "Ohne Caption") + "</div>" +
      '<div class="stats mini">' + app.stat("Reichweite", app.num(p.reach)) + app.stat("Likes", app.num(p.likes)) + app.stat("Saves", app.num(p.saves)) + app.stat("Shares", app.num(p.shares)) + "</div></a>");
    el.innerHTML = html;

    const setSess = async (q, msg) => {
      try { await app.call({ a: "sess_set", q }); d.session = q ? { req: q, status: "angefordert", at: app.stamp() } : { status: "abgebrochen", at: app.stamp() };
        const raw = app.LS.get("cache", null); if (raw) { raw.session = d.session; app.LS.set("cache", raw); }
        app.toast(msg); app.render(); }
      catch (err) { app.toast("Nicht gespeichert: " + err.message, "bad"); }
    };
    const sb = el.querySelector("#sess-start"); if (sb) sb.onclick = () => { if (confirm("Engagement-Session anfordern? Sie startet um " + nextCheck() + " auf dem Laptop.")) setSess(app.stamp(), "Session angefordert ✓ – Start um " + nextCheck()); };
    const sc = el.querySelector("#sess-cancel"); if (sc) sc.onclick = () => setSess("", "Anforderung zurückgezogen");

    el.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); app.go(a.dataset.go, a.dataset.anchor); }));
    el.querySelector("#act-reply").onclick = async (e) => {
      if (!confirm("Offene Kommentare unter den letzten 12 Posts jetzt per KI beantworten?")) return;
      const b = e.currentTarget; b.disabled = true; b.textContent = "Läuft …";
      try { await app.call({ a: "reply" }); app.toast("Gestartet – zu jeder Antwort kommt eine Mail"); }
      catch (err) { app.toast("Konnte nicht starten: " + err.message, "bad"); }
      finally { b.disabled = false; b.textContent = "💬 Offene Kommentare jetzt beantworten"; }
    };
  }
});
