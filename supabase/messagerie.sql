-- À exécuter UNE fois : Supabase > SQL Editor > New query > coller > Run.
-- Permet d'afficher le nom d'un correspondant, uniquement s'il y a déjà eu un message entre vous.
create or replace function public.nom_contact(uid uuid) returns text
language sql security definer set search_path = public stable as $$
  select p.nom from profiles p
  where p.id = uid and exists (
    select 1 from messages m
    where (m.expediteur_id = auth.uid() and m.destinataire_id = uid)
       or (m.destinataire_id = auth.uid() and m.expediteur_id = uid)
  );
$$;
revoke execute on function public.nom_contact(uuid) from public, anon;
grant execute on function public.nom_contact(uuid) to authenticated;
