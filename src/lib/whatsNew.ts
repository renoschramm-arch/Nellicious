import type { TFunction } from 'i18next'

export const APP_VERSION = '1.43'

interface ChangelogEntry {
  seq: number
  date: string
  key: string
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
// Ankündigungen; ihre seq-Nummern und Übersetzungs-Keys bleiben stabil,
// damit bestehende "gesehen"-Stände in localStorage nicht neu ausgelöst
// werden. Die eigentlichen Texte liegen in den Sprachdateien unter
// `changelog.<key>`.
const CHANGELOG: ChangelogEntry[] = [
  { seq: -4, date: '2026-08-11', key: 'seqNeg4' },
  { seq: -3, date: '2026-08-12', key: 'seqNeg3' },
  { seq: -2, date: '2026-08-13', key: 'seqNeg2' },
  { seq: -1, date: '2026-08-14', key: 'seqNeg1' },
  { seq: 0, date: '2026-08-15', key: 'seq0' },
  { seq: 1, date: '2026-08-16', key: 'seq1' },
  { seq: 2, date: '2026-08-16', key: 'seq2' },
  { seq: 3, date: '2026-08-16', key: 'seq3' },
  { seq: 4, date: '2026-08-17', key: 'seq4' },
  { seq: 5, date: '2026-08-17', key: 'seq5' },
  { seq: 6, date: '2026-08-16', key: 'seq6' },
  { seq: 7, date: '2026-08-17', key: 'seq7' },
  { seq: 8, date: '2026-08-18', key: 'seq8' },
  { seq: 9, date: '2026-08-18', key: 'seq9' },
  { seq: 10, date: '2026-08-18', key: 'seq10' },
  { seq: 11, date: '2026-08-20', key: 'seq11' },
  { seq: 12, date: '2026-08-21', key: 'seq12' },
  { seq: 13, date: '2026-08-24', key: 'seq13' },
  { seq: 14, date: '2026-08-25', key: 'seq14' },
  { seq: 15, date: '2026-08-25', key: 'seq15' },
  { seq: 16, date: '2026-08-26', key: 'seq16' },
  { seq: 17, date: '2026-08-26', key: 'seq17' },
]

export const LATEST_CHANGELOG_SEQ = CHANGELOG.reduce((max, entry) => Math.max(max, entry.seq), 0)

const SEEN_SEQ_KEY = 'nellicious-seen-changelog-seq'

function itemsFor(t: TFunction, entry: ChangelogEntry): string[] {
  return t(`changelog.${entry.key}`, { returnObjects: true }) as string[]
}

// Liefert die noch ungesehenen Ankündigungen und markiert sie sofort als
// gesehen. Erstnutzer (kein gespeicherter Stand) bekommen keine
// rückwirkende Liste vergangener Änderungen angezeigt.
export function takeUnseenChangelogItems(t: TFunction): string[] {
  const stored = localStorage.getItem(SEEN_SEQ_KEY)

  if (stored === null) {
    localStorage.setItem(SEEN_SEQ_KEY, String(LATEST_CHANGELOG_SEQ))
    return []
  }

  const seenSeq = Number(stored)
  if (!Number.isFinite(seenSeq) || seenSeq >= LATEST_CHANGELOG_SEQ) return []

  localStorage.setItem(SEEN_SEQ_KEY, String(LATEST_CHANGELOG_SEQ))
  return CHANGELOG.filter((entry) => entry.seq > seenSeq).flatMap((entry) => itemsFor(t, entry))
}

// Vollständige Historie für die "Neu in Nellicious"-Seite unter Mehr —
// unabhängig vom Gesehen-Status, neueste zuerst. Mehrere seq-Einträge mit
// demselben Datum (z. B. mehrere Ankündigungen am selben Tag) werden zu
// einer Karte zusammengefasst; die einzelnen seq-Nummern bleiben dafür
// intern in CHANGELOG unangetastet (wichtig für bestehende
// "gesehen"-Stände, siehe Kommentar oben).
export function getChangelogHistory(t: TFunction): { date: string; items: string[] }[] {
  const byDate = new Map<string, string[]>()
  for (const entry of CHANGELOG) {
    const items = byDate.get(entry.date) ?? []
    items.push(...itemsFor(t, entry))
    byDate.set(entry.date, items)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, items]) => ({ date, items }))
}
