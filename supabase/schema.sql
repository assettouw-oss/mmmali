-- MMMali : base de données Supabase.
-- Supabase > SQL Editor > New query > coller tout ce fichier > Run.

-- ========== PROFILS ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null default '',
  telephone text,
  ville text,
  role text not null default 'client' check (role in ('client','vendeur','admin')),
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function public.is_vendeur() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('vendeur','admin'));
$$;

-- Tout nouveau compte est « client » : le rôle ne peut jamais venir du formulaire d'inscription.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nom, telephone)
  values (new.id, coalesce(new.raw_user_meta_data->>'nom',''), new.raw_user_meta_data->>'telephone');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;
create policy "profil: lecture" on profiles for select using (id = auth.uid() or is_admin());
create policy "profil: modification" on profiles for update
  using (id = auth.uid() or is_admin())
  with check ((id = auth.uid() and role in ('client','vendeur')) or is_admin());

-- ========== PRODUITS ==========
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendeur_id uuid not null references profiles(id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  prix integer not null check (prix > 0),
  categorie text not null check (categorie in ('Mode','Beauté','Alimentation','Électronique','Artisanat','Autre')),
  etat text not null default 'Neuf' check (etat in ('Neuf','Occasion')),
  vendeur_nom text not null,
  ville text not null,
  contact_whatsapp text,
  statut text not null default 'publie' check (statut in ('publie','masque')),
  created_at timestamptz not null default now()
);
create index on products (created_at desc);

alter table products enable row level security;
create policy "produit: lecture" on products for select
  using (statut = 'publie' or vendeur_id = auth.uid() or is_admin());
create policy "produit: ajout" on products for insert
  with check (vendeur_id = auth.uid() and is_vendeur());
create policy "produit: modification" on products for update
  using (vendeur_id = auth.uid() or is_admin()) with check (vendeur_id = auth.uid() or is_admin());
create policy "produit: suppression" on products for delete
  using (vendeur_id = auth.uid() or is_admin());

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  chemin text not null,
  position integer not null default 0
);
alter table product_images enable row level security;
create policy "image: lecture" on product_images for select
  using (exists (select 1 from products p where p.id = product_id));
create policy "image: ajout" on product_images for insert
  with check (exists (select 1 from products p where p.id = product_id and (p.vendeur_id = auth.uid() or is_admin())));
create policy "image: suppression" on product_images for delete
  using (exists (select 1 from products p where p.id = product_id and (p.vendeur_id = auth.uid() or is_admin())));

-- ========== COMMANDES ==========
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  acheteur_id uuid not null references profiles(id),
  nom text not null,
  telephone text not null,
  adresse text not null,
  paiement text not null check (paiement in ('livraison','orange_money','moov_money')),
  total integer not null default 0,
  statut text not null default 'nouvelle' check (statut in ('nouvelle','confirmee','expediee','livree','annulee')),
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  vendeur_id uuid not null references profiles(id),
  nom text not null,
  prix integer not null,
  quantite integer not null check (quantite between 1 and 99)
);
create index on order_items (order_id);
create index on order_items (vendeur_id);

-- Fonctions « security definer » : évitent la boucle infinie entre les règles de orders et order_items.
create function public.is_order_seller(oid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from order_items where order_id = oid and vendeur_id = auth.uid());
$$;
create function public.is_order_buyer(oid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from orders where id = oid and acheteur_id = auth.uid());
$$;

alter table orders enable row level security;
alter table order_items enable row level security;
create policy "commande: lecture" on orders for select
  using (acheteur_id = auth.uid() or is_admin() or is_order_seller(id));
create policy "commande: statut" on orders for update
  using (is_order_seller(id) or is_admin()) with check (is_order_seller(id) or is_admin());
revoke update on orders from authenticated, anon;
grant update (statut) on orders to authenticated;
create policy "ligne: lecture" on order_items for select
  using (vendeur_id = auth.uid() or is_admin() or is_order_buyer(order_id));
-- Aucune règle d'insertion : on commande uniquement via passer_commande(), qui lit les vrais prix.

create function public.passer_commande(p_nom text, p_telephone text, p_adresse text, p_paiement text, p_lignes jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_total integer := 0; l jsonb; p products; q integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if jsonb_typeof(p_lignes) <> 'array' or jsonb_array_length(p_lignes) = 0 then raise exception 'Panier vide'; end if;
  insert into orders (acheteur_id, nom, telephone, adresse, paiement)
  values (auth.uid(), p_nom, p_telephone, p_adresse, p_paiement) returning id into v_id;
  for l in select * from jsonb_array_elements(p_lignes) loop
    q := (l->>'quantite')::int;
    select * into p from products where id = (l->>'id')::uuid and statut = 'publie';
    if not found then raise exception 'Produit indisponible'; end if;
    insert into order_items (order_id, product_id, vendeur_id, nom, prix, quantite)
    values (v_id, p.id, p.vendeur_id, p.nom, p.prix, q);
    v_total := v_total + p.prix * q;
  end loop;
  update orders set total = v_total where id = v_id;
  return v_id;
end $$;
revoke execute on function public.passer_commande(text,text,text,text,jsonb) from public, anon;
grant execute on function public.passer_commande(text,text,text,text,jsonb) to authenticated;

-- ========== MESSAGES ==========
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  expediteur_id uuid not null references profiles(id),
  destinataire_id uuid not null references profiles(id),
  contenu text not null check (char_length(contenu) between 1 and 1000),
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index on messages (destinataire_id, created_at desc);
alter table messages enable row level security;
create policy "message: lecture" on messages for select
  using (auth.uid() in (expediteur_id, destinataire_id) or is_admin());
create policy "message: envoi" on messages for insert
  with check (expediteur_id = auth.uid() and destinataire_id <> auth.uid());
create policy "message: lu" on messages for update
  using (destinataire_id = auth.uid()) with check (destinataire_id = auth.uid());
revoke update on messages from authenticated, anon;
grant update (lu) on messages to authenticated;

-- ========== NOTIFICATIONS ==========
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  titre text not null,
  corps text not null default '',
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);
alter table notifications enable row level security;
create policy "notif: lecture" on notifications for select using (user_id = auth.uid());
create policy "notif: lu" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on notifications from authenticated, anon;
grant update (lu) on notifications to authenticated;

create function public.notif_commande() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, titre, corps) values (new.vendeur_id, 'Nouvelle commande', new.quantite || ' x ' || new.nom);
  return new;
end $$;
create trigger t_notif_commande after insert on order_items for each row execute function public.notif_commande();

create function public.notif_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, titre, corps) values (new.destinataire_id, 'Nouveau message', left(new.contenu, 80));
  return new;
end $$;
create trigger t_notif_message after insert on messages for each row execute function public.notif_message();

-- ========== PHOTOS (stockage) ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "photos: lecture" on storage.objects for select using (bucket_id = 'produits');
create policy "photos: envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========== ADMINISTRATEUR ==========
-- Après ta première inscription, exécute (avec ton adresse e-mail) :
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'ton@email.com');
