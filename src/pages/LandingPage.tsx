import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getChangelogHistory } from '../lib/whatsNew'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

// Zentrale Prüfung auf "Bewegung reduzieren" — alle JS-getriebenen Animationen
// (Canvas, Zähler, Scroll-Effekte) schalten sich damit ab. Rein CSS-basierte
// Übergänge nutzen zusätzlich die motion-reduce:-Varianten von Tailwind.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

// Feuert einmalig, sobald ein Abschnitt in den sichtbaren Bereich scrollt —
// fällt bei fehlender IntersectionObserver-Unterstützung auf "sofort
// sichtbar" zurück, damit Inhalte nie verborgen bleiben.
function useReveal<T extends HTMLElement>(threshold = 0.15) {
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
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

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

// Registriert einen passiven Scroll-Listener und ruft den Callback zusätzlich
// einmal beim Einhängen sowie bei Größenänderungen auf.
function useScrollEffect(handler: () => void, enabled = true) {
  const saved = useRef(handler)
  saved.current = handler

  useEffect(() => {
    if (!enabled) return
    const run = () => saved.current()
    run()
    window.addEventListener('scroll', run, { passive: true })
    window.addEventListener('resize', run)
    return () => {
      window.removeEventListener('scroll', run)
      window.removeEventListener('resize', run)
    }
  }, [enabled])
}

// ---------------------------------------------------------------------------
// SVG-Ring, der sich beim Sichtbarwerden selbst zeichnet
// ---------------------------------------------------------------------------
function ProgressRing({
  size,
  stroke,
  radius,
  progress,
  color,
  children,
  draw = false,
}: {
  size: number
  stroke: number
  radius: number
  progress: number
  color: string
  children?: ReactNode
  draw?: boolean
}) {
  const circumference = 2 * Math.PI * radius
  const { ref, visible } = useReveal<HTMLDivElement>(0.4)
  const filled = draw ? (visible ? progress : 0) : progress

  return (
    <div ref={ref} className="relative shrink-0 grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - filled)}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.25,.75,.3,1)' }}
          className="motion-reduce:transition-none"
        />
      </svg>
      {children && <div className="absolute text-center">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ambiente: treibende Farbwolken hinter dem Hero
// ---------------------------------------------------------------------------
function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    type Dot = { x: number; y: number; r: number; vx: number; vy: number; c: string; a: number }
    let width = 0
    let height = 0
    let dots: Dot[] = []
    let raf: number | null = null

    function resize() {
      if (!canvas || !ctx) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const styles = getComputedStyle(document.documentElement)
      const colors = ['--basil', '--honey', '--brand'].map((name) =>
        styles.getPropertyValue(name).trim(),
      )
      dots = Array.from({ length: 26 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 22 + Math.random() * 68,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        c: colors[Math.floor(Math.random() * colors.length)],
        a: 0.04 + Math.random() * 0.05,
      }))
    }

    function frame() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      for (const dot of dots) {
        dot.x += dot.vx
        dot.y += dot.vy
        if (dot.x < -dot.r) dot.x = width + dot.r
        if (dot.x > width + dot.r) dot.x = -dot.r
        if (dot.y < -dot.r) dot.y = height + dot.r
        if (dot.y > height + dot.r) dot.y = -dot.r

        const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r)
        gradient.addColorStop(0, dot.c)
        gradient.addColorStop(1, 'transparent')
        ctx.globalAlpha = dot.a
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    frame()

    // Rechenzeit sparen, sobald der Hero aus dem Bild gescrollt ist.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (raf === null) frame()
        } else if (raf !== null) {
          cancelAnimationFrame(raf)
          raf = null
        }
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    return () => {
      window.removeEventListener('resize', resize)
      observer.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
    />
  )
}

// ---------------------------------------------------------------------------
// Kennzahl, die beim Sichtbarwerden hochzählt
// ---------------------------------------------------------------------------
function CountUp({ to }: { to: number }) {
  const { ref, visible } = useReveal<HTMLSpanElement>(0.5)
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!visible) return
    if (reduced) {
      setValue(to)
      return
    }
    const duration = 1300
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, reduced, to])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Handy-Mockup-Bausteine
// ---------------------------------------------------------------------------
function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative bg-[#14100d] rounded-[42px] p-2 shadow-2xl ${className}`}>
      <div className="absolute top-[15px] left-1/2 -translate-x-1/2 w-[78px] h-5 bg-[#14100d] rounded-full z-[5]" />
      <div className="relative bg-bg rounded-[34px] overflow-hidden aspect-[375/780] flex flex-col">
        {children}
      </div>
    </div>
  )
}

