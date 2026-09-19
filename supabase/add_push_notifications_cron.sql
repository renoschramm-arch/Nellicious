-- Zeitsteuerung für die send-reminders Edge Function: ruft sie alle 15
-- Minuten auf, damit fällige Erinnerungen (Wasser, Fasten-Ende, Mahlzeit,
-- Gewicht) zeitnah verschickt werden.
--
-- WICHTIG: Vor dem Ausführen zwei Platzhalter unten ersetzen:
--   1. <PROJEKT-REF> → deine Supabase-Projekt-Referenz (z. B. mjbjbtsygflaxkrpltuf)
--   2. <ANON-KEY>    → dein Anon-Key (Project Settings → API) — unkritisch,
--      der ist ohnehin im Browser-Bundle der App enthalten
--
-- Einmalig im Supabase Dashboard → SQL Editor ausführen.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Geheimer Header-Wert, den send-reminders zusätzlich zur normalen
-- JWT-Prüfung verlangt (siehe CRON_SECRET-Secret der Function) — in Vault
-- abgelegt statt im Klartext im Cron-Job, damit er nicht für jeden mit
-- Lesezugriff auf die Systemkataloge sichtbar ist.
select vault.create_secret(
  '08cd264e22874962a720732c3bd636355a2a79c3deeb3a2f0d26292d148c70c9',
  'cron_secret',
  'Shared Secret für den send-reminders Cron-Aufruf'
);

select cron.schedule(
  'send-reminders-every-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJEKT-REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON-KEY>',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
