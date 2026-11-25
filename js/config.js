/* Grundeinstellungen der App. Der Zugangscode steht bewusst NICHT hier,
   er wird beim ersten Start in der App eingegeben und nur auf dem Gerät gespeichert. */
window.CONFIG = {
  version: "1.18.0",
  account: "andrelauinger",
  api: "https://hook.eu2.make.com/vevi8zj183hcicg9lq8rai3oekbok6wq",
  // Ein Aufruf fürs Laden aller Daten (spart Make-Credits), eigener Webhook
  init: "https://hook.eu2.make.com/img3ntv869kn838d9spw5rc555yqtckk",
  // Automatisches Nachladen (Start, Rückkehr in die App) erst nach so vielen Minuten; ↻ lädt immer
  maxAgeMin: 30,
  // Standard-Ziele (in den Einstellungen änderbar)
  // Was wo läuft (Reiter Einstellungen → Betrieb). Make-Credits kommen nachts aus dem Szenario „IG Credits“.
  runs: [
    { id: 10171545, name: "App-Daten laden", when: "Start, ↻" },
    { id: 10161848, name: "App-Schnittstelle", when: "Sessions, Speichern" },
    { id: 10139638, name: "Posts & Kommentare", when: "täglich 06:10" },
    { id: 10149108, name: "Konto-Insights", when: "täglich 23:40" },
    { id: 10170662, name: "Hub-Alarm", when: "täglich 18:45" },
    { id: 2841603, name: "Auto-Reply (alt)", when: "bei Kommentaren, aus ab 28.11." },
    { id: 10149203, name: "Kommentare beantworten", when: "auf Knopf" }
  ],
  ownRuns: [
    { where: "Programm", name: "Auto-Reply", when: "alle 5 Min. · Google Apps Script · Claude max. 5 $/Monat" },
    { where: "Browser", name: "Engagement-Sessions", when: "manuell · Windows · Skill" }
  ],
  // Accounts, die nie in Listen auftauchen sollen
  noGo: ["with_andre", "v4n3___", "kirschke_sandra", "ve_rena_h", "_steffi_richter_", "vanandventure", "explore2bfree", "blackroll", "andrelauinger"]
};
