import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function DatenschutzPage() {
  return (
    <LegalPageLayout title="Datenschutzerklärung">
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          <br />
          <Placeholder>Vorname Nachname</Placeholder>
          <br />
          <Placeholder>Straße Hausnummer, PLZ Ort</Placeholder>
          <br />
          E-Mail: <Placeholder>kontakt@beispiel.de</Placeholder>
        </p>
        <p>
          Ein Datenschutzbeauftragter ist{' '}
          <Placeholder>nicht bestellt / bestellt: Name, Kontakt (falls gesetzlich erforderlich)</Placeholder>.
        </p>
      </section>

      <section>
        <h2>2. Welche Daten wir verarbeiten</h2>
        <ul>
          <li>
            <strong>Kontodaten:</strong> E-Mail-Adresse und Passwort (verschlüsselt gespeichert) bei
            der Registrierung
          </li>
          <li>
            <strong>Ernährungs- und Gesundheitsdaten:</strong> von dir eingetragene Mahlzeiten,
            Kalorien-/Makroziele, Gewicht, Fastenzeiten, Ernährungsform und Unverträglichkeiten
          </li>
          <li>
            <strong>Zahlungsdaten:</strong> bei Abschluss eines kostenpflichtigen Abos verarbeitet
            unser Zahlungsdienstleister <Placeholder>Name des Zahlungsdienstleisters</Placeholder>{' '}
            deine Zahlungsdaten; uns liegen nur Vertragsstatus und Zeitraum vor
          </li>
          <li>
            <strong>Nutzungsdaten:</strong> technische Daten beim Aufruf der App (z. B. IP-Adresse,
            Zeitpunkt des Zugriffs) durch das Hosting
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li>
            Bereitstellung der App und ihrer Funktionen (Vertragserfüllung, Art. 6 Abs. 1 lit. b
            DSGVO)
          </li>
          <li>Abwicklung kostenpflichtiger Abos (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li>
            Sicherheit und Missbrauchsvermeidung, z. B. automatisches Löschen unbestätigter Konten
            (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO)
          </li>
          <li>Erfüllung rechtlicher Pflichten, z. B. steuerrechtliche Aufbewahrung (Art. 6 Abs. 1 lit. c DSGVO)</li>
        </ul>
      </section>

      <section>
        <h2>4. Hosting und Auftragsverarbeiter</h2>
        <p>
          Die App wird über <Placeholder>GitHub Pages / Hosting-Anbieter</Placeholder> ausgeliefert.
          Konten- und Nutzungsdaten werden bei unserem Datenbank- und Authentifizierungs-Dienstleister{' '}
          <strong>Supabase</strong> (
          <Placeholder>Supabase Inc., Serverstandort/Region prüfen und eintragen</Placeholder>)
          gespeichert und verarbeitet. Mit allen Auftragsverarbeitern besteht ein
          Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.{' '}
          <Placeholder>
            Falls Server außerhalb der EU/des EWR liegen: Angaben zu Drittlandtransfer und
            Garantien (z. B. Standardvertragsklauseln) ergänzen.
          </Placeholder>
        </p>
      </section>

      <section>
        <h2>5. Speicherdauer</h2>
        <p>
          Kontodaten speichern wir, solange dein Konto besteht. Unbestätigte Registrierungen löschen
          wir automatisch nach 24 Stunden. Nach Löschung deines Kontos werden deine Daten{' '}
          <Placeholder>innerhalb von … Tagen vollständig gelöscht, soweit keine gesetzliche
          Aufbewahrungspflicht entgegensteht</Placeholder>.
        </p>
      </section>

      <section>
        <h2>6. Cookies und lokale Speicherung</h2>
        <p>
          Die App verwendet technisch notwendige Speicherung im Browser (z. B. um deine Anmeldung
          aufrechtzuerhalten und Einstellungen zu merken), keine Tracking- oder Marketing-Cookies.{' '}
          <Placeholder>(anpassen, falls sich das ändert, z. B. durch Analyse-Tools)</Placeholder>
        </p>
      </section>

      <section>
        <h2>7. Deine Rechte</h2>
        <p>Du hast das Recht auf:</p>
        <ul>
          <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
        </ul>
        <p>
          Zuständige Aufsichtsbehörde: <Placeholder>Landesdatenschutzbehörde am Unternehmenssitz eintragen</Placeholder>
        </p>
      </section>

      <section>
        <h2>8. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, sobald sich die Datenverarbeitung ändert. Stand:{' '}
          <Placeholder>Datum</Placeholder>
        </p>
      </section>
    </LegalPageLayout>
  )
}
