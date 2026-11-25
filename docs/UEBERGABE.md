# Übergabe für die nächste Claude-Code-Sitzung (Stand 25.11.2026)

Zuerst `CHANGELOG.md` lesen (Verlauf, bewusste Entscheidungen). Diese Datei listet nur, was **offen** ist und wo was liegt. Schlüssel und Zugangscodes stehen hier bewusst nicht.

## Wo was liegt
- **App (PWA):** dieses Repo, live auf GitHub Pages, aktuell v1.18.0. Reiter: Übersicht, Follower, Content, Kontakte, Einstellungen.
- **Make (Team 1047609):** IG App API 10161848 (prep/log/init-Routen), App Init 10171545, Auto-Reply 2841603 (ohne Mails seit 25.11.), Posts 06:10, Insights 23:40, Hub-Alarm 18:45, Button 10149203. Data Stores: 209784 Einstellungen (`main`, `stats`, `helpers` = Browser-Helfer v7, Logs), 209450 Gegenbesuch, 208242 Posts, 208884 Insights.
- **Skill `instagram-comment-helper`:** V8 (gespeichert am 25.11.). Start nur manuell, Windows-Rechner.
- **Auto-Reply neu:** `automation/ig-autoreply.gs` als Google-Apps-Script-Projekt „IG Auto-Reply“ (script.google.com), Modus `draft`, Zeitplan alle 5 Minuten. Protokoll: Google Sheet „IG Auto-Reply Protokoll“. Meta-App „lauinger-hub“ (Systemnutzer-Token, läuft nicht ab), Claude-Schlüssel „ig-autoreply“ mit 5-$-Monatslimit.

## Offen, in dieser Reihenfolge
1. **Auto-Reply Parallellauf (bis 28.11.):** Entwürfe im Sheet mit den Make-Antworten vergleichen. Dann:
   - Gegenbesuch-Eintrag neuer Kommentierer ins Apps Script einbauen (macht bisher Make: Data Store 209450, Felder h, ts, src=comment, text, media). Weg: Apps Script ruft die IG App API mit `a=mark` auf, oder neue Route.
   - `MODE` auf `live`, Make-Szenario 2841603 deaktivieren (nicht löschen).
2. **Szenario „IG Credits“ bauen**, sobald André die Make-API-Verbindung angelegt hat: täglich 23:55, `make:makeApiCall` GET `/v2/organizations/2509262` und GET `/v2/scenarios/consumptions?teamId=1047609`, dann AddRecord 209784 Schlüssel `usage`, Feld `cfg` = JSON `{ts, used (centicreditsConsumed/100), limit (license.operations), reset (nextReset), last (lastReset), ids, ops}` (ids/ops als Komma-Listen). Danach die Szenario-ID in `CONFIG.runs` ergänzen.
3. **Make-Credits:** Reset am 12.12. Posts-Abruf 06:10 seit 25.11. auf 5 Posts. Rest kommt mit Schritt 1 (Make-Auto-Reply aus am 28.11.). André nutzt ↻ in der App sparsam.
4. **Zugangscode erneuern:** Er steht im Klartext im Skill (Abschnitt 1) und im geplanten Auftrag „IG Wochen-Check Tokens“. Neuen Code in allen Router-Filtern der IG App API und im Init-Szenario setzen, Skill und Wochen-Check anpassen, André trägt ihn in der App neu ein.
5. **Design-Umbau** (freigegeben, Vorschau abgenommen): Schrift Urbanist (offline ins Repo, OFL), massive dunkle Karten mit großem Radius, „Heute“ als gefüllte Eisblau-Karte (#9CC6EE, dunkle Schrift) mit Reiter-Ecke, weiße Pillen, große leichte Zahlen, untere Leiste nur Icons (aktiv = weißer Kreis), Banner schlanker. Dazu Sidebar am Desktop und Animationen in allen Reitern.
6. **Caption-Generator** (Text und Foto) über Google Apps Script, gleiche Schlüssel-Lösung wie der Auto-Reply. Plus Hashtag-Sets aus den eigenen Reichweiten-Daten in der App.
7. **Google Doc „IG App – Änderungsprotokoll“** im Drive-Ordner „Instagram Growth“ nachziehen (seit v1.12.0 nicht aktualisiert).
8. **Hub-Kandidaten:** @lensloves_folkscenery, @norgesfotografer, @your_coasts (André prüft: aktiv, Kommentare, Business-Konto). Hub-Liste aktuell: folkscenery, visualgroundmag, moods_in_frame, stayandwander, raw_landscape__, depths.of.earth, moodygrams.

## Zu beobachten
- Erste Sessions mit Skill V8: Profile geprüft pro Follow, `rate` im Vorfilter, Gegenbesuch-Liste wird kürzer, Gefolgt-Zahl gegen Obergrenze 1.500.
- Foto-Reel-Test (jeder zweite Post als Reel), Auswertung in Content → „Was funktioniert“.
- Auswertung der Quellen am 8.12. (Follower → „Welche Quelle bringt was?“).
