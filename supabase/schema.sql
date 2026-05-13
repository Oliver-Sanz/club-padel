-- Initial Supabase schema for the padel club booking MVP.
-- This is designed for Supabase Postgres and should be applied after enabling Auth.

create extension if not exists btree_gist;

create type public.profile_role as enum ('user', 'admin');
create type public.booking_status as enum (
  'pending_payment',
  'confirmed',
  'cancelled',
  'expired',
  'blocked',
  'event'
);
create type public.hold_status as enum ('active', 'expired', 'converted', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_settings (
  club_id uuid primary key references public.clubs(id) on delete cascade,
  logo_path text,
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

create table public.courts (
  id smallint generated always as identity primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.courts (name)
values ('Pista 1'), ('Pista 2'), ('Pista 3')
on conflict (name) do nothing;

create table public.pricing_rules (
  id bigint generated always as identity primary key,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  price_per_30_min_cents integer not null check (price_per_30_min_cents >= 0),
  currency text not null default 'eur',
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- Example weekday pricing. Adjust amounts before production.
insert into public.pricing_rules (
  day_of_week,
  start_time,
  end_time,
  price_per_30_min_cents,
  label
)
select dow, '08:00'::time, '17:00'::time, 600, 'Valle'
from generate_series(1, 5) as dow
union all
select dow, '17:00'::time, '23:00'::time, 900, 'Punta'
from generate_series(1, 5) as dow;

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

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  court_id smallint not null references public.courts(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (60, 90)),
  status public.booking_status not null,
  price_total_cents integer not null default 0 check (price_total_cents >= 0),
  currency text not null default 'eur',
  price_breakdown jsonb not null default '[]'::jsonb,
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_policy_status text,
  check (start_time < end_time)
);

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  court_id smallint not null references public.courts(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  expires_at timestamptz not null,
  status public.hold_status not null default 'active',
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  check (expires_at > created_at)
);

create table public.admin_blocks (
  id uuid primary key default gen_random_uuid(),
  court_id smallint not null references public.courts(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text not null default 'americana',
  court_ids smallint[] not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- Prevent overlaps for real bookings that occupy the court.
alter table public.bookings
add constraint bookings_no_overlap
exclude using gist (
  court_id with =,
  tstzrange(start_time, end_time, '[)') with &&
)
where (status in ('pending_payment', 'confirmed', 'blocked', 'event'));

-- Prevent active holds from overlapping each other while they are still valid.
alter table public.booking_holds
add constraint booking_holds_no_active_overlap
exclude using gist (
  court_id with =,
  tstzrange(start_time, end_time, '[)') with &&
)
where (status = 'active');

create index bookings_user_start_idx on public.bookings (user_id, start_time);
create index bookings_court_start_idx on public.bookings (court_id, start_time);
create index booking_holds_expires_idx on public.booking_holds (expires_at) where status = 'active';

create or replace function public.assert_booking_does_not_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status not in ('pending_payment', 'confirmed', 'blocked', 'event') then
    return new;
  end if;

  if exists (
    select 1
    from public.admin_blocks b
    where b.court_id = new.court_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Booking overlaps an admin block';
  end if;

  if exists (
    select 1
    from public.events e
    where new.court_id = any(e.court_ids)
      and tstzrange(e.start_time, e.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Booking overlaps an event';
  end if;

  return new;
end;
$$;

create trigger bookings_cross_table_overlap_guard
before insert or update on public.bookings
for each row execute function public.assert_booking_does_not_overlap();

create or replace function public.assert_hold_does_not_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'active' then
    return new;
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.court_id = new.court_id
      and b.status in ('pending_payment', 'confirmed', 'blocked', 'event')
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Hold overlaps an occupied booking';
  end if;

  if exists (
    select 1
    from public.admin_blocks b
    where b.court_id = new.court_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Hold overlaps an admin block';
  end if;

  if exists (
    select 1
    from public.events e
    where new.court_id = any(e.court_ids)
      and tstzrange(e.start_time, e.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Hold overlaps an event';
  end if;

  return new;
end;
$$;

create trigger booking_holds_cross_table_overlap_guard
before insert or update on public.booking_holds
for each row execute function public.assert_hold_does_not_overlap();

create or replace function public.assert_admin_block_does_not_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.court_id = new.court_id
      and b.status in ('pending_payment', 'confirmed', 'blocked', 'event')
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Admin block overlaps an occupied booking';
  end if;

  if exists (
    select 1
    from public.admin_blocks b
    where b.court_id = new.court_id
      and b.id <> new.id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Admin block overlaps another admin block';
  end if;

  if exists (
    select 1
    from public.events e
    where new.court_id = any(e.court_ids)
      and tstzrange(e.start_time, e.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Admin block overlaps an event';
  end if;

  return new;
end;
$$;

create trigger admin_blocks_cross_table_overlap_guard
before insert or update on public.admin_blocks
for each row execute function public.assert_admin_block_does_not_overlap();

create or replace function public.assert_event_does_not_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.court_id = any(new.court_ids)
      and b.status in ('pending_payment', 'confirmed', 'blocked', 'event')
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Event overlaps an occupied booking';
  end if;

  if exists (
    select 1
    from public.admin_blocks b
    where b.court_id = any(new.court_ids)
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Event overlaps an admin block';
  end if;

  if exists (
    select 1
    from public.events e
    where e.id <> new.id
      and e.court_ids && new.court_ids
      and tstzrange(e.start_time, e.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'Event overlaps another event';
  end if;

  return new;
end;
$$;

create trigger events_cross_table_overlap_guard
before insert or update on public.events
for each row execute function public.assert_event_does_not_overlap();

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
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.clubs enable row level security;
alter table public.club_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_holds enable row level security;
alter table public.payments enable row level security;
alter table public.admin_blocks enable row level security;
alter table public.events enable row level security;

create policy "Profiles are visible to owner and admins"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "Courts are visible to everyone"
on public.courts for select
using (true);

create policy "Pricing is visible to everyone"
on public.pricing_rules for select
using (is_active);

create policy "Clubs are visible to everyone"
on public.clubs for select
using (true);

create policy "Admins manage clubs"
on public.clubs for all
using (public.is_admin())
with check (public.is_admin());

create policy "Club settings are visible to everyone"
on public.club_settings for select
using (true);

create policy "Admins manage club settings"
on public.club_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users can view own bookings, admins view all"
on public.bookings for select
using (user_id = auth.uid() or public.is_admin());

create policy "Users can create own pending bookings"
on public.bookings for insert
with check (
  user_id = auth.uid()
  and status = 'pending_payment'
);

-- Temporary Phase 2 policy: allows real bookings before Stripe is connected.
-- Remove this when Stripe Checkout becomes mandatory in Phase 4.
create policy "Users can create own confirmed MVP bookings"
on public.bookings for insert
with check (
  user_id = auth.uid()
  and status = 'confirmed'
);

create policy "Users can cancel own bookings"
on public.bookings for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Users can view own holds, admins view all"
on public.booking_holds for select
using (user_id = auth.uid() or public.is_admin());

create policy "Users can create own holds"
on public.booking_holds for insert
with check (user_id = auth.uid());

create policy "Users can update own holds"
on public.booking_holds for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "Admins manage admin blocks"
on public.admin_blocks for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage events"
on public.events for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins view payments"
on public.payments for select
using (public.is_admin());

-- Service-role backend code will handle payment inserts/updates from Stripe webhooks.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace view public.availability_items as
select
  b.id::text as id,
  b.court_id,
  b.start_time,
  b.end_time,
  b.status::text as status,
  case
    when b.status = 'pending_payment' then 'En proceso'
    else 'Reservada'
  end as label
from public.bookings b
where b.status in ('pending_payment', 'confirmed', 'blocked', 'event')
union all
select
  ab.id::text as id,
  ab.court_id,
  ab.start_time,
  ab.end_time,
  'blocked' as status,
  coalesce(ab.reason, 'Bloqueada') as label
from public.admin_blocks ab
union all
select
  (e.id::text || '-' || court_id::text) as id,
  court_id,
  e.start_time,
  e.end_time,
  'event' as status,
  e.name as label
from public.events e
cross join unnest(e.court_ids) as court_id;
