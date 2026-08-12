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


-- Abgehakt-/Erledigt-Status einzelner Einkaufslisten-Zutaten. An den konkreten
-- Planeintrag gebunden (nicht an eine Kalenderwoche) — ein Rezept, das erneut
-- für einen weiteren Tag eingeplant wird, erzeugt einen neuen meal_plan_entries-
-- Eintrag und taucht damit automatisch wieder unerledigt in der Liste auf.
create table if not exists public.shopping_list_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.meal_plan_entries (id) on delete cascade,
  ingredient_index integer not null,
  checked boolean not null default false,
  dismissed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, entry_id, ingredient_index)
);

alter table public.shopping_list_status enable row level security;

create policy "Nutzer sehen ihren eigenen Einkaufslisten-Status"
  on public.shopping_list_status for select
  using (auth.uid() = user_id);

create policy "Nutzer legen eigenen Einkaufslisten-Status an"
  on public.shopping_list_status for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeiten eigenen Einkaufslisten-Status"
  on public.shopping_list_status for update
  using (auth.uid() = user_id);

create policy "Nutzer löschen eigenen Einkaufslisten-Status"
  on public.shopping_list_status for delete
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


-- Weitere Beispielrezepte (owner_id NULL = global sichtbar).
-- Dieser Block ist idempotent (per Titel-Check) und kann im bestehenden
-- Supabase-Projekt einmalig separat im SQL-Editor nachgeführt werden.
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions
from (
  values
    (
      'Quinoa-Salat mit Feta und Granatapfel',
      'Frischer, proteinreicher Salat mit fruchtiger Säure und Kräutern.',
      420, 14, 48, 18,
      array['150 g Quinoa', '100 g Feta', '1 Granatapfel', '1 Salatgurke', '2 EL Olivenöl', 'Saft 1 Zitrone', 'Minze']::text[],
      'Quinoa nach Packungsangabe kochen und abkühlen lassen. Gurke würfeln, Granatapfelkerne auslösen, Feta zerbröseln. Alles vermengen, mit Olivenöl, Zitronensaft und Minze abschmecken.'
    ),
    (
      'Gebackener Lachs mit Brokkoli',
      'Omega-3-reiches Ofengericht, in 20 Minuten fertig.',
      460, 38, 12, 28,
      array['150 g Lachsfilet', '200 g Brokkoli', '1 EL Olivenöl', '1 Knoblauchzehe', 'Zitrone', 'Salz, Pfeffer']::text[],
      'Ofen auf 200°C vorheizen. Lachs und Brokkoliröschen mit Öl, gehacktem Knoblauch, Salz und Pfeffer würzen, 15–18 Minuten backen. Mit Zitrone servieren.'
    ),
    (
      'Griechischer Joghurt mit Nüssen und Honig',
      'Proteinreicher Snack oder Frühstück, in 2 Minuten fertig.',
      280, 18, 24, 12,
      array['200 g griechischer Joghurt', '20 g gemischte Nüsse', '1 TL Honig', 'Zimt']::text[],
      'Joghurt in eine Schale geben, mit gehackten Nüssen, Honig und einer Prise Zimt toppen.'
    ),
    (
      'Gemüse-Omelett mit Spinat und Tomaten',
      'Herzhaftes Low-Carb-Frühstück mit viel Protein.',
      340, 24, 8, 22,
      array['3 Eier', '50 g Spinat', '1 Tomate', '30 g Feta', '1 TL Olivenöl', 'Salz, Pfeffer']::text[],
      'Eier verquirlen und würzen. Spinat und Tomatenwürfel in Öl kurz andünsten, Eier dazugeben, stocken lassen, mit Feta bestreuen und zusammenklappen.'
    ),
    (
      'Buddha Bowl mit Süßkartoffel und Tahini-Dressing',
      'Bunte, ballaststoffreiche Bowl mit cremigem Sesam-Dressing.',
      520, 16, 64, 22,
      array['1 Süßkartoffel', '100 g Kichererbsen (Dose)', '60 g Grünkohl', '1 EL Tahini', 'Saft 1/2 Zitrone', '1 EL Olivenöl']::text[],
      'Süßkartoffel würfeln und mit Kichererbsen 20 Minuten bei 200°C rösten. Grünkohl kurz massieren. Alles in einer Bowl anrichten, Tahini mit Zitronensaft und etwas Wasser glattrühren und darüber geben.'
    ),
    (
      'Vollkornnudeln mit Pesto und Kirschtomaten',
      'Schnelle Vollkorn-Pasta mit frischen Tomaten und Parmesan.',
      490, 16, 68, 16,
      array['100 g Vollkornnudeln', '3 EL Pesto', '150 g Kirschtomaten', '20 g Parmesan', 'Basilikum']::text[],
      'Nudeln nach Packungsangabe kochen. Kirschtomaten halbieren, mit den abgetropften Nudeln und Pesto vermengen, mit Parmesan und Basilikum servieren.'
    ),
    (
      'Overnight Oats mit Chiasamen und Mango',
      'Vorbereitbares Frühstück mit Ballaststoffen und Omega-3.',
      350, 12, 58, 8,
      array['50 g Haferflocken', '1 EL Chiasamen', '200 ml Pflanzendrink', '1/2 Mango', '1 TL Ahornsirup']::text[],
      'Haferflocken, Chiasamen, Pflanzendrink und Ahornsirup vermischen, über Nacht im Kühlschrank quellen lassen. Am Morgen mit Mangowürfeln toppen.'
    ),
    (
      'Gebratenes Hähnchen mit Ofengemüse',
      'Klassisches proteinreiches Abendessen mit buntem Gemüse.',
      510, 42, 30, 22,
      array['150 g Hähnchenbrust', '1 Zucchini', '1 Paprika', '1 rote Zwiebel', '1 EL Olivenöl', 'Kräuter der Provence']::text[],
      'Gemüse würfeln, mit Öl und Kräutern vermengen, 20 Minuten bei 200°C rösten. Hähnchenbrust würzen und in der Pfanne rundherum goldbraun braten, in Streifen zum Gemüse servieren.'
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);
