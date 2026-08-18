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
  meal_type text not null default 'mittag' check (meal_type in ('fruehstueck', 'mittag', 'abend', 'snack')),
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
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

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


-- Noch mehr Beispielrezepte (owner_id NULL = global sichtbar).
-- Wie oben: idempotent per Titel-Check, kann separat im SQL-Editor nachgeführt werden.
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions
from (
  values
    (
      'Shakshuka mit Paprika und Feta',
      'Pochierte Eier in würziger Tomatensauce, direkt aus der Pfanne.',
      380, 20, 22, 24,
      array['2 Eier', '1 rote Paprika', '200 g gehackte Tomaten', '1 Zwiebel', '30 g Feta', '1 TL Paprikapulver', '1 EL Olivenöl']::text[],
      'Zwiebel und Paprika in Öl andünsten, gehackte Tomaten und Paprikapulver zugeben, 10 Minuten köcheln. Mulden formen, Eier hineingeben und stocken lassen, mit Feta bestreuen.'
    ),
    (
      'Thunfisch-Salat mit weißen Bohnen',
      'Proteinreicher Salat ohne Kochen, in 10 Minuten fertig.',
      420, 32, 30, 16,
      array['1 Dose Thunfisch (im eigenen Saft)', '1 Dose weiße Bohnen', '1/2 rote Zwiebel', 'Kirschtomaten', '1 EL Olivenöl', 'Zitronensaft']::text[],
      'Bohnen abspülen, mit abgetropftem Thunfisch, gewürfelter Zwiebel und halbierten Kirschtomaten vermengen. Mit Öl und Zitronensaft abschmecken.'
    ),
    (
      'Gemüse-Wok mit Tofu und Cashewkernen',
      'Schnelles, knackiges Wok-Gericht mit asiatischen Aromen.',
      460, 22, 38, 24,
      array['150 g Tofu', '200 g gemischtes Wokgemüse', '20 g Cashewkerne', '2 EL Sojasauce', '1 EL Sesamöl', 'Ingwer']::text[],
      'Tofu würfeln und in Sesamöl anbraten, Gemüse und Ingwer zugeben, kurz mitbraten. Mit Sojasauce ablöschen, Cashewkerne unterheben.'
    ),
    (
      'Vollkorn-Pfannkuchen mit Beeren',
      'Ballaststoffreiches Frühstück, das auch Kindern schmeckt.',
      360, 14, 50, 10,
      array['80 g Vollkornmehl', '1 Ei', '150 ml Milch', '100 g gemischte Beeren', '1 TL Honig']::text[],
      'Aus Mehl, Ei und Milch einen Teig rühren, in einer Pfanne kleine Pfannkuchen backen. Mit Beeren und Honig servieren.'
    ),
    (
      'Kürbissuppe mit Ingwer',
      'Cremige, wärmende Suppe mit feiner Schärfe.',
      260, 6, 32, 10,
      array['400 g Hokkaido-Kürbis', '1 Zwiebel', '1 Stück Ingwer', '400 ml Gemüsebrühe', '100 ml Kokosmilch']::text[],
      'Zwiebel und Ingwer andünsten, Kürbiswürfel zugeben, mit Brühe ablöschen und 15 Minuten köcheln. Pürieren, Kokosmilch unterrühren.'
    ),
    (
      'Falafel-Wrap mit Joghurt-Dip',
      'Handlicher, pflanzlicher Wrap für unterwegs.',
      480, 18, 56, 20,
      array['6 Falafel (Kichererbsen)', '1 Vollkorn-Wrap', 'Salat', 'Tomate', 'Gurke', '3 EL Joghurt', 'Zitronensaft']::text[],
      'Falafel braten oder backen. Wrap mit Salat, Tomate, Gurke und Falafel füllen. Joghurt mit Zitronensaft verrühren und darüber geben, einrollen.'
    ),
    (
      'Gebackene Süßkartoffel mit Hüttenkäse',
      'Einfaches, sättigendes Gericht mit viel Protein.',
      340, 18, 46, 8,
      array['1 große Süßkartoffel', '100 g Hüttenkäse', 'Frühlingszwiebel', 'Paprikapulver']::text[],
      'Süßkartoffel 45 Minuten bei 200°C backen, halbieren, mit Hüttenkäse füllen und mit Frühlingszwiebel und Paprikapulver toppen.'
    ),
    (
      'Protein-Smoothie mit Spinat und Banane',
      'Schneller Smoothie für vor oder nach dem Sport.',
      300, 20, 40, 6,
      array['1 Banane', '50 g Spinat', '200 ml Pflanzendrink', '1 Scoop Proteinpulver', 'Eiswürfel']::text[],
      'Alle Zutaten im Mixer glatt pürieren.'
    ),
    (
      'Rote-Bete-Salat mit Ziegenkäse und Walnüssen',
      'Erdig-süßer Salat mit cremigem Käse und Crunch.',
      380, 12, 26, 26,
      array['200 g gekochte Rote Bete', '60 g Ziegenkäse', '20 g Walnüsse', 'Rucola', '1 EL Olivenöl', 'Balsamico']::text[],
      'Rote Bete würfeln, mit Rucola auf einem Teller anrichten, Ziegenkäse und Walnüsse darüber bröseln, mit Öl und Balsamico beträufeln.'
    ),
    (
      'Gemüsecurry mit Tofu und Jasminreis',
      'Mildes, sättigendes Curry mit Kokosmilch.',
      520, 20, 64, 20,
      array['150 g Tofu', '200 g gemischtes Gemüse', '200 ml Kokosmilch', '2 TL Currypaste', '60 g Jasminreis']::text[],
      'Reis kochen. Tofu anbraten, Currypaste kurz mitrösten, Gemüse und Kokosmilch zugeben, 10 Minuten köcheln. Mit Reis servieren.'
    ),
    (
      'Putengeschnetzeltes mit Champignons',
      'Klassiker mit magerem Fleisch und cremiger Sauce.',
      420, 40, 14, 20,
      array['200 g Putenbrust', '150 g Champignons', '1 Zwiebel', '100 ml Sahne', '1 EL Öl']::text[],
      'Pute in Streifen anbraten, herausnehmen. Zwiebel und Champignons anbraten, mit Sahne ablöschen, Pute wieder zugeben und kurz köcheln.'
    ),
    (
      'Caprese-Salat mit Vollkornbaguette',
      'Italienischer Klassiker, in 5 Minuten angerichtet.',
      400, 16, 34, 22,
      array['150 g Tomaten', '125 g Mozzarella', 'Basilikum', '1 EL Olivenöl', '1 Scheibe Vollkornbaguette']::text[],
      'Tomaten und Mozzarella in Scheiben schneiden, abwechselnd anrichten, mit Basilikum und Öl beträufeln. Mit Baguette servieren.'
    ),
    (
      'Miso-Suppe mit Tofu und Wakame',
      'Leichte, umamireiche Suppe als Beilage oder Snack.',
      180, 10, 12, 8,
      array['2 EL Miso-Paste', '100 g Tofu', '1 EL getrocknete Wakame-Algen', 'Frühlingszwiebel', '500 ml Wasser']::text[],
      'Wasser erhitzen (nicht kochen), Miso-Paste einrühren. Tofuwürfel und Wakame zugeben, mit Frühlingszwiebel servieren.'
    ),
    (
      'Gebackene Forelle mit Zitrone und Kräutern',
      'Leichtes Fischgericht mit wenig Aufwand.',
      400, 36, 4, 24,
      array['1 Forelle (ausgenommen)', '1 Zitrone', 'Dill', 'Petersilie', '1 EL Olivenöl', 'Salz, Pfeffer']::text[],
      'Forelle mit Kräutern und Zitronenscheiben füllen, würzen, mit Öl beträufeln, 20 Minuten bei 200°C backen.'
    ),
    (
      'Bohnen-Chili sin Carne',
      'Herzhaftes, vegetarisches Chili zum Vorkochen.',
      440, 20, 60, 12,
      array['1 Dose Kidneybohnen', '1 Dose Mais', '400 g gehackte Tomaten', '1 Paprika', '1 Zwiebel', 'Chilipulver', 'Kreuzkümmel']::text[],
      'Zwiebel und Paprika andünsten, Gewürze mitrösten, Tomaten, Bohnen und Mais zugeben, 20 Minuten köcheln lassen.'
    ),
    (
      'Couscous-Salat mit Kichererbsen und Minze',
      'Frischer Salat für Meal-Prep, hält sich gut im Kühlschrank.',
      400, 14, 60, 12,
      array['120 g Couscous', '1 Dose Kichererbsen', '1 Gurke', 'Minze', 'Petersilie', 'Zitronensaft', '2 EL Olivenöl']::text[],
      'Couscous mit heißem Wasser übergießen, quellen lassen. Mit Kichererbsen, gewürfelter Gurke und Kräutern vermengen, mit Zitronensaft und Öl abschmecken.'
    ),
    (
      'Avocado-Toast mit pochiertem Ei',
      'Beliebter Frühstücks-Klassiker mit gesunden Fetten.',
      380, 16, 30, 22,
      array['2 Scheiben Vollkornbrot', '1 Avocado', '1 Ei', 'Chiliflocken', 'Zitronensaft', 'Salz']::text[],
      'Brot toasten, Avocado zerdrücken und mit Zitronensaft und Salz würzen, auf dem Toast verteilen. Ei pochieren und daraufsetzen, mit Chiliflocken bestreuen.'
    ),
    (
      'Gemüsespieße vom Grill mit Tzatziki',
      'Leichtes Grillgericht, auch in der Pfanne möglich.',
      320, 10, 24, 20,
      array['Zucchini', 'Paprika', 'rote Zwiebel', 'Champignons', '100 g Tzatziki', '1 EL Olivenöl']::text[],
      'Gemüse würfeln, auf Spieße stecken, mit Öl bestreichen und grillen oder braten. Mit Tzatziki servieren.'
    ),
    (
      'Rührei mit Vollkornbrot und Avocado',
      'Proteinreiches Frühstück mit gesunden Fetten.',
      420, 22, 26, 26,
      array['3 Eier', '1 Scheibe Vollkornbrot', '1/2 Avocado', '1 EL Butter', 'Schnittlauch']::text[],
      'Eier verquirlen, in Butter unter Rühren stocken lassen. Mit Vollkornbrot und Avocadoscheiben servieren, mit Schnittlauch bestreuen.'
    ),
    (
      'Zucchini-Nudeln mit Garnelen',
      'Leichtes Low-Carb-Gericht mit viel Protein.',
      340, 32, 12, 18,
      array['2 Zucchini', '150 g Garnelen', '1 Knoblauchzehe', 'Kirschtomaten', '1 EL Olivenöl', 'Chiliflocken']::text[],
      'Zucchini spiralisieren. Garnelen und Knoblauch in Öl anbraten, Kirschtomaten zugeben, Zucchininudeln kurz mitschwenken, mit Chiliflocken servieren.'
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);


-- Weitere Migrationen für bereits bestehende Supabase-Projekte -------------
-- (bei einem frischen Projekt bereits durch die create table/policy oben
-- abgedeckt; hier idempotent nachgeführt, damit dieser Block gefahrlos
-- erneut ausgeführt werden kann.)

-- Mahlzeitenart pro Rezept, für die Filterfunktion in der App.
alter table public.recipes
  add column if not exists meal_type text not null default 'mittag';

alter table public.recipes
  drop constraint if exists recipes_meal_type_check;
alter table public.recipes
  add constraint recipes_meal_type_check check (meal_type in ('fruehstueck', 'mittag', 'abend', 'snack'));

-- Nur der Eigentümer darf ein Rezept bearbeiten (verhindert, dass andere
-- Nutzer fremde oder gemeinsam sichtbare Rezepte verändern/zuspammen).
-- Die global sichtbaren Beispielrezepte (owner_id ist NULL) sind damit für
-- niemanden über die App bearbeitbar — das ist beabsichtigt.
drop policy if exists "Nutzer bearbeiten Rezepte" on public.recipes;
drop policy if exists "Nutzer bearbeiten eigene Rezepte" on public.recipes;
create policy "Nutzer bearbeiten eigene Rezepte"
  on public.recipes for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

update public.recipes set meal_type = 'fruehstueck' where title in (
  'Haferflocken mit Beeren',
  'Gemüse-Omelett mit Spinat und Tomaten',
  'Overnight Oats mit Chiasamen und Mango',
  'Shakshuka mit Paprika und Feta',
  'Vollkorn-Pfannkuchen mit Beeren',
  'Avocado-Toast mit pochiertem Ei',
  'Rührei mit Vollkornbrot und Avocado'
);

update public.recipes set meal_type = 'snack' where title in (
  'Apfel mit Mandelmus',
  'Griechischer Joghurt mit Nüssen und Honig',
  'Protein-Smoothie mit Spinat und Banane',
  'Miso-Suppe mit Tofu und Wakame'
);

update public.recipes set meal_type = 'mittag' where title in (
  'Linsen-Bowl mit Ofengemüse',
  'Quinoa-Salat mit Feta und Granatapfel',
  'Buddha Bowl mit Süßkartoffel und Tahini-Dressing',
  'Thunfisch-Salat mit weißen Bohnen',
  'Kürbissuppe mit Ingwer',
  'Falafel-Wrap mit Joghurt-Dip',
  'Rote-Bete-Salat mit Ziegenkäse und Walnüssen',
  'Caprese-Salat mit Vollkornbaguette',
  'Couscous-Salat mit Kichererbsen und Minze'
);

update public.recipes set meal_type = 'abend' where title in (
  'Kichererbsen-Curry',
  'Gebackener Lachs mit Brokkoli',
  'Vollkornnudeln mit Pesto und Kirschtomaten',
  'Gebratenes Hähnchen mit Ofengemüse',
  'Gemüse-Wok mit Tofu und Cashewkernen',
  'Gebackene Süßkartoffel mit Hüttenkäse',
  'Gemüsecurry mit Tofu und Jasminreis',
  'Putengeschnetzeltes mit Champignons',
  'Gebackene Forelle mit Zitrone und Kräutern',
  'Bohnen-Chili sin Carne',
  'Gemüsespieße vom Grill mit Tzatziki',
  'Zucchini-Nudeln mit Garnelen'
);

-- "Mehr"-Menü: erweitertes Profil (Ernährungstyp, Unverträglichkeiten,
-- Aktivitätslevel) und Ziel-Angaben.
alter table public.profiles
  add column if not exists nutrition_type text;
alter table public.profiles
  drop constraint if exists profiles_nutrition_type_check;
alter table public.profiles
  add constraint profiles_nutrition_type_check check (
    nutrition_type is null or nutrition_type in ('omnivore', 'vegetarisch', 'vegan', 'pescetarisch', 'keto', 'low_carb')
  );

alter table public.profiles
  add column if not exists intolerances text[] not null default '{}';

alter table public.profiles
  add column if not exists activity_level text;
alter table public.profiles
  drop constraint if exists profiles_activity_level_check;
alter table public.profiles
  add constraint profiles_activity_level_check check (
    activity_level is null or activity_level in ('sitzend', 'leicht_aktiv', 'maessig_aktiv', 'sehr_aktiv', 'extrem_aktiv')
  );

alter table public.profiles
  add column if not exists goal text;
alter table public.profiles
  drop constraint if exists profiles_goal_check;
alter table public.profiles
  add constraint profiles_goal_check check (
    goal is null or goal in ('abnehmen', 'halten', 'zunehmen', 'muskelaufbau')
  );

alter table public.profiles
  add column if not exists goal_note text not null default '';


-- "Verlauf"-Tab: Alter/Größe/Geschlecht im Profil sowie Gewichts- und
-- Wasser-Tracking.
alter table public.profiles
  add column if not exists age integer;

alter table public.profiles
  add column if not exists height_cm integer;

alter table public.profiles
  add column if not exists gender text;
alter table public.profiles
  drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (
    gender is null or gender in ('maennlich', 'weiblich', 'divers')
  );

-- "Divers" wurde als Option entfernt; bestehende Profile mit diesem Wert
-- werden zurückgesetzt, damit die neue, strengere Constraint greifen kann.
update public.profiles set gender = null where gender = 'divers';
alter table public.profiles
  drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (
    gender is null or gender in ('maennlich', 'weiblich')
  );

alter table public.profiles
  add column if not exists daily_water_goal_ml integer not null default 2500;

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  weight_kg numeric(5,1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.weight_logs enable row level security;

create policy "Nutzer sehen ihre eigenen Gewichtseinträge"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Nutzer legen eigene Gewichtseinträge an"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeiten eigene Gewichtseinträge"
  on public.weight_logs for update
  using (auth.uid() = user_id);

create policy "Nutzer löschen eigene Gewichtseinträge"
  on public.weight_logs for delete
  using (auth.uid() = user_id);


-- Ein Eintrag pro Nutzer und Tag mit der kumulierten Trinkmenge.
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  amount_ml integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.water_logs enable row level security;

create policy "Nutzer sehen ihre eigenen Wassereinträge"
  on public.water_logs for select
  using (auth.uid() = user_id);

create policy "Nutzer legen eigene Wassereinträge an"
  on public.water_logs for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeiten eigene Wassereinträge"
  on public.water_logs for update
  using (auth.uid() = user_id);

create policy "Nutzer löschen eigene Wassereinträge"
  on public.water_logs for delete
  using (auth.uid() = user_id);


-- Rezept-Kennzeichnung: für welche Ernährungstypen ein Rezept geeignet ist
-- (diet_tags, Werte wie profiles.nutrition_type) und welche Unverträg-
-- lichkeiten es erfüllt (free_of, Werte wie profiles.intolerances).
alter table public.recipes
  add column if not exists diet_tags text[] not null default '{}';
alter table public.recipes
  add column if not exists free_of text[] not null default '{}';

-- Bestehende Beispielrezepte nachträglich kennzeichnen (Stand der
-- jeweiligen Zutatenliste, idempotent per Titel).
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Haferflocken mit Beeren';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','keto','low_carb'], free_of = array['glutenfrei','nussfrei','sojafrei'] where title = 'Gemüse-Omelett mit Spinat und Tomaten';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Overnight Oats mit Chiasamen und Mango';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['glutenfrei','nussfrei','sojafrei'] where title = 'Shakshuka mit Paprika und Feta';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['nussfrei','sojafrei','histaminarm'] where title = 'Vollkorn-Pfannkuchen mit Beeren';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['laktosefrei','nussfrei','sojafrei'] where title = 'Avocado-Toast mit pochiertem Ei';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['nussfrei','sojafrei'] where title = 'Rührei mit Vollkornbrot und Avocado';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Linsen-Bowl mit Ofengemüse';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Quinoa-Salat mit Feta und Granatapfel';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Buddha Bowl mit Süßkartoffel und Tahini-Dressing';
update public.recipes set diet_tags = array['omnivore','pescetarisch','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Thunfisch-Salat mit weißen Bohnen';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Kürbissuppe mit Ingwer';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['nussfrei','eifrei','sojafrei'] where title = 'Falafel-Wrap mit Joghurt-Dip';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['glutenfrei','eifrei','sojafrei'] where title = 'Rote-Bete-Salat mit Ziegenkäse und Walnüssen';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['nussfrei','eifrei','sojafrei'] where title = 'Caprese-Salat mit Vollkornbaguette';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Couscous-Salat mit Kichererbsen und Minze';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Kichererbsen-Curry';
update public.recipes set diet_tags = array['omnivore','pescetarisch','keto','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Gebackener Lachs mit Brokkoli';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['eifrei','sojafrei'] where title = 'Vollkornnudeln mit Pesto und Kirschtomaten';
update public.recipes set diet_tags = array['omnivore','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Gebratenes Hähnchen mit Ofengemüse';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','eifrei'] where title = 'Gemüse-Wok mit Tofu und Cashewkernen';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Gebackene Süßkartoffel mit Hüttenkäse';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','histaminarm'] where title = 'Gemüsecurry mit Tofu und Jasminreis';
update public.recipes set diet_tags = array['omnivore','keto','low_carb'], free_of = array['glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Putengeschnetzeltes mit Champignons';
update public.recipes set diet_tags = array['omnivore','pescetarisch','keto','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm'] where title = 'Gebackene Forelle mit Zitrone und Kräutern';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Bohnen-Chili sin Carne';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Gemüsespieße vom Grill mit Tzatziki';
update public.recipes set diet_tags = array['omnivore','pescetarisch','keto','low_carb'], free_of = array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei'] where title = 'Zucchini-Nudeln mit Garnelen';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan','low_carb'], free_of = array['laktosefrei','glutenfrei','eifrei','sojafrei'] where title = 'Apfel mit Mandelmus';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','low_carb'], free_of = array['glutenfrei','eifrei','sojafrei'] where title = 'Griechischer Joghurt mit Nüssen und Honig';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch'], free_of = array['glutenfrei','nussfrei','eifrei'] where title = 'Protein-Smoothie mit Spinat und Banane';
update public.recipes set diet_tags = array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb'], free_of = array['laktosefrei','nussfrei','eifrei'] where title = 'Miso-Suppe mit Tofu und Wakame';


-- Neue Rezepte, damit für jeden Ernährungstyp und jede Unverträglichkeit
-- mindestens 7 Rezepte je Mahlzeitenart zur Verfügung stehen (per Skript
-- gegengeprüfte Abdeckung, owner_id NULL = global sichtbar).
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions, v.meal_type, v.diet_tags, v.free_of
from (
  values
    (
      'Chia-Kokos-Pudding mit Beeren',
      'Cremiger Pudding zum Vorbereiten, reich an Ballaststoffen und Omega-3.',
      290, 6, 16, 22,
      array['30 g Chiasamen', '200 ml Kokosmilch', '80 g gemischte Beeren', '1/2 TL Vanille']::text[],
      'Chiasamen mit Kokosmilch und Vanille verrühren, mindestens 3 Stunden oder über Nacht im Kühlschrank quellen lassen. Mit Beeren toppen.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Kichererbsen-Omelett mit Gemüse',
      'Veganes "Omelett" aus Kichererbsenmehl, herzhaft und proteinreich.',
      220, 12, 18, 10,
      array['60 g Kichererbsenmehl', '100 ml Wasser', '1/2 Zwiebel', '1/2 Paprika', '1/2 TL Kurkuma', '1 EL Olivenöl']::text[],
      'Kichererbsenmehl mit Wasser und Kurkuma zu einem glatten Teig verrühren. Zwiebel und Paprika fein würfeln und unterrühren. In Öl von beiden Seiten goldbraun braten.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Buchweizen-Porridge mit Apfel und Zimt',
      'Glutenfreies, wärmendes Frühstück mit fruchtiger Süße.',
      300, 8, 38, 10,
      array['60 g Buchweizenflocken', '200 ml Kokosmilch', '1 Apfel', '1 TL Zimt']::text[],
      'Buchweizenflocken mit Kokosmilch aufkochen und 5 Minuten köcheln lassen. Apfel würfeln, unterheben und mit Zimt bestreuen.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Kokos-Chia-Smoothie-Bowl mit Mango',
      'Cremige Smoothie-Bowl, schnell gemacht und gut sättigend.',
      230, 5, 24, 14,
      array['150 ml Kokosmilch', '1 EL Chiasamen', '1/2 Mango', '1 EL Kokosraspeln']::text[],
      'Kokosmilch, Chiasamen und die Hälfte der Mango pürieren, in eine Schale füllen. Mit restlicher Mango und Kokosraspeln toppen.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Reisflocken-Porridge mit Birne',
      'Sanftes, glutenfreies Porridge für einen ruhigen Start in den Tag.',
      290, 5, 42, 8,
      array['60 g Reisflocken', '200 ml Kokosmilch', '1 Birne', '1 TL Zimt']::text[],
      'Reisflocken mit Kokosmilch aufkochen und 5 Minuten quellen lassen. Birne würfeln, unterheben und mit Zimt bestreuen.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Pochierter Lachs mit Gurke und Dill',
      'Leichtes, proteinreiches Frühstück ohne viel Aufwand.',
      290, 28, 6, 18,
      array['150 g Lachsfilet', '1/2 Gurke', 'Dill', 'Zitrone', '1 EL Olivenöl']::text[],
      'Lachs in leicht siedendem Wasser 8–10 Minuten pochieren. Gurke in Scheiben schneiden, mit Dill, Zitrone und Öl anrichten, Lachs dazu servieren.',
      'fruehstueck',
      array['omnivore','pescetarisch','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Kokosjoghurt-Bowl mit Granatapfel und Kürbiskernen',
      'Frisches, milchfreies Frühstück mit Crunch.',
      230, 6, 20, 14,
      array['200 g Kokosjoghurt', '1/2 Granatapfel', '1 EL Kürbiskerne']::text[],
      'Kokosjoghurt in eine Schale geben, mit Granatapfelkernen und Kürbiskernen toppen.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Rührei mit Speck und Avocado',
      'Klassisches Low-Carb-Frühstück mit viel Protein und gesunden Fetten.',
      420, 22, 4, 34,
      array['3 Eier', '2 Scheiben Speck', '1/2 Avocado', '1 EL Butter']::text[],
      'Speck knusprig braten und herausnehmen. Eier in der Pfanne mit Butter unter Rühren stocken lassen. Mit Speck und Avocado servieren.',
      'fruehstueck',
      array['omnivore','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','sojafrei']::text[]
    ),
    (
      'Frischkäse-Röllchen mit Kochschinken',
      'Schneller, herzhafter Low-Carb-Snack für den Morgen.',
      260, 18, 3, 20,
      array['100 g Frischkäse', '4 Scheiben Kochschinken', 'Schnittlauch']::text[],
      'Frischkäse auf den Schinkenscheiben verstreichen, aufrollen und mit Schnittlauch bestreuen.',
      'fruehstueck',
      array['omnivore','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Griechischer Salat mit Feta und Oliven',
      'Frisches, herzhaftes Frühstück im mediterranen Stil.',
      270, 10, 10, 22,
      array['1/2 Gurke', '1/2 Paprika', '60 g Feta', '8 Oliven', '1 EL Olivenöl']::text[],
      'Gurke und Paprika würfeln, mit Feta und Oliven vermengen, mit Olivenöl beträufeln.',
      'fruehstueck',
      array['omnivore','pescetarisch','vegetarisch','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Lachs-Avocado-Bowl mit Gurke',
      'Frische Bowl mit gesunden Fetten und viel Protein.',
      370, 28, 10, 26,
      array['150 g Lachsfilet', '1/2 Avocado', '1/2 Gurke', '1 EL Olivenöl', 'Zitrone']::text[],
      'Lachs braten oder pochieren. Avocado und Gurke würfeln, mit dem Lachs in einer Bowl anrichten, mit Öl und Zitrone beträufeln.',
      'mittag',
      array['omnivore','pescetarisch','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Hähnchen-Salat mit Parmesan und Römersalat',
      'Proteinreicher Salat, schnell gemacht und gut sättigend.',
      370, 38, 8, 18,
      array['150 g Hähnchenbrust', 'Römersalat', '20 g Parmesan', '1 EL Olivenöl', 'Zitrone']::text[],
      'Hähnchenbrust braten und in Streifen schneiden. Mit Römersalat, gehobeltem Parmesan, Öl und Zitrone anrichten.',
      'mittag',
      array['omnivore','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Gebratener Tofu mit Blumenkohlreis',
      'Leichtes, veganes Low-Carb-Gericht mit asiatischen Aromen.',
      260, 18, 12, 16,
      array['150 g Tofu', '250 g Blumenkohlreis', '1 EL Sesamöl', 'Ingwer', 'Frühlingszwiebel']::text[],
      'Tofu würfeln und in Sesamöl anbraten. Blumenkohlreis kurz mitbraten, mit Ingwer würzen und mit Frühlingszwiebel servieren.',
      'mittag',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','histaminarm']::text[]
    ),
    (
      'Zucchini-Puffer mit Frischkäse-Dip',
      'Knusprige Gemüsepuffer mit cremigem Dip.',
      290, 16, 10, 20,
      array['2 Zucchini', '1 Ei', '30 g Parmesan', '100 g Frischkäse']::text[],
      'Zucchini raspeln, mit Ei und Parmesan vermengen, in Öl goldbraun braten. Mit Frischkäse-Dip servieren.',
      'mittag',
      array['omnivore','pescetarisch','vegetarisch','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','sojafrei']::text[]
    ),
    (
      'Gurken-Dill-Salat mit weißen Bohnen',
      'Frischer, leichter Salat für warme Tage.',
      230, 12, 22, 10,
      array['1 Gurke', '1 Dose weiße Bohnen', 'Dill', '1 EL Olivenöl', 'Zitrone', '1/2 Zwiebel']::text[],
      'Bohnen abspülen, Gurke würfeln, mit Dill, Zwiebel, Öl und Zitrone vermengen.',
      'mittag',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Reispapier-Rollen mit Garnelen und Gemüse',
      'Frische, handliche Rollen im vietnamesischen Stil.',
      280, 20, 34, 6,
      array['6 Reispapierblätter', '150 g Garnelen', '1 Karotte', '1/2 Gurke', 'Minze', 'Limette']::text[],
      'Gemüse in Streifen schneiden. Reispapier kurz einweichen, mit Garnelen, Gemüse und Minze füllen, aufrollen, mit Limette servieren.',
      'mittag',
      array['omnivore','pescetarisch','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Blumenkohl-Curry mit Kokosmilch',
      'Mildes, veganes Low-Carb-Curry, schnell gemacht.',
      280, 8, 18, 20,
      array['400 g Blumenkohl', '200 ml Kokosmilch', '2 TL Currypaste', '1 Zwiebel', 'Ingwer']::text[],
      'Zwiebel und Ingwer andünsten, Currypaste kurz mitrösten, Blumenkohlröschen und Kokosmilch zugeben, 15 Minuten köcheln.',
      'mittag',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Gebratener Halloumi mit Zucchini',
      'Herzhaftes Low-Carb-Gericht mit knusprigem Grillkäse.',
      360, 22, 8, 26,
      array['150 g Halloumi', '1 Zucchini', '1 EL Olivenöl', 'Kräuter']::text[],
      'Halloumi in Scheiben schneiden und in Öl goldbraun braten. Zucchini in Scheiben mitbraten und mit Kräutern servieren.',
      'mittag',
      array['omnivore','pescetarisch','vegetarisch','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Steak mit Kräuterbutter und grünem Spargel',
      'Klassisches Low-Carb-Gericht für besondere Tage.',
      440, 38, 6, 28,
      array['180 g Rindersteak', '200 g grüner Spargel', '1 EL Kräuterbutter', 'Knoblauch']::text[],
      'Steak scharf anbraten und mit Kräuterbutter servieren. Spargel mit Knoblauch in der Pfanne braten.',
      'mittag',
      array['omnivore','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Gebratener Tofu mit Brokkoli und Sesam',
      'Schnelles, veganes Low-Carb-Abendessen mit knackigem Gemüse.',
      270, 18, 14, 18,
      array['150 g Tofu', '250 g Brokkoli', '1 EL Sesamöl', '1 TL Sesam', 'Knoblauch']::text[],
      'Tofu würfeln und in Sesamöl anbraten. Brokkoliröschen und Knoblauch zugeben, kurz mitbraten und mit Sesam bestreuen.',
      'abend',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','histaminarm']::text[]
    ),
    (
      'Blumenkohl-Steak mit Kräuteröl',
      'Vegane Low-Carb-Hauptmahlzeit mit intensivem Röstaroma.',
      230, 8, 10, 18,
      array['1 Blumenkohl', '2 EL Olivenöl', 'Kräuter', 'Knoblauch', 'Zitrone']::text[],
      'Blumenkohl in dicke Scheiben schneiden, in Öl von beiden Seiten braten. Mit Kräuteröl, Knoblauch und Zitrone servieren.',
      'abend',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Gebackene Zucchini-Boote mit Linsen-Füllung',
      'Sättigendes, veganes Ofengericht zum Vorbereiten.',
      250, 16, 26, 8,
      array['2 Zucchini', '100 g rote Linsen', '2 EL Tomatenmark', '1 Zwiebel', 'Kräuter']::text[],
      'Zucchini halbieren und aushöhlen. Linsen kochen, mit Zwiebel und Tomatenmark vermengen, in die Zucchinihälften füllen und 20 Minuten backen.',
      'abend',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Gebratenes Rinderhack mit Zucchini-Nudeln',
      'Proteinreiches Low-Carb-Abendessen, in 15 Minuten fertig.',
      370, 32, 8, 22,
      array['200 g Rinderhackfleisch', '2 Zucchini', 'Knoblauch', '1 EL Olivenöl', 'Kräuter']::text[],
      'Hackfleisch anbraten, Knoblauch zugeben. Zucchini spiralisieren, kurz mitschwenken und mit Kräutern servieren.',
      'abend',
      array['omnivore','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Karottensticks mit Hummus',
      'Frischer, ballaststoffreicher Snack für zwischendurch.',
      150, 6, 16, 8,
      array['2 Karotten', '100 g Kichererbsen', '1 EL Tahini', 'Zitrone', '1 EL Olivenöl']::text[],
      'Kichererbsen mit Tahini, Zitronensaft und Öl zu Hummus pürieren. Mit Karottensticks servieren.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Gedünstete Süßkartoffel-Sticks',
      'Einfacher, süßlicher Snack aus dem Ofen.',
      150, 3, 24, 6,
      array['1 Süßkartoffel', '1 EL Olivenöl', 'Rosmarin', 'Salz']::text[],
      'Süßkartoffel in Sticks schneiden, mit Öl und Rosmarin vermengen, 20 Minuten bei 200°C backen.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Reiswaffeln mit Kokosjoghurt und Beeren',
      'Leichter, milchfreier Snack mit Frucht.',
      160, 3, 20, 8,
      array['2 Reiswaffeln', '100 g Kokosjoghurt', '50 g Beeren']::text[],
      'Reiswaffeln mit Kokosjoghurt bestreichen und mit Beeren toppen.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Radieschen mit Kräutersalz und Olivenöl',
      'Minimalistischer, knackiger Snack.',
      60, 1, 6, 5,
      array['1 Bund Radieschen', 'Kräutersalz', '1 TL Olivenöl']::text[],
      'Radieschen waschen und halbieren, mit Kräutersalz und einem Schuss Olivenöl servieren.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Dattel-Kokos-Energiebällchen',
      'Süßer, veganer Snack ohne raffinierten Zucker.',
      200, 4, 32, 8,
      array['100 g Datteln', '30 g Kokosraspeln', '20 g Sonnenblumenkerne', '1 EL Kakao']::text[],
      'Datteln entsteinen, mit Sonnenblumenkernen und Kakao im Mixer fein zerkleinern, zu Kugeln formen und in Kokosraspeln wälzen.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Birne mit Kokosflocken',
      'Einfacher, frischer Snack in 2 Minuten.',
      110, 1, 20, 3,
      array['1 Birne', '1 EL Kokosflocken']::text[],
      'Birne in Spalten schneiden und mit Kokosflocken bestreuen.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Hartgekochtes Ei mit Gurke',
      'Klassischer, proteinreicher Low-Carb-Snack.',
      160, 14, 4, 10,
      array['2 Eier', '1/2 Gurke', 'Salz']::text[],
      'Eier 8 Minuten hart kochen, abschrecken und pellen. Mit Gurkenscheiben und Salz servieren.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Kalte Hähnchenspieße mit Kräutern',
      'Proteinreicher Snack zum Mitnehmen.',
      200, 30, 2, 8,
      array['150 g Hähnchenbrust', '1 EL Olivenöl', 'Kräuter', 'Zitrone']::text[],
      'Hähnchenbrust würzen und braten, in Streifen schneiden, auf Spieße stecken und kalt servieren.',
      'snack',
      array['omnivore','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Reiscracker mit Frischkäse und Schnittlauch',
      'Knuspriger, milder Snack für zwischendurch.',
      160, 5, 18, 8,
      array['4 Reiscracker', '60 g Frischkäse', 'Schnittlauch']::text[],
      'Reiscracker mit Frischkäse bestreichen und mit Schnittlauch bestreuen.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    ),
    (
      'Käsewürfel mit Oliven',
      'Herzhafter Low-Carb-Snack, in 2 Minuten fertig.',
      270, 18, 2, 22,
      array['80 g Gouda', '10 Oliven', '1 EL Olivenöl']::text[],
      'Käse würfeln, mit Oliven auf einem Teller anrichten und mit Olivenöl beträufeln.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','keto','low_carb']::text[],
      array['glutenfrei','nussfrei','eifrei','sojafrei']::text[]
    ),
    (
      'Frische Beeren mit Kokoscreme',
      'Leichter, veganer Low-Carb-Snack mit wenig Zucker.',
      200, 2, 12, 16,
      array['100 g gemischte Beeren', '80 g Kokoscreme (ungesüßt)', 'Vanille']::text[],
      'Kokoscreme mit Vanille verrühren und mit Beeren in einer Schale anrichten.',
      'snack',
      array['omnivore','pescetarisch','vegetarisch','vegan','keto','low_carb']::text[],
      array['laktosefrei','glutenfrei','nussfrei','eifrei','sojafrei','histaminarm']::text[]
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);


-- 20 weitere gesunde Abendessen, auf Nutzerwunsch ergänzt.
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions, v.meal_type, v.diet_tags, v.free_of
from (
  values
    (
      'Ofengemüse mit Feta und Kräutern',
      'Buntes Ofengemüse, überbacken mit cremigem Feta.',
      420, 15, 32, 24,
      array['2 Zucchini', '1 rote Paprika', '1 rote Zwiebel', '150 g Kirschtomaten', '2 Knoblauchzehen', '100 g Feta', '3 EL Olivenöl', '1 TL getrockneter Thymian', 'Salz, Pfeffer, 1 EL Balsamico-Essig']::text[],
      'Backofen auf 200°C Ober-/Unterhitze vorheizen. Zucchini, Paprika und Zwiebel in mundgerechte Stücke schneiden, Knoblauch fein hacken. Gemüse mit Kirschtomaten, 2 EL Olivenöl, Thymian, Salz und Pfeffer in einer großen Auflaufform vermengen und gleichmäßig verteilen. 20 Minuten im Ofen rösten, dann den Feta grob darüberbröckeln und weitere 10 Minuten backen, bis der Käse leicht Farbe annimmt. Zum Schluss mit Balsamico-Essig und dem restlichen Olivenöl beträufeln und warm servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Garnelen-Curry mit Kokosmilch und Spinat',
      'Würziges Curry mit zarten Garnelen und frischem Spinat.',
      420, 30, 18, 26,
      array['250 g Garnelen', '200 ml Kokosmilch', '150 g Spinat', '1 EL rote Currypaste', '1 Zwiebel', '2 Knoblauchzehen', '1 daumengroßes Stück Ingwer', '1 EL Fischsauce', 'Saft einer Limette, Koriander zum Garnieren']::text[],
      'Zwiebel, Knoblauch und Ingwer fein hacken. In einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypaste zugeben und eine Minute mitrösten, bis sie aromatisch duftet. Mit Kokosmilch ablöschen, aufkochen lassen und mit Fischsauce abschmecken. Garnelen zugeben und 3–4 Minuten gar ziehen lassen, dann den Spinat unterrühren, bis er zusammenfällt. Mit Limettensaft abschmecken und mit frischem Koriander bestreut zu Reis servieren.',
      'abend',
      array['omnivore', 'pescetarisch']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Hähnchen-Gemüse-Pfanne mit Erdnusssauce',
      'Asiatisch inspirierte Pfanne mit cremiger Erdnusssauce.',
      480, 35, 28, 22,
      array['250 g Hähnchenbrust', '200 g Brokkoli', '1 rote Paprika', '1 Karotte', '2 Knoblauchzehen', '1 Stück Ingwer', '2 EL Erdnussbutter', '2 EL Sojasauce', 'Saft einer Limette, 1 EL Sesam']::text[],
      'Hähnchenbrust in mundgerechte Streifen schneiden, Gemüse waschen und in ähnlich große Stücke schneiden, Knoblauch und Ingwer fein hacken. Öl in einer großen Pfanne oder einem Wok stark erhitzen und das Hähnchen darin rundum anbraten, bis es Farbe annimmt. Knoblauch und Ingwer zugeben, kurz mitbraten, dann Brokkoli, Paprika und Karotte dazugeben und unter Wenden 5–6 Minuten braten, bis das Gemüse bissfest ist. Erdnussbutter mit Sojasauce und etwas Wasser glattrühren und in die Pfanne geben, alles gut vermengen und kurz köcheln lassen, bis die Sauce leicht andickt. Mit Limettensaft abschmecken und mit Sesam bestreut servieren.',
      'abend',
      array['omnivore']::text[],
      array['laktosefrei', 'eifrei']::text[]
    ),
    (
      'Vegane Linsenbolognese mit Zucchininudeln',
      'Herzhafte Bolognese aus roten Linsen auf Zucchininudeln.',
      380, 22, 32, 14,
      array['150 g rote Linsen', '3 Zucchini', '400 g stückige Tomaten', '1 Zwiebel', '1 Karotte', '1 Stange Staudensellerie', '2 Knoblauchzehen', '2 EL Tomatenmark', 'Oregano, Basilikum, Salz, Pfeffer']::text[],
      'Zwiebel, Karotte, Sellerie und Knoblauch fein würfeln. In einem Topf mit etwas Olivenöl andünsten, bis das Gemüse weich ist. Tomatenmark einrühren und kurz mitrösten, dann mit den stückigen Tomaten und den roten Linsen ablöschen. Mit etwas Wasser auffüllen, Oregano und Basilikum zugeben und die Sauce 15–18 Minuten köcheln lassen, bis die Linsen weich sind, dabei gelegentlich umrühren. Zucchini in der Zwischenzeit mit dem Spiralschneider zu Nudeln verarbeiten. Zucchininudeln kurz in der heißen Sauce erwärmen oder separat kurz andünsten und mit der Bolognese anrichten.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Gebackener Kabeljau mit Ofenkartoffeln und Rosmarin',
      'Milder Fisch mit knusprigen Kartoffelspalten.',
      460, 32, 45, 14,
      array['200 g Kabeljaufilet', '500 g Kartoffeln', '3 EL Olivenöl', '2 Zweige Rosmarin', '2 Knoblauchzehen', 'Zitrone (Saft und Schale)', 'Salz, Pfeffer', 'Petersilie zum Garnieren']::text[],
      'Backofen auf 200°C vorheizen. Kartoffeln waschen, in Spalten schneiden und mit Olivenöl, Rosmarin, zerdrückten Knoblauchzehen, Salz und Pfeffer vermengen. Auf einem Backblech verteilen und 20 Minuten vorbacken. Kabeljau mit Salz, Pfeffer und etwas Zitronensaft würzen, auf das Blech zu den Kartoffeln legen und weitere 12–15 Minuten backen, bis der Fisch gar ist und sich leicht mit der Gabel zerteilen lässt. Mit Zitronenschale und gehackter Petersilie bestreut servieren.',
      'abend',
      array['omnivore', 'pescetarisch']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Falafel-Bowl mit Hummus und Rotkohlsalat',
      'Knusprige Falafel, cremiger Hummus, frischer Krautsalat.',
      520, 18, 58, 20,
      array['150 g Falafel (Kichererbsen)', '150 g Hummus', '200 g Rotkohl', '1 Karotte', '2 EL Olivenöl', 'Saft einer Zitrone', '1 EL Tahini', 'Kreuzkümmel, Salz, Pfeffer', '1 EL Sesam, Petersilie']::text[],
      'Rotkohl fein hobeln und Karotte raspeln. Beides mit Olivenöl, Zitronensaft, Kreuzkümmel, Salz und Pfeffer vermengen und kurz durchziehen lassen. Tahini mit etwas Wasser und Zitronensaft zu einem cremigen Dressing verrühren. Falafel nach Packungsanweisung in der Pfanne oder im Ofen erhitzen, bis sie knusprig sind. Hummus als Basis in eine Schale streichen, Falafel und Rotkohlsalat darauf anrichten, mit dem Tahini-Dressing beträufeln und mit Sesam und gehackter Petersilie bestreuen.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Rindergeschnetzeltes mit Paprika und Reis',
      'Zartes Rindfleisch in würziger Paprikasauce, dazu Reis.',
      540, 32, 55, 16,
      array['250 g Rindergeschnetzeltes', '2 Paprika', '1 Zwiebel', '2 Knoblauchzehen', '150 g Reis', '2 EL Olivenöl', '1 TL Paprikapulver', '100 ml Gemüsebrühe', 'Petersilie, Salz, Pfeffer']::text[],
      'Reis nach Packungsanweisung kochen. Zwiebel und Knoblauch fein würfeln, Paprika in Streifen schneiden. Öl in einer Pfanne stark erhitzen und das Rindfleisch portionsweise scharf anbraten, damit es Farbe bekommt, dann herausnehmen. Zwiebel, Knoblauch und Paprika in derselben Pfanne andünsten, mit Paprikapulver bestäuben und mit der Gemüsebrühe ablöschen. Das Fleisch zurück in die Pfanne geben, kurz durchschwenken und mit Salz und Pfeffer abschmecken. Mit gekochtem Reis und frischer Petersilie servieren.',
      'abend',
      array['omnivore']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Gebratener Räuchertofu mit Pak Choi und Sesam',
      'Asiatisch angehauchtes Low-Carb-Gericht mit Räuchertofu.',
      380, 24, 16, 24,
      array['200 g Räuchertofu', '2 Pak Choi', '2 Knoblauchzehen', '1 Stück Ingwer', '1 EL Sesamöl', '1 EL Sojasauce', '1 TL Reisessig', '1 EL Sesam', '1 rote Chili (optional)']::text[],
      'Tofu in Würfel schneiden, Pak Choi waschen und der Länge nach halbieren, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne oder einem Wok stark erhitzen und den Tofu darin rundum knusprig anbraten. Knoblauch, Ingwer und die in Ringe geschnittene Chili zugeben und kurz mitbraten, bis es aromatisch duftet. Pak Choi dazugeben und unter Wenden 3–4 Minuten braten, bis er leicht zusammenfällt. Mit Sojasauce und Reisessig ablöschen, kurz durchschwenken und mit Sesam bestreut servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei']::text[]
    ),
    (
      'Zucchini-Lasagne mit Ricotta',
      'Lasagne mit Zucchinischeiben statt Nudelplatten.',
      460, 22, 32, 26,
      array['3 Zucchini', '250 g Ricotta', '400 g stückige Tomaten', '2 Knoblauchzehen', '1 Zwiebel', '80 g Mozzarella', '50 g Parmesan', 'Muskatnuss, Salz, Pfeffer', 'Basilikum zum Garnieren']::text[],
      'Backofen auf 200°C vorheizen. Zwiebel und Knoblauch fein würfeln und in etwas Olivenöl andünsten, mit den stückigen Tomaten ablöschen und 10 Minuten zu einer Sauce einkochen, mit Salz und Pfeffer abschmecken. Zucchini in dünne Längsscheiben schneiden. Ricotta mit einer Prise Muskatnuss verrühren. In einer Auflaufform abwechselnd Tomatensauce, Zucchinischeiben und Ricotta schichten, bis alle Zutaten aufgebraucht sind. Mit gerissenem Mozzarella und Parmesan bestreuen und 30 Minuten backen, bis die Oberfläche goldbraun ist. Mit frischem Basilikum garniert servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Miso-Lachs mit Brokkoli und Reis',
      'Lachs in Miso-Marinade gebacken, dazu gedünsteter Brokkoli.',
      540, 34, 48, 22,
      array['200 g Lachsfilet', '1 EL Misopaste', '1 TL Honig', '1 TL Sojasauce', '200 g Brokkoli', '150 g Reis', '1 Stück Ingwer, gerieben', '1 EL Sesam, Frühlingszwiebel']::text[],
      'Backofen auf 200°C vorheizen. Misopaste mit Honig, Sojasauce und geriebenem Ingwer zu einer Marinade verrühren und den Lachs damit bestreichen, kurz ziehen lassen. Reis nach Packungsanweisung kochen. Lachs auf ein mit Backpapier ausgelegtes Blech legen und 12–15 Minuten backen, bis er gar ist und die Marinade leicht karamellisiert. Brokkoli in Röschen teilen und in der Zwischenzeit 5 Minuten dämpfen, bis er bissfest ist. Alles zusammen mit dem Reis anrichten, mit Sesam und Frühlingszwiebelringen bestreuen.',
      'abend',
      array['omnivore', 'pescetarisch']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei']::text[]
    ),
    (
      'Kichererbsen-Spinat-Curry mit Naturjoghurt',
      'Mildes Curry, verfeinert mit einem Klecks Joghurt.',
      420, 18, 42, 16,
      array['400 g Kichererbsen (Dose)', '200 g Spinat', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kreuzkümmel', '400 g stückige Tomaten', '2 EL Naturjoghurt']::text[],
      'Zwiebel, Knoblauch und Ingwer fein hacken. In einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypulver und Kreuzkümmel zugeben und kurz mitrösten, bis die Gewürze aromatisch duften. Mit den stückigen Tomaten ablöschen, die abgetropften Kichererbsen zugeben und alles 10 Minuten köcheln lassen, damit sich die Aromen verbinden. Spinat unterrühren und zusammenfallen lassen, mit Salz und Pfeffer abschmecken. Mit einem Klecks Naturjoghurt servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Putenschnitzel mit grünem Spargel und Zitronenbutter',
      'Mageres Putenfleisch, dazu saisonaler Spargel.',
      400, 38, 10, 22,
      array['200 g Putenschnitzel', '250 g grüner Spargel', '2 EL Mehl', '2 EL Butter', '1 Knoblauchzehe', 'Zitrone (Saft und Schale)', 'Petersilie', 'Salz, Pfeffer']::text[],
      'Spargel waschen und die holzigen Enden abschneiden. Putenschnitzel salzen, pfeffern und leicht in Mehl wenden. In einer Pfanne mit etwas Butter von beiden Seiten goldbraun und durchgebraten braten, dann warm stellen. Spargel in derselben Pfanne mit etwas Wasser und einer zerdrückten Knoblauchzehe 6–8 Minuten dünsten, bis er bissfest ist. Restliche Butter mit Zitronensaft und -schale in einem kleinen Topf schmelzen. Schnitzel und Spargel auf Tellern anrichten, mit der Zitronenbutter beträufeln und mit gehackter Petersilie bestreuen.',
      'abend',
      array['omnivore', 'low_carb']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Auberginen-Curry mit Kokosmilch und Koriander',
      'Cremiges, veganes Curry mit intensivem Aroma.',
      400, 10, 34, 24,
      array['2 Auberginen', '200 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypaste', '1 TL Kurkuma', '200 g stückige Tomaten', 'Koriander zum Garnieren']::text[],
      'Auberginen in Würfel schneiden, Zwiebel, Knoblauch und Ingwer fein hacken. Öl in einem Topf erhitzen und die Auberginenwürfel darin rundum anbraten, bis sie leicht Farbe annehmen, dann herausnehmen. Zwiebel, Knoblauch und Ingwer im selben Topf andünsten, Currypaste und Kurkuma zugeben und kurz mitrösten. Mit Kokosmilch und stückigen Tomaten ablöschen, die Auberginen zurückgeben und alles 15 Minuten köcheln lassen, bis die Auberginen weich sind. Mit Salz abschmecken und mit frischem Koriander garniert servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Gebratene Jakobsmuscheln mit Erbsenpüree',
      'Elegantes, leichtes Fischgericht mit cremigem Erbsenpüree.',
      380, 28, 24, 18,
      array['200 g Jakobsmuscheln', '250 g TK-Erbsen', '1 Schalotte', '2 EL Butter', '2 EL Sahne', 'Minze', 'Zitrone', 'Salz, Pfeffer']::text[],
      'Schalotte fein würfeln und in etwas Butter glasig dünsten. Erbsen zugeben und 3–4 Minuten mitdünsten, dann mit etwas Wasser auffüllen und weich kochen. Erbsen mit Sahne, Minze, Salz und Pfeffer fein pürieren, bei Bedarf durch ein Sieb streichen für eine besonders cremige Konsistenz. Jakobsmuscheln trocken tupfen, salzen und pfeffern. In einer sehr heißen Pfanne mit etwas Butter je Seite 1–2 Minuten scharf anbraten, bis sie goldbraun sind, aber innen noch glasig bleiben. Erbsenpüree auf Tellern verteilen, Jakobsmuscheln daraufsetzen und mit Zitronensaft beträufeln.',
      'abend',
      array['omnivore', 'pescetarisch']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Bohnen-Eintopf mit Chorizo',
      'Herzhafter Eintopf mit weißen Bohnen und würziger Chorizo.',
      480, 28, 40, 22,
      array['400 g weiße Bohnen (Dose)', '100 g Chorizo', '1 Zwiebel', '2 Knoblauchzehen', '1 Karotte', '1 Paprika', '1 TL Paprikapulver', '300 ml Gemüsebrühe', '1 Lorbeerblatt']::text[],
      'Zwiebel, Knoblauch, Karotte und Paprika klein schneiden. Chorizo in Scheiben schneiden und in einem Topf ohne zusätzliches Fett anbraten, bis sie ihr Öl abgibt. Zwiebel, Knoblauch, Karotte und Paprika zugeben und mitdünsten, bis das Gemüse weich wird. Mit Paprikapulver bestäuben, kurz mitrösten und mit der Gemüsebrühe ablöschen. Bohnen und Lorbeerblatt zugeben und alles 15–20 Minuten köcheln lassen, bis der Eintopf sämig ist. Lorbeerblatt entfernen und mit Salz und Pfeffer abschmecken.',
      'abend',
      array['omnivore']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Gebackener Feta mit Cherrytomaten und Vollkornbrot',
      'Ofenfeta in Olivenöl mit geplatzten Cherrytomaten.',
      460, 18, 38, 26,
      array['200 g Feta', '300 g Cherrytomaten', '2 Knoblauchzehen', '3 EL Olivenöl', '1 TL Oregano', 'Chiliflocken (optional)', '4 Scheiben Vollkornbrot', 'Basilikum']::text[],
      'Backofen auf 200°C vorheizen. Feta in die Mitte einer Auflaufform legen und die Cherrytomaten sowie die halbierten Knoblauchzehen drum herum verteilen. Mit Olivenöl beträufeln, mit Oregano und nach Belieben Chiliflocken bestreuen. 20–25 Minuten backen, bis die Tomaten geplatzt sind und der Feta leicht Farbe angenommen hat. In der Zwischenzeit die Vollkornbrotscheiben rösten. Feta und Tomaten mit einer Gabel leicht zerdrücken und vermengen, mit frischem Basilikum bestreuen und zusammen mit dem gerösteten Brot servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Teriyaki-Tofu mit Brokkoli und Jasminreis',
      'Süß-würziger Tofu, asiatisch inspiriert.',
      480, 22, 58, 14,
      array['200 g Tofu', '200 g Brokkoli', '150 g Jasminreis', '2 Knoblauchzehen', '1 Stück Ingwer', '3 EL Teriyaki-Sauce', '1 EL Sesamöl', '1 EL Sesam', 'Frühlingszwiebel']::text[],
      'Jasminreis nach Packungsanweisung kochen. Tofu trocken tupfen und in Würfel schneiden, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne erhitzen und den Tofu darin von allen Seiten knusprig braten, dann herausnehmen. Knoblauch und Ingwer kurz in derselben Pfanne andünsten, Brokkoliröschen zugeben und 5 Minuten braten, bis sie bissfest sind. Tofu zurück in die Pfanne geben, mit der Teriyaki-Sauce ablöschen und alles gut vermengen, bis die Sauce leicht andickt. Mit Jasminreis anrichten und mit Sesam und Frühlingszwiebelringen bestreuen.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei']::text[]
    ),
    (
      'Hähnchen-Curry mit Süßkartoffel',
      'Mildes Curry mit zartem Hähnchen und süßer Kartoffel.',
      500, 34, 42, 20,
      array['250 g Hähnchenbrust', '1 Süßkartoffel', '200 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kreuzkümmel', 'Koriander zum Garnieren']::text[],
      'Hähnchenbrust in mundgerechte Stücke schneiden, Zwiebel, Knoblauch und Ingwer fein hacken, Süßkartoffel schälen und würfeln. Öl in einem Topf erhitzen und das Hähnchen darin anbraten, bis es Farbe annimmt, dann herausnehmen. Zwiebel, Knoblauch und Ingwer im selben Topf andünsten, Currypulver und Kreuzkümmel zugeben und kurz mitrösten. Süßkartoffelwürfel und Kokosmilch zugeben, Hähnchen zurück in den Topf geben und alles 15–18 Minuten köcheln lassen, bis die Süßkartoffel weich und das Hähnchen durchgegart ist. Mit Salz abschmecken und mit frischem Koriander bestreut servieren.',
      'abend',
      array['omnivore']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Gedämpfter Seelachs mit Fenchel und Dillsauce',
      'Leichtes, proteinreiches Fischgericht mit cremiger Dillsauce.',
      360, 30, 12, 20,
      array['200 g Seelachsfilet', '1 Fenchelknolle', '1 Schalotte', '2 EL Naturjoghurt', 'Dill', 'Zitrone (Saft und Schale)', 'Petersilie', 'Salz, Pfeffer']::text[],
      'Fenchel putzen und in dünne Streifen schneiden, Schalotte fein würfeln. Beides in einem Topf mit etwas Wasser oder Gemüsebrühe bei mittlerer Hitze 8–10 Minuten dünsten, bis der Fenchel weich ist. Seelachsfilet mit Salz und Pfeffer würzen und auf den Fenchel legen, Deckel schließen und weitere 6–8 Minuten mitdämpfen, bis der Fisch gar ist. Naturjoghurt mit gehacktem Dill, Zitronensaft und -schale zu einer cremigen Sauce verrühren. Fisch und Fenchel auf Tellern anrichten, mit der Dillsauce beträufeln und mit frischer Petersilie garnieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'low_carb']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Rote-Linsen-Dal mit Naan',
      'Sämiges indisches Linsengericht mit warmem Fladenbrot.',
      460, 20, 62, 12,
      array['200 g rote Linsen', '400 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kurkuma', '2 Naan-Brote', 'Koriander zum Garnieren']::text[],
      'Linsen unter kaltem Wasser abspülen, bis das Wasser klar bleibt. Zwiebel, Knoblauch und Ingwer fein hacken und in einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypulver und Kurkuma zugeben und kurz mitrösten, bis die Gewürze aromatisch duften. Linsen und Kokosmilch zugeben, mit etwas Wasser auffüllen und bei mittlerer Hitze 15–18 Minuten köcheln lassen, dabei gelegentlich umrühren, bis das Dal sämig ist. Mit Salz abschmecken und mit frischem Koriander bestreut zusammen mit warmem Naan servieren.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);

-- Die 20 Abendessen oben wurden nachträglich um mehr Zutaten und eine
-- ausführlichere Zubereitung ergänzt. Als reines Update (statt erneutem
-- Insert) angehängt, damit auch bereits befüllte Projekte die
-- ausführlichere Fassung erhalten, sobald dieser Block ausgeführt wird.
update public.recipes set
  ingredients = array['2 Zucchini', '1 rote Paprika', '1 rote Zwiebel', '150 g Kirschtomaten', '2 Knoblauchzehen', '100 g Feta', '3 EL Olivenöl', '1 TL getrockneter Thymian', 'Salz, Pfeffer, 1 EL Balsamico-Essig']::text[],
  instructions = 'Backofen auf 200°C Ober-/Unterhitze vorheizen. Zucchini, Paprika und Zwiebel in mundgerechte Stücke schneiden, Knoblauch fein hacken. Gemüse mit Kirschtomaten, 2 EL Olivenöl, Thymian, Salz und Pfeffer in einer großen Auflaufform vermengen und gleichmäßig verteilen. 20 Minuten im Ofen rösten, dann den Feta grob darüberbröckeln und weitere 10 Minuten backen, bis der Käse leicht Farbe annimmt. Zum Schluss mit Balsamico-Essig und dem restlichen Olivenöl beträufeln und warm servieren.'
where title = 'Ofengemüse mit Feta und Kräutern';
update public.recipes set
  ingredients = array['250 g Garnelen', '200 ml Kokosmilch', '150 g Spinat', '1 EL rote Currypaste', '1 Zwiebel', '2 Knoblauchzehen', '1 daumengroßes Stück Ingwer', '1 EL Fischsauce', 'Saft einer Limette, Koriander zum Garnieren']::text[],
  instructions = 'Zwiebel, Knoblauch und Ingwer fein hacken. In einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypaste zugeben und eine Minute mitrösten, bis sie aromatisch duftet. Mit Kokosmilch ablöschen, aufkochen lassen und mit Fischsauce abschmecken. Garnelen zugeben und 3–4 Minuten gar ziehen lassen, dann den Spinat unterrühren, bis er zusammenfällt. Mit Limettensaft abschmecken und mit frischem Koriander bestreut zu Reis servieren.'
where title = 'Garnelen-Curry mit Kokosmilch und Spinat';
update public.recipes set
  ingredients = array['250 g Hähnchenbrust', '200 g Brokkoli', '1 rote Paprika', '1 Karotte', '2 Knoblauchzehen', '1 Stück Ingwer', '2 EL Erdnussbutter', '2 EL Sojasauce', 'Saft einer Limette, 1 EL Sesam']::text[],
  instructions = 'Hähnchenbrust in mundgerechte Streifen schneiden, Gemüse waschen und in ähnlich große Stücke schneiden, Knoblauch und Ingwer fein hacken. Öl in einer großen Pfanne oder einem Wok stark erhitzen und das Hähnchen darin rundum anbraten, bis es Farbe annimmt. Knoblauch und Ingwer zugeben, kurz mitbraten, dann Brokkoli, Paprika und Karotte dazugeben und unter Wenden 5–6 Minuten braten, bis das Gemüse bissfest ist. Erdnussbutter mit Sojasauce und etwas Wasser glattrühren und in die Pfanne geben, alles gut vermengen und kurz köcheln lassen, bis die Sauce leicht andickt. Mit Limettensaft abschmecken und mit Sesam bestreut servieren.'
where title = 'Hähnchen-Gemüse-Pfanne mit Erdnusssauce';
update public.recipes set
  ingredients = array['150 g rote Linsen', '3 Zucchini', '400 g stückige Tomaten', '1 Zwiebel', '1 Karotte', '1 Stange Staudensellerie', '2 Knoblauchzehen', '2 EL Tomatenmark', 'Oregano, Basilikum, Salz, Pfeffer']::text[],
  instructions = 'Zwiebel, Karotte, Sellerie und Knoblauch fein würfeln. In einem Topf mit etwas Olivenöl andünsten, bis das Gemüse weich ist. Tomatenmark einrühren und kurz mitrösten, dann mit den stückigen Tomaten und den roten Linsen ablöschen. Mit etwas Wasser auffüllen, Oregano und Basilikum zugeben und die Sauce 15–18 Minuten köcheln lassen, bis die Linsen weich sind, dabei gelegentlich umrühren. Zucchini in der Zwischenzeit mit dem Spiralschneider zu Nudeln verarbeiten. Zucchininudeln kurz in der heißen Sauce erwärmen oder separat kurz andünsten und mit der Bolognese anrichten.'
where title = 'Vegane Linsenbolognese mit Zucchininudeln';
update public.recipes set
  ingredients = array['200 g Kabeljaufilet', '500 g Kartoffeln', '3 EL Olivenöl', '2 Zweige Rosmarin', '2 Knoblauchzehen', 'Zitrone (Saft und Schale)', 'Salz, Pfeffer', 'Petersilie zum Garnieren']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Kartoffeln waschen, in Spalten schneiden und mit Olivenöl, Rosmarin, zerdrückten Knoblauchzehen, Salz und Pfeffer vermengen. Auf einem Backblech verteilen und 20 Minuten vorbacken. Kabeljau mit Salz, Pfeffer und etwas Zitronensaft würzen, auf das Blech zu den Kartoffeln legen und weitere 12–15 Minuten backen, bis der Fisch gar ist und sich leicht mit der Gabel zerteilen lässt. Mit Zitronenschale und gehackter Petersilie bestreut servieren.'
where title = 'Gebackener Kabeljau mit Ofenkartoffeln und Rosmarin';
update public.recipes set
  ingredients = array['150 g Falafel (Kichererbsen)', '150 g Hummus', '200 g Rotkohl', '1 Karotte', '2 EL Olivenöl', 'Saft einer Zitrone', '1 EL Tahini', 'Kreuzkümmel, Salz, Pfeffer', '1 EL Sesam, Petersilie']::text[],
  instructions = 'Rotkohl fein hobeln und Karotte raspeln. Beides mit Olivenöl, Zitronensaft, Kreuzkümmel, Salz und Pfeffer vermengen und kurz durchziehen lassen. Tahini mit etwas Wasser und Zitronensaft zu einem cremigen Dressing verrühren. Falafel nach Packungsanweisung in der Pfanne oder im Ofen erhitzen, bis sie knusprig sind. Hummus als Basis in eine Schale streichen, Falafel und Rotkohlsalat darauf anrichten, mit dem Tahini-Dressing beträufeln und mit Sesam und gehackter Petersilie bestreuen.'
where title = 'Falafel-Bowl mit Hummus und Rotkohlsalat';
update public.recipes set
  ingredients = array['250 g Rindergeschnetzeltes', '2 Paprika', '1 Zwiebel', '2 Knoblauchzehen', '150 g Reis', '2 EL Olivenöl', '1 TL Paprikapulver', '100 ml Gemüsebrühe', 'Petersilie, Salz, Pfeffer']::text[],
  instructions = 'Reis nach Packungsanweisung kochen. Zwiebel und Knoblauch fein würfeln, Paprika in Streifen schneiden. Öl in einer Pfanne stark erhitzen und das Rindfleisch portionsweise scharf anbraten, damit es Farbe bekommt, dann herausnehmen. Zwiebel, Knoblauch und Paprika in derselben Pfanne andünsten, mit Paprikapulver bestäuben und mit der Gemüsebrühe ablöschen. Das Fleisch zurück in die Pfanne geben, kurz durchschwenken und mit Salz und Pfeffer abschmecken. Mit gekochtem Reis und frischer Petersilie servieren.'
where title = 'Rindergeschnetzeltes mit Paprika und Reis';
update public.recipes set
  ingredients = array['200 g Räuchertofu', '2 Pak Choi', '2 Knoblauchzehen', '1 Stück Ingwer', '1 EL Sesamöl', '1 EL Sojasauce', '1 TL Reisessig', '1 EL Sesam', '1 rote Chili (optional)']::text[],
  instructions = 'Tofu in Würfel schneiden, Pak Choi waschen und der Länge nach halbieren, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne oder einem Wok stark erhitzen und den Tofu darin rundum knusprig anbraten. Knoblauch, Ingwer und die in Ringe geschnittene Chili zugeben und kurz mitbraten, bis es aromatisch duftet. Pak Choi dazugeben und unter Wenden 3–4 Minuten braten, bis er leicht zusammenfällt. Mit Sojasauce und Reisessig ablöschen, kurz durchschwenken und mit Sesam bestreut servieren.'
where title = 'Gebratener Räuchertofu mit Pak Choi und Sesam';
update public.recipes set
  ingredients = array['3 Zucchini', '250 g Ricotta', '400 g stückige Tomaten', '2 Knoblauchzehen', '1 Zwiebel', '80 g Mozzarella', '50 g Parmesan', 'Muskatnuss, Salz, Pfeffer', 'Basilikum zum Garnieren']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Zwiebel und Knoblauch fein würfeln und in etwas Olivenöl andünsten, mit den stückigen Tomaten ablöschen und 10 Minuten zu einer Sauce einkochen, mit Salz und Pfeffer abschmecken. Zucchini in dünne Längsscheiben schneiden. Ricotta mit einer Prise Muskatnuss verrühren. In einer Auflaufform abwechselnd Tomatensauce, Zucchinischeiben und Ricotta schichten, bis alle Zutaten aufgebraucht sind. Mit gerissenem Mozzarella und Parmesan bestreuen und 30 Minuten backen, bis die Oberfläche goldbraun ist. Mit frischem Basilikum garniert servieren.'
where title = 'Zucchini-Lasagne mit Ricotta';
update public.recipes set
  ingredients = array['200 g Lachsfilet', '1 EL Misopaste', '1 TL Honig', '1 TL Sojasauce', '200 g Brokkoli', '150 g Reis', '1 Stück Ingwer, gerieben', '1 EL Sesam, Frühlingszwiebel']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Misopaste mit Honig, Sojasauce und geriebenem Ingwer zu einer Marinade verrühren und den Lachs damit bestreichen, kurz ziehen lassen. Reis nach Packungsanweisung kochen. Lachs auf ein mit Backpapier ausgelegtes Blech legen und 12–15 Minuten backen, bis er gar ist und die Marinade leicht karamellisiert. Brokkoli in Röschen teilen und in der Zwischenzeit 5 Minuten dämpfen, bis er bissfest ist. Alles zusammen mit dem Reis anrichten, mit Sesam und Frühlingszwiebelringen bestreuen.'
where title = 'Miso-Lachs mit Brokkoli und Reis';
update public.recipes set
  ingredients = array['400 g Kichererbsen (Dose)', '200 g Spinat', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kreuzkümmel', '400 g stückige Tomaten', '2 EL Naturjoghurt']::text[],
  instructions = 'Zwiebel, Knoblauch und Ingwer fein hacken. In einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypulver und Kreuzkümmel zugeben und kurz mitrösten, bis die Gewürze aromatisch duften. Mit den stückigen Tomaten ablöschen, die abgetropften Kichererbsen zugeben und alles 10 Minuten köcheln lassen, damit sich die Aromen verbinden. Spinat unterrühren und zusammenfallen lassen, mit Salz und Pfeffer abschmecken. Mit einem Klecks Naturjoghurt servieren.'
where title = 'Kichererbsen-Spinat-Curry mit Naturjoghurt';
update public.recipes set
  ingredients = array['200 g Putenschnitzel', '250 g grüner Spargel', '2 EL Mehl', '2 EL Butter', '1 Knoblauchzehe', 'Zitrone (Saft und Schale)', 'Petersilie', 'Salz, Pfeffer']::text[],
  instructions = 'Spargel waschen und die holzigen Enden abschneiden. Putenschnitzel salzen, pfeffern und leicht in Mehl wenden. In einer Pfanne mit etwas Butter von beiden Seiten goldbraun und durchgebraten braten, dann warm stellen. Spargel in derselben Pfanne mit etwas Wasser und einer zerdrückten Knoblauchzehe 6–8 Minuten dünsten, bis er bissfest ist. Restliche Butter mit Zitronensaft und -schale in einem kleinen Topf schmelzen. Schnitzel und Spargel auf Tellern anrichten, mit der Zitronenbutter beträufeln und mit gehackter Petersilie bestreuen.'
where title = 'Putenschnitzel mit grünem Spargel und Zitronenbutter';
update public.recipes set
  ingredients = array['2 Auberginen', '200 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypaste', '1 TL Kurkuma', '200 g stückige Tomaten', 'Koriander zum Garnieren']::text[],
  instructions = 'Auberginen in Würfel schneiden, Zwiebel, Knoblauch und Ingwer fein hacken. Öl in einem Topf erhitzen und die Auberginenwürfel darin rundum anbraten, bis sie leicht Farbe annehmen, dann herausnehmen. Zwiebel, Knoblauch und Ingwer im selben Topf andünsten, Currypaste und Kurkuma zugeben und kurz mitrösten. Mit Kokosmilch und stückigen Tomaten ablöschen, die Auberginen zurückgeben und alles 15 Minuten köcheln lassen, bis die Auberginen weich sind. Mit Salz abschmecken und mit frischem Koriander garniert servieren.'
where title = 'Auberginen-Curry mit Kokosmilch und Koriander';
update public.recipes set
  ingredients = array['200 g Jakobsmuscheln', '250 g TK-Erbsen', '1 Schalotte', '2 EL Butter', '2 EL Sahne', 'Minze', 'Zitrone', 'Salz, Pfeffer']::text[],
  instructions = 'Schalotte fein würfeln und in etwas Butter glasig dünsten. Erbsen zugeben und 3–4 Minuten mitdünsten, dann mit etwas Wasser auffüllen und weich kochen. Erbsen mit Sahne, Minze, Salz und Pfeffer fein pürieren, bei Bedarf durch ein Sieb streichen für eine besonders cremige Konsistenz. Jakobsmuscheln trocken tupfen, salzen und pfeffern. In einer sehr heißen Pfanne mit etwas Butter je Seite 1–2 Minuten scharf anbraten, bis sie goldbraun sind, aber innen noch glasig bleiben. Erbsenpüree auf Tellern verteilen, Jakobsmuscheln daraufsetzen und mit Zitronensaft beträufeln.'
where title = 'Gebratene Jakobsmuscheln mit Erbsenpüree';
update public.recipes set
  ingredients = array['400 g weiße Bohnen (Dose)', '100 g Chorizo', '1 Zwiebel', '2 Knoblauchzehen', '1 Karotte', '1 Paprika', '1 TL Paprikapulver', '300 ml Gemüsebrühe', '1 Lorbeerblatt']::text[],
  instructions = 'Zwiebel, Knoblauch, Karotte und Paprika klein schneiden. Chorizo in Scheiben schneiden und in einem Topf ohne zusätzliches Fett anbraten, bis sie ihr Öl abgibt. Zwiebel, Knoblauch, Karotte und Paprika zugeben und mitdünsten, bis das Gemüse weich wird. Mit Paprikapulver bestäuben, kurz mitrösten und mit der Gemüsebrühe ablöschen. Bohnen und Lorbeerblatt zugeben und alles 15–20 Minuten köcheln lassen, bis der Eintopf sämig ist. Lorbeerblatt entfernen und mit Salz und Pfeffer abschmecken.'
where title = 'Bohnen-Eintopf mit Chorizo';
update public.recipes set
  ingredients = array['200 g Feta', '300 g Cherrytomaten', '2 Knoblauchzehen', '3 EL Olivenöl', '1 TL Oregano', 'Chiliflocken (optional)', '4 Scheiben Vollkornbrot', 'Basilikum']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Feta in die Mitte einer Auflaufform legen und die Cherrytomaten sowie die halbierten Knoblauchzehen drum herum verteilen. Mit Olivenöl beträufeln, mit Oregano und nach Belieben Chiliflocken bestreuen. 20–25 Minuten backen, bis die Tomaten geplatzt sind und der Feta leicht Farbe angenommen hat. In der Zwischenzeit die Vollkornbrotscheiben rösten. Feta und Tomaten mit einer Gabel leicht zerdrücken und vermengen, mit frischem Basilikum bestreuen und zusammen mit dem gerösteten Brot servieren.'
where title = 'Gebackener Feta mit Cherrytomaten und Vollkornbrot';
update public.recipes set
  ingredients = array['200 g Tofu', '200 g Brokkoli', '150 g Jasminreis', '2 Knoblauchzehen', '1 Stück Ingwer', '3 EL Teriyaki-Sauce', '1 EL Sesamöl', '1 EL Sesam', 'Frühlingszwiebel']::text[],
  instructions = 'Jasminreis nach Packungsanweisung kochen. Tofu trocken tupfen und in Würfel schneiden, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne erhitzen und den Tofu darin von allen Seiten knusprig braten, dann herausnehmen. Knoblauch und Ingwer kurz in derselben Pfanne andünsten, Brokkoliröschen zugeben und 5 Minuten braten, bis sie bissfest sind. Tofu zurück in die Pfanne geben, mit der Teriyaki-Sauce ablöschen und alles gut vermengen, bis die Sauce leicht andickt. Mit Jasminreis anrichten und mit Sesam und Frühlingszwiebelringen bestreuen.'
where title = 'Teriyaki-Tofu mit Brokkoli und Jasminreis';
update public.recipes set
  ingredients = array['250 g Hähnchenbrust', '1 Süßkartoffel', '200 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kreuzkümmel', 'Koriander zum Garnieren']::text[],
  instructions = 'Hähnchenbrust in mundgerechte Stücke schneiden, Zwiebel, Knoblauch und Ingwer fein hacken, Süßkartoffel schälen und würfeln. Öl in einem Topf erhitzen und das Hähnchen darin anbraten, bis es Farbe annimmt, dann herausnehmen. Zwiebel, Knoblauch und Ingwer im selben Topf andünsten, Currypulver und Kreuzkümmel zugeben und kurz mitrösten. Süßkartoffelwürfel und Kokosmilch zugeben, Hähnchen zurück in den Topf geben und alles 15–18 Minuten köcheln lassen, bis die Süßkartoffel weich und das Hähnchen durchgegart ist. Mit Salz abschmecken und mit frischem Koriander bestreut servieren.'
where title = 'Hähnchen-Curry mit Süßkartoffel';
update public.recipes set
  ingredients = array['200 g Seelachsfilet', '1 Fenchelknolle', '1 Schalotte', '2 EL Naturjoghurt', 'Dill', 'Zitrone (Saft und Schale)', 'Petersilie', 'Salz, Pfeffer']::text[],
  instructions = 'Fenchel putzen und in dünne Streifen schneiden, Schalotte fein würfeln. Beides in einem Topf mit etwas Wasser oder Gemüsebrühe bei mittlerer Hitze 8–10 Minuten dünsten, bis der Fenchel weich ist. Seelachsfilet mit Salz und Pfeffer würzen und auf den Fenchel legen, Deckel schließen und weitere 6–8 Minuten mitdämpfen, bis der Fisch gar ist. Naturjoghurt mit gehacktem Dill, Zitronensaft und -schale zu einer cremigen Sauce verrühren. Fisch und Fenchel auf Tellern anrichten, mit der Dillsauce beträufeln und mit frischer Petersilie garnieren.'
where title = 'Gedämpfter Seelachs mit Fenchel und Dillsauce';
update public.recipes set
  ingredients = array['200 g rote Linsen', '400 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 TL Kurkuma', '2 Naan-Brote', 'Koriander zum Garnieren']::text[],
  instructions = 'Linsen unter kaltem Wasser abspülen, bis das Wasser klar bleibt. Zwiebel, Knoblauch und Ingwer fein hacken und in einem Topf mit etwas Öl andünsten, bis die Zwiebel glasig ist. Currypulver und Kurkuma zugeben und kurz mitrösten, bis die Gewürze aromatisch duften. Linsen und Kokosmilch zugeben, mit etwas Wasser auffüllen und bei mittlerer Hitze 15–18 Minuten köcheln lassen, dabei gelegentlich umrühren, bis das Dal sämig ist. Mit Salz abschmecken und mit frischem Koriander bestreut zusammen mit warmem Naan servieren.'
where title = 'Rote-Linsen-Dal mit Naan';


-- 66 weitere bestehende Rezepte (Grundgerüst + frühere Ergänzungen) wurden
-- ebenfalls um mehr Zutaten und eine ausführlichere Zubereitung erweitert.
-- Als Update statt erneutem Insert, unabhängig vom bisherigen Befüllungsstand.
update public.recipes set
  ingredients = array['150 g rote Linsen', '1 Süßkartoffel', '1 rote Paprika', '1 Zwiebel', '1 Knoblauchzehe', '2 EL Olivenöl', '1 TL Kreuzkümmel', 'Saft einer halben Zitrone', 'Salz, Pfeffer, Petersilie']::text[],
  instructions = 'Linsen nach Packungsangabe in reichlich Wasser 15–20 Minuten weich kochen und abgießen. Süßkartoffel und Paprika würfeln, mit 1 EL Olivenöl, Kreuzkümmel, Salz und Pfeffer vermengen und 20 Minuten bei 200°C rösten, bis sie weich sind. Zwiebel und Knoblauch fein hacken und in der Zwischenzeit in etwas Öl glasig dünsten. Linsen, Ofengemüse und Zwiebelmischung in einer Bowl vermengen, mit Zitronensaft und restlichem Olivenöl abschmecken. Mit frischer Petersilie bestreut servieren.'
where title = 'Linsen-Bowl mit Ofengemüse';
update public.recipes set
  ingredients = array['60 g Haferflocken', '200 ml Milch oder Pflanzendrink', '1 TL Chiasamen', '100 g gemischte Beeren', '1 TL Honig', '1 Prise Zimt', '1 EL Mandelblättchen']::text[],
  instructions = 'Haferflocken mit der Milch und den Chiasamen in einem Topf aufkochen. Bei mittlerer Hitze 3–4 Minuten köcheln lassen, dabei gelegentlich umrühren, bis die Masse sämig ist. Vom Herd nehmen und kurz quellen lassen. In eine Schale füllen, mit den Beeren, einer Prise Zimt und Honig toppen. Mit gerösteten Mandelblättchen bestreuen und warm servieren.'
where title = 'Haferflocken mit Beeren';
update public.recipes set
  ingredients = array['1 Apfel', '1 EL Mandelmus', '1 Prise Zimt', '1 TL Kokosflocken']::text[],
  instructions = 'Apfel waschen, vierteln, entkernen und in dünne Spalten schneiden. Auf einem Teller fächerförmig anrichten. Mandelmus leicht erwärmen, bis es cremig-flüssig wird, und über die Apfelspalten träufeln. Mit einer Prise Zimt und Kokosflocken bestreuen.'
where title = 'Apfel mit Mandelmus';
update public.recipes set
  ingredients = array['400 g Kichererbsen (Dose)', '200 ml Kokosmilch', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypulver', '1 EL Tomatenmark', '1 Handvoll Spinat', 'Koriander zum Garnieren']::text[],
  instructions = 'Zwiebel, Knoblauch und Ingwer fein hacken und in etwas Öl andünsten, bis die Zwiebel glasig ist. Currypulver und Tomatenmark zugeben und kurz mitrösten, bis es aromatisch duftet. Mit Kokosmilch ablöschen, die abgetropften Kichererbsen zugeben und 10 Minuten köcheln lassen. Spinat unterrühren und zusammenfallen lassen, mit Salz abschmecken. Mit frischem Koriander bestreut servieren.'
where title = 'Kichererbsen-Curry';
update public.recipes set
  ingredients = array['150 g Quinoa', '100 g Feta', '1 Granatapfel', '1 Salatgurke', '1/2 rote Zwiebel', '2 EL Olivenöl', 'Saft 1 Zitrone', 'Minze', '1 EL Kürbiskerne']::text[],
  instructions = 'Quinoa nach Packungsangabe in Salzwasser kochen, abgießen und vollständig abkühlen lassen. Gurke würfeln, rote Zwiebel fein hacken und Granatapfelkerne aus der Frucht lösen. Feta grob zerbröseln. Alle Zutaten mit dem abgekühlten Quinoa in einer großen Schüssel vermengen. Mit Olivenöl, Zitronensaft und gehackter Minze abschmecken, mit Kürbiskernen bestreut servieren.'
where title = 'Quinoa-Salat mit Feta und Granatapfel';
update public.recipes set
  ingredients = array['150 g Lachsfilet', '200 g Brokkoli', '2 EL Olivenöl', '2 Knoblauchzehen', 'Zitrone (Saft und Scheiben)', 'Dill', 'Chiliflocken (optional)', 'Salz, Pfeffer']::text[],
  instructions = 'Backofen auf 200°C vorheizen und ein Blech mit Backpapier auslegen. Brokkoli in Röschen teilen, Knoblauch fein hacken. Lachs und Brokkoli auf dem Blech verteilen, mit Öl beträufeln, mit Knoblauch, Salz, Pfeffer und nach Belieben Chiliflocken würzen. Mit Zitronenscheiben belegen und 15–18 Minuten backen, bis der Lachs gar ist und der Brokkoli bissfest bleibt. Mit frischem Dill und Zitronensaft servieren.'
where title = 'Gebackener Lachs mit Brokkoli';
update public.recipes set
  ingredients = array['200 g griechischer Joghurt', '20 g gemischte Nüsse', '1 TL Kürbiskerne', '1 TL Honig', '1 Prise Zimt', '50 g Beeren']::text[],
  instructions = 'Joghurt in eine Schale füllen und glattstreichen. Nüsse grob hacken. Joghurt mit Nüssen, Kürbiskernen und Beeren toppen. Mit Honig beträufeln und mit einer Prise Zimt bestreuen.'
where title = 'Griechischer Joghurt mit Nüssen und Honig';
update public.recipes set
  ingredients = array['3 Eier', '1 EL Milch', '50 g Spinat', '1 Tomate', '1/2 Zwiebel', '30 g Feta', '1 EL Olivenöl', 'Salz, Pfeffer, Basilikum']::text[],
  instructions = 'Eier mit Milch, Salz und Pfeffer in einer Schüssel verquirlen. Zwiebel fein würfeln, Tomate in Scheiben schneiden. Zwiebel in Öl glasig dünsten, Spinat und Tomate zugeben und kurz zusammenfallen lassen. Eimasse dazugießen und bei mittlerer Hitze stocken lassen, dabei den Rand gelegentlich zur Mitte ziehen. Mit Feta bestreuen, zusammenklappen und mit frischem Basilikum servieren.'
where title = 'Gemüse-Omelett mit Spinat und Tomaten';
update public.recipes set
  ingredients = array['1 Süßkartoffel', '100 g Kichererbsen (Dose)', '60 g Grünkohl', '1/4 rote Zwiebel', '1 TL Kreuzkümmel', '1 EL Tahini', 'Saft 1/2 Zitrone', '1 EL Olivenöl', '1 TL Sesam']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Süßkartoffel würfeln, mit den abgetropften Kichererbsen, Kreuzkümmel und etwas Öl vermengen und 20 Minuten rösten, bis alles weich und leicht geröstet ist. Grünkohl von den Stielen zupfen, in Streifen schneiden und mit etwas Öl kurz mit den Händen massieren, bis er weicher wird. Rote Zwiebel in dünne Ringe schneiden. Tahini mit Zitronensaft und etwas Wasser zu einem cremigen Dressing verrühren. Alle Komponenten in einer Bowl anrichten, mit dem Dressing beträufeln und mit Sesam bestreuen.'
where title = 'Buddha Bowl mit Süßkartoffel und Tahini-Dressing';
update public.recipes set
  ingredients = array['100 g Vollkornnudeln', '3 EL Pesto', '150 g Kirschtomaten', '1 Knoblauchzehe', '1 EL Olivenöl', '20 g Parmesan', '1 EL Pinienkerne', 'Basilikum']::text[],
  instructions = 'Nudeln nach Packungsangabe in Salzwasser bissfest kochen und abgießen, dabei etwas Nudelwasser auffangen. Kirschtomaten halbieren, Knoblauch fein hacken. Olivenöl in einer Pfanne erhitzen, Knoblauch und Tomaten kurz andünsten. Nudeln zugeben, Pesto unterrühren und bei Bedarf mit etwas Nudelwasser verlängern. Mit geriebenem Parmesan, gerösteten Pinienkernen und frischem Basilikum servieren.'
where title = 'Vollkornnudeln mit Pesto und Kirschtomaten';
update public.recipes set
  ingredients = array['50 g Haferflocken', '1 EL Chiasamen', '200 ml Pflanzendrink', '1 TL Ahornsirup', '1 Prise Zimt', '1/2 Mango', '1 TL Kokosraspeln']::text[],
  instructions = 'Haferflocken, Chiasamen, Pflanzendrink, Ahornsirup und eine Prise Zimt in einem Glas oder einer Schüssel gut verrühren. Abgedeckt über Nacht (mindestens 4 Stunden) im Kühlschrank quellen lassen. Am nächsten Morgen die Konsistenz prüfen und bei Bedarf mit etwas Pflanzendrink verdünnen. Mango schälen und würfeln. Overnight Oats mit den Mangowürfeln toppen und mit Kokosraspeln bestreuen.'
where title = 'Overnight Oats mit Chiasamen und Mango';
update public.recipes set
  ingredients = array['150 g Hähnchenbrust', '1 Zucchini', '1 Paprika', '1 rote Zwiebel', '1 Knoblauchzehe', '2 EL Olivenöl', '1 TL Kräuter der Provence', 'Zitrone, Salz, Pfeffer']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Zucchini, Paprika und Zwiebel in mundgerechte Stücke schneiden, Knoblauch fein hacken. Gemüse mit 1 EL Olivenöl, Kräutern der Provence, Salz und Pfeffer vermengen und auf einem Blech 20 Minuten rösten. Hähnchenbrust salzen, pfeffern und in einer Pfanne mit restlichem Öl von beiden Seiten goldbraun braten, bis sie durchgegart ist. In Streifen schneiden und mit dem Ofengemüse und etwas Zitronensaft servieren.'
where title = 'Gebratenes Hähnchen mit Ofengemüse';
update public.recipes set
  ingredients = array['2 Eier', '1 rote Paprika', '200 g gehackte Tomaten', '1 Zwiebel', '2 Knoblauchzehen', '30 g Feta', '1 TL Paprikapulver', '1/2 TL Kreuzkümmel', '1 EL Olivenöl, Petersilie']::text[],
  instructions = 'Zwiebel, Paprika und Knoblauch fein würfeln. In Olivenöl bei mittlerer Hitze andünsten, bis das Gemüse weich ist. Paprikapulver und Kreuzkümmel zugeben und kurz mitrösten, bis sie aromatisch duften. Gehackte Tomaten zugeben und 10 Minuten köcheln lassen, bis die Sauce eindickt. Mit einem Löffel zwei Mulden in die Sauce drücken, die Eier hineingleiten lassen und bei geschlossenem Deckel 5–6 Minuten stocken lassen. Mit Feta bestreuen und mit frischer Petersilie servieren.'
where title = 'Shakshuka mit Paprika und Feta';
update public.recipes set
  ingredients = array['1 Dose Thunfisch (im eigenen Saft)', '1 Dose weiße Bohnen', '1/2 rote Zwiebel', '150 g Kirschtomaten', '1 Stange Staudensellerie', '2 EL Olivenöl', 'Saft einer Zitrone', 'Petersilie, Salz, Pfeffer']::text[],
  instructions = 'Bohnen in einem Sieb abspülen und gut abtropfen lassen. Rote Zwiebel fein würfeln, Sellerie in kleine Stücke schneiden, Kirschtomaten halbieren. Thunfisch abtropfen lassen und mit einer Gabel grob zerpflücken. Alle Zutaten in einer Schüssel vermengen. Mit Olivenöl und Zitronensaft abschmecken, mit Salz und Pfeffer würzen und mit frischer Petersilie bestreuen.'
where title = 'Thunfisch-Salat mit weißen Bohnen';
update public.recipes set
  ingredients = array['150 g Tofu', '200 g gemischtes Wokgemüse', '2 Knoblauchzehen', '1 Stück Ingwer', '20 g Cashewkerne', '2 EL Sojasauce', '1 EL Sesamöl', 'Frühlingszwiebel', '150 g Reis']::text[],
  instructions = 'Reis nach Packungsanweisung kochen. Tofu trocken tupfen und würfeln, Knoblauch und Ingwer fein hacken. Sesamöl in einem Wok oder einer großen Pfanne stark erhitzen und den Tofu darin rundum knusprig braten, dann herausnehmen. Knoblauch und Ingwer kurz anbraten, Wokgemüse zugeben und unter Wenden 4–5 Minuten braten, bis es bissfest ist. Tofu zurückgeben, mit Sojasauce ablöschen, Cashewkerne unterheben. Mit Reis und Frühlingszwiebelringen servieren.'
where title = 'Gemüse-Wok mit Tofu und Cashewkernen';
update public.recipes set
  ingredients = array['80 g Vollkornmehl', '1 TL Backpulver', '1 Ei', '150 ml Milch', '1/2 TL Vanilleextrakt', '1 TL Butter zum Braten', '100 g gemischte Beeren', '1 TL Honig']::text[],
  instructions = 'Mehl und Backpulver in einer Schüssel vermengen. Ei, Milch und Vanilleextrakt in einer zweiten Schüssel verquirlen und zur Mehlmischung geben, glattrühren. Butter in einer Pfanne bei mittlerer Hitze zerlassen und kleine Pfannkuchen darin von jeder Seite 2–3 Minuten goldbraun backen. Fertige Pfannkuchen warmstellen, bis der ganze Teig verbraucht ist. Mit frischen Beeren und Honig servieren.'
where title = 'Vollkorn-Pfannkuchen mit Beeren';
update public.recipes set
  ingredients = array['400 g Hokkaido-Kürbis', '1 Zwiebel', '1 Knoblauchzehe', '1 Stück Ingwer', '1 EL Öl', '400 ml Gemüsebrühe', '100 ml Kokosmilch', '1 EL Kürbiskerne']::text[],
  instructions = 'Kürbis waschen, entkernen und würfeln (Hokkaido kann mit Schale verwendet werden). Zwiebel, Knoblauch und Ingwer fein hacken und in Öl andünsten, bis die Zwiebel glasig ist. Kürbiswürfel zugeben und kurz mitdünsten. Mit Gemüsebrühe ablöschen und 15–18 Minuten köcheln lassen, bis der Kürbis weich ist. Suppe fein pürieren, Kokosmilch unterrühren und nochmals kurz erwärmen. Mit gerösteten Kürbiskernen bestreut servieren.'
where title = 'Kürbissuppe mit Ingwer';
update public.recipes set
  ingredients = array['6 Falafel (Kichererbsen)', '1 Vollkorn-Wrap', 'Salatblätter', '1 Tomate', '1/2 Gurke', '1/4 rote Zwiebel', '3 EL Joghurt', '1/2 Knoblauchzehe, Zitronensaft']::text[],
  instructions = 'Falafel nach Packungsanweisung in der Pfanne oder im Ofen erhitzen, bis sie außen knusprig sind. Tomate und Gurke in Scheiben, rote Zwiebel in dünne Ringe schneiden. Joghurt mit fein gepresstem Knoblauch und Zitronensaft zu einem Dip verrühren. Wrap kurz in der Pfanne erwärmen, damit er sich besser rollen lässt. Mit Salat, Tomate, Gurke, Zwiebel und Falafel belegen, den Joghurt-Dip darüberträufeln und fest einrollen.'
where title = 'Falafel-Wrap mit Joghurt-Dip';
update public.recipes set
  ingredients = array['1 große Süßkartoffel', '100 g Hüttenkäse', 'Frühlingszwiebel', '1 TL Paprikapulver', '1 EL Kürbiskerne', 'etwas Olivenöl, Salz, Pfeffer']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Süßkartoffel waschen, mehrfach mit einer Gabel einstechen und mit etwas Öl einreiben. 45–50 Minuten backen, bis sie weich ist. Süßkartoffel längs halbieren und das Fruchtfleisch leicht auflockern. Mit Hüttenkäse füllen, mit Salz und Pfeffer würzen. Mit Frühlingszwiebelringen, Paprikapulver und Kürbiskernen bestreuen.'
where title = 'Gebackene Süßkartoffel mit Hüttenkäse';
update public.recipes set
  ingredients = array['1 Banane', '50 g Spinat', '200 ml Pflanzendrink', '1 Scoop Proteinpulver', '1 TL Chiasamen', '1 Prise Zimt', 'Eiswürfel']::text[],
  instructions = 'Banane schälen und grob in Stücke brechen. Spinat, Pflanzendrink, Proteinpulver, Chiasamen und Zimt zusammen mit der Banane in einen Mixer geben. Eiswürfel zugeben und alles auf höchster Stufe 30–60 Sekunden fein pürieren, bis eine cremige Konsistenz entsteht. Bei Bedarf mit etwas mehr Pflanzendrink verdünnen und sofort servieren.'
where title = 'Protein-Smoothie mit Spinat und Banane';
update public.recipes set
  ingredients = array['200 g gekochte Rote Bete', '60 g Ziegenkäse', '20 g Walnüsse', '60 g Rucola', '2 EL Olivenöl', '1 EL Balsamico-Essig', '1 TL Honig', 'Thymian']::text[],
  instructions = 'Rote Bete in mundgerechte Würfel oder Scheiben schneiden. Rucola auf einem Teller oder einer Platte verteilen, die Rote Bete darauf anrichten. Ziegenkäse in Scheiben schneiden oder grob bröckeln und über den Salat verteilen. Walnüsse grob hacken und in einer trockenen Pfanne kurz anrösten, bis sie duften. Olivenöl, Balsamico-Essig und Honig zu einem Dressing verrühren, über den Salat träufeln. Mit gerösteten Walnüssen und Thymian bestreut servieren.'
where title = 'Rote-Bete-Salat mit Ziegenkäse und Walnüssen';
update public.recipes set
  ingredients = array['150 g Tofu', '200 g gemischtes Gemüse', '1 Zwiebel', '2 Knoblauchzehen', '2 TL Currypaste', '200 ml Kokosmilch', '60 g Jasminreis', 'Koriander zum Garnieren']::text[],
  instructions = 'Jasminreis nach Packungsanweisung kochen. Tofu würfeln, Zwiebel und Knoblauch fein hacken. Tofu in etwas Öl von allen Seiten anbraten und herausnehmen. Zwiebel und Knoblauch im selben Topf andünsten, Currypaste zugeben und kurz mitrösten. Gemüse und Kokosmilch zugeben, 10 Minuten köcheln lassen, bis das Gemüse gar ist, den Tofu zurückgeben und kurz erwärmen. Mit Reis und frischem Koriander servieren.'
where title = 'Gemüsecurry mit Tofu und Jasminreis';
update public.recipes set
  ingredients = array['200 g Putenbrust', '150 g Champignons', '1 Zwiebel', '1 Knoblauchzehe', '1 EL Öl', '50 ml Gemüsebrühe', '100 ml Sahne', 'Petersilie, Salz, Pfeffer']::text[],
  instructions = 'Putenbrust in dünne Streifen schneiden, salzen und pfeffern. In heißem Öl portionsweise scharf anbraten und herausnehmen. Zwiebel und Knoblauch fein würfeln, Champignons in Scheiben schneiden. Beides im selben Topf andünsten, bis die Pilze Farbe annehmen. Mit Brühe ablöschen, Sahne zugeben und kurz einkochen lassen. Pute zurückgeben, kurz durchschwenken und mit Salz, Pfeffer und Petersilie abschmecken.'
where title = 'Putengeschnetzeltes mit Champignons';
update public.recipes set
  ingredients = array['150 g Tomaten', '125 g Mozzarella', 'Basilikum', '2 EL Olivenöl', '1 EL Balsamico-Creme', '1 Scheibe Vollkornbaguette', '1 Knoblauchzehe', 'Salz, Pfeffer']::text[],
  instructions = 'Tomaten und Mozzarella in gleichmäßige Scheiben schneiden. Abwechselnd fächerförmig auf einem Teller anrichten. Mit Salz, Pfeffer und Olivenöl beträufeln, mit Balsamico-Creme verzieren. Vollkornbaguette toasten und mit einer angeschnittenen Knoblauchzehe einreiben. Salat mit frischen Basilikumblättern garnieren und mit dem Knoblauch-Baguette servieren.'
where title = 'Caprese-Salat mit Vollkornbaguette';
update public.recipes set
  ingredients = array['2 EL Miso-Paste', '100 g Tofu', '1 EL getrocknete Wakame-Algen', '500 ml Wasser oder Gemüsebrühe', 'Frühlingszwiebel', '1 TL Sesam']::text[],
  instructions = 'Wakame-Algen in kaltem Wasser 5 Minuten einweichen, bis sie sich entfalten, dann abtropfen lassen. Wasser oder Brühe in einem Topf erhitzen, aber nicht kochen lassen. Etwas von der heißen Flüssigkeit abnehmen, Miso-Paste darin glattrühren und zurück in den Topf geben. Tofu würfeln und zusammen mit den Wakame-Algen in die Suppe geben, kurz erwärmen. Mit Frühlingszwiebelringen und Sesam bestreut servieren.'
where title = 'Miso-Suppe mit Tofu und Wakame';
update public.recipes set
  ingredients = array['1 Forelle (ausgenommen)', '1 Zitrone', 'Dill', 'Petersilie', '1 Knoblauchzehe', '2 EL Olivenöl', 'Salz, Pfeffer']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Forelle innen und außen salzen und pfeffern. Zitrone in Scheiben schneiden, Knoblauch in dünne Scheiben schneiden. Forelle mit Zitronenscheiben, Knoblauch, Dill und Petersilie füllen. Mit Olivenöl beträufeln, in Alufolie oder eine Auflaufform legen und 20–25 Minuten backen, bis das Fleisch sich leicht von den Gräten löst. Mit zusätzlichem Zitronensaft beträufelt servieren.'
where title = 'Gebackene Forelle mit Zitrone und Kräutern';
update public.recipes set
  ingredients = array['1 Dose Kidneybohnen', '1 Dose Mais', '400 g gehackte Tomaten', '1 Paprika', '1 Zwiebel', '2 Knoblauchzehen', '1 EL Tomatenmark', '1 TL Chilipulver', '1 TL Kreuzkümmel']::text[],
  instructions = 'Zwiebel, Knoblauch und Paprika fein würfeln. In etwas Öl andünsten, bis das Gemüse weich ist. Tomatenmark, Chilipulver und Kreuzkümmel zugeben und kurz mitrösten. Gehackte Tomaten zugeben und aufkochen lassen. Abgetropfte Bohnen und Mais unterrühren und alles 20 Minuten bei niedriger Hitze köcheln lassen, bis die Sauce eindickt. Mit Salz und Pfeffer abschmecken.'
where title = 'Bohnen-Chili sin Carne';
update public.recipes set
  ingredients = array['120 g Couscous', '150 ml heißes Wasser', '1 Dose Kichererbsen', '1 Gurke', '100 g Kirschtomaten', '1/4 rote Zwiebel', 'Minze, Petersilie', 'Saft einer Zitrone', '2 EL Olivenöl']::text[],
  instructions = 'Couscous in eine Schüssel geben, mit heißem Wasser übergießen, abdecken und 10 Minuten quellen lassen, dann mit einer Gabel auflockern. Gurke und Kirschtomaten würfeln, rote Zwiebel fein hacken, Kräuter grob zupfen. Abgetropfte Kichererbsen zum Couscous geben. Gemüse und Kräuter untermischen. Mit Zitronensaft und Olivenöl abschmecken, mit Salz und Pfeffer würzen und kalt oder lauwarm servieren.'
where title = 'Couscous-Salat mit Kichererbsen und Minze';
update public.recipes set
  ingredients = array['2 Scheiben Vollkornbrot', '1 Avocado', '1 Ei', '1 EL Essig (für Pochierwasser)', 'Saft einer halben Zitrone', 'Chiliflocken', 'Salz, Sesam']::text[],
  instructions = 'Wasser mit einem Schuss Essig in einem Topf zum leichten Sieden bringen. Ei in eine Tasse aufschlagen und vorsichtig in einen kleinen Strudel im Wasser gleiten lassen, 3 Minuten pochieren. Brot in der Zwischenzeit toasten. Avocado mit einer Gabel zerdrücken, mit Zitronensaft und Salz abschmecken und auf dem Toast verteilen. Pochiertes Ei mit einer Schaumkelle herausheben, kurz abtropfen lassen und auf den Toast setzen. Mit Chiliflocken und Sesam bestreuen.'
where title = 'Avocado-Toast mit pochiertem Ei';
update public.recipes set
  ingredients = array['Zucchini', 'Paprika', 'rote Zwiebel', 'Champignons', '2 EL Olivenöl', 'Kräuter der Provence', 'Zitrone', '100 g Tzatziki']::text[],
  instructions = 'Gemüse waschen und in gleich große Stücke schneiden. Abwechselnd auf Holz- oder Metallspieße stecken. Mit Olivenöl bestreichen und mit Kräutern der Provence, Salz und Pfeffer würzen. Auf dem Grill oder in einer Grillpfanne von allen Seiten 8–10 Minuten grillen, bis das Gemüse gar und leicht gebräunt ist. Mit etwas Zitronensaft beträufeln und mit Tzatziki servieren.'
where title = 'Gemüsespieße vom Grill mit Tzatziki';
update public.recipes set
  ingredients = array['3 Eier', '1 EL Milch', '1 EL Butter', '1 Scheibe Vollkornbrot', '1/2 Avocado', 'Schnittlauch', 'Salz, Pfeffer']::text[],
  instructions = 'Eier mit Milch, Salz und Pfeffer verquirlen. Butter in einer Pfanne bei mittlerer Hitze zerlassen, Eimasse hineingeben. Unter ständigem Rühren mit einem Pfannenwender stocken lassen, bis das Rührei cremig, aber nicht trocken ist. Brot toasten, Avocado in Scheiben schneiden oder zerdrücken und auf dem Toast verteilen. Rührei daneben anrichten und mit frisch geschnittenem Schnittlauch bestreuen.'
where title = 'Rührei mit Vollkornbrot und Avocado';
update public.recipes set
  ingredients = array['2 Zucchini', '150 g Garnelen', '2 Knoblauchzehen', '150 g Kirschtomaten', '2 EL Olivenöl', 'Chiliflocken', 'Zitrone', 'Petersilie']::text[],
  instructions = 'Zucchini mit einem Spiralschneider oder Sparschäler zu Nudeln verarbeiten. Knoblauch fein hacken, Kirschtomaten halbieren. Olivenöl in einer Pfanne erhitzen, Garnelen mit Knoblauch und Chiliflocken 2–3 Minuten anbraten, bis sie rosa und gar sind, dann herausnehmen. Kirschtomaten in derselben Pfanne kurz anschwitzen, Zucchininudeln zugeben und 1–2 Minuten mitschwenken, bis sie warm, aber noch bissfest sind. Garnelen zurückgeben, mit Zitronensaft beträufeln und mit Petersilie bestreut servieren.'
where title = 'Zucchini-Nudeln mit Garnelen';
update public.recipes set
  ingredients = array['30 g Chiasamen', '200 ml Kokosmilch', '1/2 TL Vanilleextrakt', '1 TL Ahornsirup', '80 g gemischte Beeren', '1 EL Kokosraspeln']::text[],
  instructions = 'Chiasamen, Kokosmilch, Vanilleextrakt und Ahornsirup in einem Glas oder einer Schüssel gründlich verrühren. Nach 10 Minuten noch einmal umrühren, damit sich die Chiasamen nicht am Boden absetzen. Abgedeckt mindestens 3 Stunden oder über Nacht im Kühlschrank quellen lassen, bis eine puddingartige Konsistenz entsteht. Vor dem Servieren nochmals umrühren. Mit frischen Beeren und Kokosraspeln toppen.'
where title = 'Chia-Kokos-Pudding mit Beeren';
update public.recipes set
  ingredients = array['60 g Kichererbsenmehl', '100 ml Wasser', '1/4 TL Backpulver', '1/2 Zwiebel', '1/2 Paprika', '1/2 TL Kurkuma', '1/4 TL Kreuzkümmel', '1 EL Olivenöl', 'Petersilie, Salz']::text[],
  instructions = 'Kichererbsenmehl mit Wasser, Backpulver, Kurkuma, Kreuzkümmel und Salz in einer Schüssel zu einem glatten, dickflüssigen Teig verrühren, kurz ruhen lassen. Zwiebel und Paprika fein würfeln und unter den Teig heben. Öl in einer Pfanne erhitzen, den Teig hineingeben und gleichmäßig verteilen. Bei mittlerer Hitze 4–5 Minuten braten, bis die Unterseite goldbraun ist, dann vorsichtig wenden und weitere 3–4 Minuten fertig braten. Mit frischer Petersilie bestreut servieren.'
where title = 'Kichererbsen-Omelett mit Gemüse';
update public.recipes set
  ingredients = array['60 g Buchweizenflocken', '200 ml Kokosmilch', '1 Apfel', '1 TL Zimt', '1 TL Honig', '1 EL gehackte Walnüsse']::text[],
  instructions = 'Buchweizenflocken mit der Kokosmilch in einem Topf aufkochen. Bei niedriger Hitze 5 Minuten köcheln lassen, dabei häufig umrühren, bis das Porridge cremig ist. Apfel waschen, entkernen und würfeln. Die Hälfte des Apfels unter das Porridge heben und kurz miterwärmen. Porridge in eine Schale füllen, mit dem restlichen Apfel, Zimt und Honig toppen und mit gehackten Walnüssen bestreuen.'
where title = 'Buchweizen-Porridge mit Apfel und Zimt';
update public.recipes set
  ingredients = array['150 ml Kokosmilch', '1 EL Chiasamen', '1/2 Mango', '1/2 Banane', '1 EL Kokosraspeln', '1 EL Granola']::text[],
  instructions = 'Kokosmilch, Chiasamen und die Hälfte der Mango zusammen mit der Banane in einen Mixer geben. Alles fein pürieren, bis eine dickflüssige, cremige Masse entsteht. In eine Schale füllen. Restliche Mango würfeln und zusammen mit Kokosraspeln und Granola auf der Bowl verteilen. Sofort servieren, solange die Bowl noch kühl ist.'
where title = 'Kokos-Chia-Smoothie-Bowl mit Mango';
update public.recipes set
  ingredients = array['60 g Reisflocken', '200 ml Kokosmilch', '1/2 TL Vanilleextrakt', '1 Birne', '1 TL Zimt', '1 TL Honig']::text[],
  instructions = 'Reisflocken mit Kokosmilch und Vanilleextrakt in einem Topf aufkochen. Bei niedriger Hitze 5 Minuten köcheln lassen und quellen lassen, dabei gelegentlich umrühren. Birne waschen, entkernen und würfeln. Die Hälfte der Birnenwürfel unter das Porridge heben. In eine Schale füllen, mit den restlichen Birnenwürfeln, Zimt und Honig toppen.'
where title = 'Reisflocken-Porridge mit Birne';
update public.recipes set
  ingredients = array['150 g Lachsfilet', '1/2 Gurke', '1 Lorbeerblatt', 'einige Pfefferkörner', 'Dill', 'Zitrone', '1 EL Olivenöl']::text[],
  instructions = 'Wasser mit Lorbeerblatt und Pfefferkörnern in einem flachen Topf zum leichten Sieden bringen. Lachs vorsichtig hineinlegen und bei niedriger Hitze 8–10 Minuten gar ziehen lassen, bis er sich mit der Gabel leicht zerteilen lässt. Gurke in dünne Scheiben schneiden. Lachs aus dem Wasser heben und kurz abtropfen lassen. Mit Gurkenscheiben, frischem Dill und Zitronenspalten anrichten und mit Olivenöl beträufeln.'
where title = 'Pochierter Lachs mit Gurke und Dill';
update public.recipes set
  ingredients = array['200 g Kokosjoghurt', '1/2 Granatapfel', '1 EL Kürbiskerne', '1 TL Honig', '1 Prise Zimt']::text[],
  instructions = 'Kokosjoghurt in eine Schale füllen und glattstreichen. Granatapfel halbieren und die Kerne vorsichtig herauslösen. Joghurt mit den Granatapfelkernen und Kürbiskernen toppen. Mit Honig beträufeln und mit einer Prise Zimt bestreuen.'
where title = 'Kokosjoghurt-Bowl mit Granatapfel und Kürbiskernen';
update public.recipes set
  ingredients = array['3 Eier', '2 Scheiben Speck', '1/2 Avocado', '1 EL Butter', 'Salz, Pfeffer, Schnittlauch']::text[],
  instructions = 'Speck in einer Pfanne ohne zusätzliches Fett knusprig braten und auf Küchenpapier abtropfen lassen. Eier mit Salz und Pfeffer verquirlen. Butter in derselben Pfanne zerlassen, Eier hineingeben und unter Rühren stocken lassen, bis sie cremig sind. Avocado in Scheiben schneiden. Rührei mit Speck und Avocado auf einem Teller anrichten und mit Schnittlauch bestreuen.'
where title = 'Rührei mit Speck und Avocado';
update public.recipes set
  ingredients = array['100 g Frischkäse', '4 Scheiben Kochschinken', 'Schnittlauch', 'Pfeffer', '2 Radieschen']::text[],
  instructions = 'Frischkäse mit Pfeffer und fein geschnittenem Schnittlauch verrühren. Radieschen in dünne Scheiben schneiden. Kochschinkenscheiben auf einem Brett auslegen und dünn mit der Frischkäsemischung bestreichen. Radieschenscheiben darauf verteilen. Scheiben straff aufrollen und quer halbieren, mit der Schnittfläche nach oben anrichten.'
where title = 'Frischkäse-Röllchen mit Kochschinken';
update public.recipes set
  ingredients = array['1/2 Gurke', '1/2 Paprika', '1 Tomate', '1/4 rote Zwiebel', '60 g Feta', '8 Oliven', '2 EL Olivenöl', 'Oregano']::text[],
  instructions = 'Gurke, Paprika und Tomate in mundgerechte Stücke schneiden. Rote Zwiebel in dünne Ringe schneiden. Gemüse zusammen mit den Oliven in einer Schüssel vermengen. Feta in Würfeln darauf verteilen oder grob darüberbröckeln. Mit Olivenöl beträufeln und mit Oregano bestreuen.'
where title = 'Griechischer Salat mit Feta und Oliven';
update public.recipes set
  ingredients = array['150 g Lachsfilet', '1/2 Avocado', '1/2 Gurke', '2 Radieschen', '1 EL Olivenöl', 'Zitrone', '1 TL Sesam']::text[],
  instructions = 'Lachs in einer Pfanne mit etwas Öl von beiden Seiten 3–4 Minuten braten oder in leicht siedendem Wasser pochieren, bis er gar ist. Avocado und Gurke würfeln, Radieschen in dünne Scheiben schneiden. Gemüse in einer Bowl anrichten. Lachs in Stücke teilen und daraufsetzen. Mit Olivenöl und Zitronensaft beträufeln und mit Sesam bestreuen.'
where title = 'Lachs-Avocado-Bowl mit Gurke';
update public.recipes set
  ingredients = array['150 g Hähnchenbrust', 'Römersalat', '20 g Parmesan', '2 EL Olivenöl', 'Saft einer Zitrone', '1 Knoblauchzehe', '1 TL Senf', 'Salz, Pfeffer']::text[],
  instructions = 'Hähnchenbrust salzen, pfeffern und in einer Pfanne mit etwas Öl von beiden Seiten braten, bis sie durchgegart ist, dann kurz ruhen lassen. Römersalat waschen, trocken schleudern und in mundgerechte Stücke zupfen. Olivenöl, Zitronensaft, fein gepressten Knoblauch und Senf zu einem Dressing verrühren. Hähnchenbrust in Streifen schneiden. Salat mit dem Dressing vermengen, mit Hähnchenstreifen und gehobeltem Parmesan servieren.'
where title = 'Hähnchen-Salat mit Parmesan und Römersalat';
update public.recipes set
  ingredients = array['150 g Tofu', '250 g Blumenkohlreis', '1 Knoblauchzehe', '1 Stück Ingwer', '1 EL Sesamöl', '1 EL Sojasauce', 'Frühlingszwiebel']::text[],
  instructions = 'Tofu trocken tupfen und würfeln, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne erhitzen und den Tofu darin rundum knusprig anbraten, dann herausnehmen. Knoblauch und Ingwer kurz im selben Öl andünsten, Blumenkohlreis zugeben und 4–5 Minuten braten, bis er gar, aber noch bissfest ist. Tofu zurückgeben, mit Sojasauce ablöschen und alles gut vermengen. Mit Frühlingszwiebelringen bestreut servieren.'
where title = 'Gebratener Tofu mit Blumenkohlreis';
update public.recipes set
  ingredients = array['2 Zucchini', '1 Ei', '2 EL Mehl', '30 g Parmesan', '1 EL Öl zum Braten', 'Salz, Pfeffer', '100 g Frischkäse', 'Schnittlauch']::text[],
  instructions = 'Zucchini grob raspeln, mit etwas Salz vermengen und 10 Minuten ziehen lassen, dann überschüssige Flüssigkeit ausdrücken. Mit Ei, Mehl, geriebenem Parmesan, Salz und Pfeffer zu einem Teig vermengen. Öl in einer Pfanne erhitzen und aus dem Teig kleine Puffer formen, von beiden Seiten 3–4 Minuten goldbraun braten. Frischkäse mit fein geschnittenem Schnittlauch verrühren. Puffer mit dem Frischkäse-Dip servieren.'
where title = 'Zucchini-Puffer mit Frischkäse-Dip';
update public.recipes set
  ingredients = array['1 Gurke', '1 Dose weiße Bohnen', '1/2 Zwiebel', 'Dill', '2 EL Olivenöl', 'Saft einer Zitrone', '1 TL Senf', 'Salz, Pfeffer']::text[],
  instructions = 'Bohnen in einem Sieb abspülen und gut abtropfen lassen. Gurke würfeln, Zwiebel fein hacken. Olivenöl, Zitronensaft und Senf zu einem Dressing verrühren, mit Salz und Pfeffer abschmecken. Bohnen, Gurke und Zwiebel in einer Schüssel vermengen, mit dem Dressing übergießen und gut durchmischen. Mit reichlich frischem Dill bestreut servieren.'
where title = 'Gurken-Dill-Salat mit weißen Bohnen';
update public.recipes set
  ingredients = array['6 Reispapierblätter', '150 g Garnelen (gegart)', '1 Karotte', '1/2 Gurke', 'Salatblätter', 'Minze', 'Limette', 'Sojasauce zum Dippen']::text[],
  instructions = 'Karotte und Gurke in feine Streifen schneiden. Garnelen längs halbieren, falls groß. Ein Reispapierblatt kurz in warmem Wasser einweichen, bis es weich wird, dann auf ein feuchtes Tuch legen. Mit Salatblatt, Karotten- und Gurkenstreifen, Garnelen und Minze belegen und straff aufrollen, dabei die Seiten nach innen klappen. Mit den restlichen Blättern genauso verfahren. Mit Limettenspalten und Sojasauce zum Dippen servieren.'
where title = 'Reispapier-Rollen mit Garnelen und Gemüse';
update public.recipes set
  ingredients = array['400 g Blumenkohl', '1 Zwiebel', '2 Knoblauchzehen', '1 Stück Ingwer', '2 TL Currypaste', '200 ml Kokosmilch', 'Koriander zum Garnieren']::text[],
  instructions = 'Zwiebel, Knoblauch und Ingwer fein hacken. In etwas Öl andünsten, bis die Zwiebel glasig ist. Currypaste zugeben und kurz mitrösten, bis sie aromatisch duftet. Blumenkohl in kleine Röschen teilen und zugeben, kurz mitschwenken. Mit Kokosmilch ablöschen und 15 Minuten köcheln lassen, bis der Blumenkohl weich ist. Mit Salz abschmecken und mit frischem Koriander bestreut servieren.'
where title = 'Blumenkohl-Curry mit Kokosmilch';
update public.recipes set
  ingredients = array['150 g Halloumi', '1 Zucchini', '2 EL Olivenöl', 'Kräuter der Provence', 'Zitrone', '1 TL Honig']::text[],
  instructions = 'Halloumi in etwa 1 cm dicke Scheiben schneiden, Zucchini in Scheiben schneiden. Olivenöl in einer Pfanne erhitzen und den Halloumi darin von beiden Seiten 2–3 Minuten goldbraun braten, dann herausnehmen. Zucchini in derselben Pfanne mit Kräutern der Provence 4–5 Minuten braten, bis sie leicht gebräunt ist. Halloumi zurück in die Pfanne geben, mit Honig beträufeln und kurz karamellisieren lassen. Mit Zitronensaft beträufelt servieren.'
where title = 'Gebratener Halloumi mit Zucchini';
update public.recipes set
  ingredients = array['180 g Rindersteak', '200 g grüner Spargel', '1 EL Öl', '1 EL Kräuterbutter', '1 Knoblauchzehe', 'Salz, Pfeffer']::text[],
  instructions = 'Steak mindestens 20 Minuten vor dem Braten aus dem Kühlschrank nehmen und mit Salz und Pfeffer würzen. Spargel waschen und die holzigen Enden abschneiden. Öl in einer Pfanne stark erhitzen und das Steak je nach gewünschtem Gargrad 2–4 Minuten pro Seite scharf anbraten, dann kurz ruhen lassen. Spargel mit zerdrückter Knoblauchzehe in der gleichen Pfanne 6–8 Minuten braten, bis er bissfest ist. Steak mit Kräuterbutter belegen und zusammen mit dem Spargel servieren.'
where title = 'Steak mit Kräuterbutter und grünem Spargel';
update public.recipes set
  ingredients = array['150 g Tofu', '250 g Brokkoli', '1 Knoblauchzehe', '1 Stück Ingwer', '1 EL Sesamöl', '1 EL Sojasauce', '1 TL Sesam']::text[],
  instructions = 'Tofu würfeln, Knoblauch und Ingwer fein hacken. Sesamöl in einer Pfanne erhitzen und den Tofu darin rundum goldbraun anbraten. Knoblauch und Ingwer zugeben und kurz mitbraten, bis es aromatisch duftet. Brokkoliröschen zugeben und unter Wenden 5 Minuten braten, bis sie bissfest sind. Mit Sojasauce ablöschen und kurz durchschwenken. Mit Sesam bestreut servieren.'
where title = 'Gebratener Tofu mit Brokkoli und Sesam';
update public.recipes set
  ingredients = array['1 Blumenkohl', '3 EL Olivenöl', 'Kräuter (z. B. Petersilie, Thymian)', '2 Knoblauchzehen', 'Zitrone', 'Salz, Pfeffer']::text[],
  instructions = 'Blumenkohl vom Strunk befreien und in etwa 2 cm dicke Scheiben schneiden, sodass "Steaks" entstehen. Mit Salz und Pfeffer würzen. Olivenöl in einer großen Pfanne erhitzen und die Blumenkohl-Steaks von jeder Seite 5–6 Minuten braten, bis sie goldbraun und weich sind. Knoblauch fein hacken, mit den Kräutern und etwas Olivenöl vermengen. Blumenkohl-Steaks mit dem Kräuteröl beträufeln und mit Zitronensaft servieren.'
where title = 'Blumenkohl-Steak mit Kräuteröl';
update public.recipes set
  ingredients = array['2 Zucchini', '100 g rote Linsen', '1 Zwiebel', '1 Knoblauchzehe', '2 EL Tomatenmark', '1 TL Paprikapulver', 'Kräuter (z. B. Oregano)', 'Salz, Pfeffer']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Linsen in Wasser 10–12 Minuten weich kochen und abgießen. Zucchini längs halbieren und mit einem Löffel etwas aushöhlen. Zwiebel und Knoblauch fein hacken und in etwas Öl andünsten, Tomatenmark und Paprikapulver zugeben und kurz mitrösten. Gekochte Linsen unterrühren, mit Kräutern, Salz und Pfeffer abschmecken. Zucchinihälften mit der Linsenmischung füllen und 20 Minuten backen, bis die Zucchini weich ist.'
where title = 'Gebackene Zucchini-Boote mit Linsen-Füllung';
update public.recipes set
  ingredients = array['200 g Rinderhackfleisch', '2 Zucchini', '1 Zwiebel', '2 Knoblauchzehen', '100 g Kirschtomaten', '1 EL Olivenöl', 'Kräuter (z. B. Oregano)', 'Salz, Pfeffer']::text[],
  instructions = 'Zwiebel und Knoblauch fein hacken. Hackfleisch in Olivenöl krümelig anbraten, bis es durchgebraten ist, dann Zwiebel und Knoblauch zugeben und mitdünsten. Kirschtomaten halbieren und zugeben, kurz mitschwenken. Zucchini mit dem Spiralschneider zu Nudeln verarbeiten. Zucchininudeln unter das Hackfleisch heben und 1–2 Minuten mitschwenken, bis sie warm, aber noch bissfest sind. Mit Kräutern, Salz und Pfeffer abschmecken.'
where title = 'Gebratenes Rinderhack mit Zucchini-Nudeln';
update public.recipes set
  ingredients = array['2 Karotten', '100 g Kichererbsen (Dose)', '1 EL Tahini', 'Saft einer halben Zitrone', '1 EL Olivenöl', '1/2 Knoblauchzehe', '1/4 TL Kreuzkümmel']::text[],
  instructions = 'Kichererbsen abspülen und abtropfen lassen. Zusammen mit Tahini, Zitronensaft, Olivenöl, Knoblauch und Kreuzkümmel in einen Mixer geben. Alles fein pürieren, bei Bedarf etwas Wasser zugeben, bis eine cremige Konsistenz entsteht. Mit Salz abschmecken. Karotten schälen und in Sticks schneiden, zusammen mit dem Hummus servieren.'
where title = 'Karottensticks mit Hummus';
update public.recipes set
  ingredients = array['1 Süßkartoffel', '1 EL Olivenöl', '1 TL Paprikapulver', '1 Knoblauchzehe', 'Rosmarin', 'Salz']::text[],
  instructions = 'Backofen auf 200°C vorheizen. Süßkartoffel waschen und in gleichmäßige Sticks schneiden. Mit Olivenöl, Paprikapulver, fein gehacktem Knoblauch, Rosmarin und Salz in einer Schüssel vermengen. Auf einem Backblech in einer Schicht verteilen. 20–25 Minuten backen, dabei einmal wenden, bis die Sticks weich und leicht knusprig sind.'
where title = 'Gedünstete Süßkartoffel-Sticks';
update public.recipes set
  ingredients = array['2 Reiswaffeln', '100 g Kokosjoghurt', '50 g Beeren', '1 TL Honig', '1 TL Kokosraspeln']::text[],
  instructions = 'Kokosjoghurt in eine kleine Schale geben und mit Honig verrühren. Reiswaffeln mit der Joghurtmischung bestreichen. Beeren waschen und darauf verteilen. Mit Kokosraspeln bestreuen und sofort servieren, solange die Waffeln knusprig sind.'
where title = 'Reiswaffeln mit Kokosjoghurt und Beeren';
update public.recipes set
  ingredients = array['1 Bund Radieschen', '1 TL Olivenöl', 'Kräutersalz', 'etwas Butter (optional)', 'Schnittlauch']::text[],
  instructions = 'Radieschen gründlich waschen und die Blätter entfernen, größere Exemplare halbieren. Auf einem Teller anrichten. Nach Belieben mit etwas weicher Butter bestreichen. Mit einem Schuss Olivenöl beträufeln und mit Kräutersalz bestreuen. Mit frisch geschnittenem Schnittlauch garnieren und sofort servieren.'
where title = 'Radieschen mit Kräutersalz und Olivenöl';
update public.recipes set
  ingredients = array['100 g Datteln (entsteint)', '30 g Kokosraspeln', '20 g Sonnenblumenkerne', '1 EL Kakaopulver', '1/2 TL Vanilleextrakt', '1 EL Wasser (bei Bedarf)']::text[],
  instructions = 'Datteln in warmem Wasser 10 Minuten einweichen, falls sie sehr fest sind, dann abtropfen lassen. Datteln, Sonnenblumenkerne, Kakaopulver und Vanilleextrakt in einen Mixer oder eine Küchenmaschine geben. Fein zerkleinern, bis eine klebrige, formbare Masse entsteht, bei Bedarf einen Esslöffel Wasser zugeben. Aus der Masse kleine Kugeln formen. In Kokosraspeln wälzen, bis sie rundum bedeckt sind, und im Kühlschrank fest werden lassen.'
where title = 'Dattel-Kokos-Energiebällchen';
update public.recipes set
  ingredients = array['1 Birne', '1 EL Kokosflocken', 'etwas Zitronensaft', '1 Prise Zimt']::text[],
  instructions = 'Birne waschen, vierteln, entkernen und in dünne Spalten schneiden. Mit etwas Zitronensaft beträufeln, damit sie nicht braun wird. Auf einem Teller fächerförmig anrichten. Mit Kokosflocken und einer Prise Zimt bestreuen.'
where title = 'Birne mit Kokosflocken';
update public.recipes set
  ingredients = array['2 Eier', '1/2 Gurke', '1 TL Olivenöl', 'Salz, Pfeffer', 'Schnittlauch']::text[],
  instructions = 'Eier in einen Topf mit kaltem Wasser geben, aufkochen lassen und 8 Minuten hart kochen. Anschließend sofort in kaltem Wasser abschrecken, damit sie sich leichter pellen lassen. Eier pellen und halbieren. Gurke in Scheiben schneiden und mit den Eihälften auf einem Teller anrichten. Mit Olivenöl beträufeln, mit Salz, Pfeffer und Schnittlauch bestreuen.'
where title = 'Hartgekochtes Ei mit Gurke';
update public.recipes set
  ingredients = array['150 g Hähnchenbrust', '1 EL Olivenöl', '1 Knoblauchzehe', 'Kräuter der Provence', '1/2 TL Paprikapulver', 'Zitrone, Salz, Pfeffer']::text[],
  instructions = 'Hähnchenbrust in mundgerechte Würfel schneiden. Mit Olivenöl, fein gehacktem Knoblauch, Kräutern der Provence, Paprikapulver, Salz und Pfeffer vermengen und kurz marinieren. In einer Pfanne bei mittlerer Hitze rundum 8–10 Minuten braten, bis das Fleisch durchgegart ist. Vollständig abkühlen lassen. Auf Spieße stecken und mit etwas Zitronensaft beträufelt kalt servieren.'
where title = 'Kalte Hähnchenspieße mit Kräutern';
update public.recipes set
  ingredients = array['4 Reiscracker', '60 g Frischkäse', 'Schnittlauch', 'Pfeffer', '2 Radieschen (optional)']::text[],
  instructions = 'Frischkäse mit frisch gemahlenem Pfeffer verrühren, bis er cremig ist. Reiscracker auf einem Teller auslegen. Frischkäse gleichmäßig auf den Crackern verteilen. Radieschen in dünne Scheiben schneiden und darauf verteilen. Mit fein geschnittenem Schnittlauch bestreuen und sofort servieren.'
where title = 'Reiscracker mit Frischkäse und Schnittlauch';
update public.recipes set
  ingredients = array['80 g Gouda', '10 Oliven', '1 EL Olivenöl', 'Kräuter (z. B. Oregano)', '4 Kirschtomaten (optional)']::text[],
  instructions = 'Käse in gleichmäßige Würfel schneiden. Zusammen mit den Oliven und, falls verwendet, halbierten Kirschtomaten auf einem kleinen Teller anrichten. Mit Olivenöl beträufeln. Mit getrockneten Kräutern bestreuen und sofort servieren.'
where title = 'Käsewürfel mit Oliven';
update public.recipes set
  ingredients = array['100 g gemischte Beeren', '80 g Kokoscreme (ungesüßt)', '1/2 TL Vanilleextrakt', '1 TL Ahornsirup', 'Minze zum Garnieren']::text[],
  instructions = 'Kokoscreme mit Vanilleextrakt und Ahornsirup glattrühren, bis eine cremige Konsistenz entsteht. In eine kleine Schale füllen. Beeren waschen und trocken tupfen. Über die Kokoscreme verteilen. Mit frischer Minze garniert servieren.'
where title = 'Frische Beeren mit Kokoscreme';


-- Favoriten: Rezepte sind app-weit geteilt, die Favoriten-Markierung ist
-- aber pro Nutzer — daher eine eigene Zuordnungstabelle statt eines Feldes
-- direkt an recipes.
create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_favorites enable row level security;

drop policy if exists "Nutzer sehen ihre eigenen Favoriten" on public.recipe_favorites;
create policy "Nutzer sehen ihre eigenen Favoriten"
  on public.recipe_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Nutzer legen eigene Favoriten an" on public.recipe_favorites;
create policy "Nutzer legen eigene Favoriten an"
  on public.recipe_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer entfernen eigene Favoriten" on public.recipe_favorites;
create policy "Nutzer entfernen eigene Favoriten"
  on public.recipe_favorites for delete
  using (auth.uid() = user_id);


-- Grundlage für ein künftiges Freemium-Modell: provider-agnostisches Feld
-- (subscription_source), damit sich später neben Stripe (Web) auch Apple
-- In-App-Purchase / Google Play Billing anbinden lassen, ohne das Schema
-- noch einmal zu ändern. Die eigentliche Zahlungsanbindung (Checkout,
-- Webhook-Handler) folgt erst, wenn Preise/Feature-Grenzen feststehen.
alter table public.profiles
  add column if not exists is_premium boolean not null default false;
alter table public.profiles
  add column if not exists subscription_source text;
alter table public.profiles
  drop constraint if exists profiles_subscription_source_check;
alter table public.profiles
  add constraint profiles_subscription_source_check check (
    subscription_source is null or subscription_source in ('stripe', 'app_store', 'play_store')
  );
alter table public.profiles
  add column if not exists stripe_customer_id text;
alter table public.profiles
  add column if not exists premium_until timestamptz;

-- Sicherheitsnetz: Die bestehenden Insert-/Update-Policies erlauben Nutzern,
-- jedes Feld ihres eigenen Profils anzulegen bzw. zu ändern (row-level,
-- nicht spaltenweise). Ohne diesen Trigger könnte sich ein Nutzer über die
-- Browser-Konsole selbst is_premium = true setzen — sowohl beim ersten
-- Anlegen des Profils als auch nachträglich per Update. Der Trigger setzt
-- die Abo-Felder bei jedem Insert/Update durch eine normale Nutzer-Session
-- auf ihren sicheren Ausgangswert zurück — nur eine Verbindung mit dem
-- Supabase service_role-Key (z. B. eine Edge Function, die eine echte
-- Stripe-Webhook-Signatur geprüft hat) darf sie tatsächlich ändern.
create or replace function public.protect_premium_fields()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    if TG_OP = 'INSERT' then
      new.is_premium := false;
      new.subscription_source := null;
      new.stripe_customer_id := null;
      new.premium_until := null;
    else
      new.is_premium := old.is_premium;
      new.subscription_source := old.subscription_source;
      new.stripe_customer_id := old.stripe_customer_id;
      new.premium_until := old.premium_until;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_premium_fields on public.profiles;
create trigger protect_premium_fields
  before insert or update on public.profiles
  for each row execute function public.protect_premium_fields();


-- Nutzerindividuelle Schnellauswahl-Mengen für den Wassertracker (statt
-- der bisher fest verdrahteten 150/250/500 ml). Drei Werte, damit sich
-- das bestehende 3er-Grid im UI nicht ändern muss.
alter table public.profiles
  add column if not exists water_quick_amounts_ml integer[] not null default '{150,250,500}';
alter table public.profiles
  drop constraint if exists profiles_water_quick_amounts_check;
alter table public.profiles
  add constraint profiles_water_quick_amounts_check check (
    array_length(water_quick_amounts_ml, 1) = 3
    and water_quick_amounts_ml[1] > 0
    and water_quick_amounts_ml[2] > 0
    and water_quick_amounts_ml[3] > 0
  );


-- Optionales Wunschgewicht, ergänzt die bestehende Gewichtshistorie
-- (weight_logs) um ein konkretes Ziel statt nur der groben Richtung
-- aus profiles.goal.
alter table public.profiles
  add column if not exists target_weight_kg numeric(5,1);


-- Eigene Notizen zu Rezepten — wie bei recipe_favorites sind Rezepte
-- app-weit geteilt, die Notiz ist aber pro Nutzer (z. B. "nächstes Mal
-- mehr Gewürze"), daher eine eigene Zuordnungstabelle statt eines Felds
-- direkt an recipes.
create table if not exists public.recipe_notes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_notes enable row level security;

drop policy if exists "Nutzer sehen ihre eigenen Rezeptnotizen" on public.recipe_notes;
create policy "Nutzer sehen ihre eigenen Rezeptnotizen"
  on public.recipe_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Nutzer legen eigene Rezeptnotizen an" on public.recipe_notes;
create policy "Nutzer legen eigene Rezeptnotizen an"
  on public.recipe_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Nutzer aktualisieren eigene Rezeptnotizen" on public.recipe_notes;
create policy "Nutzer aktualisieren eigene Rezeptnotizen"
  on public.recipe_notes for update
  using (auth.uid() = user_id);

drop policy if exists "Nutzer löschen eigene Rezeptnotizen" on public.recipe_notes;
create policy "Nutzer löschen eigene Rezeptnotizen"
  on public.recipe_notes for delete
  using (auth.uid() = user_id);


-- 20 Salat-Rezepte (owner_id NULL = global sichtbar). Bewusst als
-- eigenständige Salate gebaut, die sich gut als Beilage zu vielen
-- Hauptgerichten kombinieren lassen, nicht nur als alleinstehendes
-- Mittag-/Abendgericht. Idempotent per Titel-Check.
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions, v.meal_type, v.diet_tags, v.free_of
from (
  values
    (
      'Gemischter Salat mit Himbeerdressing',
      'Bunter Blattsalat mit fruchtig-süßem Himbeer-Dressing.',
      280, 6, 18, 21,
      array['150 g gemischter Blattsalat', '10 Kirschtomaten', '1/2 Salatgurke', '1/2 rote Zwiebel', '80 g frische Himbeeren', '20 g Walnusskerne', 'Für das Dressing: 50 g Himbeeren, 3 EL Olivenöl, 1 EL Balsamico-Essig, 1 TL Honig, 1 TL Senf, Salz, Pfeffer']::text[],
      'Blattsalat waschen, trocken schleudern und mit halbierten Kirschtomaten, Gurkenscheiben und dünn geschnittener roter Zwiebel in einer großen Schüssel vermengen. Für das Dressing 50 g Himbeeren mit einer Gabel zerdrücken und mit Olivenöl, Balsamico-Essig, Honig, Senf, Salz und Pfeffer glattrühren — für ein feineres Dressing die Kerne durch ein Sieb streichen. Salat mit dem Dressing beträufeln, vorsichtig vermengen und mit den restlichen frischen Himbeeren und gehackten Walnüssen bestreuen.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Rucola-Salat mit Parmesan und Pinienkernen',
      'Klassischer italienischer Beilagensalat, in 5 Minuten fertig.',
      230, 9, 4, 20,
      array['100 g Rucola', '30 g Parmesan (gehobelt)', '2 EL Pinienkerne', '3 EL Olivenöl', '1 EL Zitronensaft', 'Salz, Pfeffer']::text[],
      'Pinienkerne in einer Pfanne ohne Fett kurz goldbraun rösten. Rucola waschen, trocken schleudern und auf einem Teller verteilen. Mit Olivenöl und Zitronensaft beträufeln, leicht salzen und pfeffern. Mit gehobeltem Parmesan und den gerösteten Pinienkernen bestreuen und sofort servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'keto', 'low_carb']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Paprika-Halloumi-Salat mit Minze',
      'Warmer Salat mit gebratenem Halloumi und knackiger Paprika.',
      370, 18, 10, 28,
      array['2 rote Paprika', '200 g Halloumi', '50 g Rucola', '2 EL Olivenöl', '1 EL Zitronensaft', 'Minzblätter, Salz, Pfeffer']::text[],
      'Paprika in Streifen schneiden und in einer Pfanne mit etwas Olivenöl anbraten, bis sie leicht Farbe annehmen. Halloumi in Scheiben schneiden und in derselben Pfanne von beiden Seiten goldbraun anbraten. Rucola auf einem Teller verteilen, Paprika und Halloumi darauf anrichten. Mit Olivenöl und Zitronensaft beträufeln, salzen, pfeffern und mit frischer Minze bestreuen.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'keto', 'low_carb']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Karotten-Apfel-Salat mit Ingwerdressing',
      'Erfrischender Rohkostsalat mit süß-scharfem Ingwer-Dressing.',
      210, 3, 26, 11,
      array['3 Karotten', '1 Apfel', '1 EL Zitronensaft', '1 TL frischer Ingwer (gerieben)', '2 EL Olivenöl', '1 TL Honig', '1 EL Sonnenblumenkerne']::text[],
      'Karotten schälen und raspeln. Apfel waschen, entkernen und ebenfalls raspeln oder in feine Streifen schneiden, sofort mit etwas Zitronensaft vermengen, damit er nicht braun wird. Geriebenen Ingwer mit Olivenöl, restlichem Zitronensaft und Honig zu einem Dressing verrühren. Karotten und Apfel mit dem Dressing vermengen und mit gerösteten Sonnenblumenkernen bestreuen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Roter-Linsen-Salat mit Petersilie und Zitrone',
      'Sättigender, proteinreicher Salat für Meal-Prep.',
      410, 20, 52, 14,
      array['200 g rote Linsen', '1 Salatgurke', '1 rote Paprika', '1 Bund Petersilie', 'Saft 1 Zitrone', '3 EL Olivenöl', '1 Knoblauchzehe', 'Salz, Pfeffer, Kreuzkümmel']::text[],
      'Linsen nach Packungsangabe in Salzwasser kochen, bis sie weich, aber noch bissfest sind, abgießen und abkühlen lassen. Gurke und Paprika fein würfeln, Petersilie grob hacken, Knoblauch fein reiben. Alle Zutaten mit den abgekühlten Linsen vermengen, mit Zitronensaft, Olivenöl, Kreuzkümmel, Salz und Pfeffer abschmecken und vor dem Servieren kurz durchziehen lassen.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Joghurt-Gurken-Salat mit Minze',
      'Kühler, leichter Salat für warme Tage, in 10 Minuten fertig.',
      140, 10, 8, 7,
      array['1 Salatgurke', '150 g griechischer Joghurt', '1 EL frische Minze (gehackt)', '1 Knoblauchzehe', '1 TL Zitronensaft', 'Salz, Pfeffer']::text[],
      'Gurke in dünne Scheiben hobeln oder würfeln, leicht salzen und 10 Minuten in einem Sieb Wasser ziehen lassen, dann abtropfen. Joghurt mit gehackter Minze, fein geriebenem Knoblauch, Zitronensaft, Salz und Pfeffer glattrühren. Gurke unterheben und den Salat gut gekühlt servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'keto', 'low_carb']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Fenchel-Orangen-Salat mit schwarzen Oliven',
      'Frischer italienischer Salat mit süß-herber Note.',
      220, 3, 24, 13,
      array['1 Fenchelknolle', '2 Orangen', '10 schwarze Oliven', '2 EL Olivenöl', '1 TL Zitronensaft', 'Salz, Pfeffer, Fenchelgrün']::text[],
      'Fenchel putzen und in sehr dünne Scheiben hobeln, das zarte Fenchelgrün beiseitelegen. Orangen filetieren, dabei den austretenden Saft auffangen. Fenchel und Orangenfilets auf einem Teller anrichten, Oliven darüber verteilen. Aus dem aufgefangenen Orangensaft, Olivenöl, Zitronensaft, Salz und Pfeffer ein Dressing anrühren, über den Salat träufeln und mit Fenchelgrün garnieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Rote-Zwiebel-Tomatensalat mit Sumach',
      'Orientalisch angehauchter Salat, schnell gemacht.',
      150, 2, 12, 11,
      array['4 Tomaten', '1 rote Zwiebel', '1 TL Sumach', '2 EL Olivenöl', '1 EL Zitronensaft', 'Petersilie, Salz, Pfeffer']::text[],
      'Tomaten in Scheiben oder Achtel schneiden, rote Zwiebel in sehr dünne Ringe hobeln und beides auf einem Teller anrichten. Mit Sumach bestäuben, mit Olivenöl und Zitronensaft beträufeln, salzen und pfeffern. Mit gehackter Petersilie bestreuen und kurz durchziehen lassen, bevor serviert wird.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Wurzelgemüse-Salat mit Walnüssen und Ziegenkäse',
      'Warmer Herbstsalat mit geröstetem Wurzelgemüse.',
      380, 12, 28, 24,
      array['2 Karotten', '1 Pastinake', '1 rote Bete (vorgekocht)', '50 g Ziegenkäse', '20 g Walnusskerne', '2 EL Olivenöl', '1 EL Honig', '1 EL Apfelessig']::text[],
      'Karotten und Pastinake schälen, in dünne Scheiben hobeln, mit 1 EL Olivenöl beträufeln und im Ofen bei 200°C 15 Minuten weich rösten. Rote Bete in Würfel schneiden. Geröstetes Wurzelgemüse mit roter Bete auf einem Teller anrichten, Ziegenkäse darüberbröckeln und mit Walnüssen bestreuen. Restliches Olivenöl mit Honig und Apfelessig verrühren und über den Salat träufeln.',
      'abend',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Spinat-Erdbeer-Salat mit Balsamico-Dressing',
      'Süß-herzhafter Salat mit frischen Erdbeeren und Feta.',
      260, 6, 16, 20,
      array['100 g Babyspinat', '200 g Erdbeeren', '30 g Feta', '2 EL gehackte Pekannüsse', '2 EL Olivenöl', '1 EL Balsamico-Essig', '1 TL Honig']::text[],
      'Babyspinat waschen und trocken schleudern, Erdbeeren putzen und vierteln. Spinat und Erdbeeren in einer Schüssel vermengen, Feta darüberbröckeln und mit gehackten Pekannüssen bestreuen. Olivenöl, Balsamico-Essig und Honig zu einem Dressing verrühren, über den Salat träufeln und sofort servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Grünkohlsalat mit Cranberrys und Mandeln',
      'Kräftiger Wintersalat, wird durch Massieren angenehm mild.',
      310, 10, 20, 21,
      array['150 g Grünkohl', '2 EL getrocknete Cranberrys', '2 EL gehobelte Mandeln', '30 g Parmesan', '3 EL Olivenöl', '1 EL Zitronensaft', 'Salz, Pfeffer']::text[],
      'Grünkohl waschen, von den dicken Stielen befreien und in feine Streifen schneiden. Mit Olivenöl, Zitronensaft, Salz und Pfeffer in einer Schüssel kräftig durchkneten, bis die Blätter weicher werden — das nimmt die Bitterkeit und macht den Salat angenehmer zu kauen. Mandeln in einer Pfanne ohne Fett kurz rösten. Grünkohl mit Cranberrys, gerösteten Mandeln und gehobeltem Parmesan bestreuen.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Bunter Krautsalat mit Apfel und Kümmel',
      'Klassischer Krautsalat, verträglicher durch kurzes Durchziehen.',
      180, 2, 22, 9,
      array['300 g Weißkohl', '1 Apfel', '1 Karotte', '2 EL Apfelessig', '2 EL Olivenöl', '1 TL Kümmel', '1 TL Honig', 'Salz, Pfeffer']::text[],
      'Weißkohl fein hobeln, mit etwas Salz kräftig durchkneten, bis er weicher wird und Wasser zieht. Apfel und Karotte raspeln und untermischen. Apfelessig, Olivenöl, Kümmel und Honig zu einem Dressing verrühren, über den Krautsalat geben und gut vermengen. Mindestens 20 Minuten durchziehen lassen, bevor serviert wird.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Bulgursalat mit Petersilie und Granatapfelkernen',
      'Frischer Tabouleh-Salat, hält sich gut im Kühlschrank.',
      410, 10, 60, 14,
      array['150 g Bulgur', '1 Bund Petersilie', '1 Salatgurke', '2 Tomaten', '1 Granatapfel', 'Saft 1 Zitrone', '3 EL Olivenöl', 'Salz, Pfeffer']::text[],
      'Bulgur nach Packungsangabe in heißem Wasser quellen lassen und abkühlen lassen. Petersilie fein hacken, Gurke und Tomaten würfeln, Granatapfelkerne auslösen. Alle Zutaten mit dem abgekühlten Bulgur vermengen, mit Zitronensaft und Olivenöl abschmecken, salzen und pfeffern.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Avocado-Mango-Salat mit Limettendressing',
      'Cremig-fruchtiger Salat mit karibischem Flair.',
      320, 4, 26, 22,
      array['1 Avocado', '1 Mango', '50 g Rucola', '1/2 rote Zwiebel', 'Saft 1 Limette', '2 EL Olivenöl', '1 TL Honig', 'Chiliflocken (optional)']::text[],
      'Avocado und Mango schälen und in Würfel oder Spalten schneiden. Rote Zwiebel in feine Ringe schneiden. Rucola auf einem Teller verteilen, Avocado, Mango und Zwiebel darauf anrichten. Limettensaft, Olivenöl und Honig zu einem Dressing verrühren, über den Salat träufeln und nach Belieben mit Chiliflocken bestreuen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei', 'histaminarm']::text[]
    ),
    (
      'Sellerie-Walnuss-Salat mit Apfel',
      'Knackiger Wintersalat mit cremigem Joghurtdressing.',
      260, 7, 18, 18,
      array['1/2 Knolle Sellerie', '1 Apfel', '30 g Walnusskerne', '100 g Joghurt', '1 EL Zitronensaft', 'Salz, Pfeffer']::text[],
      'Sellerie schälen und in feine Streifen oder Raspeln schneiden, sofort mit etwas Zitronensaft vermengen. Apfel waschen, entkernen und ebenfalls in feine Streifen schneiden. Joghurt mit dem restlichen Zitronensaft, Salz und Pfeffer verrühren, unter Sellerie und Apfel heben. Mit gehackten Walnüssen bestreuen und servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Rettichsalat mit Radieschen und Sesam',
      'Knackig-scharfer asiatisch angehauchter Salat.',
      150, 4, 16, 8,
      array['1 Rettich', '1 Bund Radieschen', '1 EL Sesam', '2 EL Reisessig', '1 EL Sojasauce', '1 TL Sesamöl', '1 TL Honig']::text[],
      'Rettich schälen und in sehr dünne Scheiben hobeln, Radieschen ebenfalls in feine Scheiben schneiden. Reisessig, Sojasauce, Sesamöl und Honig zu einem Dressing verrühren. Rettich und Radieschen mit dem Dressing vermengen, kurz durchziehen lassen und mit geröstetem Sesam bestreuen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei']::text[]
    ),
    (
      'Endiviensalat mit Speck und Croutons',
      'Herzhafter warmer Salat mit knusprigem Speck und Croutons.',
      380, 14, 20, 27,
      array['1 Endiviensalat', '80 g Speckwürfel', '50 g Weißbrot (für Croutons)', '2 EL Olivenöl', '1 EL Weißweinessig', '1 TL Senf', 'Salz, Pfeffer']::text[],
      'Weißbrot in Würfel schneiden und in einer Pfanne mit etwas Olivenöl knusprig goldbraun rösten. Speckwürfel in derselben Pfanne knusprig auslassen. Endiviensalat waschen, trocken schleudern und in mundgerechte Stücke zupfen. Olivenöl, Weißweinessig, Senf, Salz und Pfeffer zu einem Dressing verrühren, über den Salat geben, mit Speck und Croutons bestreuen und sofort servieren, solange die Croutons noch knusprig sind.',
      'abend',
      array['omnivore']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Wassermelonen-Feta-Salat mit Minze',
      'Erfrischender Sommersalat, süß-salzig kombiniert.',
      240, 8, 18, 15,
      array['400 g Wassermelone', '100 g Feta', '10 Minzblätter', '2 EL Olivenöl', '1 EL Balsamico-Essig', 'Schwarzer Pfeffer']::text[],
      'Wassermelone entkernen und in mundgerechte Würfel schneiden. Feta ebenfalls würfeln. Wassermelone und Feta auf einem Teller anrichten, mit gezupften Minzblättern bestreuen. Mit Olivenöl und Balsamico-Essig beträufeln und mit frisch gemahlenem Pfeffer servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Pilzsalat mit Petersilie und Zitrone',
      'Roher Champignonsalat, leicht und schnell gemacht.',
      210, 6, 8, 17,
      array['250 g braune Champignons', '1 Schalotte', '1 Bund Petersilie', 'Saft 1 Zitrone', '3 EL Olivenöl', 'Salz, Pfeffer']::text[],
      'Champignons putzen und in sehr dünne Scheiben hobeln. Schalotte fein würfeln, Petersilie grob hacken. Champignons mit Schalotte, Zitronensaft, Olivenöl, Salz und Pfeffer vermengen und kurz durchziehen lassen, damit die Pilze etwas Säure aufnehmen. Mit Petersilie bestreut servieren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Rosenkohlsalat mit Parmesan und Zitrone',
      'Roher Rosenkohlsalat, knackig und würzig-nussig.',
      260, 10, 16, 18,
      array['300 g Rosenkohl', '30 g Parmesan', '2 EL Olivenöl', '1 EL Zitronensaft', '2 EL gehobelte Mandeln', 'Salz, Pfeffer']::text[],
      'Rosenkohl putzen und mit einem Hobel oder Messer in sehr feine Streifen schneiden. Mit Olivenöl, Zitronensaft, Salz und Pfeffer vermengen und kurz durchziehen lassen, damit er etwas weicher wird. Mandeln in einer Pfanne ohne Fett rösten. Rosenkohl mit gehobeltem Parmesan und gerösteten Mandeln bestreut servieren.',
      'mittag',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'low_carb']::text[],
      array['glutenfrei', 'eifrei', 'sojafrei']::text[]
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);


-- 20 gesunde Backrezepte (owner_id NULL = global sichtbar). Bewusst mit
-- Vollkornmehl, wenig/keinem raffinierten Zucker (Banane, Datteln, Honig)
-- und wo möglich mehr Protein/Ballaststoffen statt klassischer Kuchen-
-- Rezepte, plus ein paar herzhafte Optionen für Mittag/Abend. Idempotent
-- per Titel-Check.
insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
select v.title, v.description, v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.ingredients, v.instructions, v.meal_type, v.diet_tags, v.free_of
from (
  values
    (
      'Vollkorn-Bananenbrot mit Walnüssen',
      'Saftiges Bananenbrot ohne raffinierten Zucker, mit Walnuss-Crunch.',
      220, 6, 28, 9,
      array['3 reife Bananen', '200 g Vollkornmehl', '2 Eier', '50 g Honig', '50 ml Rapsöl', '1 TL Backpulver', '1 TL Zimt', '50 g Walnusskerne (gehackt)']::text[],
      'Backofen auf 175°C Ober-/Unterhitze vorheizen, eine Kastenform einfetten. Bananen in einer Schüssel mit einer Gabel zerdrücken, Eier, Honig und Rapsöl unterrühren. Vollkornmehl, Backpulver und Zimt in einer zweiten Schüssel vermischen, zur Bananenmasse geben und nur kurz verrühren, bis kein Mehl mehr sichtbar ist. Walnüsse unterheben, Teig in die Kastenform füllen und 45–50 Minuten backen, bis ein Zahnstocher sauber herauskommt. Vor dem Anschneiden vollständig auskühlen lassen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'sojafrei']::text[]
    ),
    (
      'Haferflocken-Kekse mit Apfel und Zimt',
      'Schnelle, zuckerarme Kekse mit fruchtiger Note.',
      110, 2, 16, 4,
      array['150 g Haferflocken', '1 Apfel (geraspelt)', '2 EL Honig', '2 EL Kokosöl (geschmolzen)', '1 TL Zimt', '1/2 TL Backpulver', 'Prise Salz']::text[],
      'Backofen auf 180°C vorheizen, ein Blech mit Backpapier auslegen. Haferflocken, Backpulver, Zimt und Salz in einer Schüssel vermischen. Geraspelten Apfel, Honig und geschmolzenes Kokosöl unterrühren, bis ein klebriger Teig entsteht. Mit einem Löffel 12 Häufchen auf das Blech setzen und leicht flachdrücken. 15–18 Minuten backen, bis die Ränder golden sind, auf dem Blech auskühlen lassen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Karottenkuchen-Muffins mit leichtem Frischkäse-Topping',
      'Klassiker als Muffin, mit weniger Zucker und cremigem Topping.',
      190, 4, 22, 9,
      array['200 g Vollkornmehl', '3 Karotten (geraspelt)', '2 Eier', '80 g Honig', '60 ml Rapsöl', '1 TL Zimt', '1 TL Backpulver', 'Für das Topping: 100 g Frischkäse, 1 EL Honig, etwas Zitronensaft']::text[],
      'Backofen auf 175°C vorheizen, ein Muffinblech mit Papierförmchen bestücken. Eier, Honig und Rapsöl verquirlen, geraspelte Karotten unterrühren. Vollkornmehl, Zimt und Backpulver vermischen und unter die Karottenmasse heben. Teig auf die Förmchen verteilen und 20–22 Minuten backen, bis ein Zahnstocher sauber herauskommt. Auskühlen lassen. Frischkäse mit Honig und etwas Zitronensaft glattrühren und die ausgekühlten Muffins damit toppen.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'sojafrei']::text[]
    ),
    (
      'Haferriegel mit Erdnussbutter und Honig',
      'Sättigende Riegel zum Vorbereiten, gut fürs Meal-Prep.',
      180, 5, 20, 9,
      array['200 g Haferflocken', '100 g Erdnussbutter', '80 g Honig', '30 g Kürbiskerne', '30 g getrocknete Cranberrys', '1 Prise Salz']::text[],
      'Backofen auf 175°C vorheizen, eine flache Backform mit Backpapier auslegen. Erdnussbutter und Honig in einem Topf bei niedriger Hitze verflüssigen und verrühren. Haferflocken, Kürbiskerne, Cranberrys und Salz in einer Schüssel vermischen, die Erdnussbutter-Honig-Mischung unterrühren, bis alles gleichmäßig benetzt ist. Masse fest in die Form drücken und 18–20 Minuten backen, bis die Oberfläche golden ist. Vollständig auskühlen lassen, bevor in Riegel geschnitten wird — das macht sie fester.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Kürbis-Muffins mit Zimt und Walnüssen',
      'Herbstliche Muffins mit warmen Gewürzen.',
      200, 4, 24, 10,
      array['250 g Kürbispüree', '200 g Vollkornmehl', '2 Eier', '70 g Honig', '50 ml Rapsöl', '1 TL Zimt', '1/2 TL Muskat', '1 TL Backpulver', '40 g Walnusskerne (gehackt)']::text[],
      'Backofen auf 175°C vorheizen, Muffinblech mit Papierförmchen bestücken. Kürbispüree, Eier, Honig und Rapsöl verrühren. Vollkornmehl, Zimt, Muskat und Backpulver vermischen und unter die Kürbismasse heben, Walnüsse unterheben. Teig auf die Förmchen verteilen und 20–25 Minuten backen, bis ein Zahnstocher sauber herauskommt.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'sojafrei']::text[]
    ),
    (
      'Beeren-Streuselkuchen mit Vollkornboden',
      'Fruchtiger Streuselkuchen mit Vollkorn-Mürbeteig.',
      230, 5, 30, 10,
      array['200 g Vollkornmehl', '80 g kalte Butter', '50 g Honig', '1 Ei', '1 TL Backpulver', '300 g gemischte Beeren', 'Für die Streusel: 60 g Vollkornmehl, 40 g Butter, 30 g Honig, etwas Zimt']::text[],
      'Backofen auf 180°C vorheizen, eine Springform (24 cm) einfetten. Vollkornmehl, kalte Butter, Honig, Ei und Backpulver zu einem Mürbeteig verkneten, in die Form drücken und einen Rand hochziehen. Beeren gleichmäßig darauf verteilen. Für die Streusel Mehl, Butter und Honig mit den Fingern zu Streuseln verreiben, mit etwas Zimt vermischen und über die Beeren streuen. 35–40 Minuten backen, bis die Streusel golden sind.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'sojafrei']::text[]
    ),
    (
      'Dinkel-Vollkornbrötchen mit Sonnenblumenkernen',
      'Frisch gebackene Brötchen, außen knusprig, innen locker.',
      210, 8, 38, 3,
      array['400 g Dinkelvollkornmehl', '1 Würfel frische Hefe (oder 1 Pkt. Trockenhefe)', '300 ml lauwarmes Wasser', '1 TL Salz', '1 TL Honig', '40 g Sonnenblumenkerne']::text[],
      'Hefe mit Honig im lauwarmen Wasser auflösen und 5 Minuten stehen lassen. Mehl, Salz und Sonnenblumenkerne vermischen, das Hefewasser dazugeben und zu einem glatten Teig verkneten. Teig zugedeckt an einem warmen Ort etwa 45–60 Minuten gehen lassen, bis er sich sichtbar vergrößert hat. Teig in 10 Portionen teilen, zu Brötchen formen und auf ein mit Backpapier ausgelegtes Blech setzen, nochmals 15 Minuten gehen lassen. Bei 220°C 20–22 Minuten backen, bis die Brötchen goldbraun und hohl klingen, wenn man auf den Boden klopft.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Baked Oats mit Banane und Zimt',
      'Warmes Ofen-Porridge, wie ein kleiner Kuchen zum Löffeln.',
      380, 14, 52, 12,
      array['80 g Haferflocken', '1 Banane', '1 Ei', '150 ml Milch oder Pflanzendrink', '1 TL Backpulver', '1 TL Zimt', '1 EL Honig', 'Optional: Beeren zum Servieren']::text[],
      'Backofen auf 190°C vorheizen, eine kleine ofenfeste Form einfetten. Banane mit einer Gabel zerdrücken, mit Ei, Milch, Honig und Zimt verquirlen. Haferflocken und Backpulver unterrühren. Masse in die Form geben und 20–25 Minuten backen, bis die Oberfläche fest und leicht gebräunt ist. Warm servieren, nach Belieben mit frischen Beeren.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'sojafrei']::text[]
    ),
    (
      'Schoko-Bananen-Brownies mit schwarzen Bohnen',
      'Fudgy Brownies, proteinreicher als klassische Rezepte.',
      150, 5, 18, 6,
      array['400 g schwarze Bohnen (Dose, abgetropft)', '2 reife Bananen', '3 EL Kakaopulver', '60 g Honig', '2 Eier', '2 EL Kokosöl', '1 TL Backpulver', '50 g dunkle Schokoladenstückchen']::text[],
      'Backofen auf 175°C vorheizen, eine kleine Backform (ca. 20x20 cm) mit Backpapier auslegen. Schwarze Bohnen, Bananen, Kakaopulver, Honig, Eier und Kokosöl im Mixer zu einer glatten Masse pürieren. Backpulver unterrühren, Schokoladenstückchen unterheben. Teig in die Form füllen und 25–30 Minuten backen, bis die Oberfläche fest ist. Vollständig auskühlen lassen, bevor in Stücke geschnitten wird.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'glutenfrei', 'nussfrei', 'sojafrei']::text[]
    ),
    (
      'Vollkorn-Pizzaboden mit buntem Gemüsebelag',
      'Selbst gebackene Pizza mit Vollkornboden und frischem Gemüse.',
      320, 12, 48, 9,
      array['300 g Vollkornmehl', '1 TL Trockenhefe', '200 ml lauwarmes Wasser', '1 EL Olivenöl', '1 TL Salz', 'Für den Belag: 150 g passierte Tomaten, 1 Zucchini, 1 Paprika, 100 g Mozzarella, Oregano']::text[],
      'Hefe im lauwarmen Wasser auflösen, 5 Minuten stehen lassen. Vollkornmehl, Salz und Olivenöl dazugeben und zu einem glatten Teig verkneten, zugedeckt 45 Minuten gehen lassen. Teig auf einem mit Backpapier ausgelegten Blech dünn ausrollen, mit passierten Tomaten bestreichen. Zucchini und Paprika in dünne Scheiben schneiden und auf der Pizza verteilen, mit Mozzarella belegen und mit Oregano bestreuen. Bei 220°C 15–18 Minuten backen, bis der Boden knusprig und der Käse geschmolzen ist.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Granola-Riegel mit Datteln und Nüssen',
      'Klebrig-süße Riegel ganz ohne raffinierten Zucker.',
      190, 5, 22, 9,
      array['150 g Haferflocken', '100 g Datteln (entsteint)', '50 g gemischte Nüsse', '2 EL Honig', '2 EL Kokosöl', '30 g Kürbiskerne']::text[],
      'Backofen auf 170°C vorheizen, eine flache Form mit Backpapier auslegen. Datteln in warmem Wasser 10 Minuten einweichen, abtropfen lassen und mit Honig und geschmolzenem Kokosöl zu einer klebrigen Paste pürieren. Haferflocken, grob gehackte Nüsse und Kürbiskerne unterrühren. Masse fest in die Form drücken und 20 Minuten backen. Vollständig auskühlen lassen, bevor in Riegel geschnitten wird.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Zucchini-Walnuss-Brot',
      'Saftiges Brot, versteckt viel Gemüse in einer süßen Scheibe.',
      210, 5, 22, 11,
      array['1 Zucchini (geraspelt)', '200 g Vollkornmehl', '2 Eier', '60 g Honig', '60 ml Rapsöl', '1 TL Zimt', '1 TL Backpulver', '40 g Walnusskerne (gehackt)']::text[],
      'Backofen auf 175°C vorheizen, eine Kastenform einfetten. Geraspelte Zucchini gut ausdrücken, damit überschüssige Flüssigkeit entfernt wird. Eier, Honig und Rapsöl verquirlen, Zucchini unterrühren. Vollkornmehl, Zimt und Backpulver vermischen und unterheben, Walnüsse zum Schluss unterheben. Teig in die Kastenform füllen und 45–50 Minuten backen, bis ein Zahnstocher sauber herauskommt.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'sojafrei']::text[]
    ),
    (
      'Vollkorn-Focaccia mit Rosmarin und Kirschtomaten',
      'Italienisches Fladenbrot, außen knusprig, innen fluffig.',
      220, 6, 34, 7,
      array['350 g Vollkornmehl', '1 TL Trockenhefe', '250 ml lauwarmes Wasser', '4 EL Olivenöl', '1 TL Salz', '150 g Kirschtomaten', '2 Zweige Rosmarin', 'grobes Meersalz']::text[],
      'Hefe im lauwarmen Wasser auflösen, 5 Minuten stehen lassen. Mehl, Salz und 2 EL Olivenöl dazugeben, zu einem weichen Teig verkneten, zugedeckt 1 Stunde gehen lassen. Teig auf einem geölten Blech ausbreiten, mit den Fingerspitzen Mulden hineindrücken. Kirschtomaten (halbiert) und Rosmarinnadeln darauf verteilen, mit restlichem Olivenöl beträufeln und mit grobem Meersalz bestreuen. Nochmals 20 Minuten gehen lassen, dann bei 220°C 20–25 Minuten backen, bis die Focaccia goldbraun ist.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Blaubeer-Mandel-Muffins (glutenfrei)',
      'Saftige Muffins ganz ohne Mehl, mit gemahlenen Mandeln.',
      210, 6, 16, 14,
      array['200 g gemahlene Mandeln', '3 Eier', '60 g Honig', '1 TL Backpulver', '150 g Blaubeeren', '1 TL Vanilleextrakt']::text[],
      'Backofen auf 175°C vorheizen, Muffinblech mit Papierförmchen bestücken. Eier, Honig und Vanilleextrakt verquirlen. Gemahlene Mandeln und Backpulver unterrühren, bis ein glatter Teig entsteht. Blaubeeren vorsichtig unterheben. Teig auf die Förmchen verteilen und 20–22 Minuten backen, bis die Muffins goldbraun sind und ein Zahnstocher sauber herauskommt.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'keto', 'low_carb']::text[],
      array['laktosefrei', 'glutenfrei', 'sojafrei']::text[]
    ),
    (
      'Möhren-Ingwer-Kekse',
      'Würzig-süße Kekse mit frischem Ingwer.',
      90, 2, 12, 4,
      array['150 g Vollkornmehl', '1 Karotte (fein geraspelt)', '50 g weiche Butter', '40 g Honig', '1 TL frischer Ingwer (gerieben)', '1/2 TL Backpulver', '1/2 TL Zimt']::text[],
      'Backofen auf 175°C vorheizen, ein Blech mit Backpapier auslegen. Butter und Honig cremig rühren, geriebene Karotte und Ingwer unterrühren. Vollkornmehl, Backpulver und Zimt vermischen und unterkneten, bis ein fester Teig entsteht. Kleine Kugeln formen, auf das Blech setzen und leicht flachdrücken. 12–14 Minuten backen, bis die Ränder golden sind.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Herzhafte Vollkorn-Käse-Kräuter-Muffins',
      'Pikante Muffins als Beilage oder unterwegs-Snack.',
      180, 7, 16, 10,
      array['200 g Vollkornmehl', '2 Eier', '150 ml Milch', '80 g geriebener Käse', '50 ml Olivenöl', '1 Bund Kräuter (Schnittlauch, Petersilie)', '1 TL Backpulver', 'Salz, Pfeffer']::text[],
      'Backofen auf 180°C vorheizen, Muffinblech mit Papierförmchen bestücken. Eier, Milch und Olivenöl verquirlen. Vollkornmehl und Backpulver unterrühren, geriebenen Käse und gehackte Kräuter unterheben, mit Salz und Pfeffer abschmecken. Teig auf die Förmchen verteilen und 20–22 Minuten backen, bis die Muffins goldbraun sind.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'sojafrei']::text[]
    ),
    (
      'Süßkartoffel-Brownies',
      'Schokoladige Brownies mit Süßkartoffel statt viel Zucker.',
      140, 4, 18, 6,
      array['300 g Süßkartoffel (gekocht, püriert)', '3 EL Kakaopulver', '60 g Honig', '2 Eier', '2 EL Kokosöl', '50 g Vollkornmehl', '1/2 TL Backpulver', '40 g dunkle Schokoladenstückchen']::text[],
      'Backofen auf 175°C vorheizen, eine kleine Backform mit Backpapier auslegen. Süßkartoffelpüree mit Kakaopulver, Honig, Eiern und Kokosöl glattrühren. Vollkornmehl und Backpulver unterrühren, Schokoladenstückchen unterheben. Teig in die Form füllen und 25–30 Minuten backen, bis die Oberfläche fest ist. Vollständig auskühlen lassen, bevor in Stücke geschnitten wird.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'nussfrei', 'sojafrei']::text[]
    ),
    (
      'Vollkorn-Kürbiskern-Cracker',
      'Knusprige Cracker, ideal zu Dips oder als Snack pur.',
      160, 6, 18, 7,
      array['150 g Vollkornmehl', '30 g Kürbiskerne', '30 g Sonnenblumenkerne', '3 EL Olivenöl', '100 ml Wasser', '1/2 TL Salz', '1 TL Kräuter der Provence']::text[],
      'Backofen auf 180°C vorheizen. Alle Zutaten in einer Schüssel zu einem festen, nicht klebrigen Teig verkneten, bei Bedarf noch etwas Wasser oder Mehl ergänzen. Teig zwischen zwei Bogen Backpapier hauchdünn ausrollen, in Rechtecke schneiden und auf ein Blech legen. 15–18 Minuten backen, bis die Cracker knusprig und golden sind, dabei nach der Hälfte der Zeit wenden.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch', 'vegan']::text[],
      array['laktosefrei', 'nussfrei', 'eifrei', 'sojafrei']::text[]
    ),
    (
      'Apfel-Hafer-Kuchen ohne Zucker',
      'Saftiger Kuchen, gesüßt allein durch Äpfel und Apfelmus.',
      170, 4, 26, 6,
      array['200 g Haferflocken (fein gemahlen oder als Mehl)', '3 Äpfel (2 gerieben, 1 in Scheiben)', '2 Eier', '100 ml Apfelmus (ungesüßt)', '1 TL Zimt', '1 TL Backpulver', '1 TL Vanilleextrakt']::text[],
      'Backofen auf 175°C vorheizen, eine Springform (20 cm) einfetten. Eier mit Apfelmus und Vanilleextrakt verquirlen, geriebene Äpfel unterrühren. Haferflocken, Zimt und Backpulver unterheben, bis ein gleichmäßiger Teig entsteht. Teig in die Form füllen, die Apfelscheiben fächerförmig obenauf verteilen. 35–40 Minuten backen, bis der Kuchen fest ist und golden aussieht.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['laktosefrei', 'nussfrei', 'sojafrei']::text[]
    ),
    (
      'Dinkel-Zimtschnecken mit wenig Zucker',
      'Klassische Zimtschnecken, mit Honig statt viel Zucker.',
      210, 6, 32, 7,
      array['350 g Dinkelvollkornmehl', '1 TL Trockenhefe', '180 ml lauwarme Milch', '30 g Honig', '30 g weiche Butter', '1 Ei', 'Für die Füllung: 2 EL Butter, 3 EL Honig, 2 TL Zimt']::text[],
      'Hefe mit einem Teelöffel Honig in der lauwarmen Milch auflösen, 5 Minuten stehen lassen. Mehl, restlichen Honig, Butter und Ei dazugeben und zu einem glatten Teig verkneten, zugedeckt 1 Stunde gehen lassen. Teig auf einer bemehlten Fläche zu einem Rechteck ausrollen, mit weicher Butter bestreichen und mit Honig und Zimt bestreuen. Von der langen Seite aufrollen und in 12 Scheiben schneiden, in eine gefettete Form setzen und nochmals 20 Minuten gehen lassen. Bei 190°C 20–25 Minuten backen, bis die Schnecken goldbraun sind.',
      'snack',
      array['omnivore', 'pescetarisch', 'vegetarisch']::text[],
      array['nussfrei', 'sojafrei']::text[]
    )
) as v(title, description, kcal, protein_g, carbs_g, fat_g, ingredients, instructions, meal_type, diet_tags, free_of)
where not exists (
  select 1 from public.recipes r where r.title = v.title
);
