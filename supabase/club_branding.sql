-- Club branding and content settings for the white-label dashboard.
-- Run this once in Supabase SQL Editor for the existing production database.

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_settings (
  club_id uuid primary key references public.clubs(id) on delete cascade,
  logo_path text,
  logo_full_path text,
  colors jsonb not null default '{
    "background": "#25476E",
    "foreground": "#33EFFF",
    "accent": "#CCFF00",
    "grey": "#D9D9D9",
    "ink": "#07111C",
    "panel": "#102A43",
    "mist": "#EAF6FA",
    "line": "#CCFF00"
  }'::jsonb,
  copy jsonb not null default '{
    "home": {
      "eyebrow": "Club de Padel",
      "title": "Reservas claras, rapidas y sin dobles reservas.",
      "subtitle": "Fase 2 del MVP: login con Supabase, disponibilidad preparada para datos reales y fallback seguro a mocks mientras configuras las claves."
    },
    "auth": {
      "eyebrow": "Acceso Fase 2",
      "title": "Reserva con tu cuenta",
      "subtitle": "Puedes ver disponibilidad sin iniciar sesion. Para reservar, usaremos Google o un enlace por email.",
      "googleButton": "Continuar con Google",
      "emailButton": "Recibir enlace por email",
      "helper": "Supabase todavia no esta configurado. La app seguira usando datos mock hasta que rellenes `.env.local`.",
      "loggedInTitle": "Estas dentro",
      "loggedInSubtitle": "Sesion activa",
      "reservationsButton": "Mis reservas",
      "adminButton": "Ir a admin",
      "logoutButton": "Cerrar sesion",
      "missingConfig": "Configura Supabase para activar el acceso real."
    },
    "booking": {
      "eyebrow": "Disponibilidad",
      "title": "Elige pista y hora",
      "subtitle": "Scroll horizontal sincronizado: mueve cualquier pista y las tres se alinean. Los slots amarillos son reservas en proceso con expiracion temporal.",
      "buttonLabel": "Guardar 6 minutos",
      "activeHoldLabel": "Reserva temporal activa",
      "holdSuccess": "Horario guardado. Ahora confirma la reserva antes de que expire.",
      "holdRefreshError": "No se pudo actualizar la disponibilidad. Reintentando con datos actuales.",
      "loadingMessage": "Actualizando disponibilidad...",
      "legendAvailable": "Libre",
      "legendBooked": "Ocupado",
      "legendBlocked": "Bloqueado",
      "legendInProgress": "En proceso"
    },
    "admin": {
      "eyebrow": "Admin",
      "title": "Reservas del club",
      "subtitle": "Vista de todas las reservas activas futuras, ordenadas por fecha y pista.",
      "backButton": "Volver a reservas",
      "settingsTitle": "Branding y textos",
      "settingsSubtitle": "Ajusta el nombre, logo, colores y textos visibles de la web sin tocar el codigo.",
      "reservationsTitle": "Reservas del club",
      "reservationsSubtitle": "Vista de todas las reservas activas futuras, ordenadas por fecha y pista.",
      "manualTitle": "Crear reserva manual",
      "manualSubtitle": "El dia se elige en el calendario superior. Esta accion crea una reserva confirmada desde el club, sin pasar por pago."
    },
    "player": {
      "eyebrow": "Jugador",
      "title": "Mis reservas",
      "subtitle": "Consulta tus proximas reservas y cancela gratis hasta 6 horas antes.",
      "upcomingTitle": "Proximas reservas",
      "historyTitle": "Historial",
      "emptyUpcoming": "Aun no tienes reservas futuras.",
      "emptyHistory": "Todavia no hay historial.",
      "cancelButton": "Cancelar reserva",
      "cancelingButton": "Cancelando...",
      "cancelSuccess": "Reserva cancelada.",
      "contactClub": "Faltan menos de 6 horas: contacta con el club",
      "cancelledLabel": "Cancelada"
    },
    "system": {
      "configurationMissing": "Configura Supabase antes de usar esta pagina.",
      "loadingAvailability": "Cargando disponibilidad...",
      "dataSourceMock": "Mock local",
      "dataSourceSupabase": "Supabase",
      "updatingAvailability": "Actualizando disponibilidad..."
    }
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_settings
add column if not exists logo_full_path text;

create index if not exists clubs_slug_idx on public.clubs (slug);

alter table public.clubs enable row level security;
alter table public.club_settings enable row level security;

drop policy if exists "Clubs are visible to everyone" on public.clubs;
create policy "Clubs are visible to everyone"
on public.clubs for select
using (true);

drop policy if exists "Admins manage clubs" on public.clubs;
create policy "Admins manage clubs"
on public.clubs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Club settings are visible to everyone" on public.club_settings;
create policy "Club settings are visible to everyone"
on public.club_settings for select
using (true);

drop policy if exists "Admins manage club settings" on public.club_settings;
create policy "Admins manage club settings"
on public.club_settings for all
using (public.is_admin())
with check (public.is_admin());

insert into public.clubs (slug, name, is_active)
values ('default', 'Club de Padel', true)
on conflict (slug) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.club_settings (club_id)
select id
from public.clubs
where slug = 'default'
on conflict (club_id) do nothing;

insert into storage.buckets (id, name, public)
values ('club-branding', 'club-branding', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

drop policy if exists "Public can read club branding assets" on storage.objects;
create policy "Public can read club branding assets"
on storage.objects for select
using (bucket_id = 'club-branding');

drop policy if exists "Admins can upload club branding assets" on storage.objects;
create policy "Admins can upload club branding assets"
on storage.objects for insert
with check (bucket_id = 'club-branding' and public.is_admin());

drop policy if exists "Admins can update club branding assets" on storage.objects;
create policy "Admins can update club branding assets"
on storage.objects for update
using (bucket_id = 'club-branding' and public.is_admin())
with check (bucket_id = 'club-branding' and public.is_admin());

drop policy if exists "Admins can delete club branding assets" on storage.objects;
create policy "Admins can delete club branding assets"
on storage.objects for delete
using (bucket_id = 'club-branding' and public.is_admin());
