import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function WiderrufPage() {
  return (
    <LegalPageLayout title="Widerrufsbelehrung">
      <section>
        <h2>Widerrufsrecht</h2>
        <p>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen den Vertrag über dein
          Nellicious-Abo zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
          Vertragsabschlusses.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns (
          <Placeholder>Vorname Nachname, Anschrift, E-Mail-Adresse</Placeholder>) mittels einer
          eindeutigen Erklärung (z. B. per E-Mail) über deinen Entschluss, diesen Vertrag zu
          widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular
          verwenden, das ist aber nicht vorgeschrieben.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
          Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
        </p>
      </section>

      <section>
        <h2>Folgen des Widerrufs</h2>
        <p>
          Wenn du diesen Vertrag widerrufst, erstatten wir dir alle Zahlungen, die wir von dir
          erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an
          dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung
          verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion
          eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart.
        </p>
      </section>

      <section>
        <h2>Vorzeitiges Erlöschen des Widerrufsrechts</h2>
        <p>
          Hast du im Bestellprozess ausdrücklich zugestimmt, dass wir mit der Ausführung des
          Vertrags (z. B. Freischaltung der Premium-Funktionen) bereits vor Ablauf der
          Widerrufsfrist beginnen, und dabei bestätigt, dass du dein Widerrufsrecht bei
          vollständiger Vertragserfüllung durch uns verlierst, erlischt dein Widerrufsrecht mit
          vollständiger Erbringung der Leistung. <Placeholder>(prüfen: passt die Formulierung im Bestellprozess dazu?)</Placeholder>
        </p>
      </section>

      <section>
        <h2>Muster-Widerrufsformular</h2>
        <p>
          (Wenn du den Vertrag widerrufen willst, fülle dieses Formular aus und sende es an uns
          zurück.)
        </p>
        <p>
          An <Placeholder>Vorname Nachname, Anschrift, E-Mail-Adresse</Placeholder>:
        </p>
        <p>
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über das
          Abonnement der digitalen Inhalte „Nellicious Premium"
          <br />
          Bestellt am (*) / erhalten am (*): <Placeholder>__________</Placeholder>
          <br />
          Name des/der Verbraucher(s): <Placeholder>__________</Placeholder>
          <br />
          Anschrift des/der Verbraucher(s): <Placeholder>__________</Placeholder>
          <br />
          Datum: <Placeholder>__________</Placeholder>
        </p>
        <p>(*) Unzutreffendes streichen.</p>
      </section>
    </LegalPageLayout>
  )
}
