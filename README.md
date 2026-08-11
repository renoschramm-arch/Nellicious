# Nellicious

Ernährungs-App für gesunde Mahlzeiten, Rezepte und Tages-Tracking. Begleiter-App zur Fasten-App Marlenia.

React + TypeScript + Vite + Tailwind CSS, Backend über Supabase (Postgres + Auth), Hosting über GitHub Pages.

## Lokal starten

```bash
npm install
cp .env.example .env   # Werte aus deinem Supabase-Projekt eintragen
npm run dev
```

## Supabase-Projekt einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im SQL-Editor des Projekts den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) ausführen — legt Tabellen (`profiles`, `recipes`, `meal_logs`), Row-Level-Security-Policies und ein paar Beispielrezepte an.
3. Unter **Project Settings → API** die `Project URL` und den `anon public`-Key kopieren und in `.env` eintragen (siehe `.env.example`).
4. E-Mail-Bestätigung für neue Konten kann unter **Authentication → Providers → Email** je nach Bedarf an- oder ausgeschaltet werden.

## Deployment (GitHub Pages)

Der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) baut die App bei jedem Push auf `main` und deployed sie auf GitHub Pages.

Einmalig einrichten:

1. **Repo Settings → Pages → Source** auf `GitHub Actions` stellen.
2. **Repo Settings → Secrets and variables → Actions** zwei Secrets anlegen: `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` (gleiche Werte wie in `.env`).
3. Nach dem nächsten Push auf `main` ist die App unter `https://<username>.github.io/Nellicious/` erreichbar.

## Stand & nächste Schritte

Umgesetzt: Anmeldung/Registrierung, Tages-Tracking (Mahlzeiten erfassen, kcal/Makros im Blick), Rezepte durchsuchen & als Mahlzeit loggen, Profil mit individuellen Tageszielen.

Noch offen: Wochenplanung mit Einkaufsliste — bewusst nicht mit angefangen, folgt als eigener Schritt.

## Design

Farb- und Typografiekonzept ("Paprika & Basilikum") ist in `src/index.css` als CSS-Variablen hinterlegt, inkl. Light/Dark Mode. Schriften: Domine (Überschriften), Work Sans (Fließtext/UI), IBM Plex Mono (Zahlen/Nährwerte), selbst gehostet unter `public/fonts`.
