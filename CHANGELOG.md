# IG Growth App – Änderungsprotokoll

Zweck: Nach jeder Änderung an der App wird hier eingetragen, was gemacht wurde. Claude liest das vor jeder neuen Bearbeitung, damit nichts verloren geht.

App: PWA im GitHub-Repo skriptm/IG (GitHub Pages). Reiter: Übersicht, Wachstum, Content, Kontakte, Einstellungen.

## Bewusste Entscheidungen (nicht rückgängig machen)
- Kein Knopf „Session starten“ in der App, bewusst entfernt. Sessions startet André im Claude-Chat.
- Instagram-Daten werden nur auf Tippen auf ↻ neu abgefragt, nicht automatisch.
- Entfernte Funktionen werden immer komplett aus dem Code gelöscht (kein toter Code).
- Merkliste und Gegenbesuch-Warteschlange sind eine gemeinsame Liste „Als Nächstes besuchen“ im Reiter Kontakte.
- Moody-Cinematic-Look (dunkel, Glas-Karten, Orange als Akzent).

## Fahrplan (Schritt für Schritt, nach jedem Schritt anschauen)
1. Aufräumen: Doppeltes und zu viele Texte raus ✅ (15.11.)
2. Neue Growth-Kennzahlen A+B: „Diese Woche“, Netto-Follower pro Tag, Funnel ✅ (15.11.)
3. Zielgruppe und Reels-Wiedergabedauer ✅ (16.11.), Beste Posting-Zeit zurückgestellt (zu wenig Posts)
4. Reiter für Reiter neu ordnen, beginnend mit der Übersicht
- Geparkt: „Nächster geplanter Post“ – erst möglich, wenn es in Make ein Szenario zum automatischen Posten gibt.

## Offene Fragen an André
- keine

## Make-Szenarien (Team 1047609)
- IG App API (10161848): Webhook für die App. Aktionen: all, mark, del, reply, stats, cfg_get, cfg_set, refresh, sess_get, prep, log.
- IG Growth – Konto-Insights sammeln (10149108): täglich 23:40, Data Store 208884. Enthält seit 15.11. auch profile_views.
- IG Growth – Posts & Kommentare sammeln (10139638): täglich 06:10, Data Store 208242.
- IG Auto-Reply (2841603), IG Offene Kommentare beantworten (10149203).

## Verlauf

### 16.11.2026 – v1.10.0 (Zielgruppe, Reels-Wiedergabedauer)
- Make „Konto-Insights sammeln“: 4 neue Zweige für Follower-Demografie (Alter, Geschlecht, Land, Stadt), Datensätze `demo_age`, `demo_gender`, `demo_country`, `demo_city` im Data Store 208884 (Format `Name=Wert|…`).
- Make „Posts & Kommentare sammeln“: Router nach den Post-Insights, neuer Zweig nur für Reels (Ø Wiedergabedauer, gesamte Wiedergabezeit in ms), Datensatz `reel_<id>` mit product `REELWT` im Data Store 208242.
- App, Content: neue Karten „Reels“ (Ø Wiedergabe je Reel) und „Zielgruppe“ (Männer/Frauen, Alter, Top-Länder, Top-Städte).
- Zurückgestellt: Beste Posting-Zeit. Meta liefert die Online-Zeiten der Follower im Make-Baustein nicht, eigene Auswertung erst mit mehr Posts sinnvoll.

### 16.11.2026 – v1.9.0 (Übersicht aufgeräumt, Follower pro Aktion)
- Übersicht neu geordnet: Ergebnis zuerst (Heute, Diese Woche), dann Zu tun, dann Session, Fokus, neuester Post. Laufband mit Kommentaren entfernt (inkl. CSS, kein toter Code).
- Wachstum, „Bringt das Skript Follower?“: Balken je Bereich mit Follower pro 100 Kommentare, Hubs einzeln aufgeführt, Hinweis „zu wenig Daten“ unter 30 Kommentaren.
- Fahrplan: nächste Schritte Beste Posting-Zeit, Reels-Wiedergabedauer (Make), danach Umschalter für Van & Venture (Konten-Auswahl, Daten je Konto getrennt).

