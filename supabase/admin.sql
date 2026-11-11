-- À exécuter UNE fois : Supabase > SQL Editor > New query > coller > Run.
-- Permet à l'administrateur de supprimer les photos d'une annonce.
create policy "photos: suppression admin" on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and public.is_admin());

-- Pour te nommer administrateur (remplace par l'e-mail de ton compte MMMali) :
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'ton@email.com');
