-- À exécuter UNE fois : Supabase > SQL Editor > New query > coller > Run.
-- Ajoute les vidéos de présentation des produits (20 Mo maximum par vidéo).

alter table public.products add column if not exists video_chemin text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 20971520, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos: lecture" on storage.objects;
drop policy if exists "videos: envoi" on storage.objects;
drop policy if exists "videos: suppression" on storage.objects;
drop policy if exists "videos: suppression admin" on storage.objects;
create policy "videos: lecture" on storage.objects for select using (bucket_id = 'videos');
create policy "videos: envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "videos: suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "videos: suppression admin" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and public.is_admin());

notify pgrst, 'reload schema';
