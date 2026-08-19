export const APP_VERSION = '1.36'

interface ChangelogEntry {
  seq: number
  date: string
  items: string[]
}

// Jede neue nutzerspürbare Funktion bekommt hier einen Eintrag mit
// aufsteigender `seq` und dem Datum, an dem sie live ging. Die Heute-Seite
// zeigt beim nächsten Besuch alle Einträge an, deren `seq` größer ist als
// die zuletzt gesehene — danach gilt der Stand als gesehen (siehe
// takeUnseenChangelogItems). Die vollständige Historie (unabhängig vom
// Gesehen-Status) zeigt die "Neu in Nellicious"-Seite unter Mehr.
//
// Die Einträge mit `seq <= 0` sind rückwirkend erfasste Historie aus der
// Zeit vor dieser Karte (16.08.2026) — sie lösen bewusst nie eine
// Toast-Anzeige aus (immer kleiner als jeder je gespeicherte Stand),
// dienen also ausschließlich der vollständigen Chronik auf der Seite.
// Die Einträge ab seq 1 sind unverändert die schon live gewesenen
// Ankündigungen; ihre seq-Nummern und Texte bleiben stabil, damit
// bestehende "gesehen"-Stände in localStorage nicht neu ausgelöst werden.
const CHANGELOG: ChangelogEntry[] = [
  {
    seq: -4,
    date: '2026-08-11',
    items: [
      'Wochenplan mit automatischer Einkaufsliste eingeführt (nach Rezept gruppiert oder als flache Liste, Mengen skalieren je nach Planhäufigkeit)',
    ],
  },
  {
    seq: -3,
    date: '2026-08-12',
    items: [
      'Nellicious startet: Ernährungs-Tracking, Rezepte und Supabase-Anbindung',
      '28 neue, gesunde Rezepte zur Datenbank hinzugefügt',
      'Rezepte bearbeiten und nach Mahlzeitenart filtern',
      'Eigene Rezepte über den "Neu"-Button anlegen',
      'Hell/Dunkel/System-Design-Umschalter',
      'Mobile Navigation (Tab-Leiste unten) eingeführt',
      'Kopfzeile bleibt beim Scrollen sichtbar',
    ],
  },
  {
    seq: -2,
    date: '2026-08-13',
    items: [
      'Menü "Profil" zu "Mehr" umgebaut, mit Untermenü für Profil, Ziele, Tagesziele, Darstellung und Info',
      'Verlauf-Tab: Gewichts- und Wassertracking, Profil um Alter/Größe/Geschlecht erweitert',
      'Tagesziel (kcal) automatisch nach der Mifflin-St-Jeor-Formel berechnen',
      'Rezepte nach Ernährungstyp und Unverträglichkeit kennzeichnen und filtern',
      'Rezepte per Link importieren',
    ],
  },
  {
    seq: -1,
    date: '2026-08-14',
    items: ['Rezepte als Favoriten markieren'],
  },
  {
    seq: 0,
    date: '2026-08-15',
    items: [
      'Lebensmittelsuche (inkl. 200 kuratierten Lebensmitteln) beim manuellen Essenseintrag und in Rezeptzutaten',
      'Barcode-Scanner: Lebensmittel per Kamera erfassen',
      'Eigene Rezepte lassen sich löschen',
      'Persönliche Begrüßung mit Namen und Motivationsspruch beim App-Start',
    ],
  },
  {
    seq: 1,
    date: '2026-08-16',
    items: [
      '20 neue, gesunde Abendessen-Rezepte in der Datenbank',
      'Neu angelegte Rezepte öffnen direkt die Detailseite',
    ],
  },
  {
    seq: 2,
    date: '2026-08-16',
    items: [
      '🍳 Kochmodus in der Rezeptansicht: hält den Bildschirm wach, solange du kochst',
    ],
  },
  {
    seq: 3,
    date: '2026-08-16',
    items: [
      'Abendessen-Rezepte mit mehr Zutaten und ausführlicherer Zubereitung',
    ],
  },
  {
    seq: 4,
    date: '2026-08-17',
    items: [
      'Wassertracker: eigene Menge eintragen und die drei Schnellauswahl-Mengen selbst festlegen',
    ],
  },
  {
    seq: 5,
    date: '2026-08-17',
    items: [
      'Wunschgewicht im Profil eintragen — der Verlauf zeigt den Restweg dorthin',
      'Wasser-Karte aufgeräumt: ein Einstellungs-Button für Ziel und Schnellauswahl statt mehrerer Zeilen',
      'Wochenplan: größere, leichter antippbare Kacheln für Mahlzeiten und Einkaufsliste',
      'Darstellung: Schriftgröße lässt sich jetzt auf "Groß" stellen',
    ],
  },
  {
    seq: 6,
    date: '2026-08-16',
    items: ['Unterstützungs-Hinweis auf der Info-Seite ergänzt'],
  },
  {
    seq: 7,
    date: '2026-08-17',
    items: [
      'Alle Rezepte: mehr Zutaten und ausführlichere Zubereitung',
      'Verlauf: Kalorien-/Makro-Verlauf über die letzte Woche ergänzt',
      'Streak-Zähler: aufeinanderfolgende Log-Tage auf der Heute-Seite',
      'Rezept-Notizen: eigene Notiz pro Rezept',
    ],
  },
  {
    seq: 8,
    date: '2026-08-18',
    items: [
      '20 Salat-Rezepte zur Rezeptdatenbank hinzugefügt',
      'Eingabefelder zoomen auf dem Handy nicht mehr automatisch beim Tippen',
    ],
  },
  {
    seq: 9,
    date: '2026-08-18',
    items: ['20 gesunde Backrezepte zur Rezeptdatenbank hinzugefügt'],
  },
  {
    seq: 10,
    date: '2026-08-18',
    items: [
      '⏱️ Neu: Intervallfasten-Tracker mit Ring, Streak und 7-Tage-Verlauf',
      'Fasten-Protokolle (16:8, 18:6, 20:4, OMAD) selbst anpassbar',
      'Fastenzeiten rückwirkend eintragen und im Nachhinein bearbeiten',
      'Automatischer Countdown bis zum Fastenende bzw. bis zum nächsten Fastenbeginn',
      'Erklärungen zu den vier Fastenphasen (Verdauung, Fettverbrennung, Ketose, Autophagie)',
      'Fastenring auch auf der Heute-Seite sichtbar',
      'Intervallfasten lässt sich bei Bedarf komplett ausschalten',
    ],
  },
]

