import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function ImpressumPage() {
  return (
    <LegalPageLayout title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          <Placeholder>Vorname Nachname</Placeholder>
          <br />
          <Placeholder>Straße Hausnummer</Placeholder>
          <br />
          <Placeholder>PLZ Ort</Placeholder>
          <br />
          <Placeholder>Land</Placeholder>
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <Placeholder>kontakt@beispiel.de</Placeholder>
          <br />
          Telefon (optional): <Placeholder>+49 000 0000000</Placeholder>
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:{' '}
          <Placeholder>DE000000000 (falls vorhanden, sonst Abschnitt entfernen)</Placeholder>
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          <Placeholder>Vorname Nachname, Anschrift wie oben</Placeholder>
        </p>
      </section>

      <section>
        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse finden Sie oben unter „Kontakt".
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen. <Placeholder>(prüfen/anpassen)</Placeholder>
        </p>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter
          jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
          hinweisen.
        </p>
      </section>

      <section>
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält ggf. Links zu externen Webseiten Dritter, auf deren Inhalte wir
          keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
          übernehmen.
        </p>
      </section>

      <section>
        <h2>Urheberrecht</h2>
        <p>
          Die durch die Betreiber dieser App erstellten Inhalte und Werke unterliegen dem deutschen
          Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
        </p>
      </section>
    </LegalPageLayout>
  )
}
