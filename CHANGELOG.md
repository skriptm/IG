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
2. Neue Growth-Kennzahlen: Netto-Follower pro Woche, Vergleich mit der Vorwoche, Funnel Reichweite → Profilaufrufe → Follows, Reels-Views/Wiedergabedauer, nächster geplanter Post
3. Reiter für Reiter neu ordnen, beginnend mit der Übersicht

## Offene Fragen an André
- keine

## Verlauf

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
