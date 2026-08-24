-- Öffentliches Teilen von Rezepten ermöglichen (Teilen-Button auf der
-- Rezept-Detailseite). Rezepte bleiben wie bisher standardmäßig nur für
-- angemeldete Nutzer:innen sichtbar; NUR Rezepte, die explizit über den
-- Teilen-Button freigegeben wurden (is_shared = true), sind dann auch
-- ohne Account über /rezept-teilen/:id aufrufbar — damit niemand
-- versehentlich die komplette Rezept-Datenbank öffentlich macht.
--
-- Einmalig im Supabase Dashboard → SQL Editor ausführen.


-- 1) Spalte für den Freigabe-Status ----------------------------------------

alter table public.recipes
  add column if not exists is_shared boolean not null default false;


-- 2) Freigegebene Rezepte auch ohne Login lesbar machen --------------------

drop policy if exists "Freigegebene Rezepte sind öffentlich sichtbar" on public.recipes;
create policy "Freigegebene Rezepte sind öffentlich sichtbar"
  on public.recipes for select
  using (is_shared = true);


-- 3) Funktion zum Freigeben/Zurückziehen ------------------------------------
--
-- Läuft mit erhöhten Rechten (security definer), damit die normale
-- Update-Policy (nur Zeilenbesitzer:in) hier nicht im Weg steht — die
-- Berechtigung wird stattdessen im Funktionskörper selbst geprüft:
-- erlaubt ist es nur für eigene Rezepte oder globale Beispielrezepte
-- (owner_id ist null).

create or replace function public.set_recipe_shared(p_recipe_id uuid, p_shared boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.recipes
  set is_shared = p_shared
  where id = p_recipe_id
    and (owner_id = auth.uid() or owner_id is null);

  if not found then
    raise exception 'Rezept nicht gefunden oder keine Berechtigung';
  end if;
end;
$$;

revoke all on function public.set_recipe_shared(uuid, boolean) from public;
grant execute on function public.set_recipe_shared(uuid, boolean) to authenticated;