function ScreenBar({ title, meta }: { title: ReactNode; meta: string }) {
  return (
    <div className="px-[18px] pt-[26px] pb-[9px] border-b border-border flex items-baseline justify-between shrink-0">
      <span className="font-display font-semibold text-sm">{title}</span>
      <span className="font-mono text-[8px] text-text-muted uppercase tracking-wide">{meta}</span>
    </div>
  )
}

function TabBar({ active }: { active: string }) {
  return (
    <div className="flex justify-around items-center px-1.5 pt-[9px] pb-[15px] border-t border-border shrink-0">
      {['Heute', 'Rezepte', 'Plan', 'Verlauf', 'Mehr'].map((tab) => (
        <span
          key={tab}
          className={`text-[8px] ${
            tab === active
              ? 'text-on-primary bg-primary px-2.5 py-1 rounded-full'
              : 'text-text-muted'
          }`}
        >
          {tab}
        </span>
      ))}
    </div>
  )
}

function MacroGrid() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[
        ['Protein', '78 g'],
        ['Kohlenh.', '161 g'],
        ['Fett', '37 g'],
      ].map(([label, value]) => (
        <div key={label} className="bg-surface border border-border rounded-[9px] px-1 py-[7px] text-center">
          <span className="block font-mono text-[6px] text-text-muted uppercase tracking-wide mb-0.5">
            {label}
          </span>
          <span className="font-mono text-[10px] font-medium">{value}</span>
        </div>
      ))}
    </div>
  )
}

