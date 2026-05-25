# Authentication Debug Steps

## Check Profile in Database
1. Open Supabase dashboard
2. Go to SQL Editor and run:
```sql
SELECT id, full_name, role FROM public.profiles;
```
3. Verify your account shows role = 'manager' (not null or 'employee')

## Check Browser Console
1. Login to the app
2. Open DevTools (F12) → Console tab
3. Look for these logs:
   - "Profile loaded: {role: 'manager', ...}" ✅ GOOD
   - "Profile fetch error:" ❌ PROBLEM
   - No profile logs ❌ Profile not being fetched

4. Also check in ProjectSelector output for:
   - "ProjectSelector - Profile: {role: 'manager', ...}, isManager: true" ✅ GOOD

## Possible Issues
- Profile doesn't exist in database after signup
- Role field is NULL or 'employee' instead of 'manager'
- Profile takes too long to load and component renders before it arrives
- RLS policy preventing profile fetch