export const LATEST_CHANGELOG_SEQ = CHANGELOG.reduce((max, entry) => Math.max(max, entry.seq), 0)

const SEEN_SEQ_KEY = 'nellicious-seen-changelog-seq'

// Liefert die noch ungesehenen Ankündigungen und markiert sie sofort als
// gesehen. Erstnutzer (kein gespeicherter Stand) bekommen keine
// rückwirkende Liste vergangener Änderungen angezeigt.
export function takeUnseenChangelogItems(): string[] {
  const stored = localStorage.getItem(SEEN_SEQ_KEY)

  if (stored === null) {
    localStorage.setItem(SEEN_SEQ_KEY, String(LATEST_CHANGELOG_SEQ))
    return []
  }

  const seenSeq = Number(stored)
  if (!Number.isFinite(seenSeq) || seenSeq >= LATEST_CHANGELOG_SEQ) return []

  localStorage.setItem(SEEN_SEQ_KEY, String(LATEST_CHANGELOG_SEQ))
  return CHANGELOG.filter((entry) => entry.seq > seenSeq).flatMap((entry) => entry.items)
}

// Vollständige Historie für die "Neu in Nellicious"-Seite unter Mehr —
// unabhängig vom Gesehen-Status, neueste zuerst. Mehrere seq-Einträge mit
// demselben Datum (z. B. mehrere Ankündigungen am selben Tag) werden zu
// einer Karte zusammengefasst; die einzelnen seq-Nummern bleiben dafür
// intern in CHANGELOG unangetastet (wichtig für bestehende
// "gesehen"-Stände, siehe Kommentar oben).
export function getChangelogHistory(): { date: string; items: string[] }[] {
  const byDate = new Map<string, string[]>()
  for (const entry of CHANGELOG) {
    const items = byDate.get(entry.date) ?? []
    items.push(...entry.items)
    byDate.set(entry.date, items)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, items]) => ({ date, items }))
}
