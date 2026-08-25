import { useTranslation } from 'react-i18next'
import { LegalPageLayout, Placeholder } from '../components/LegalPageLayout'

export function DatenschutzPage() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout title={t('legal.datenschutzTitle')}>
      <section>
        <h2>{t('datenschutz.s1Title')}</h2>
        <p>
          {t('datenschutz.s1P1')}
          <br />
          <Placeholder>Vorname Nachname</Placeholder>
          <br />
          <Placeholder>Straße Hausnummer, PLZ Ort</Placeholder>
          <br />
          {t('datenschutz.s1P1Email')} <Placeholder>kontakt@beispiel.de</Placeholder>
        </p>
        <p>
          {t('datenschutz.s1P2Before')} <Placeholder>{t('datenschutz.s1P2Placeholder')}</Placeholder>.
        </p>
      </section>

      <section>
        <h2>{t('datenschutz.s2Title')}</h2>
        <ul>
          <li>
            <strong>{t('datenschutz.s2Item1Strong')}</strong> {t('datenschutz.s2Item1')}
          </li>
          <li>
            <strong>{t('datenschutz.s2Item2Strong')}</strong> {t('datenschutz.s2Item2')}
          </li>
          <li>
            <strong>{t('datenschutz.s2Item3Strong')}</strong> {t('datenschutz.s2Item3Before')}{' '}
            <Placeholder>{t('datenschutz.s2Item3Placeholder')}</Placeholder> {t('datenschutz.s2Item3After')}
          </li>
          <li>
            <strong>{t('datenschutz.s2Item4Strong')}</strong> {t('datenschutz.s2Item4')}
          </li>
        </ul>
      </section>

      <section>
        <h2>{t('datenschutz.s3Title')}</h2>
        <ul>
          <li>{t('datenschutz.s3Item1')}</li>
          <li>{t('datenschutz.s3Item2')}</li>
          <li>{t('datenschutz.s3Item3')}</li>
          <li>{t('datenschutz.s3Item4')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('datenschutz.s4Title')}</h2>
        <p>
          {t('datenschutz.s4Part1Before')} <Placeholder>{t('datenschutz.s4Part1Placeholder')}</Placeholder>{' '}
          {t('datenschutz.s4Part1After')} <strong>Supabase</strong> (
          <Placeholder>{t('datenschutz.s4Part2Placeholder')}</Placeholder>) {t('datenschutz.s4Part2After')}{' '}
          <Placeholder>{t('datenschutz.s4Part3Placeholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('datenschutz.s5Title')}</h2>
        <p>
          {t('datenschutz.s5Before')} <Placeholder>{t('datenschutz.s5Placeholder')}</Placeholder>.
        </p>
      </section>

      <section>
        <h2>{t('datenschutz.s6Title')}</h2>
        <p>
          {t('datenschutz.s6Before')} <Placeholder>{t('datenschutz.s6Placeholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('datenschutz.s7Title')}</h2>
        <p>{t('datenschutz.s7Intro')}</p>
        <ul>
          <li>{t('datenschutz.s7Item1')}</li>
          <li>{t('datenschutz.s7Item2')}</li>
          <li>{t('datenschutz.s7Item3')}</li>
          <li>{t('datenschutz.s7Item4')}</li>
          <li>{t('datenschutz.s7Item5')}</li>
          <li>{t('datenschutz.s7Item6')}</li>
          <li>{t('datenschutz.s7Item7')}</li>
        </ul>
        <p>
          {t('datenschutz.s7AuthorityBefore')} <Placeholder>{t('datenschutz.s7AuthorityPlaceholder')}</Placeholder>
        </p>
      </section>

      <section>
        <h2>{t('datenschutz.s8Title')}</h2>
        <p>
          {t('datenschutz.s8Before')} <Placeholder>{t('datenschutz.s8Placeholder')}</Placeholder>
        </p>
      </section>
    </LegalPageLayout>
  )
}
