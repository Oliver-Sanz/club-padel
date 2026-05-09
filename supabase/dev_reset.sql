-- Development reset only.
-- Use this when the initial schema failed halfway and Supabase is left in a partial state.
-- WARNING: this deletes the MVP public tables and data.

drop view if exists public.availability_items;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.events cascade;
drop table if exists public.admin_blocks cascade;
drop table if exists public.booking_holds cascade;
drop table if exists public.bookings cascade;
drop table if exists public.payments cascade;
drop table if exists public.pricing_rules cascade;
drop table if exists public.courts cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.assert_event_does_not_overlap() cascade;
drop function if exists public.assert_admin_block_does_not_overlap() cascade;
drop function if exists public.assert_hold_does_not_overlap() cascade;
drop function if exists public.assert_booking_does_not_overlap() cascade;
drop function if exists public.is_admin() cascade;

drop type if exists public.payment_status cascade;
drop type if exists public.hold_status cascade;
drop type if exists public.booking_status cascade;
drop type if exists public.profile_role cascade;
