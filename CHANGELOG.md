# IG Growth App – Änderungsprotokoll

Zweck: Nach jeder Änderung an der App wird hier eingetragen, was gemacht wurde. Claude liest das vor jeder neuen Bearbeitung, damit nichts verloren geht.

App: PWA im GitHub-Repo skriptm/IG (GitHub Pages). Reiter: Übersicht, Follower, Content, Kontakte, Einstellungen.

## Bewusste Entscheidungen (nicht rückgängig machen)
- Kein Knopf „Session starten“ in der App, bewusst entfernt. Sessions startet André im Claude-Chat.
- Instagram-Daten werden nur auf Tippen auf ↻ neu abgefragt, nicht automatisch.
- Entfernte Funktionen werden immer komplett aus dem Code gelöscht (kein toter Code).
- Merkliste und Gegenbesuch-Warteschlange sind eine gemeinsame Liste „Als Nächstes besuchen“ im Reiter Kontakte.
- Moody-Cinematic-Look (dunkel, Glas-Karten, Eisblau #4B88C5 als Akzent, seit v1.14.0; vorher Orange).
- Make-Credits sparen: Start und Rückkehr in die App laden nur nach, wenn die Daten älter als 30 Minuten sind (CONFIG.maxAgeMin). ↻ und Ziehen laden immer. Die App lädt alles mit einem Aufruf (`init`).
- Browser-Aufgaben (Tests, Instagram) laufen immer über den Windows-Rechner, nie über das MacBook.

## Fahrplan (Schritt für Schritt, nach jedem Schritt anschauen)
1. Aufräumen: Doppeltes und zu viele Texte raus ✅ (15.11.)
2. Neue Growth-Kennzahlen A+B: „Diese Woche“, Netto-Follower pro Tag, Funnel ✅ (15.11.)
3. Zielgruppe und Reels-Wiedergabedauer ✅ (16.11.), Beste Posting-Zeit zurückgestellt (zu wenig Posts)
4. Reiter für Reiter neu ordnen, beginnend mit der Übersicht
- Geparkt: „Nächster geplanter Post“ – erst möglich, wenn es in Make ein Szenario zum automatischen Posten gibt.

## Offene Fragen an André
- Alte Routen `all`, `stats`, `cfg_get`, `sess_get` in „IG App API“ werden von der App nicht mehr genutzt. Beim nächsten Make-Termin (zusammen mit der `log`-Antwort) löschen, nach ein paar Tagen Beobachtung.

## Make-Szenarien (Team 1047609)
- IG App API (10161848): Webhook für die App. Aktionen: all, mark, del, reply, stats, cfg_get, cfg_set, refresh, sess_get, prep, log. `all`, `stats`, `cfg_get`, `sess_get` nutzt die App seit v1.12.0 nicht mehr.
- IG App Init (10171545): eigener Webhook (Hook 4517389), liefert Posts, Insights, Gegenbesuch, Statistik, Einstellungen und Session in einem Aufruf. 14 Operationen statt 20.
- IG Growth – Konto-Insights sammeln (10149108): täglich 23:40, Data Store 208884. Enthält seit 15.11. auch profile_views.
- IG Growth – Posts & Kommentare sammeln (10139638): täglich 06:10, Data Store 208242.
- IG Hub-Alarm (10170662): täglich 18:45, Datensatz `fresh` im Data Store 208242.
- IG Auto-Reply (2841603), IG Offene Kommentare beantworten (10149203).

## Verlauf

### 24.11.2026 – v1.15.1 (Reiter „Follower“, Quellen nach Ertrag sortiert)
- Reiter „Skript“ heißt „Follower“ (`follower.js`, ersetzt `skript.js`, Wunsch André).
- „Welche Quelle bringt was?“: sortiert nach gewonnenen Followern (Conversions + Follow-backs), bei Gleichstand nach Quote. Gilt für Gruppen und einzelne Quellen, bei jedem Laden. Pille „+N“ zeigt die gewonnenen Follower je Quelle.

### 24.11.2026 – v1.15.0 (Wachstum aufgelöst, Reiter „Skript“)
- Reiter „Wachstum“ entfernt (`growth.js` gelöscht), Inhalte verteilt, Doppeltes raus. 5 statt 6 Reiter.
- Übersicht: neu „Netto-Follower pro Tag“ und „Follower-Ziel“ (unter „Diese Woche“).
- Content: neu „Funnel“ (unter „Reichweite pro Tag“).
- Reiter „Follows“ heißt jetzt „Skript“ (`skript.js`, ersetzt `follows.js`): Kacheln, „Welche Quelle bringt was?“, Gefolgt-Liste, Follower & Follows pro Tag, Aktivität pro Session, Conversions, neue Follower, letzte Kommentare.
- „Bringt das Skript Follower?“ und „Was funktioniert?“ zu einer Karte „Welche Quelle bringt was?“ zusammengelegt: je Gruppe (Hashtags, Hubs, Feed, Gegenbesuch, Kernliste & Merkliste, Sonstige) und einzeln Kommentare → Follower und Follows → Follow-backs.
- Gelöscht als doppelt: Kachel-Karte „Follower“ aus Wachstum (Kacheln jetzt nur im Skript-Reiter), zweite Follower-Kurve. CSS `.roi-s` gelöscht.

### 24.11.2026 – v1.14.2 (Übersicht: neuester Post oben, Wochentage im Streak)
- Übersicht: Karte „Neuester Post“ direkt unter „Heute“ (vorher ganz unten).
- Streak-Balken mit Wochentag darunter, heute hervorgehoben. Ein grauer Balken heißt: an dem Tag keine Session (z. B. Fr 21.11.).

### 24.11.2026 – v1.14.1 (App-Icon in Eisblau)
- App-Icons (180, 192, 512, 512 maskable) neu: Nachthimmel, Berge mit Schneespitzen, eisblauer Mond statt oranger Sonne. Mond und Gipfel liegen in der sicheren Zone für runde Icons.

### 24.11.2026 – v1.14.0 (Eisblau statt Orange, Banner mit Bergen und Kamera)
- Akzentfarbe Eisblau `#4B88C5` (hell `#9CC6EE`) statt Orange, nach Foto von André. Alle Orange-Töne laufen jetzt über `--accent-rgb`.
- `--blue` gelöscht (hätte mit dem neuen Akzent kollidiert). Likes im Chart „Aktivität pro Session“ und der Ring „Gefolgt“ in der Übersicht nutzen jetzt `--sand`.
- Banner: kühler Nachthimmel, drei Bergketten mit Schneespitzen, deutlich sichtbarer. Dahinter eine Kamera als feine Linie, der Mond ist das Objektiv. Vignette etwas schwächer.
- Staubpartikel im Banner kühl statt warm.

### 24.11.2026 – v1.13.0 (Reiter „Follows“)
- Neuer Reiter „Follows“ (`js/modules/follows.js`): Kacheln mit Hochzählen und Anheben beim Hover (Follower, Folge ich, Follows heute von `limits.follow_day`, Follow-backs mit Quote, Entfolgen fällig).
- Liste „Gefolgt“ mit Filter (Alle, Offen, Fällig, Zurück, Entfolgt): Handle, Followerzahl, Quelle, Datum, Tage, unser Kommentar (Link zum Post), Status-Pille. Zeilen blenden gestaffelt ein.
- „Was funktioniert?“: Follow-back-Quote je Quelle (Hashtags, Hubs, Feed, Sonstige) und jede Quelle einzeln.
- Chart: Follower-Kurve und Follows pro Tag (davon zurück).
- Wachstum: Karten „Gefolgt“, „Entfolgen?“ und Kachel „Follow-back“ entfernt (jetzt im Reiter Follows).
- Kommentar je Follow kommt aus dem neuen Make-Feld `c`; ältere Follows ohne `c` nehmen den letzten Kommentar aus `activity`.

### 24.11.2026 – v1.12.1 (Follow-Status korrigiert, Make-Log für Follow-Kommentare)
- App, Wachstum: Status-Pillen „offen · X T.“, „entfolgen fällig“, „entfolgt“, „folgt zurück“. Entfolgte Accounts (Make-Status `unf`) standen vorher als „X T. offen“ da (z. B. @hannah____berg).
- App: Entfolgen-Grenze kommt aus den Skill-Einstellungen (`limits.unfollow_days`, aktuell 7) statt `CONFIG.unfollowAfterDays` (14, gelöscht). Neu im Kern: `App.followState()`, `App.unfDays()`.
- Make „IG App API“, `log`: Follow-Zeilen (`F`) mit Kommentartext zählen jetzt als Like + Kommentar (vorher fehlten sie in Tages- und Stundenlimit). Follow-Einträge speichern Kommentar (`c`) und Shortcode (`sc`). Ältere Follows werden aus `activity` und dem Tageslog nachgetragen.
- Make „IG App API“, `prep`: `day`/`hour` zählen Follow-Zeilen mit Kommentar mit. Folge: Die Limits greifen ab jetzt früher, weil sie korrekt zählen.

### 16.11.2026 – Arbeitsregeln
- Neu: `CLAUDE.md` im Repo. Claude Code liest damit automatisch zuerst dieses Protokoll und hält sich an die Regeln (kein toter Code, Version hochzählen, Protokoll pflegen, Make-Credits, Browser nur über Windows).

### 16.11.2026 – v1.12.0 (Make-Credits sparen)
- Auslöser: Make-Plan hat 14.000 Credits pro Monat (Reset 12.12.), am 16.11. waren 4.176 verbraucht. Jeder App-Start und jede Rückkehr in den Vordergrund löste 4 Aufrufe aus (20 Credits), teils mehrfach pro Minute.
- App: automatisches Laden nur, wenn die Daten älter als 30 Minuten sind. ↻, Ziehen und Code speichern laden immer. Dafür `fresh()` und der Parameter `auto` in `load()`.
- App: ein Aufruf `init` statt `all` + `stats` + `cfg_get` + `sess_get`. Alter Ladecode gelöscht.
- Make: neues Szenario „IG App Init“ (10171545, Hook 4517389), 14 Operationen pro Aufruf. Getestet: Posts, Insights, Gegenbesuch, Stats, Einstellungen, Session kommen korrekt an.
- Messung: Stand 16.11. ca. 10:30 waren 4.176,5 von 14.000 Credits verbraucht. Am 19.11. Tagesverbrauch im Make-Dashboard prüfen, Ziel unter 400 pro Tag.

### 16.11.2026 – v1.11.0 (Hub-Alarm)
- Make: neues Szenario „IG Hub-Alarm“ (10170662), täglich 18:45. Liest Hubs und Kernliste aus den Einstellungen, holt je Konto die 4 neuesten Posts (nur Business-/Creator-Konten) und schreibt alle Posts der letzten 26 Stunden als Datensatz `fresh` (product `FRESH`, Format `handle|zeit|link;…`) in den Data Store 208242. Ca. 35 Operationen pro Lauf.
- App, Übersicht: Karte „Neu bei Hubs & Kernliste“ mit offen/kommentiert.
- Skill: Session arbeitet zuerst die `fresh`-Liste ab (Kernliste direkt per Post-Link, Hubs nur bei neuem Post).
- Entscheidung André: keine Push-Meldung, nur Dashboard, Prüfung einmal täglich vor der Abendrunde.

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
