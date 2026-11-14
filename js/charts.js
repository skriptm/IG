/* Schlanke SVG-Charts ohne externe Bibliothek (funktionieren offline). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const esc = (s) => App.esc(s);

  // Fortschrittsring
  function ring(value, goal, label, color) {
    const open = goal == null, p = open ? (value ? 1 : 0) : goal ? Math.min(1, value / goal) : 0, r = 34, c = 2 * Math.PI * r;
    return '<div class="ring' + (!open && goal && value >= goal ? " full" : "") + '" data-anim style="--rc:' + color + '"><svg viewBox="0 0 84 84" width="84" height="84">' +
      '<circle cx="42" cy="42" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="42" cy="42" r="' + r + '" class="ring-fg" style="stroke:' + color + ";stroke-dasharray:" + c + ";--off:" + c * (1 - p) + ";stroke-dashoffset:" + c + '"/>' +
      '</svg><div class="ring-in"><b class="cu" data-to="' + (Number(value) || 0) + '">0</b>' + (open ? "" : "<small>/" + App.num(goal) + "</small>") + "</div><div class=\"ring-l\">" + esc(label) + "</div></div>";
  }

  // Linien-/Flächenchart. points: [{x:label, y:number, tip}]
  function line(el, points, opts) {
    opts = opts || {};
    el.innerHTML = "";
    if (!points.length) { el.innerHTML = '<p class="muted">Noch keine Daten</p>'; return; }
    const W = el.clientWidth || 320, H = opts.height || 160, P = { l: 8, r: 8, t: 14, b: 22 };
    const ys = points.map((p) => p.y), min = Math.min(...ys), max = Math.max(...ys), pad = (max - min) * 0.15 || 1;
    const lo = min - pad, hi = max + pad;
    const X = (i) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (points.length - 1));
    const Y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    const d = points.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
    const area = d + " L" + X(points.length - 1).toFixed(1) + " " + (H - P.b) + " L" + X(0).toFixed(1) + " " + (H - P.b) + "Z";
    const color = opts.color || "var(--accent)";
    let svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" class="chart">' +
      '<defs><linearGradient id="g' + (opts.id || "l") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#g' + (opts.id || "l") + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" class="draw"/>';
    points.forEach((p, i) => { svg += '<circle cx="' + X(i) + '" cy="' + Y(p.y) + '" r="3.2" fill="#0b0d10" stroke="' + color + '" stroke-width="2"/>'; });
    // Achsenbeschriftung: erster und letzter Punkt
    svg += '<text x="' + P.l + '" y="' + (H - 6) + '" class="axis">' + esc(points[0].x) + "</text>";
    if (points.length > 1) svg += '<text x="' + (W - P.r) + '" y="' + (H - 6) + '" class="axis" text-anchor="end">' + esc(points[points.length - 1].x) + "</text>";
    svg += '<text x="' + (W - P.r) + '" y="' + (Y(max) - 6) + '" class="axis" text-anchor="end">' + App.num(max) + "</text>";
    svg += '<line class="cursor" x1="0" x2="0" y1="' + P.t + '" y2="' + (H - P.b) + '" style="display:none"/></svg><div class="tip" style="display:none"></div>';
    el.innerHTML = svg;
    interact(el, points.length, X, (i) => points[i].tip || (points[i].x + ": " + App.num(points[i].y)));
  }

  // Gestapelte Balken. rows: [{x, parts:[{v, c, n}]}]
  function bars(el, rows, opts) {
    opts = opts || {};
    el.innerHTML = "";
    if (!rows.length) { el.innerHTML = '<p class="muted">Noch keine Daten</p>'; return; }
    const W = el.clientWidth || 320, H = opts.height || 150, P = { l: 4, r: 4, t: 10, b: 22 };
    const max = Math.max(...rows.map((r) => r.parts.reduce((s, p) => s + (p.v || 0), 0))) || 1;
    const slot = (W - P.l - P.r) / rows.length, bw = Math.min(34, slot * 0.62);
    const X = (i) => P.l + slot * i + slot / 2;
    let svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" class="chart">';
    rows.forEach((r, i) => {
      let y = H - P.b;
      r.parts.forEach((p) => {
        const hgt = ((p.v || 0) / max) * (H - P.t - P.b);
        y -= hgt;
        svg += '<rect class="grow" x="' + (X(i) - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + Math.max(0, hgt) + '" rx="4" fill="' + p.c + '" style="animation-delay:' + i * 40 + 'ms"/>';
      });
      if (rows.length <= 10 || i % Math.ceil(rows.length / 8) === 0) svg += '<text x="' + X(i) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + esc(r.x) + "</text>";
    });
    svg += '<line class="cursor" x1="0" x2="0" y1="' + P.t + '" y2="' + (H - P.b) + '" style="display:none"/></svg><div class="tip" style="display:none"></div>';
    el.innerHTML = svg;
    interact(el, rows.length, X, (i) => rows[i].tip || rows[i].x);
  }

  // Tippen/Ziehen zeigt Werte an
  function interact(el, n, X, tipOf) {
    const svg = el.querySelector("svg"), tip = el.querySelector(".tip"), cur = el.querySelector(".cursor");
    const show = (ev) => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal.width;
      const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (vb / r.width);
      let best = 0, bd = Infinity; for (let i = 0; i < n; i++) { const dd = Math.abs(X(i) - px); if (dd < bd) { bd = dd; best = i; } }
      cur.setAttribute("x1", X(best)); cur.setAttribute("x2", X(best)); cur.style.display = "";
      tip.innerHTML = tipOf(best); tip.style.display = "block";
      const left = (X(best) / vb) * r.width; tip.style.left = Math.max(8, Math.min(r.width - tip.offsetWidth - 8, left - tip.offsetWidth / 2)) + "px";
    };
    const hide = () => { tip.style.display = "none"; cur.style.display = "none"; };
    svg.addEventListener("pointerdown", show); svg.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "mouse") show(e); });
    svg.addEventListener("pointerleave", hide); svg.addEventListener("touchend", () => setTimeout(hide, 1800));
  }

  // Mini-Balken für Tabellen
  function meter(v, max, color) { const p = max ? Math.max(3, (v / max) * 100) : 0; return '<span class="meter"><i style="width:' + p + "%;background:" + (color || "var(--accent)") + '"></i></span>'; }

  // Sparkline (HTML-String)
  function spark(vals) {
    vals = vals.filter((v) => v != null && !isNaN(v)); if (vals.length < 2) return "";
    const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 200, 42 - ((v - mn) / span) * 36]);
    const l = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    return '<svg class="chart spark" viewBox="0 0 200 46" preserveAspectRatio="none" width="100%" height="46" aria-hidden="true"><path d="' + l + ' L200 46 L0 46Z" fill="rgba(240,124,30,.14)"/><path class="draw" d="' + l + '" fill="none" stroke="#f07c1e" stroke-width="2"/></svg>';
  }

  window.Charts = { ring, line, bars, meter, spark };
})();
