-- Simule la publication d'un produit par ton compte, exactement comme le fait le site.
-- 1) Remplace ton@email.com (UNE seule fois, dans la ligne marquée <<<) par l'adresse de ton compte MMMali.
-- 2) Supabase > SQL Editor > New query > coller > Run.
-- Rien n'est enregistré : le test s'annule toujours à la fin.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'ton@email.com';   -- <<<
  if uid is null then raise exception 'ECHEC : aucun compte avec cette adresse e-mail.'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.products (vendeur_id, nom, prix, categorie, vendeur_nom, ville)
  values (uid, 'Test', 1000, 'Mode', 'Ma boutique', 'Bamako');
  raise exception 'TEST REUSSI : la base accepte la publication (test annule volontairement).';
end $$;
