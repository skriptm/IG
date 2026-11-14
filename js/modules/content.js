/* Content: Reichweite pro Tag, Formate, Post-Ranking */
App.register({
  id: "content", title: "Content", order: 3,
  icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="16" cy="8" r="1.6"/></svg>',
  state: { sort: "reach" },
  render(el, d, app) {
    const me = this, ins = d.insights, posts = d.posts;
    const totReach = ins.reduce((a, x) => a + (x.reach || 0), 0), totNon = ins.reduce((a, x) => a + (x.reachNon || 0), 0);
    const totSaves = posts.reduce((a, p) => a + p.saves, 0), totShares = posts.reduce((a, p) => a + p.shares, 0);

    // Formate: Durchschnitt pro Post-Typ
    const groups = {};
    posts.forEach((p) => { const k = p.product === "REELS" ? "Reels" : p.type === "CAROUSEL_ALBUM" ? "Carousels" : "Bilder"; (groups[k] = groups[k] || []).push(p); });
    const fmt = Object.entries(groups).map(([k, arr]) => ({ k, n: arr.length, reach: avg(arr, "reach"), er: avg(arr.filter((p) => p.er != null), "er"), saves: avg(arr, "saves") }));
    const maxFR = Math.max(1, ...fmt.map((f) => f.reach));

    let html = app.card("Überblick",
      '<div class="stats">' +
        app.stat("Reichweite", app.num(totReach), ins.length + " Tage") +
        app.stat("Nicht-Follower", totReach ? app.pct(totNon / totReach, 0) : "–", "Anteil Reichweite") +
        app.stat("Saves", app.num(totSaves), posts.length + " Posts") +
        app.stat("Shares", app.num(totShares), posts.length + " Posts") +
      "</div>");

    html += app.card("Reichweite pro Tag", '<div class="legend"><i style="background:var(--blue)"></i>Follower <i style="background:var(--accent)"></i>Nicht-Follower</div><div class="chart-box" id="ch-reach"></div>');

    const lastFmt = [...ins].reverse().find((x) => x.reachByFormat);
    if (lastFmt) {
      const lab = { REEL: "Reels", STORY: "Stories", POST: "Bilder", CAROUSEL_CONTAINER: "Carousels", AD: "Werbung" };
      const ent = Object.entries(lastFmt.reachByFormat).sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...ent.map((e) => e[1]));
      html += app.card("Reichweite nach Format <span class=\"muted small\">" + app.fmtDate(lastFmt.day) + "</span>", '<ul class="list bars">' + ent.map(([k, v]) =>
        "<li><span>" + app.esc(lab[k] || k) + "</span>" + Charts.meter(v, mx, k === "AD" ? "var(--muted)" : "var(--accent)") + '<span class="right">' + app.num(v) + "</span></li>").join("") + "</ul>" +
        (lastFmt.reachByFormat.AD ? '<p class="muted small">„Werbung“ ist Reichweite aus beworbenen Beiträgen.</p>' : ""));
    }

    html += app.card("Formate im Vergleich", '<ul class="list bars">' + fmt.map((f) =>
      "<li><span>" + f.k + ' <small class="muted">(' + f.n + ")</small></span>" + Charts.meter(f.reach, maxFR) + '<span class="right">Ø ' + app.num(Math.round(f.reach)) + '<small class="muted"> · ER ' + app.pct(f.er) + "</small></span></li>").join("") + "</ul>");

    const sorts = { reach: "Reichweite", er: "Engagement", saves: "Saves", ts: "Neueste" };
    html += app.card("Post-Ranking",
      '<div class="seg" id="seg">' + Object.entries(sorts).map(([k, v]) => '<button data-k="' + k + '" class="' + (me.state.sort === k ? "on" : "") + '">' + v + "</button>").join("") + "</div>" +
      '<ol class="ranking" id="ranking"></ol>');
    el.innerHTML = html;

    Charts.bars(el.querySelector("#ch-reach"), ins.map((x) => ({ x: app.fmtDate(x.day), parts: [{ v: x.reachFollower || 0, c: "var(--blue)" }, { v: x.reachNon || 0, c: "var(--accent)" }],
      tip: app.fmtDate(x.day) + "<br><b>" + app.num(x.reach) + "</b> erreicht<br>" + app.num(x.reachFollower) + " Follower · " + app.num(x.reachNon) + " neu" })));

    const list = el.querySelector("#ranking");
    const draw = () => {
      const k = me.state.sort, arr = posts.slice().sort((a, b) => (k === "ts" ? (a.ts < b.ts ? 1 : -1) : (b[k] || 0) - (a[k] || 0)));
      const mx = Math.max(1, ...arr.map((p) => p.reach));
      list.innerHTML = arr.map((p, i) =>
        '<li><a href="' + app.esc(p.link) + '" target="_blank" rel="noopener">' +
          '<span class="rank">' + (i + 1) + "</span>" +
          '<div class="rk-main"><div class="rk-top"><span class="tag">' + (p.product === "REELS" ? "Reel" : p.type === "CAROUSEL_ALBUM" ? "Carousel" : "Bild") + "</span> " + app.fmtDate(p.ts) + "</div>" +
          '<div class="rk-cap">' + app.esc((p.caption.split("\n")[0] || "Ohne Caption").slice(0, 70)) + "</div>" + Charts.meter(p.reach, mx) +
          '<div class="rk-nums">👁 ' + app.num(p.reach) + " · ♥ " + app.num(p.likes) + " · 💬 " + app.num(p.comments) + " · 🔖 " + app.num(p.saves) + " · ↗ " + app.num(p.shares) + " · ER " + app.pct(p.er) + "</div></div></a></li>").join("");
    };
    draw();
    el.querySelector("#seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      me.state.sort = b.dataset.k; el.querySelectorAll("#seg button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });
    function avg(arr, k) { return arr.length ? arr.reduce((a, p) => a + (p[k] || 0), 0) / arr.length : 0; }
  }
});
