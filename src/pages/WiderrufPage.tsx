import { useTranslation } from 'react-i18next'
import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function WiderrufPage() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout title={t('legal.widerrufTitle')}>
      <section>
        <h2>{t('widerruf.s1Title')}</h2>
        <p>{t('widerruf.s1P1')}</p>
        <p>
          {t('widerruf.s1P2Before')}
          <Placeholder>{t('widerruf.s1P2Placeholder')}</Placeholder>
          {t('widerruf.s1P2After')}
        </p>
        <p>{t('widerruf.s1P3')}</p>
      </section>

      <section>
        <h2>{t('widerruf.s2Title')}</h2>
        <p>{t('widerruf.s2Text')}</p>
      </section>

      <section>
        <h2>{t('widerruf.s3Title')}</h2>
        <p>
          {t('widerruf.s3Before')} <Placeholder>{t('widerruf.s3Placeholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('widerruf.s4Title')}</h2>
        <p>{t('widerruf.s4Intro')}</p>
        <p>
          {t('widerruf.s4To')} <Placeholder>Vorname Nachname, Anschrift, E-Mail-Adresse</Placeholder>:
        </p>
        <p>
          {t('widerruf.s4Body')}
          <br />
          {t('widerruf.s4OrderedOn')} <Placeholder>__________</Placeholder>
          <br />
          {t('widerruf.s4ConsumerName')} <Placeholder>__________</Placeholder>
          <br />
          {t('widerruf.s4ConsumerAddress')} <Placeholder>__________</Placeholder>
          <br />
          {t('widerruf.s4Date')} <Placeholder>__________</Placeholder>
        </p>
        <p>{t('widerruf.s4Footnote')}</p>
      </section>
    </LegalPageLayout>
  )
}
