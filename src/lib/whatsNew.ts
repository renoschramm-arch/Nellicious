export const APP_VERSION = '1.33'

interface ChangelogEntry {
  seq: number
  items: string[]
}

// Jede neue nutzerspürbare Funktion bekommt hier einen Eintrag mit
// aufsteigender `seq`. Die Heute-Seite zeigt beim nächsten Besuch alle
// Einträge an, deren `seq` größer ist als die zuletzt gesehene — danach
// gilt der Stand als gesehen (siehe useUnseenChangelog).
const CHANGELOG: ChangelogEntry[] = [
  {
    seq: 1,
    items: [
      '20 neue, gesunde Abendessen-Rezepte in der Datenbank',
      'Eigene Rezepte lassen sich jetzt löschen',
      'Neu angelegte Rezepte öffnen direkt die Detailseite',
    ],
  },
  {
    seq: 2,
    items: [
      '🍳 Kochmodus in der Rezeptansicht: hält den Bildschirm wach, solange du kochst',
    ],
  },
]

export const LATEST_CHANGELOG_SEQ = CHANGELOG.at(-1)?.seq ?? 0

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