### 16.11.2026 – v1.8.0 (Token-Sparmodus)
- Make „IG App API“: neue Aktionen `prep` (Session-Vorbereitung: Limits, Listen, Sperrlisten, Gegenbesuch, offene Follows) und `log` (Session-Abschluss: Log, Stats, Conversions, Follow-back, Merkliste und Gegenbesuch aufräumen). Statistik liegt jetzt im Datenspeicher 209784 (Schlüssel `stats`, Tageslog `log-YYYY-MM-DD`), nicht mehr in Drive. Die App liest weiter über `stats`, gleiches JSON-Format.
- Skill auf ca. ein Drittel gekürzt (Version 2): 1 Aufruf zum Start, 1 Aufruf zum Ende, Browser-Helfer in localStorage, ein Call pro Post.
- Kommentare: nur 2 bis 4 Wörter plus ein Smiley hinten, vom Helfer aus einem Pool gewählt (kein Modell nötig). Sessions laufen auf einem günstigeren Modell.
- Top-Fans-Automatik entfernt (Gegenbesuch deckt Kommentatoren ab).
- App: Hinweistexte ohne „Drive“.
- Wöchentliche Token-Auswertung als geplante Aufgabe.

### 15.11.2026 – v1.7.0 (Growth-Kennzahlen A+B)
- Übersicht: neue Karte „Diese Woche“ (Netto-Follower, Reichweite organisch, Interaktionen, Profilaufrufe; Vergleich mit Vorwoche, sobald 14 Tage Daten da sind, ca. ab 25.11.).
- Wachstum: oben „Netto-Follower pro Tag“ (grün/rot um die Nulllinie) und „Funnel“ (Nicht-Follower erreicht → Profilaufrufe → neue Follower).
- Make: Konto-Insights sammelt zusätzlich profile_views (getestet, funktioniert).
- Make: Zweig „Session starten“ samt Zähler aus „IG App API“ gelöscht, Datensatz „starts“ entfernt. App: Zähler „starts“ und Status „gestartet“ aus dem Code entfernt. „x Runden heute“ zählt jetzt nur noch Sessions aus der Statistik.
- Tage ohne Follow-Daten (z. B. ein Lauf mitten am Tag) zählen nicht als 0.

### 15.11.2026 – v1.6.0
- Kontakte: Merkliste und Warteschlange zusammengeführt zur Karte „Als Nächstes besuchen“ (Pill „Gegenbesuch“ oder „Merkliste“, Feld zum Hinzufügen, Schalter „Top-Fans automatisch hinzufügen“). Merkliste wird weiter in der Skill-Konfiguration (Make) gespeichert.
- Einstellungen: Unterreiter „Merkliste“ und Karte „Top-Fans“ entfernt. Beim Speichern der Einstellungen wird die aktuelle Merkliste übernommen, damit nichts überschrieben wird.
- Content-Ranking: Top 5, Rest hinter „Alle anzeigen“.
- Toter Code entfernt: Tagesziele (CONFIG.goals, settings.goals), ungenutzte CSS-Klasse .advice.

### 15.11.2026 – v1.5.1
- Fix: ⓘ-Erklärungen wurden nicht angezeigt (CSS-Klasse `.tip` kollidierte mit dem Diagramm-Tooltip, jetzt `.card-tip`).
- Restlichen Code des entfernten Start-Knopfs gelöscht.

### 15.11.2026 – v1.5.0 (Aufräumen)
- Erklärtexte hinter ⓘ oben rechts in der Karte (antippen = aufklappen). Sichtbar bleiben nur Status-Meldungen (Pause, Ziel-Prognose, Budget-Summe).
- Übersicht: „Schnellaktionen“ entfernt, „Gestern auf Instagram“ entfernt (kommt als „Diese Woche“ in Schritt 2 zurück), Ring „Follows“ heißt jetzt „Gefolgt“, Fokus zeigt nur den wichtigsten Tipp.
- Instagram-Icon im Kopf neben ↻ (auf allen Reitern).
- Content: Lead-Sätze entfernt, Format + Caption als Karte „Was funktioniert“, Konto-Insights-Tabelle 5 statt 9 Spalten. Antworten-Knopf nur noch hier.
- Wachstum: Listen zeigen die ersten 5, Rest hinter „Alle anzeigen“.
- Kontakte: Erklärtexte hinter ⓘ.
- Einstellungen: ungenutzte Karte „Tagesziele“ entfernt.

### 15.11.2026 – v1.4.3
- Neuester Post: Kachel „Kommentare“ ergänzt (5 Kacheln: Reichw., Likes, Komm., Saves, Shares).
