-- Nellicious — Supabase-Schema
-- Im Supabase SQL-Editor des Projekts ausführen (Dashboard → SQL Editor → New query).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  daily_kcal_goal integer not null default 2000,
  daily_protein_goal integer not null default 120,
  daily_carbs_goal integer not null default 220,
  daily_fat_goal integer not null default 70,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Nutzer sehen ihr eigenes Profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Nutzer legen ihr eigenes Profil an"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Nutzer bearbeiten ihr eigenes Profil"
  on public.profiles for update
  using (auth.uid() = id);


create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  kcal integer not null,
  protein_g integer not null default 0,
  carbs_g integer not null default 0,
  fat_g integer not null default 0,
  ingredients text[] not null default '{}',
  instructions text not null default '',
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

-- owner_id ist NULL für globale Beispielrezepte (für alle sichtbar).
create policy "Rezepte sind für alle angemeldeten Nutzer sichtbar"
  on public.recipes for select
  using (auth.role() = 'authenticated');

create policy "Nutzer legen eigene Rezepte an"
  on public.recipes for insert
  with check (auth.uid() = owner_id);

create policy "Nutzer bearbeiten eigene Rezepte"
  on public.recipes for update
  using (auth.uid() = owner_id);

create policy "Nutzer löschen eigene Rezepte"
  on public.recipes for delete
  using (auth.uid() = owner_id);


create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete set null,
  name text not null,
  kcal integer not null,
  protein_g integer not null default 0,
  carbs_g integer not null default 0,
  fat_g integer not null default 0,
  logged_at timestamptz not null default now()
);

alter table public.meal_logs enable row level security;

create policy "Nutzer sehen ihre eigenen Einträge"
  on public.meal_logs for select
  using (auth.uid() = user_id);

create policy "Nutzer legen eigene Einträge an"
  on public.meal_logs for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeiten eigene Einträge"
  on public.meal_logs for update
  using (auth.uid() = user_id);

create policy "Nutzer löschen eigene Einträge"
  on public.meal_logs for delete
  using (auth.uid() = user_id);


create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  meal_slot text not null check (meal_slot in ('fruehstueck', 'mittag', 'abend', 'snack')),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date, meal_slot)
);

alter table public.meal_plan_entries enable row level security;

create policy "Nutzer sehen ihre eigenen Planeinträge"
  on public.meal_plan_entries for select
  using (auth.uid() = user_id);

create policy "Nutzer legen eigene Planeinträge an"
  on public.meal_plan_entries for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeiten eigene Planeinträge"
  on public.meal_plan_entries for update
  using (auth.uid() = user_id);

create policy "Nutzer löschen eigene Planeinträge"
  on public.meal_plan_entries for delete
  using (auth.uid() = user_id);


-- Ein paar Beispielrezepte zum Start (owner_id NULL = global sichtbar).
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions)
values
  (
    'Linsen-Bowl mit Ofengemüse',
    'Herzhafte, proteinreiche Bowl mit gerösteten Süßkartoffeln und Paprika.',
    540, 24, 62, 18,
    array['150 g rote Linsen', '1 Süßkartoffel', '1 rote Paprika', '1 EL Olivenöl', 'Kreuzkümmel, Salz, Pfeffer'],
    'Linsen nach Packungsangabe kochen. Süßkartoffel und Paprika würfeln, mit Öl und Gewürzen 20 Minuten bei 200°C rösten. Alles zusammen anrichten.'
  ),
  (
    'Haferflocken mit Beeren',
    'Schnelles, ballaststoffreiches Frühstück mit frischen Beeren.',
    320, 11, 52, 8,
    array['60 g Haferflocken', '200 ml Milch oder Pflanzendrink', '100 g gemischte Beeren', '1 TL Honig'],
    'Haferflocken mit der Milch aufkochen, 3–4 Minuten quellen lassen, mit Beeren und Honig servieren.'
  ),
  (
    'Apfel mit Mandelmus',
    'Einfacher, sättigender Snack für zwischendurch.',
    210, 5, 22, 12,
    array['1 Apfel', '1 EL Mandelmus'],
    'Apfel in Spalten schneiden und mit Mandelmus servieren.'
  ),
  (
    'Kichererbsen-Curry',
    'Würziges Curry mit Kokosmilch, schnell gemacht und gut vorzubereiten.',
    480, 18, 48, 22,
    array['400 g Kichererbsen (Dose)', '200 ml Kokosmilch', '1 Zwiebel', '2 TL Currypulver', '1 Handvoll Spinat'],
    'Zwiebel andünsten, Currypulver kurz mitrösten, Kichererbsen und Kokosmilch zugeben, 10 Minuten köcheln, Spinat unterrühren.'
  )
on conflict do nothing;
