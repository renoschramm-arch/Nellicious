-- Löscht automatisch Konten, deren E-Mail-Adresse nach 24 Stunden noch
-- nicht bestätigt wurde. Läuft als wiederkehrender Job direkt in der
-- Datenbank (pg_cron) — einmalig hier ausführen, danach läuft die
-- Bereinigung von allein, ohne dass etwas in der App dafür nötig ist.
--
-- Direktes Löschen aus auth.users ist bei Supabase der übliche Weg dafür.
-- Alle abhängigen Zeilen (profiles, recipes, ...) sind per
-- "on delete cascade" mit auth.users verknüpft (siehe schema.sql) und
-- werden automatisch mitgelöscht — ein unbestätigtes Konto hinterlässt so
-- keine Reste.
--
-- ANLEITUNG:
-- 1. Den kompletten Block unten im Supabase Dashboard → SQL Editor
--    ausführen (einmalig).
-- 2. Der Job läuft danach automatisch jede volle Stunde und prüft, welche
--    unbestätigten Konten älter als 24 Stunden sind.
-- 3. Mit der Kontroll-Abfrage ganz unten prüfen, dass der Job eingetragen
--    und aktiv ist.


-- 1) pg_cron aktivieren (falls noch nicht geschehen) ----------------------

create extension if not exists pg_cron with schema extensions;


-- 2) Wiederkehrenden Job einrichten (idempotent: alten Job gleichen Namens
--    zuerst entfernen, damit dieses Skript mehrfach ausführbar bleibt) ----

select cron.unschedule(jobid)
from cron.job
where jobname = 'delete-unconfirmed-signups';

select cron.schedule(
  'delete-unconfirmed-signups',
  '0 * * * *', -- jede volle Stunde
  $$
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '24 hours';
  $$
);


-- 3) Kontrolle: eingetragenen Job anzeigen ---------------------------------

select jobname, schedule, active
from cron.job
where jobname = 'delete-unconfirmed-signups';


-- Optional zum Testen: zeigt nur an, wen der Job aktuell löschen würde,
-- löscht aber nichts (zum Ausprobieren separat markieren und ausführen) --

-- select id, email, created_at
-- from auth.users
-- where email_confirmed_at is null
--   and created_at < now() - interval '24 hours';
