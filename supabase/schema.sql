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
