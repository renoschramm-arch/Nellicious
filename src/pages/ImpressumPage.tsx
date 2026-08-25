import { useTranslation } from 'react-i18next'
import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function ImpressumPage() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout title={t('legal.impressumTitle')}>
      <section>
        <h2>{t('impressum.s1Title')}</h2>
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
        <h2>{t('impressum.s2Title')}</h2>
        <p>
          {t('impressum.s2Email')} <Placeholder>kontakt@beispiel.de</Placeholder>
          <br />
          {t('impressum.s2Phone')} <Placeholder>+49 000 0000000</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('impressum.s3Title')}</h2>
        <p>
          {t('impressum.s3Before')} <Placeholder>{t('impressum.s3Placeholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('impressum.s4Title')}</h2>
        <p>
          <Placeholder>{t('impressum.s4Placeholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('impressum.s5Title')}</h2>
        <p>
          {t('impressum.s5Before')}{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>
          {t('impressum.s5After')}
        </p>
        <p>
          {t('impressum.s5Note')} <Placeholder>{t('impressum.s5NotePlaceholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('impressum.s6Title')}</h2>
        <p>{t('impressum.s6Text')}</p>
      </section>

      <section>
        <h2>{t('impressum.s7Title')}</h2>
        <p>{t('impressum.s7Text')}</p>
      </section>

      <section>
        <h2>{t('impressum.s8Title')}</h2>
        <p>{t('impressum.s8Text')}</p>
      </section>
    </LegalPageLayout>
  )
}
