/* Kontakte: Gegenbesuch-Liste mit Vormerken und Entfernen */
App.register({
  id: "contacts", title: "Kontakte", order: 4,
  icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.5 3.6 5.4"/></svg>',
  state: { filter: "all" },
  render(el, d, app) {
    const me = this;
    const marked = d.contacts.filter((c) => c.marked).length;
    el.innerHTML = app.card("Gegenbesuche",
      '<p class="muted small">Leute, die unter deinen Posts kommentiert haben. Mit ☆ vormerken: Die nächste Engagement-Session besucht sie zuerst.</p>' +
      '<div class="seg" id="cseg"><button data-f="all" class="' + (me.state.filter === "all" ? "on" : "") + '">Alle <span class="pill">' + d.contacts.length + '</span></button><button data-f="marked" class="' + (me.state.filter === "marked" ? "on" : "") + '">Vorgemerkt <span class="pill accent">' + marked + "</span></button></div>" +
      '<ul class="list contacts" id="clist"></ul>');
    const list = el.querySelector("#clist");

    const draw = () => {
      const arr = d.contacts.filter((c) => me.state.filter === "all" || c.marked);
      if (!arr.length) { list.innerHTML = '<li class="muted">' + (me.state.filter === "marked" ? "Noch niemand vorgemerkt." : "Keine offenen Gegenbesuche. Stark!") + "</li>"; return; }
      list.innerHTML = arr.map((c) =>
        '<li data-h="' + app.esc(c.h) + '" class="' + (c.marked ? "is-marked" : "") + '">' +
          '<button class="star" aria-label="vormerken">' + (c.marked ? "★" : "☆") + "</button>" +
          '<div class="c-main"><a href="' + app.profile(c.h) + '" target="_blank" rel="noopener"><b>@' + app.esc(c.h) + '</b></a> <span class="muted small">' + app.esc(app.rel(c.ts)) + "</span>" +
          (c.text ? '<div class="ctext">„' + app.esc(c.text) + "“</div>" : "") + "</div>" +
          '<button class="x" aria-label="entfernen">✕</button></li>').join("");
    };
    draw();

    el.querySelector("#cseg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      me.state.filter = b.dataset.f; el.querySelectorAll("#cseg button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });

    list.addEventListener("click", async (e) => {
      const li = e.target.closest("li[data-h]"); if (!li) return;
      const hh = li.dataset.h, c = d.contacts.find((x) => x.h === hh); if (!c) return;
      if (e.target.closest(".star")) {
        const now = new Date(), q = c.marked ? "" : app.localDay(now) + " " + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
        c.marked = !c.marked; c.q = q; draw(); updateCounts();
        try { await app.call({ a: "mark", h: hh, q }); app.toast(c.marked ? "@" + hh + " vorgemerkt" : "Vormerkung entfernt"); persist(); }
        catch (err) { c.marked = !c.marked; draw(); updateCounts(); app.toast("Nicht gespeichert: " + err.message, "bad"); }
      } else if (e.target.closest(".x")) {
        if (!confirm("@" + hh + " aus der Gegenbesuch-Liste entfernen?")) return;
        li.classList.add("out");
        try { await app.call({ a: "del", h: hh }); d.contacts = d.contacts.filter((x) => x.h !== hh); setTimeout(() => { draw(); updateCounts(); }, 250); app.toast("Entfernt"); persist(); }
        catch (err) { li.classList.remove("out"); app.toast("Nicht entfernt: " + err.message, "bad"); }
      }
    });

    function updateCounts() {
      const p = el.querySelectorAll("#cseg .pill"); p[0].textContent = d.contacts.length; p[1].textContent = d.contacts.filter((c) => c.marked).length;
    }
    // Lokalen Cache nachziehen, damit die Änderung auch offline sichtbar bleibt
    function persist() {
      const raw = app.LS.get("cache", null); if (!raw) return;
      raw.gb = d.contacts.map((c) => ({ key: c.h, data: { h: c.h, ts: c.ts, src: c.src, text: encodeURIComponent(c.text || ""), media: c.media, q: c.q || null } }));
      app.LS.set("cache", raw);
    }
  }
});
