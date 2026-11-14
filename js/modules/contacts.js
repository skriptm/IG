/* Kontakte: Gegenbesuch mit Auswahl, „Alle vormerken“ und Warteschlange */
App.register({
  id: "contacts", title: "Kontakte", order: 4,
  icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.5 3.6 5.4"/></svg>',
  sel: new Set(),
  render(el, d, app) {
    const me = this;
    el.innerHTML =
      app.card("Gegenbesuch <span class=\"pill\" id=\"n-open\"></span>",
        '<p class="lead">Leute, die bei dir kommentiert haben, bekommen einen Gegenbesuch: Like und Kommentar auf ihren neuesten Post.</p>' +
        '<div class="btnrow"><button class="btn primary" id="mark-sel" disabled>✅ Auswahl merken · <span id="n-sel">0</span></button><button class="btn" id="mark-all">📌 Alle merken</button></div>' +
        '<ul class="list contacts" id="open-list"></ul>' +
        app.note("„✓ beantwortet“ heißt: Du hast unter deinem Post geantwortet. Der Gegenbesuch auf seinem Profil steht trotzdem noch aus."), { id: "gb" }) +
      app.card("In Warteschlange <span class=\"pill accent\" id=\"n-q\"></span>",
        '<ul class="list contacts" id="q-list"></ul>' +
        app.note("Die nächste Engagement-Session besucht sie zuerst. Kommentare zählen zum Tageslimit, danach wird nur noch geliked. Mit ✕ nimmst du jemanden ganz von der Liste."));

    const openL = el.querySelector("#open-list"), qL = el.querySelector("#q-list"), selBtn = el.querySelector("#mark-sel");
    const row = (c, queued) =>
      '<li data-h="' + app.esc(c.h) + '" class="' + (me.sel.has(c.h) ? "picked" : "") + '">' +
      (queued ? '<span class="sel" style="cursor:default">📌</span>' : '<button class="sel" aria-label="auswählen">' + (me.sel.has(c.h) ? "✓" : "") + "</button>") +
      '<div class="c-main">' + app.userLink(c.h) + ' <span class="muted small">' + app.esc(app.rel(c.ts)) + "</span>" +
      (c.text ? '<div class="ctext">„' + app.esc(c.text) + "“</div>" : "") +
      '<div class="meta">' + (c.replied ? '<span class="pill green">✓ beantwortet</span>' : "") + (queued ? '<span class="muted small">vorgemerkt ' + app.fmtDate(c.q, true) + "</span>" : "") + "</div></div>" +
      '<button class="x" aria-label="entfernen">✕</button></li>';

    const draw = () => {
      const open = d.contacts.filter((c) => !c.marked), q = d.contacts.filter((c) => c.marked).sort((a, b) => (a.q < b.q ? -1 : 1));
      [...me.sel].forEach((hh) => { if (!open.find((c) => c.h === hh)) me.sel.delete(hh); });
      openL.innerHTML = open.length ? open.map((c) => row(c, false)).join("") : '<li class="muted">Alle besucht oder vorgemerkt 🙂</li>';
      qL.innerHTML = q.length ? q.map((c) => row(c, true)).join("") : '<li class="muted">Niemand vorgemerkt.</li>';
      el.querySelector("#n-open").textContent = open.length; el.querySelector("#n-q").textContent = q.length;
      el.querySelector("#n-sel").textContent = me.sel.size; selBtn.disabled = !me.sel.size;
      el.querySelector("#mark-all").disabled = !open.length;
    };
    draw();

    const persist = () => {
      const raw = app.LS.get("cache", null); if (!raw) return;
      raw.gb = d.contacts.map((c) => ({ key: c.h, data: { h: c.h, ts: c.ts, src: c.src, text: encodeURIComponent(c.text || ""), media: c.media, q: c.q || null } }));
      app.LS.set("cache", raw);
    };

    const markMany = async (handles) => {
      if (!handles.length) return;
      const q = app.stamp(); let ok = 0;
      selBtn.disabled = true; el.querySelector("#mark-all").disabled = true;
      for (const hh of handles) {
        app.toast("Wird vorgemerkt … " + (ok + 1) + " von " + handles.length, "", 0);
        try { await app.call({ a: "mark", h: hh, q }); const c = d.contacts.find((x) => x.h === hh); if (c) { c.q = q; c.marked = true; } ok++; }
        catch (err) { app.toast("Abgebrochen: " + err.message, "bad"); break; }
      }
      me.sel.clear(); persist(); draw();
      if (ok === handles.length) app.toast(ok + (ok === 1 ? " Person" : " Leute") + " vorgemerkt ✓");
    };
    selBtn.onclick = () => markMany([...me.sel]);
    el.querySelector("#mark-all").onclick = () => { const open = d.contacts.filter((c) => !c.marked).map((c) => c.h); if (confirm(open.length + " Leute vormerken?")) markMany(open); };

    const onClick = async (e) => {
      const li = e.target.closest("li[data-h]"); if (!li) return;
      const hh = li.dataset.h;
      if (e.target.closest("button.sel")) { me.sel.has(hh) ? me.sel.delete(hh) : me.sel.add(hh); draw(); return; }
      if (e.target.closest(".x")) {
        if (!confirm("@" + hh + " von der Liste nehmen, ohne ihn zu besuchen?")) return;
        li.classList.add("out");
        try { await app.call({ a: "del", h: hh }); d.contacts = d.contacts.filter((x) => x.h !== hh); me.sel.delete(hh); persist(); setTimeout(draw, 250); app.toast("Entfernt"); }
        catch (err) { li.classList.remove("out"); app.toast("Nicht entfernt: " + err.message, "bad"); }
      }
    };
    openL.addEventListener("click", onClick); qL.addEventListener("click", onClick);
  }
});
