/* Einstellungen: Zugangscode, Ziele, No-Go-Liste, App-Infos */
App.register({
  id: "settings", title: "Mehr", order: 9, needsData: false,
  icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  render(el, d, app) {
    const g = app.settings.goals;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    let html = "";
    if (!standalone) {
      html += app.card("📲 Als App installieren", '<ol class="steps"><li>Diese Seite in <b>Safari</b> öffnen</li><li>Unten auf <b>Teilen</b> <span class="kbd">⬆︎</span> tippen</li><li><b>„Zum Home-Bildschirm“</b> wählen</li></ol><p class="muted small">Danach startet IG Growth wie eine echte App im Vollbild.</p>');
    }
    html += app.card("Zugang",
      '<label class="field"><span>Zugangscode</span><input id="code" type="password" autocomplete="off" placeholder="Code eingeben" value="' + app.esc(app.settings.code) + '"></label>' +
      '<button class="btn primary" id="save-code">Speichern & laden</button>' +
      '<p class="muted small">Der Code bleibt nur auf diesem Gerät gespeichert.</p>');
    html += app.card("Tagesziele",
      '<div class="grid3">' +
        field("g-comments", "Kommentare", g.comments) + field("g-likes", "Likes", g.likes) + field("g-new", "Neue Follower", g.newFollowers) +
      '</div><button class="btn" id="save-goals">Ziele speichern</button>');
    html += app.card("No-Go-Liste",
      '<p class="muted small">Diese Accounts tauchen in keiner Liste auf. Einer pro Zeile.</p>' +
      '<textarea id="nogo" rows="6">' + app.esc(app.settings.noGo.join("\n")) + '</textarea><button class="btn" id="save-nogo">Liste speichern</button>');
    html += app.card("App",
      '<ul class="list"><li><span>Version</span><span class="right muted">' + CONFIG.version + '</span></li>' +
      "<li><span>Daten</span><span class=\"right muted\">" + (d ? app.esc(app.rel(d.fetched)) : "–") + "</span></li>" +
      "<li><span>Drive-Statistik</span><span class=\"right muted\">" + (d && d.stats ? "verbunden" : app.esc((d && d.statsError) || "–")) + "</span></li></ul>" +
      '<div class="actions"><button class="btn" id="reload-app">App neu laden</button><button class="btn danger" id="reset">Lokale Daten löschen</button></div>');
    el.innerHTML = html;

    el.querySelector("#save-code").onclick = () => { app.settings.code = el.querySelector("#code").value.trim(); app.toast("Gespeichert"); app.data = null; app.go("home"); app.load(true); };
    el.querySelector("#save-goals").onclick = () => {
      const v = (id) => Math.max(1, parseInt(el.querySelector("#" + id).value, 10) || 1);
      app.settings.goals = { comments: v("g-comments"), likes: v("g-likes"), newFollowers: v("g-new") }; app.toast("Ziele gespeichert");
    };
    el.querySelector("#save-nogo").onclick = () => {
      app.settings.noGo = el.querySelector("#nogo").value.split(/[\s,]+/).map((x) => x.trim().replace(/^@/, "")).filter(Boolean);
      const raw = app.LS.get("cache", null); if (raw) app.data = app.normalize(raw); app.toast("No-Go-Liste gespeichert");
    };
    el.querySelector("#reload-app").onclick = async () => {
      if ("caches" in window) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
      if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.update())); }
      location.reload();
    };
    el.querySelector("#reset").onclick = () => { if (confirm("Zwischengespeicherte Daten löschen? Der Zugangscode bleibt.")) { app.LS.del("cache"); app.data = null; app.load(true); } };
    function field(id, label, v) { return '<label class="field"><span>' + label + '</span><input id="' + id + '" type="number" inputmode="numeric" min="1" value="' + v + '"></label>'; }
  }
});
