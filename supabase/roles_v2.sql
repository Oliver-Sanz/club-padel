-- Role model v2:
-- player: normal user who books and manages their own reservations.
-- admin: club operator who manages reservations.
-- super_admin: platform operator who manages branding and can also operate reservations.

alter type public.profile_role add value if not exists 'player';
alter type public.profile_role add value if not exists 'super_admin';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text = 'super_admin'
  );
$$;

create or replace function public.prevent_profile_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and auth.uid() is not null
    and not public.is_super_admin()
  then
    raise exception 'Only super admins can change profile roles';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
before update on public.profiles
for each row execute function public.prevent_profile_role_self_escalation();

drop policy if exists "Super admins can update profiles" on public.profiles;
create policy "Super admins can update profiles"
on public.profiles for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Admins manage clubs" on public.clubs;
create policy "Admins manage clubs"
on public.clubs for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Admins manage club settings" on public.club_settings;
create policy "Admins manage club settings"
on public.club_settings for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Admins can upload club branding assets" on storage.objects;
create policy "Admins can upload club branding assets"
on storage.objects for insert
with check (bucket_id = 'club-branding' and public.is_super_admin());

drop policy if exists "Admins can update club branding assets" on storage.objects;
create policy "Admins can update club branding assets"
on storage.objects for update
using (bucket_id = 'club-branding' and public.is_super_admin())
with check (bucket_id = 'club-branding' and public.is_super_admin());

drop policy if exists "Admins can delete club branding assets" on storage.objects;
create policy "Admins can delete club branding assets"
on storage.objects for delete
using (bucket_id = 'club-branding' and public.is_super_admin());
