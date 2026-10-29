-- Ejecutar en el editor SQL de Supabase. Ninguna clave privada va en el frontend.
create table if not exists public.menu_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.menu_admins enable row level security;
revoke all on public.menu_admins from anon, authenticated;
create or replace function public.is_menu_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.menu_admins where user_id = auth.uid()) $$;
revoke all on function public.is_menu_admin() from public;
grant execute on function public.is_menu_admin() to anon, authenticated;
create table if not exists public.menus (
 id text primary key check (id = 'la-piccolina'),
 payload jsonb not null,
 version integer not null default 1
);
alter table public.menus enable row level security;
grant select on public.menus to anon, authenticated;
grant update on public.menus to authenticated;
drop policy if exists "Lectura publica del menu" on public.menus;
create policy "Lectura publica del menu" on public.menus for select to anon, authenticated using (true);
drop policy if exists "Solo administradores editan" on public.menus;
create policy "Solo administradores editan" on public.menus for update to authenticated
using (public.is_menu_admin()) with check (public.is_menu_admin());
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('menu-images','menu-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "Fotos publicas" on storage.objects;
create policy "Fotos publicas" on storage.objects for select to anon, authenticated using (bucket_id='menu-images');
drop policy if exists "Administradores suben fotos" on storage.objects;
create policy "Administradores suben fotos" on storage.objects for insert to authenticated
with check (bucket_id='menu-images' and public.is_menu_admin());
-- Crear al dueño desde Authentication > Users (sin registro público).
-- Autorizarlo con su UUID real, sin compartir contraseñas:
-- insert into public.menu_admins(user_id) values ('UUID-DEL-USUARIO');
