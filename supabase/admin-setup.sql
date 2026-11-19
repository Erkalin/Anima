-- Run this AFTER adding the admin user in Authentication → Users
-- (Add user → email below, password of your choice, "Auto Confirm User" ON).
insert into public.admins (user_id, email, name, role)
select id, 'erkalin.lol@proton.me', 'مدیر آموزشگاه', 'owner'
from auth.users
where email = 'erkalin.lol@proton.me'
on conflict (email) do nothing;