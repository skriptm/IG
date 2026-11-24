/* Grundeinstellungen der App. Der Zugangscode steht bewusst NICHT hier,
   er wird beim ersten Start in der App eingegeben und nur auf dem Gerät gespeichert. */
window.CONFIG = {
  version: "1.14.0",
  account: "andrelauinger",
  api: "https://hook.eu2.make.com/vevi8zj183hcicg9lq8rai3oekbok6wq",
  // Ein Aufruf fürs Laden aller Daten (spart Make-Credits), eigener Webhook
  init: "https://hook.eu2.make.com/img3ntv869kn838d9spw5rc555yqtckk",
  // Automatisches Nachladen (Start, Rückkehr in die App) erst nach so vielen Minuten; ↻ lädt immer
  maxAgeMin: 30,
  // Standard-Ziele (in den Einstellungen änderbar)
  // Accounts, die nie in Listen auftauchen sollen
  noGo: ["with_andre", "v4n3___", "kirschke_sandra", "ve_rena_h", "_steffi_richter_", "vanandventure", "explore2bfree", "blackroll", "andrelauinger"]
};
