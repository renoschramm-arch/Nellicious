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

-- Rezepte sind app-weit geteilt, daher dürfen alle angemeldeten Nutzer sie
-- bearbeiten (nicht nur eigene) — siehe "Weitere Migrationen" unten für den
-- Nachtrag in bereits bestehenden Projekten.
create policy "Nutzer bearbeiten Rezepte"
  on public.recipes for update
  using (auth.role() = 'authenticated');

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

-- Rezepte sind app-weit geteilt (kein Multi-Tenant-Betrieb) — daher dürfen
-- alle angemeldeten Nutzer Rezepte bearbeiten, nicht nur ihre eigenen.
-- Ohne diese Freigabe könnte niemand die global sichtbaren Beispielrezepte
-- (owner_id ist NULL) über die "Bearbeiten"-Funktion in der App ändern.
drop policy if exists "Nutzer bearbeiten eigene Rezepte" on public.recipes;
drop policy if exists "Nutzer bearbeiten Rezepte" on public.recipes;
create policy "Nutzer bearbeiten Rezepte"
  on public.recipes for update
  using (auth.role() = 'authenticated');

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
