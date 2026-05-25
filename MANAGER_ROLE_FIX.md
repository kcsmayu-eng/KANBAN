# Manager Role Recognition - Fixed & Debugging Guide

## 🔴 Problem
After logging in as a manager, the app doesn't recognize your role and doesn't show the "Create Project" button.

## ✅ Root Cause Found
**Race condition**: The component was rendering before your profile data loaded from the database, so `isManager` appeared false.

## 🔧 Fixes Applied

### 1. Enhanced AuthContext.jsx
- Added debug logging to show when role info updates
- Now logs: `✅ AuthContext updated - Role: manager, isManager: true`

### 2. Fixed ProjectSelector.jsx  
- Now waits for BOTH auth loading AND projects loading before rendering
- Previously only waited for projects to load, causing premature render
- Now shows manager section only after profile is confirmed

## 🐛 Debugging Steps

### Step 1: Check Profile in Database
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor**
4. Run this query:
```sql
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;
```
5. **Verify**: Your account should show `role = 'manager'` (NOT null, NOT 'employee')

### Step 2: Check Browser Console Logs
1. Open the app in your browser
2. Press `F12` to open DevTools → **Console** tab
3. **Log in again**
4. Look for these logs:
   - ✅ `Profile loaded: {id: ..., role: "manager", ...}` 
   - ✅ `✅ AuthContext updated - Role: manager, isManager: true`
   - ✅ `ProjectSelector - Profile: {role: "manager", ...}, isManager: true, authLoading: false`

5. If you see errors:
   - ❌ `Profile fetch error: ...` → RLS policy issue
   - ❌ Missing logs → Profile not being fetched

### Step 3: Check RLS Policies
If you see "permission denied" errors:
1. Go to Supabase Dashboard → **Auth** → **Policies**
2. Click on `public.profiles` table
3. Verify these policies exist:
   - `profiles_select`: Anyone can read
   - `profiles_insert`: User can insert own profile
   - `profiles_update`: User can update own profile

### Step 4: Manual Database Audit
If your profile doesn't exist or has wrong role:

**Option A: Create/Fix via Supabase Dashboard**
1. Go to **Editor** → `profiles` table
2. Click **Insert row**
3. Set:
   - `id`: Your Supabase auth user ID (from Auth → Users)
   - `full_name`: Your name
   - `role`: `manager`

**Option B: Insert via SQL**
```sql
INSERT INTO public.profiles (id, full_name, role) 
VALUES ('YOUR-USER-ID', 'Your Name', 'manager');
```

## 🚀 Testing After Fix

1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear local storage** (DevTools → Application → Local Storage → Clear All)
3. **Log out** and **Log in again**
4. Check DevTools console for the success logs above
5. You should now see the **"Create New Project"** section

## 📋 Checklist

- [ ] Verified profile exists in database with `role = 'manager'`
- [ ] No errors in browser console
- [ ] Browser hard-refreshed and cache cleared  
- [ ] Logged out and back in
- [ ] Console shows success logs (✅ AuthContext updated)
- [ ] "Create New Project" section now visible
- [ ] Can create a new project successfully

## 🆘 Still Not Working?

1. Share the **browser console output** (the logs after login)
2. Share the **SQL query result** from the profiles table
3. Check if there are any **auth errors** in Supabase logs
   - Go to Supabase Dashboard → **Logs** → **Edge Functions/Auth**

