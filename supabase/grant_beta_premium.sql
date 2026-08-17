-- Schaltet Nellicious Premium für ausgewählte Nutzer frei, ohne dass sie
-- bezahlen — z. B. für Beta-Tester. Nur zur manuellen Ausführung im
-- Supabase Dashboard → SQL Editor gedacht, NICHT Teil der automatischen
-- Schema-Migration (schema.sql).
--
-- Funktioniert nur dort: Der protect_premium_fields-Trigger (siehe
-- schema.sql) setzt is_premium/premium_until/subscription_source bei jedem
-- Insert/Update über die normale App-Session (also über die REST-API mit
-- anon/authenticated-Rolle) automatisch zurück. Der SQL Editor läuft
-- dagegen als privilegierte Verbindung ohne diese Rolle im Request-Kontext,
-- deshalb greift der Trigger hier nicht und das Update wirkt tatsächlich.
--
-- ANLEITUNG:
-- 1. Unten in der ersten Abfrage die E-Mail-Adressen in der Liste durch die
--    echten Adressen der Beta-Tester ersetzen (eine pro Zeile, in
--    einfachen Anführungszeichen, durch Komma getrennt).
-- 2. Optional: Wenn der Zugang zeitlich befristet sein soll (z. B. nur für
--    die Dauer der Beta-Phase), die auskommentierte premium_until-Zeile
--    aktivieren und das Intervall anpassen (z. B. '60 days', '3 months').
--    Bleibt sie deaktiviert, gilt der Zugang unbefristet, bis er manuell
--    wieder entzogen wird.
-- 3. Die komplette Abfrage im SQL Editor ausführen.
-- 4. Mit der Kontroll-Abfrage ganz unten prüfen, dass genau die
--    gewünschten Nutzer jetzt is_premium = true haben.


-- 1) Premium freischalten -----------------------------------------------

update public.profiles
set
  is_premium = true
  -- , premium_until = now() + interval '60 days'
where id in (
  select id from auth.users where email in (
    'beta-tester-1@example.com',
    'beta-tester-2@example.com'
  )
);


-- 2) Premium wieder entziehen (bei Bedarf, gleiche E-Mail-Liste) --------

-- update public.profiles
-- set is_premium = false, premium_until = null
-- where id in (
--   select id from auth.users where email in (
--     'beta-tester-1@example.com',
--     'beta-tester-2@example.com'
--   )
-- );


-- 3) Kontrolle: aktuell freigeschaltete Nutzer anzeigen ------------------

select
  u.email,
  p.is_premium,
  p.premium_until,
  p.subscription_source
from public.profiles p
join auth.users u on u.id = p.id
where p.is_premium = true
order by u.email;