function MealRow({ name, kcal, last = false }: { name: string; kcal: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-[7px] py-[7px] text-[9px] ${last ? '' : 'border-b border-border'}`}>
      <span className="w-[5px] h-[5px] rounded-full bg-honey shrink-0" />
      <span className="flex-1">{name}</span>
      <span className="font-mono text-[7.5px] text-text-muted">{kcal}</span>
    </div>
  )
}

// Die vier Bildschirme der scroll-fixierten Strecke
function ScreenHeute() {
  return (
    <>
      <ScreenBar title="Heute" meta="Mi., 19. Aug" />
      <div className="flex-1 p-3.5 flex flex-col gap-[9px] min-h-0">
        <div className="bg-surface-2 border border-border rounded-[13px] p-[11px] flex items-center gap-2.5">
          <ProgressRing size={60} stroke={8} radius={24} progress={0.64} color="var(--color-primary)">
            <span className="font-mono text-[8px] font-medium text-primary">64%</span>
          </ProgressRing>
          <div>
            <div className="text-[9.5px] font-semibold">Tagesziel</div>
            <div className="font-mono text-[11px] text-primary">1340 / 2100</div>
          </div>
        </div>
        <MacroGrid />
        <div className="bg-surface border border-border rounded-[13px] p-[11px]">
          <MealRow name="Overnight Oats" kcal="340" />
          <MealRow name="Linsen-Bowl" kcal="480" />
          <MealRow name="Tom Kha Gai" kcal="420" last />
        </div>
        <div className="mt-auto bg-primary text-on-primary text-center text-[9px] font-semibold py-[9px] rounded-[9px]">
          Mahlzeit hinzufügen
        </div>
      </div>
      <TabBar active="Heute" />
    </>
  )
}

function ScreenPlan() {
  return (
    <>
      <ScreenBar title="Wochenplan" meta="KW 34" />
      <div className="flex-1 p-3.5 flex flex-col gap-[9px] min-h-0">
        {[
          ['Montag', ['Porridge mit Beeren', 'Quinoa-Salat']],
          ['Dienstag', ['Pho Ga', 'Lachs mit Brokkoli']],
        ].map(([day, meals]) => (
          <div key={day as string} className="bg-surface border border-border rounded-[13px] p-[9px]">
            <div className="text-[8px] text-text-muted uppercase mb-1.5">{day as string}</div>
            {(meals as string[]).map((meal, i, arr) => (
              <MealRow key={meal} name={meal} kcal="" last={i === arr.length - 1} />
            ))}
          </div>
        ))}
        <div className="bg-surface-2 border border-border rounded-[13px] p-[11px]">
          <div className="text-[9.5px] font-semibold mb-[7px]">🛒 Einkaufsliste</div>
          <div className="text-[8px] text-text-muted leading-[1.9]">
            ○ 300 g rote Linsen
            <br />○ 2 Süßkartoffeln
            <br />○ 1 Bund Petersilie
            <br />○ 400 ml Kokosmilch
          </div>
        </div>
      </div>
      <TabBar active="Plan" />
    </>
  )
}

function ScreenFasten() {
  return (
    <>
      <ScreenBar title="Intervallfasten" meta="16:8" />
      <div className="flex-1 p-3.5 flex flex-col items-center justify-center gap-3.5 min-h-0">
        <ProgressRing size={112} stroke={10} radius={46} progress={0.75} color="var(--color-basil)">
          <span className="font-mono text-[15px] font-medium text-basil">03:45</span>
        </ProgressRing>
        <div className="text-center">
          <div className="text-[9.5px] font-semibold">Fastenzeit endet um 18:30</div>
          <div className="text-[8px] text-text-muted mt-[3px]">Phase: Ketose setzt ein</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-[13px] p-[11px] w-full">
          <div className="text-[8px] text-text-muted leading-[1.85]">
            ✓ Verdauung · ✓ Fettverbrennung
            <br />● Ketose · ○ Autophagie
          </div>
        </div>
      </div>
      <TabBar active="Verlauf" />
    </>
  )
}

function ScreenScanner() {
  return (
    <>
      <ScreenBar title="Barcode scannen" meta="Kamera" />
      <div className="flex-1 p-3.5 flex flex-col justify-center gap-4 min-h-0">
        <div className="border-2 border-dashed border-primary rounded-[14px] h-[130px] grid place-items-center gap-2 bg-primary/5">
          <span className="text-[30px]">📷</span>
          <span className="font-mono text-[8px] text-text-muted">Barcode im Rahmen halten</span>
        </div>
        <div className="bg-surface border border-border rounded-[13px] p-[11px]">
          <div className="text-[9.5px] font-semibold">Haferflocken, kernig</div>
          <div className="font-mono text-[8px] text-text-muted mt-[5px]">372 kcal · 13 P · 59 K · 7 F</div>
        </div>
        <div className="bg-primary text-on-primary text-center text-[9px] font-semibold py-[9px] rounded-[9px]">
          Übernehmen
        </div>
      </div>
      <TabBar active="Heute" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Scroll-fixierte Funktionsstrecke: Das Handy bleibt stehen, Text und Display
// wechseln synchron mit dem Scrollfortschritt.
// ---------------------------------------------------------------------------
const PANELS = [
  {
    eyebrow: 'Tagesübersicht',
    title: 'Kalorien & Makros, ohne Kopfrechnen.',
    text: 'Mahlzeit aus einem Rezept übernehmen, per Barcode scannen oder manuell eintragen — dein Tagesziel und die Makroverteilung aktualisieren sich sofort.',
    screen: <ScreenHeute />,
  },
  {
    eyebrow: 'Wochenplaner',
    title: 'Plane die Woche, die Einkaufsliste macht sich selbst.',
    text: 'Rezepte auf die Tage verteilen — Zutatenmengen werden automatisch zusammengerechnet und nach Rezept gruppiert.',
    screen: <ScreenPlan />,
  },
  {
    eyebrow: 'Intervallfasten',
    title: 'Fastenring, Essensfenster und Phasen erklärt.',
    text: 'Protokoll wählen, starten — der Ring zählt bis zum Fastenende herunter und erklärt unterwegs, was im Körper gerade passiert.',
    screen: <ScreenFasten />,
  },
  {
    eyebrow: 'Barcode-Scanner',
    title: 'Verpacktes in 2 Sekunden erfassen.',
    text: 'Kamera drauf halten, fertig — Nährwerte werden automatisch übernommen. Für generische Zutaten greift die kuratierte 681er-Datenbank.',
    screen: <ScreenScanner />,
  },
]

function PinnedFeatures() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useScrollEffect(
    useCallback(() => {
      const section = sectionRef.current
      if (!section) return
      const total = section.offsetHeight - window.innerHeight
      if (total <= 0) return
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / total))
      const index = Math.min(PANELS.length - 1, Math.floor(progress * PANELS.length * 0.999))
      setActive(index)
    }, []),
  )

  return (
    <section
      ref={sectionRef}
      id="funktionen"
      className="relative"
      style={{ height: `${PANELS.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen max-w-5xl mx-auto px-6 pt-14 md:pt-0 grid md:grid-cols-2 gap-4 md:gap-16 items-center content-center">
        {/* Fortschritt als senkrechte Punkt-Leiste — gleiche Achse wie die
            Scrollrichtung, damit die Abfolge intuitiv lesbar bleibt. */}
        <div
          aria-hidden="true"
          className="absolute left-3 sm:left-4 md:left-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4"
        >
          <span className="absolute inset-y-1 w-px bg-border" />
          {PANELS.map((panel, i) => (
            <span
              key={panel.eyebrow}
              className={`relative w-2.5 h-2.5 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none ${
                i === active ? 'bg-primary scale-[1.35] ring-4 ring-primary/20' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="relative min-h-[300px] order-2 md:order-1 text-center md:text-left">
          {PANELS.map((panel, i) => (
            <div
              key={panel.eyebrow}
              className={`md:absolute md:inset-0 flex flex-col justify-center transition-all duration-500 ease-out motion-reduce:transition-none ${
                i === active
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none absolute inset-0'
              }`}
              aria-hidden={i !== active}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {panel.eyebrow}
              </span>
              <h2 className="font-display font-semibold text-2xl md:text-4xl leading-tight mt-3.5 mb-4 text-wrap-balance">
                {panel.title}
              </h2>
              <p className="text-text-muted text-base md:text-[17px] font-light leading-relaxed max-w-[44ch] mx-auto md:mx-0">
                {panel.text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center order-1 md:order-2">
          {/* Auf schmalen Geräten wird das komplette Handy proportional
              skaliert statt nur schmaler gesetzt — so bleiben die festen
              Pixelgrößen im Display im Verhältnis und der Inhalt läuft nicht
              über die Tab-Leiste hinaus. Die feste Wrapper-Höhe entspricht der
              skalierten Höhe, damit das Raster nicht die volle Größe reserviert. */}
          <div className="h-[340px] min-[420px]:h-[396px] md:h-auto">
            <div className="relative w-[272px] origin-top scale-[0.62] min-[420px]:scale-[0.72] md:scale-100">
              <Phone>
                {PANELS.map((panel, i) => (
                  <div
                    key={panel.eyebrow}
                    className={`absolute inset-0 flex flex-col transition-opacity duration-500 motion-reduce:transition-none ${
                      i === active ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={i !== active}
                  >
                    {panel.screen}
                  </div>
                ))}
              </Phone>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Statement: Wörter leuchten beim Scrollen nacheinander auf
// ---------------------------------------------------------------------------
const STATEMENT = 'Kein Punktesystem. Kein schlechtes Gewissen. Nur klare Zahlen und richtig gutes Essen.'
const ACCENT_WORDS = new Set(['Punktesystem.', 'Gewissen.', 'gutes', 'Essen.'])

function Statement() {
  const ref = useRef<HTMLHeadingElement>(null)
  const words = STATEMENT.split(' ')
  const [lit, setLit] = useState(0)
  const reduced = usePrefersReducedMotion()

  useScrollEffect(
    useCallback(() => {
      const el = ref.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const start = window.innerHeight * 0.9
      const end = window.innerHeight * 0.25
      const p = Math.min(1, Math.max(0, (start - top) / (start - end)))
      setLit(Math.round(p * words.length))
    }, [words.length]),
    !reduced,
  )

  return (
    <section className="bg-[#1c1310] text-[#f7f0e8] py-28 md:py-44 text-center overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <h2 ref={ref} className="font-display font-semibold text-3xl md:text-6xl leading-[1.08] max-w-[20ch] mx-auto text-wrap-balance">
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className={`inline-block transition-all duration-500 motion-reduce:transition-none motion-reduce:!opacity-100 ${
                reduced || i < lit ? 'opacity-100' : 'opacity-[0.16]'
              } ${ACCENT_WORDS.has(word) && (reduced || i < lit) ? 'text-brand' : ''}`}
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h2>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Rezept-Schiene, die sich scroll-getrieben seitwärts bewegt
// ---------------------------------------------------------------------------
const RECIPES = [
  { emoji: '🥣', title: 'Overnight Oats mit Beeren', kcal: '340 kcal', protein: '12 P', tag: 'Vegetarisch', meal: 'Frühstück', tint: 'var(--color-honey)' },
  { emoji: '🍜', title: 'Tom Kha Gai', kcal: '420 kcal', protein: '28 P', tag: 'Glutenfrei', meal: 'Mittag', tint: 'var(--color-basil)' },
  { emoji: '🐟', title: 'Lachs mit Brokkoli', kcal: '450 kcal', protein: '38 P', tag: 'Pescetarisch', meal: 'Abend', tint: 'var(--color-primary)' },
  { emoji: '🥗', title: 'Quinoa-Salat mit Feta', kcal: '380 kcal', protein: '15 P', tag: 'Vegetarisch', meal: 'Mittag', tint: 'var(--color-basil)' },
  { emoji: '🍲', title: 'Masoor Dal Shorba', kcal: '320 kcal', protein: '18 P', tag: 'Vegan', meal: 'Mittag', tint: 'var(--color-honey)' },
  { emoji: '🍛', title: 'Kichererbsen-Curry', kcal: '410 kcal', protein: '16 P', tag: 'Vegan', meal: 'Abend', tint: 'var(--color-primary)' },
  { emoji: '🥑', title: 'Avocado-Brot mit Ei', kcal: '360 kcal', protein: '17 P', tag: 'Vegetarisch', meal: 'Frühstück', tint: 'var(--color-basil)' },
  { emoji: '🍚', title: 'Pho Ga', kcal: '430 kcal', protein: '30 P', tag: 'Glutenfrei', meal: 'Abend', tint: 'var(--color-honey)' },
]

function RecipeRail() {
  const sectionRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useScrollEffect(
    useCallback(() => {
      const section = sectionRef.current
      const rail = railRef.current
      if (!section || !rail) return
      const rect = section.getBoundingClientRect()
      const p = Math.min(
        1,
        Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)),
      )
      const max = Math.max(0, rail.scrollWidth - window.innerWidth + 56)
      rail.style.transform = `translate3d(${-p * max * 0.85}px,0,0)`
    }, []),
    !reduced,
  )

  return (
    <section ref={sectionRef} id="rezepte" className="py-20 md:py-32 overflow-hidden">
      <Reveal>
        <div className="max-w-5xl mx-auto px-6 flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
              174 Rezepte
            </span>
            <h2 className="font-display font-semibold text-2xl md:text-4xl leading-tight mt-3 max-w-[16ch] text-wrap-balance">
              Von Overnight Oats bis Tom Kha Gai.
            </h2>
          </div>
          <p className="text-text-muted font-light max-w-[34ch]">
            Jedes Rezept mit Nährwerten, Zutatenliste und Kennzeichnung für Ernährungsform und
            Unverträglichkeiten.
          </p>
        </div>
      </Reveal>

      <div className="overflow-x-auto md:overflow-hidden px-6 md:px-0">
        <div ref={railRef} className="flex gap-[18px] will-change-transform w-max md:pl-6">
          {RECIPES.map((recipe) => (
            <article
              key={recipe.title}
              className="w-[232px] shrink-0 bg-surface border border-border rounded-[18px] overflow-hidden shadow-[var(--shadow)]"
            >
              <div
                className="h-[116px] grid place-items-center text-[40px]"
                style={{ background: `color-mix(in srgb, ${recipe.tint} 17%, transparent)` }}
              >
                {recipe.emoji}
              </div>
              <div className="px-4 pt-3 pb-4">
                <h3 className="font-display font-semibold text-[14.5px] leading-snug mb-1.5">
                  {recipe.title}
                </h3>
                <div className="flex gap-2.5 font-mono text-[10px] text-text-muted">
                  <span>{recipe.kcal}</span>
                  <span>{recipe.protein}</span>
                </div>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[9.5px] px-2 py-[3px] rounded-full bg-basil/15 text-basil">
                    {recipe.tag}
                  </span>
                  <span className="text-[9.5px] px-2 py-[3px] rounded-full bg-honey/15 text-honey">
                    {recipe.meal}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Fasten-Sektion mit großem, sich zeichnendem Ring
// ---------------------------------------------------------------------------
const PHASES = [
  { time: '0–4 h', text: 'Verdauung — der Körper verarbeitet die letzte Mahlzeit' },
  { time: '4–12 h', text: 'Fettverbrennung beginnt' },
  { time: '12–18 h', text: 'Ketose setzt ein' },
  { time: '18 h+', text: 'Autophagie — Zellreinigung läuft' },
]

function FastingSection() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.4)

  return (
    <section className="bg-surface-2 border-y border-border py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center text-center md:text-left">
        <div ref={ref} className="flex justify-center">
          <ProgressRing
            size={300}
            stroke={13}
            radius={131}
            progress={0.74}
            color="var(--color-basil)"
            draw
          >
            <span className="font-mono text-3xl md:text-4xl font-medium text-basil block">03:45</span>
            <span className="text-xs text-text-muted">bis 18:30 Uhr</span>
          </ProgressRing>
        </div>

        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            Intervallfasten
          </span>
          <h2 className="font-display font-semibold text-2xl md:text-4xl leading-tight mt-3.5 mb-4 text-wrap-balance">
            Der Ring zählt. Du machst einfach weiter.
          </h2>
          <p className="text-text-muted font-light max-w-[46ch] mx-auto md:mx-0">
            16:8, 18:6, 20:4 oder eigenes Protokoll. Rückwirkend eintragen, wenn du es mal vergisst —
            und jederzeit ganz abschalten.
          </p>
          <div className="flex flex-col gap-2.5 mt-8">
            {PHASES.map((phase, i) => (
              <div
                key={phase.time}
                className={`flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-[13px] text-sm text-left transition-all duration-600 ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-x-0 ${
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3.5'
                }`}
                style={{ transitionDelay: visible ? `${260 + i * 130}ms` : '0ms' }}
              >
                <span className="font-mono text-[11px] text-basil min-w-[52px]">{phase.time}</span>
                <span>{phase.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
const STATS = [
  { value: 174, label: 'Rezepte' },
  { value: 681, label: 'Lebensmittel' },
  { value: 6, label: 'Ernährungsformen' },
  { value: 14, label: 'Tage kostenlos' },
]

export function LandingPage() {
  const [stuck, setStuck] = useState(false)
  const recentChangelog = getChangelogHistory().slice(0, 2)

  useScrollEffect(
    useCallback(() => {
      setStuck(window.scrollY > 10)
    }, []),
  )

  return (
    <div className="min-h-screen bg-bg text-text">
      <header
        className={`sticky top-0 z-50 bg-bg/85 backdrop-blur-xl border-b transition-colors duration-300 ${
          stuck ? 'border-border' : 'border-transparent'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <span className="font-display font-bold text-lg sm:text-xl shrink-0">
            Nelli<span className="text-primary">cious</span>
          </span>
          <div className="flex items-center gap-5 sm:gap-7 shrink-0">
            <a href="#funktionen" className="hidden md:inline text-sm text-text-muted hover:text-text transition-colors">
              Funktionen
            </a>
            <a href="#rezepte" className="hidden md:inline text-sm text-text-muted hover:text-text transition-colors">
              Rezepte
            </a>
            <a href="#preise" className="hidden md:inline text-sm text-text-muted hover:text-text transition-colors">
              Preise
            </a>
            <Link to="/anmelden" className="text-xs sm:text-sm text-text-muted hover:text-text whitespace-nowrap transition-colors">
              Anmelden
            </Link>
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2.5 hover:bg-primary-hover hover:-translate-y-px transition-all whitespace-nowrap"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 md:pt-24 pb-10 text-center overflow-hidden">
        <AmbientCanvas />
        <div className="relative z-[1] max-w-5xl mx-auto px-6 landing-stage">
          <span className="inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-basil bg-basil/10 rounded-full px-4 py-[7px]">
            🌱 Kostenlos in der Beta
          </span>
          <h1 className="font-display font-semibold text-[clamp(2.9rem,7.2vw,5.4rem)] leading-[1.06] tracking-tight max-w-[15ch] mx-auto mt-6 mb-5 text-wrap-balance">
            Ernährung, die sich <span className="text-primary">nach deinem Leben</span> richtet.
          </h1>
          <p className="text-lg md:text-xl text-text-muted font-light leading-relaxed max-w-[56ch] mx-auto">
            Kalorien und Makros tracken, aus 174 Rezepten planen und mit Intervallfasten den Überblick
            behalten — alles in einer ruhigen App statt zehn Tabs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-9">
            <Link
              to="/anmelden?mode=signup"
              className="bg-primary text-on-primary font-semibold text-base rounded-full px-8 py-4 hover:bg-primary-hover hover:-translate-y-px transition-all"
            >
              Kostenlos starten
            </Link>
            <a
              href="#funktionen"
              className="border border-border rounded-full px-8 py-4 font-semibold text-base hover:border-primary hover:text-primary transition-colors"
            >
              Funktionen ansehen
            </a>
          </div>
          <p className="text-xs text-text-muted mt-4">
            Keine Kreditkarte nötig · in 30 Sekunden startklar
          </p>
        </div>

        <div className="relative z-[1] mx-auto mt-16 w-[300px] landing-hero-device">
          <Phone>
            <ScreenBar title={<>Nelli<span className="text-primary">cious</span></>} meta="Mi., 19. August" />
            <div className="flex-1 p-3.5 flex flex-col gap-[9px] min-h-0">
              <span className="self-start font-mono text-[7.5px] text-honey bg-honey/15 rounded-full px-2.5 py-1">
                🔥 5 Tage in Folge geloggt
              </span>
              <div className="bg-surface-2 border border-border rounded-[13px] p-[11px] flex items-center gap-2.5">
                <ProgressRing size={52} stroke={7} radius={21} progress={0.64} color="var(--color-primary)" draw>
                  <span className="font-mono text-[8px] font-medium text-primary">64%</span>
                </ProgressRing>
                <div>
                  <div className="text-[9.5px] font-semibold">Tagesziel</div>
                  <div className="font-mono text-[11px] text-primary">1340 / 2100 kcal</div>
                </div>
              </div>
              <MacroGrid />
              <div className="bg-surface border border-border rounded-[13px] p-[11px]">
                <MealRow name="Overnight Oats mit Beeren" kcal="340" />
                <MealRow name="Linsen-Bowl mit Ofengemüse" kcal="480" />
                <MealRow name="Tom Kha Gai" kcal="420" last />
              </div>
              <div className="mt-auto bg-primary text-on-primary text-center text-[9px] font-semibold py-[9px] rounded-[9px]">
                Mahlzeit hinzufügen
              </div>
            </div>
            <TabBar active="Heute" />
          </Phone>
        </div>
      </section>

      {/* Kennzahlen */}
      <section className="border-y border-border bg-surface-2">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="block font-display font-semibold text-[clamp(2.2rem,4.2vw,3rem)] text-primary tracking-tight">
                <CountUp to={stat.value} />
              </span>
              <span className="text-[13px] text-text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <PinnedFeatures />
      <Statement />
      <RecipeRail />
      <FastingSection />

      {/* Neu in Nellicious */}
      <Reveal>
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="text-center md:text-left">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                Aktive Entwicklung
              </span>
              <h2 className="font-display font-semibold text-2xl md:text-4xl leading-tight mt-3.5 mb-4 text-wrap-balance">
                Läuft nie fertig — wird laufend besser.
              </h2>
              <p className="text-text-muted font-light leading-relaxed max-w-sm mx-auto md:mx-0">
                Jede Woche neue Rezepte, Funktionen und Verbesserungen. Was sich ändert, steht offen und
                mit Datum unter „Neu in Nellicious" — kein Changelog, den niemand liest.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {recentChangelog.map((entry) => (
                <div
                  key={entry.date}
                  className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2"
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-honey">
                    {dateFormatter.format(new Date(`${entry.date}T00:00:00`))}
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {entry.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Preise */}
      <Reveal>
        <section id="preise" className="py-20 md:py-32 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
              Preise
            </span>
            <h2 className="font-display font-semibold text-2xl md:text-4xl leading-tight mt-3.5 mb-4 max-w-[18ch] mx-auto text-wrap-balance">
              Kostenlos starten, upgraden wenn's passt.
            </h2>
            <p className="text-text-muted font-light max-w-[50ch] mx-auto mb-11">
              Alle Grundfunktionen sind dauerhaft kostenlos. Premium schaltet Wochenplanung über die
              aktuelle Woche hinaus und den Kochmodus frei — 14 Tage zum Ausprobieren, ohne
              Zahlungsdaten.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="bg-surface border border-border rounded-[18px] p-6 text-left">
                <h3 className="font-display font-semibold text-[15px] mb-2.5">Monatlich</h3>
                <span className="font-mono text-[26px] font-medium">3,99 €</span>{' '}
                <span className="text-[12.5px] text-text-muted">/ Monat</span>
                <p className="text-xs text-text-muted mt-2">jederzeit kündbar</p>
              </div>
              <div className="relative bg-surface border border-primary rounded-[18px] p-6 text-left">
                <span className="absolute -top-3 left-5 bg-primary text-on-primary font-mono text-[9.5px] uppercase tracking-wide rounded-full px-2.5 py-1">
                  2 Monate gratis
                </span>
                <h3 className="font-display font-semibold text-[15px] mb-2.5">Jährlich</h3>
                <span className="font-mono text-[26px] font-medium">39,99 €</span>{' '}
                <span className="text-[12.5px] text-text-muted">/ Jahr</span>
                <p className="text-xs text-text-muted mt-2">entspricht 3,33 € / Monat</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Abschluss */}
      <div className="max-w-5xl mx-auto px-6 pb-20 md:pb-28">
        <Reveal>
          <div className="bg-[#1c1310] text-[#f7f0e8] rounded-[30px] px-7 py-16 md:py-24 text-center flex flex-col items-center gap-5">
            <h2 className="font-display font-semibold text-2xl md:text-5xl leading-[1.08] max-w-[17ch] text-wrap-balance">
              Bereit für weniger Kopfzerbrechen beim Essen?
            </h2>
            <p className="text-[#f7f0e8]/60 font-light max-w-[44ch]">
              Kostenlos anmelden, ersten Tag loggen, in der ersten Woche schon den Rhythmus spüren.
            </p>
            <Link
              to="/anmelden?mode=signup"
              className="mt-2 bg-primary text-on-primary font-semibold text-base rounded-full px-8 py-4 hover:bg-primary-hover hover:-translate-y-px transition-all"
            >
              Kostenlos starten
            </Link>
          </div>
        </Reveal>
      </div>

      <footer className="border-t border-border py-7 pb-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <span className="font-display font-bold">
            Nelli<span className="text-primary">cious</span>
          </span>
          <div className="flex flex-wrap gap-5 text-sm text-text-muted">
            <Link to="/anmelden" className="hover:text-text transition-colors">
              Anmelden
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
