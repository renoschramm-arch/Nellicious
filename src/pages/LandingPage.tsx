import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Feuert einmalig, sobald ein Abschnitt in den sichtbaren Bereich scrollt —
// fällt bei fehlender IntersectionObserver-Unterstützung auf "sofort
// sichtbar" zurück, damit Inhalte nie verborgen bleiben.
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function Ring({ color, deg, size = 52 }: { color: string; deg: number; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, var(--border) ${deg}deg 360deg)`,
      }}
    >
      <div
        className="rounded-full bg-surface-2"
        style={{ width: size * 0.7, height: size * 0.7 }}
      />
    </div>
  )
}

const STATS = [
  { value: '146', label: 'Rezepte' },
  { value: '681', label: 'Lebensmittel in der Suche' },
  { value: '6', label: 'Ernährungsformen' },
  { value: '14', label: 'Tage kostenlos testen' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <span className="font-display font-bold text-lg sm:text-xl shrink-0">
            Nelli<span className="text-primary">cious</span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/anmelden" className="text-xs sm:text-sm text-text-muted hover:text-text whitespace-nowrap">
              Anmelden
            </Link>
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2.5 hover:bg-primary-hover transition-colors whitespace-nowrap"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-20 md:pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-basil bg-basil/10 rounded-full px-3.5 py-1.5">
            🌱 Kostenlos in der Beta
          </span>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-tight mt-5 mb-4 text-wrap-balance">
            Ernährung, die sich <span className="text-primary">nach deinem Leben</span> richtet.
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-md mx-auto md:mx-0 mb-7">
            Kalorien und Makros tracken, aus 146 Rezepten planen und mit Intervallfasten den
            Überblick behalten — alles in einer ruhigen, aufgeräumten App statt zehn Tabs.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold text-base rounded-full px-7 py-3.5 hover:bg-primary-hover transition-colors"
            >
              Kostenlos starten
            </Link>
            <a
              href="#funktionen"
              className="border border-border rounded-full px-7 py-3.5 font-semibold text-base hover:border-primary hover:text-primary transition-colors"
            >
              Funktionen ansehen
            </a>
          </div>
          <p className="text-xs text-text-muted mt-3.5">
            Keine Kreditkarte nötig · in 30 Sekunden startklar
          </p>
        </div>

        <div className="relative flex justify-center min-h-[420px] md:min-h-[480px]">
          {/* Ghost-Handy im Hintergrund */}
          <div className="absolute w-[190px] md:w-[210px] top-6 -left-2 md:-left-10 -rotate-[9deg] opacity-50 z-[1]">
            <div className="bg-[#14100d] rounded-[30px] p-1.5">
              <div className="bg-bg rounded-[24px] overflow-hidden aspect-[375/760] flex flex-col text-[10px]">
                <div className="px-4 pt-4 pb-2.5 border-b border-border">
                  <div className="font-display font-bold text-sm">
                    Nelli<span className="text-primary">cious</span>
                  </div>
                  <div className="text-[8px] text-text-muted mt-0.5">Gesund ernähren</div>
                </div>
                <div className="flex-1 px-4 py-3 flex flex-col gap-2.5">
                  <span className="font-display font-bold text-sm">Verlauf</span>
                  <div className="bg-surface-2 border border-border rounded-lg p-2 flex items-center gap-2">
                    <Ring color="var(--color-basil)" deg={260} size={30} />
                    <span>
                      ⏱️ Fastenzeit endet in
                      <span className="block font-mono text-[9px] text-basil">03:12 h</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Haupt-Handy */}
          <div className="relative z-[2] w-[220px] md:w-[240px]">
            <span className="absolute z-[3] -top-4 -right-3 md:-right-9 rotate-6 bg-basil text-white font-mono text-xs font-medium px-3.5 py-2 rounded-full shadow-lg whitespace-nowrap">
              🔥 5 Tage in Folge
            </span>
            <div className="bg-[#14100d] rounded-[34px] p-1.5 shadow-2xl rotate-2">
              <div className="bg-bg rounded-[28px] overflow-hidden aspect-[375/760] flex flex-col text-[10px]">
                <div className="px-4 pt-4 pb-2.5 border-b border-border">
                  <div className="font-display font-bold text-sm">
                    Nelli<span className="text-primary">cious</span>
                  </div>
                  <div className="text-[8px] text-text-muted mt-0.5">Gesund ernähren</div>
                </div>
                <div className="flex-1 px-4 py-3 flex flex-col gap-2.5 overflow-hidden">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display font-bold text-sm">Heute</span>
                    <span className="font-mono text-[7px] text-text-muted uppercase">Mi., 19. August</span>
                  </div>
                  <span className="self-start font-mono text-[7px] text-honey bg-honey/15 rounded-full px-2 py-1">
                    🔥 5 Tage in Folge geloggt
                  </span>
                  <div className="bg-surface-2 border border-border rounded-lg p-2 flex items-center gap-2">
                    <Ring color="var(--color-primary)" deg={230} size={30} />
                    <span>
                      Tagesziel
                      <span className="block font-mono text-[9px] text-primary">1340 / 2100 kcal</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[8px]">
                    <div className="bg-surface border border-border rounded-md p-1.5 text-center">
                      <div className="text-text-muted text-[5.5px] uppercase mb-0.5">Protein</div>78 g
                    </div>
                    <div className="bg-surface border border-border rounded-md p-1.5 text-center">
                      <div className="text-text-muted text-[5.5px] uppercase mb-0.5">Kohlenh.</div>161 g
                    </div>
                    <div className="bg-surface border border-border rounded-md p-1.5 text-center">
                      <div className="text-text-muted text-[5.5px] uppercase mb-0.5">Fett</div>37 g
                    </div>
                  </div>
                  <div className="bg-surface/85 border border-border rounded-lg px-2">
                    <div className="flex items-center gap-1.5 py-1.5 border-b border-border text-[8px]">
                      <span className="w-1 h-1 rounded-full bg-honey shrink-0" />
                      <span className="flex-1">Overnight Oats mit Beeren</span>
                      <span className="font-mono text-[6.5px] text-text-muted">340 kcal</span>
                    </div>
                    <div className="flex items-center gap-1.5 py-1.5 text-[8px]">
                      <span className="w-1 h-1 rounded-full bg-honey shrink-0" />
                      <span className="flex-1">Linsen-Bowl mit Ofengemüse</span>
                      <span className="font-mono text-[6.5px] text-text-muted">480 kcal</span>
                    </div>
                  </div>
                  <div className="bg-primary text-on-primary rounded-md py-1.5 text-center font-semibold text-[8px]">
                    Mahlzeit hinzufügen
                  </div>
                </div>
                <div className="flex justify-center gap-0.5 px-1.5 pt-1.5 pb-2.5 border-t border-border">
                  <span className="bg-primary text-on-primary rounded-full px-2 py-1 text-[6.5px] font-semibold">Heute</span>
                  <span className="text-text-muted rounded-full px-2 py-1 text-[6.5px] font-semibold">Rezepte</span>
                  <span className="text-text-muted rounded-full px-2 py-1 text-[6.5px] font-semibold">Plan</span>
                  <span className="text-text-muted rounded-full px-2 py-1 text-[6.5px] font-semibold">Verlauf</span>
                  <span className="text-text-muted rounded-full px-2 py-1 text-[6.5px] font-semibold">Mehr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kennzahlen */}
      <section className="border-y border-border bg-surface-2">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-mono font-medium text-2xl md:text-3xl text-primary tabular-nums">{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Funktionen */}
      <section id="funktionen" className="max-w-5xl mx-auto px-6 py-20 md:py-24 flex flex-col gap-24 md:gap-28">
        <Reveal className="grid md:grid-cols-2 gap-10 md:gap-16 items-center text-center md:text-left">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Tagesübersicht</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5 leading-tight">
              Kalorien & Makros, ohne Kopfrechnen.
            </h2>
            <p className="text-text-muted leading-relaxed max-w-sm mx-auto md:mx-0">
              Mahlzeit aus einem Rezept übernehmen, per Barcode scannen oder manuell eintragen —
              dein Tagesziel und die Makroverteilung aktualisieren sich sofort. Ein Streak zeigt,
              wie regelmäßig du dranbleibst.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col gap-3.5">
              <span className="font-display font-semibold">Tagesziel</span>
              <div className="flex items-center gap-3.5">
                <Ring color="var(--color-primary)" deg={230} />
                <span className="font-mono font-medium text-base text-primary">1340 / 2100 kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-sm">
                <div className="bg-surface-2 border border-border rounded-lg p-2 text-center">
                  <div className="text-text-muted text-[10px] uppercase mb-0.5">Protein</div>78 g
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-2 text-center">
                  <div className="text-text-muted text-[10px] uppercase mb-0.5">Kohlenh.</div>161 g
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-2 text-center">
                  <div className="text-text-muted text-[10px] uppercase mb-0.5">Fett</div>37 g
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="grid md:grid-cols-2 gap-10 md:gap-16 items-center text-center md:text-left">
          <div className="md:order-2">
            <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Wochenplaner</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5 leading-tight">
              Plane die Woche, die Einkaufsliste macht sich von selbst.
            </h2>
            <p className="text-text-muted leading-relaxed max-w-sm mx-auto md:mx-0">
              Rezepte auf die Tage verteilen — Zutatenmengen werden automatisch zusammengerechnet
              und zu einer nach Rezept gruppierten Einkaufsliste, die du beim Einkaufen einfach
              abhaken kannst.
            </p>
          </div>
          <div className="flex justify-center md:order-1">
            <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col gap-3">
              <span className="font-display font-semibold">Einkaufsliste</span>
              <div className="flex flex-col gap-2">
                {['300 g rote Linsen', '2 Süßkartoffeln', '1 Bund Petersilie'].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-basil/15 text-basil text-[10px] flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="grid md:grid-cols-2 gap-10 md:gap-16 items-center text-center md:text-left">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Intervallfasten</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5 leading-tight">
              Fastenring, Essensfenster und Phasen erklärt.
            </h2>
            <p className="text-text-muted leading-relaxed max-w-sm mx-auto md:mx-0">
              Protokoll wählen (16:8, 18:6, 20:4 oder eigenes), starten — der Ring zählt bis zum
              Fastenende herunter und erklärt unterwegs, was im Körper gerade passiert.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col gap-3.5">
              <span className="font-display font-semibold flex items-center gap-2">
                ⏱️ Intervallfasten
                <span className="font-mono text-xs text-honey ml-auto">🔥 6 Tage</span>
              </span>
              <div className="flex items-center gap-3.5">
                <Ring color="var(--color-basil)" deg={288} />
                <div className="text-sm">
                  Fastenzeit endet in
                  <span className="block font-mono font-medium text-base text-basil">
                    03:45 h <span className="text-text-muted text-sm">um 18:30 Uhr</span>
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5">Phase: Ketose setzt ein</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="grid md:grid-cols-2 gap-10 md:gap-16 items-center text-center md:text-left">
          <div className="md:order-2">
            <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Barcode-Scanner</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5 leading-tight">
              Verpacktes in 2 Sekunden erfassen.
            </h2>
            <p className="text-text-muted leading-relaxed max-w-sm mx-auto md:mx-0">
              Kamera drauf halten, fertig — Nährwerte werden automatisch übernommen. Für
              generische Zutaten wie Reis oder Gemüse greift die kuratierte 681er-Datenbank, wo
              Markendatenbanken oft lückenhaft sind.
            </p>
          </div>
          <div className="flex justify-center md:order-1">
            <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col gap-3">
              <span className="font-display font-semibold">Lebensmittel suchen</span>
              <div className="aspect-[16/10] border-2 border-dashed border-primary rounded-xl bg-surface-2 flex flex-col items-center justify-center gap-1.5 font-mono text-sm text-text-muted">
                <span className="text-2xl">📷</span>
                Barcode im Rahmen halten
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Neu in Nellicious */}
      <Reveal>
        <section className="border-y border-border bg-surface-2 py-20 md:py-24">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="text-center md:text-left">
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Aktive Entwicklung</span>
              <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5 leading-tight">
                Läuft nie fertig — wird laufend besser.
              </h2>
              <p className="text-text-muted leading-relaxed max-w-sm mx-auto md:mx-0">
                Jede Woche neue Rezepte, Funktionen und Verbesserungen. Was sich ändert, steht
                offen und mit Datum unter „Neu in Nellicious" — kein Changelog, den niemand liest.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
                <span className="font-mono text-xs uppercase text-honey">18. August 2026</span>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Intervallfasten: Fastenring, Essensfenster-Timer & Phasen erklärt',
                    'Fastenzeiten rückwirkend eintragen & bearbeiten',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
                <span className="font-mono text-xs uppercase text-honey">12. August 2026</span>
                <ul className="flex flex-col gap-1.5">
                  {['20 neue Salatrezepte', '20 neue gesunde Backrezepte'].map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Preise */}
      <Reveal>
        <section className="max-w-3xl mx-auto px-6 py-20 md:py-24 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Preise</span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 mb-3.5">
            Kostenlos starten, upgraden wenn's passt.
          </h2>
          <p className="text-text-muted leading-relaxed max-w-md mx-auto mb-10">
            Alle Grundfunktionen sind dauerhaft kostenlos. Premium schaltet Wochenplanung über die
            aktuelle Woche hinaus und den Kochmodus frei — 14 Tage lang zum Ausprobieren, ohne
            Zahlungsdaten.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-surface border border-border rounded-2xl p-6 text-left flex flex-col gap-2">
              <span className="font-display font-semibold">Monatlich</span>
              <span className="font-mono text-2xl">
                3,99 € <span className="text-sm text-text-muted font-sans">/ Monat</span>
              </span>
              <span className="text-xs text-text-muted">jederzeit kündbar</span>
            </div>
            <div className="relative bg-surface border border-primary rounded-2xl p-6 text-left flex flex-col gap-2">
              <span className="absolute -top-3 left-6 bg-primary text-on-primary font-mono text-[10px] uppercase tracking-wide rounded-full px-2.5 py-1">
                2 Monate gratis
              </span>
              <span className="font-display font-semibold">Jährlich</span>
              <span className="font-mono text-2xl">
                39,99 € <span className="text-sm text-text-muted font-sans">/ Jahr</span>
              </span>
              <span className="text-xs text-text-muted">entspricht 3,33 € / Monat</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-6">
            14 Tage kostenlos testen · danach automatisch im Gratis-Umfang weiternutzbar
          </p>
        </section>
      </Reveal>

      {/* Abschluss-CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20 md:pb-24">
        <Reveal>
          <div className="bg-text text-bg rounded-[28px] px-8 py-16 md:py-20 text-center flex flex-col items-center gap-5">
            <h2 className="font-display font-semibold text-2xl md:text-3xl max-w-xs md:max-w-sm">
              Bereit für weniger Kopfzerbrechen beim Essen?
            </h2>
            <p className="text-bg/70 max-w-md">
              Kostenlos anmelden, ersten Tag loggen, in der ersten Woche schon den Rhythmus
              spüren.
            </p>
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold rounded-full px-7 py-3.5 hover:bg-primary-hover transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </Reveal>
      </div>

      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-bold">Nellicious</span>
          <div className="flex gap-5 text-sm text-text-muted">
            <Link to="/anmelden" className="hover:text-text">
              Anmelden
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
