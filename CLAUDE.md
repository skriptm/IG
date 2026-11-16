# IG Growth App – Arbeitsregeln für Claude

Diese Datei wird in Claude Code automatisch gelesen. Sie gilt für jede Bearbeitung dieses Repos.

## Vor jeder Bearbeitung
1. `CHANGELOG.md` lesen (aktueller Stand, bewusste Entscheidungen, offene Fragen, Make-Szenarien).
2. Bei Unklarheit zuerst André fragen, nicht raten. Vorschläge erst als Optionen mit Aufwand zeigen, dann nach seiner Rückmeldung umsetzen.

## Aufbau
- PWA ohne Build-Schritt, ausgeliefert über GitHub Pages (Push auf `main` = live).
- `js/core.js`: Kern, Laden der Daten, Aufrufe an Make. `js/config.js`: Version, Webhook-Adressen, Altersgrenze fürs Nachladen.
- `js/modules/*.js`: ein Reiter pro Datei (Übersicht, Wachstum, Content, Kontakte, Einstellungen).
- `sw.js`: Service Worker. Bei jeder Änderung `VERSION` hochzählen und `CONFIG.version` passend setzen.

## Regeln (von André)
- Entfernte Funktionen komplett löschen, auch Code, CSS und Texte. Kein toter Code.
- Nach jeder Änderung einen Eintrag in `CHANGELOG.md` (neuer Abschnitt oben im Verlauf, mit Version). Danach auch das Google Doc „IG App – Änderungsprotokoll“ im Drive-Ordner „Instagram Growth“ aktualisieren (neu anlegen, altes in den Papierkorb), falls Drive verfügbar ist.
- Look: Moody Cinematic (dunkel, Glas-Karten, Orange als Akzent). Texte auf Deutsch, kurz, keine Erklärblöcke.
- Kein Knopf „Session starten“ in der App. Instagram-Daten nur auf ↻ neu abfragen, nicht automatisch.
- Browser (Tests, Instagram) immer über den Windows-Rechner, nicht über das MacBook.
- Schritt für Schritt arbeiten und nach jedem Schritt anschauen lassen.

## Make-Credits (wichtig)
- Plan: 14.000 Credits pro Monat, Tagesbudget etwa 380. Jeder Make-Modullauf kostet 1 Credit.
- Die App lädt über einen Aufruf `init` (14 Credits). Start und Rückkehr in die App laden nur nach, wenn die Daten älter als `CONFIG.maxAgeMin` (30 Minuten) sind. Das nicht aushebeln und keine zusätzlichen automatischen Aufrufe einbauen.
- Neue Daten für die App nach Möglichkeit in die Route `init` legen, nicht als weiteren Aufruf.

## Was nicht ins Repo gehört
- Der Zugangscode zur App steht nirgends im Repo. Er wird auf dem Gerät eingegeben. Für Tests nicht in Dateien schreiben.

## Make und Drive
- Änderungen an Make-Szenarien (Webhooks, Routen, Data Stores) macht Claude im Chat mit der Make-Anbindung, nicht hier. Prüfen mit `/mcp`, ob Make verbunden ist. Wenn eine App-Änderung eine Make-Änderung braucht, einen klaren Auftrag dafür schreiben (Route, Felder, erwartete Antwort), den André im Chat weitergibt.
- Vor dem Push: `node --check` auf geänderte JS-Dateien.
