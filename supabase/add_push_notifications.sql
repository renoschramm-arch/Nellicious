-- Push-Erinnerungen: Wasser trinken, Fasten-Fenster endet bald, Mahlzeit
-- eintragen, Gewicht eintragen. Nutzer wählen selbst, welche sie bekommen
-- möchten (siehe Mehr → Benachrichtigungen).
--
-- Einmalig im Supabase Dashboard → SQL Editor ausführen.


-- 1) Präferenzen + Zeitzone am Profil -----------------------------------

alter table public.profiles
  add column if not exists notify_water boolean not null default true,
  add column if not exists notify_fasting_end boolean not null default true,
  add column if not exists notify_meal boolean not null default true,
  add column if not exists notify_weight boolean not null default true,
  add column if not exists timezone text not null default 'Europe/Berlin';


-- 2) Push-Subscriptions (vom Browser, pro Gerät) ----------------------------

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Nutzer sehen eigene Push-Subscriptions" on public.push_subscriptions;
create policy "Nutzer sehen eigene Push-Subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Nutzer legen eigene Push-Subscriptions an" on public.push_subscriptions;
create policy "Nutzer legen eigene Push-Subscriptions an"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer aktualisieren eigene Push-Subscriptions" on public.push_subscriptions;
create policy "Nutzer aktualisieren eigene Push-Subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer löschen eigene Push-Subscriptions" on public.push_subscriptions;
create policy "Nutzer löschen eigene Push-Subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);


-- 3) Merker, wann welche Erinnerung zuletzt verschickt wurde ----------------
-- Nur von der send-reminders-Function (Service-Role) verwendet — bewusst
-- ohne Policies, RLS ist aktiv, also für alle anderen Rollen gesperrt.

create table if not exists public.notification_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  last_sent_at timestamptz not null default now(),
  context text,
  primary key (user_id, kind)
);

alter table public.notification_state enable row level security;
