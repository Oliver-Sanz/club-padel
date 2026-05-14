alter table public.bookings
add column if not exists created_by uuid references public.profiles(id) on delete set null;

