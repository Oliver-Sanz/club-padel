-- Phase 3: show active booking holds as temporary orange/pending slots.
-- Run this in Supabase SQL Editor after the original schema.

create or replace function public.expire_old_booking_holds()
returns void
language sql
security definer
set search_path = public
as $$
  update public.booking_holds
  set status = 'expired'
  where status = 'active'
    and expires_at <= now();
$$;

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
  end as label,
  null::timestamptz as expires_at
from public.bookings b
where b.status in ('pending_payment', 'confirmed', 'blocked', 'event')
union all
select
  h.id::text as id,
  h.court_id,
  h.start_time,
  h.end_time,
  'pending_payment' as status,
  'En proceso' as label,
  h.expires_at
from public.booking_holds h
where h.status = 'active'
  and h.expires_at > now()
union all
select
  ab.id::text as id,
  ab.court_id,
  ab.start_time,
  ab.end_time,
  'blocked' as status,
  coalesce(ab.reason, 'Bloqueada') as label,
  null::timestamptz as expires_at
from public.admin_blocks ab
union all
select
  (e.id::text || '-' || court_id::text) as id,
  court_id,
  e.start_time,
  e.end_time,
  'event' as status,
  e.name as label,
  null::timestamptz as expires_at
from public.events e
cross join unnest(e.court_ids) as court_id;
