const PAYPAL_URL = 'https://paypal.me/renoschramm'

export function SupportModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-display font-semibold text-lg">Bevor du weitergehst 💛</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <p className="text-sm text-text-muted leading-relaxed">
            Nellicious entsteht in unzähligen Abendstunden — jede neue Funktion, jedes kleine Detail
            wird mit echtem Herzblut gebaut, getestet und immer weiter verfeinert. Kalorien-Tracking,
            Rezeptsuche mit Barcode-Scanner, Wochenplaner, Kochmodus und mehr: Vergleichbare Apps mit
            diesem Funktionsumfang verlangen meist ein Abo von mehreren Euro im Monat.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Nellicious ist komplett kostenlos — und das soll auch so bleiben. Wenn dir die App etwas
            wert ist, freue ich mich riesig über eine kleine Unterstützung. Sie fließt direkt in Zeit
            für neue Funktionen. Und falls gerade nicht: Auch dann danke ich dir von Herzen, dass du
            Nellicious nutzt. ❤️
          </p>

          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-3 text-sm shadow-sm hover:border-[#009cde] transition-colors"
          >
            <span className="text-[#16110d]">🧡 Weiter zu</span>
            <span className="font-sans italic tracking-tight text-base">
              <span className="font-bold text-[#003087]">Pay</span>
              <span className="font-bold text-[#009cde]">Pal</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
