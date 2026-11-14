# IG Growth – App für @andrelauinger

Installierbare Web-App (PWA) mit Übersicht, Wachstum, Content, Kontakten und Einstellungen.
Läuft auf GitHub Pages: **https://skriptm.github.io/IG/**

## So funktioniert's
- **Daten:** Die App fragt das Make-Szenario **„IG App API“** ab (Webhook, nur mit Zugangscode).
  - `a=all` → Posts, Konto-Insights, Gegenbesuche aus den Make-Datenspeichern
  - `a=stats` → neueste `ig-stats-*.json` aus Drive („Instagram Growth/Stats“)
  - `a=mark` / `a=del` → Gegenbesuch vormerken bzw. entfernen
  - `a=reply` → startet „IG Offene Kommentare beantworten (Button)“
  - `a=refresh` → fragt die 8 neuesten Posts samt Insights und Kommentaren direkt bei Instagram ab (Aktualisieren-Knopf / Ziehen)
  - `a=cfg_get` / `a=cfg_set` (POST, Feld `d`) → Skill-Einstellungen im Make-Datenspeicher „IG Growth – Einstellungen“ (ID 209784)
- **Zugangscode:** wird in der App unter „Mehr“ eingetragen und nur auf dem Gerät gespeichert. Er steht nicht in diesem Repo.
- **Offline:** Der Service Worker (`sw.js`) speichert die App, die letzten Daten liegen im Gerätespeicher.

## Neuen Bereich hinzufügen
1. Datei `js/modules/meinbereich.js` anlegen:
   ```js
   App.register({
     id: "meinbereich", title: "Titel", order: 5,
     icon: '<svg viewBox="0 0 24 24">…</svg>',
     render(el, data, app) { el.innerHTML = app.card("Titel", "<p>Inhalt</p>"); }
   });
   ```
2. In `index.html` per `<script src="js/modules/meinbereich.js">` einbinden.
3. In `sw.js` zur Liste `SHELL` hinzufügen und `VERSION` hochzählen.

Neue Datenquellen: im Make-Szenario eine weitere Route mit eigenem `a=…` anlegen und in `App.load()` / `normalize()` ergänzen.
