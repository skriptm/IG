/* Übersicht: Tagesringe, Streak, Kennzahlen, Schnellaktionen */
App.register({
  id: "home", title: "Übersicht", order: 1,
  icon: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  render(el, d, app) {
    const g = app.settings.goals, s = d.stats, T = app.today();
    const todaySessions = s ? s.sessions.filter((x) => app.localDay(x.ts) === T) : [];
    const sum = (k) => todaySessions.reduce((a, x) => a + (x[k] || 0), 0);

    // Streak: aufeinanderfolgende Tage mit mindestens einer Session
    let streak = 0;
    if (s) {
      const set = new Set(s.sessions.map((x) => app.localDay(x.ts)));
      const dt = new Date(); if (!set.has(app.localDay(dt))) dt.setDate(dt.getDate() - 1);
      while (set.has(app.localDay(dt))) { streak++; dt.setDate(dt.getDate() - 1); }
    }

    const last = d.insights[d.insights.length - 1] || {};
    const prev = d.insights[d.insights.length - 2] || {};
    const trend = (a, b) => (a == null || b == null || !b ? "" : '<span class="' + (a >= b ? "up" : "down") + '">' + (a >= b ? "▲" : "▼") + " " + Math.abs(Math.round(((a - b) / b) * 100)) + " %</span>");
    const marked = d.contacts.filter((c) => c.marked).length;
    const recent = d.posts.slice(0, 8).filter((p) => p.er != null);
    const avgEr = recent.length ? recent.reduce((a, p) => a + p.er, 0) / recent.length : null;

    let html = "";
    html += app.card("Heute",
      '<div class="rings">' +
        Charts.ring(sum("comments"), g.comments, "Kommentare", "var(--accent)") +
        Charts.ring(sum("likes"), g.likes, "Likes", "var(--blue)") +
        Charts.ring(sum("new"), g.newFollowers, "Neue Follower", "var(--green)") +
      "</div>" +
      '<div class="streak"><span class="flame">' + (streak ? "🔥" : "🌫️") + "</span><div><b>" + streak + (streak === 1 ? " Tag" : " Tage") + "</b> Engagement-Streak" +
      "<small>" + (todaySessions.length ? todaySessions.length + " Session(s) heute" : "Heute noch keine Session") + "</small></div></div>" +
      (d.statsError ? '<p class="note">⚠️ ' + app.esc(d.statsError) + ": Ringe und Streak brauchen die Drive-Statistik.</p>" : ""));

    html += app.card("Gestern auf Instagram",
      '<div class="stats">' +
        app.stat("Reichweite", app.num(last.reach), trend(last.reach, prev.reach)) +
        app.stat("Nicht-Follower", last.reach ? app.pct(last.reachNon / last.reach, 0) : "–", "der Reichweite") +
        app.stat("Neue Follows", app.num(last.follows), last.unfollows != null ? "−" + app.num(last.unfollows) + " Unfollows" : "") +
        app.stat("Interaktionen", app.num(last.interactions), trend(last.interactions, prev.interactions)) +
      "</div>" + (last.day ? '<p class="muted small">Stand ' + app.fmtDate(last.day) + "</p>" : ""));

    html += app.card("Schnellaktionen",
      '<div class="actions">' +
        '<button class="btn primary" id="act-reply">💬 Offene Kommentare beantworten</button>' +
        '<button class="btn" id="act-contacts">🤝 Gegenbesuche <span class="pill">' + d.contacts.length + "</span>" + (marked ? ' <span class="pill accent">' + marked + " vorgemerkt</span>" : "") + "</button>" +
        '<a class="btn" href="https://www.instagram.com/' + CONFIG.account + '/" target="_blank" rel="noopener">📷 Instagram öffnen</a>' +
      "</div>");

    const p = d.posts[0];
    if (p) {
      html += app.card("Neuester Post",
        '<a class="post-hero" href="' + app.esc(p.link) + '" target="_blank" rel="noopener">' +
          '<div class="post-meta"><span class="tag">' + app.esc(fmtType(p)) + "</span> " + app.fmtDate(p.ts, true) + "</div>" +
          '<div class="post-cap">' + app.esc(p.caption.split("\n")[0] || "Ohne Caption") + "</div>" +
          '<div class="stats mini">' + app.stat("Reichweite", app.num(p.reach)) + app.stat("Likes", app.num(p.likes)) + app.stat("Saves", app.num(p.saves)) + app.stat("ER", app.pct(p.er)) + "</div>" +
        "</a>" + (avgEr != null ? '<p class="muted small">Ø Engagement-Rate letzte ' + recent.length + " Posts: " + app.pct(avgEr) + "</p>" : ""));
    }
    el.innerHTML = html;

    el.querySelector("#act-contacts").onclick = () => app.go("contacts");
    el.querySelector("#act-reply").onclick = async (e) => {
      if (!confirm("Offene Kommentare unter den letzten 12 Posts jetzt per KI beantworten? Fragen gehen wie gewohnt per Mail an dich.")) return;
      const b = e.currentTarget; b.disabled = true; b.textContent = "Läuft …";
      try { await app.call({ a: "reply" }); app.toast("Gestartet – Ergebnis kommt per Mail"); }
      catch (err) { app.toast("Konnte nicht starten: " + err.message, "bad"); }
      finally { b.disabled = false; b.textContent = "💬 Offene Kommentare beantworten"; }
    };
    function fmtType(p) { return p.product === "REELS" ? "Reel" : p.type === "CAROUSEL_ALBUM" ? "Carousel" : p.type === "VIDEO" ? "Video" : "Bild"; }
  }
});
