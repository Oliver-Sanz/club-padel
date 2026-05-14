-- Run this after roles_v2.sql has completed successfully.
-- In the current MVP, existing admins were platform admins. Preserve their branding access.

update public.profiles
set role = 'super_admin'
where role::text = 'admin';

