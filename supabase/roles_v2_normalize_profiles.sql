-- Run this after roles_v2.sql has completed successfully.
-- It renames legacy "user" profiles to the clearer "player" role.

alter table public.profiles
alter column role set default 'player';

update public.profiles
set role = 'player'
where role::text = 'user';

