-- Fork-on-Edit für Rezepte: bearbeitet jemand ein nicht selbst angelegtes
-- Rezept (globales Beispielrezept oder ein von anderen geteiltes), entsteht
-- eine private Kopie statt einer Änderung am Original — alle anderen sehen
-- weiterhin unverändert das Original.
--
-- Einmalig im Supabase Dashboard → SQL Editor ausführen.


-- 1) Spalte für die Fork-Beziehung -----------------------------------------

alter table public.recipes
  add column if not exists forked_from uuid references public.recipes (id) on delete set null;


-- 2) Höchstens eine eigene Kopie pro Original -------------------------------
-- (NULL-Werte gelten in Unique-Constraints nie als gleich, betrifft also nur
-- tatsächliche Forks — normale eigene Rezepte und globale Rezepte mit
-- forked_from = NULL kollidieren nie miteinander.)

alter table public.recipes
  drop constraint if exists recipes_owner_fork_unique;
alter table public.recipes
  add constraint recipes_owner_fork_unique unique (owner_id, forked_from);


-- 3) Sichtbarkeit einschränken -----------------------------------------------
-- Bisher durften alle angemeldeten Nutzer:innen ausnahmslos jede Zeile lesen
-- (auth.role() = 'authenticated', ohne Bezug zu owner_id) — dadurch wären
-- private Forks (und eigentlich auch schon jedes selbst angelegte, nicht
-- geteilte Rezept) für alle anderen sichtbar gewesen. Ab jetzt sehen
-- angemeldete Nutzer:innen nur noch eigene und globale Rezepte; öffentlich
-- geteilte (is_shared = true) bleiben über die separate, bereits bestehende
-- Policy weiterhin für alle sichtbar.

drop policy if exists "Rezepte sind für alle angemeldeten Nutzer sichtbar" on public.recipes;
create policy "Rezepte sind für alle angemeldeten Nutzer sichtbar"
  on public.recipes for select
  using (auth.role() = 'authenticated' and (owner_id = auth.uid() or owner_id is null));
