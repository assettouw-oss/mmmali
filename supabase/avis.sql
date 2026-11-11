-- À exécuter dans : Supabase > SQL Editor > New query > coller > Run.
-- Version relançable : si une partie existe déjà, elle est simplement remplacée (pas d'erreur).

create or replace function public.a_achete(pid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.order_items i join public.orders o on o.id::text = i.order_id::text
    where i.product_id::text = pid::text and o.acheteur_id::text = auth.uid()::text and o.statut = 'livree'
  );
$$;
revoke execute on function public.a_achete(uuid) from public, anon;
grant execute on function public.a_achete(uuid) to authenticated;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  auteur_id uuid not null references public.profiles(id) on delete cascade,
  auteur_nom text not null default '',
  note integer not null check (note between 1 and 5),
  commentaire text not null default '' check (char_length(commentaire) <= 500),
  created_at timestamptz not null default now(),
  unique (product_id, auteur_id)
);

create or replace function public.avis_nom() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.auteur_nom := coalesce((select nom from public.profiles where id = new.auteur_id), '');
  return new;
end $$;
drop trigger if exists t_avis_nom on public.reviews;
create trigger t_avis_nom before insert or update on public.reviews
  for each row execute function public.avis_nom();

alter table public.reviews enable row level security;
drop policy if exists "avis: lecture" on public.reviews;
drop policy if exists "avis: ajout" on public.reviews;
drop policy if exists "avis: modification" on public.reviews;
drop policy if exists "avis: suppression" on public.reviews;
create policy "avis: lecture" on public.reviews for select using (true);
create policy "avis: ajout" on public.reviews for insert
  with check (auteur_id = auth.uid() and public.a_achete(product_id));
create policy "avis: modification" on public.reviews for update
  using (auteur_id = auth.uid()) with check (auteur_id = auth.uid() and public.a_achete(product_id));
create policy "avis: suppression" on public.reviews for delete
  using (auteur_id = auth.uid() or public.is_admin());

drop view if exists public.product_ratings;
create view public.product_ratings with (security_invoker = true) as
  select product_id, round(avg(note), 1) as moyenne, count(*) as nb from public.reviews group by product_id;
grant select on public.product_ratings to anon, authenticated;
