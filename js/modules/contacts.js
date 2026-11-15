/* Kontakte: Gegenbesuch mit Auswahl, „Alle merken“ und gemeinsame Liste „Als Nächstes besuchen“ (Warteschlange + Merkliste) */
App.register({
  id: "contacts", title: "Kontakte", order: 4,
  icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.5 3.6 5.4"/></svg>',
  sel: new Set(),
  render(el, d, app) {
    const me = this;
    el.innerHTML =
      app.card("Gegenbesuch <span class=\"pill\" id=\"n-open\"></span>",
        '<div class="btnrow"><button class="btn primary" id="mark-sel" disabled>✅ Auswahl merken · <span id="n-sel">0</span></button><button class="btn" id="mark-all">📌 Alle merken</button></div>' +
        '<ul class="list contacts" id="open-list"></ul>', { id: "gb", tip: "Leute, die bei dir kommentiert haben, bekommen einen Gegenbesuch: Like und Kommentar auf ihren neuesten Post. „✓ beantwortet“ heißt nur, dass du unter deinem Post geantwortet hast, der Gegenbesuch steht noch aus." }) +
      app.card("Als Nächstes besuchen <span class=\"pill accent\" id=\"n-q\"></span>",
        '<div class="add"><input id="wl-add" placeholder="@handle oder Profil-Link" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn small" id="wl-btn">+ Hinzufügen</button></div><div class="err" id="wl-err"></div>' +
        '<ul class="list contacts" id="q-list"></ul>' +
        '<div class="switchrow" style="margin-top:12px"><span>Top-Fans automatisch hinzufügen</span><label class="switch"><input type="checkbox" id="fans-sw"><span></span></label></div>',
        { tip: "Die nächste Session besucht alle hier zuerst (Like + Kommentar) und nimmt sie danach von der Liste. „Gegenbesuch“ kommt von oben, „Merkliste“ hast du eingetragen oder es ist ein Top-Fan. ✕ entfernt ganz." });

    const openL = el.querySelector("#open-list"), qL = el.querySelector("#q-list"), selBtn = el.querySelector("#mark-sel");
    const row = (c, queued) =>
      '<li data-h="' + app.esc(c.h) + '" class="' + (me.sel.has(c.h) ? "picked" : "") + '">' +
      (queued ? '<span class="sel" style="cursor:default">📌</span>' : '<button class="sel" aria-label="auswählen">' + (me.sel.has(c.h) ? "✓" : "") + "</button>") +
      '<div class="c-main">' + app.userLink(c.h) + ' <span class="muted small">' + app.esc(app.rel(c.ts)) + "</span>" +
      (c.text ? '<div class="ctext">„' + app.esc(c.text) + "“</div>" : "") +
      '<div class="meta">' + (c.replied ? '<span class="pill green">✓ beantwortet</span>' : "") + (queued ? '<span class="pill">Gegenbesuch</span><span class="muted small">vorgemerkt ' + app.fmtDate(c.q, true) + "</span>" : "") + "</div></div>" +
      '<button class="x" aria-label="entfernen">✕</button></li>';

    const wl = () => ((d.cfg && Array.isArray(d.cfg.watchlist)) ? d.cfg.watchlist : []);
    const wlRow = (hh) => '<li data-w="' + app.esc(hh) + '"><span class="sel" style="cursor:default">📌</span><div class="c-main">' + app.userLink(hh) + '<div class="meta"><span class="pill">Merkliste</span></div></div><button class="x" aria-label="entfernen">✕</button></li>';

    const draw = () => {
      const open = d.contacts.filter((c) => !c.marked), q = d.contacts.filter((c) => c.marked).sort((a, b) => (a.q < b.q ? -1 : 1));
      const qh = new Set(q.map((c) => String(c.h).toLowerCase())), w = wl().filter((hh) => !qh.has(String(hh).toLowerCase()));
      [...me.sel].forEach((hh) => { if (!open.find((c) => c.h === hh)) me.sel.delete(hh); });
      openL.innerHTML = open.length ? open.map((c) => row(c, false)).join("") : '<li class="muted">Alle besucht oder vorgemerkt 🙂</li>';
      qL.innerHTML = q.length || w.length ? q.map((c) => row(c, true)).join("") + w.map(wlRow).join("") : '<li class="muted">Niemand vorgemerkt.</li>';
      el.querySelector("#n-open").textContent = open.length; el.querySelector("#n-q").textContent = q.length + w.length;
      const sw = el.querySelector("#fans-sw"); sw.checked = !d.cfg || d.cfg.fans_to_watchlist !== false; sw.disabled = !d.cfg;
      el.querySelector("#wl-btn").disabled = !d.cfg;
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

    /* Merkliste liegt in der Skill-Konfiguration (Make) */
    const saveWl = async (fn, okMsg) => {
      if (!d.cfg) return app.toast("Einstellungen noch nicht geladen", "bad");
      const cfg = JSON.parse(JSON.stringify(d.cfg)); if (!Array.isArray(cfg.watchlist)) cfg.watchlist = [];
      fn(cfg);
      try { await app.saveCfg(cfg); draw(); if (okMsg) app.toast(okMsg); return true; }
      catch (err) { app.toast("Nicht gespeichert: " + err.message, "bad"); draw(); return false; }
    };
    const handle = (v) => { const x = String(v || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "").toLowerCase(); return /^[a-z0-9._]{1,30}$/.test(x) ? x : null; };
    const addWl = () => {
      const inp = el.querySelector("#wl-add"), err = el.querySelector("#wl-err"); err.textContent = "";
      const parts = inp.value.split(/[\s,;]+/).filter(Boolean); if (!parts.length) return;
      const nogo = new Set(((d.cfg && d.cfg.nogo) || []).map((x) => String(x).toLowerCase()));
      const good = [], bad = [];
      parts.forEach((p) => { const v = handle(p); if (!v) bad.push(p); else if (nogo.has(v)) bad.push(p + " (No-Go)"); else if (!wl().includes(v) && !good.includes(v)) good.push(v); });
      if (bad.length) err.textContent = "Nicht übernommen: " + bad.join(", ");
      if (good.length) saveWl((cfg) => cfg.watchlist.push(...good), good.length === 1 ? "@" + good[0] + " gemerkt ✓" : good.length + " Leute gemerkt ✓").then((ok) => { if (ok) inp.value = ""; });
    };
    el.querySelector("#wl-btn").onclick = addWl;
    el.querySelector("#wl-add").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addWl(); } });
    el.querySelector("#fans-sw").onchange = (e) => { const on = e.target.checked; saveWl((cfg) => { cfg.fans_to_watchlist = on; }, on ? "Top-Fans werden automatisch gemerkt" : "Top-Fans: aus"); };

    const onClick = async (e) => {
      const wli = e.target.closest("li[data-w]");
      if (wli && e.target.closest(".x")) {
        const hh = wli.dataset.w; if (!confirm("@" + hh + " von der Merkliste nehmen?")) return;
        wli.classList.add("out"); await saveWl((cfg) => { cfg.watchlist = cfg.watchlist.filter((x) => x !== hh); }, "Entfernt"); return;
      }
      const li = e.target.closest("li[data-h]"); if (!li) return;
      const hh = li.dataset.h;
      if (e.target.closest("button.sel")) { me.sel.has(hh) ? me.sel.delete(hh) : me.sel.add(hh); draw(); return; }
      if (e.target.closest(".x")) {
        if (!confirm("@" + hh + " von der Liste nehmen, ohne ihn zu besuchen?")) return;
        li.classList.add("out");
        try { await app.call({ a: "del", h: hh }); d.contacts = d.contacts.filter((x) => x.h !== hh); me.sel.delete(hh); persist();
          if (wl().map((x) => String(x).toLowerCase()).includes(String(hh).toLowerCase())) await saveWl((cfg) => { cfg.watchlist = cfg.watchlist.filter((x) => String(x).toLowerCase() !== String(hh).toLowerCase()); });
          setTimeout(draw, 250); app.toast("Entfernt"); }
        catch (err) { li.classList.remove("out"); app.toast("Nicht entfernt: " + err.message, "bad"); }
      }
    };
    openL.addEventListener("click", onClick); qL.addEventListener("click", onClick);
  }
});
