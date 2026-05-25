// Quick test script to run in browser console after logging in
// Copy & paste this entire block into DevTools Console while logged into the app

console.log('🔍 Starting Manager Role Diagnostic...\n');

// Test 1: Check Supabase Auth
const testSupabaseAuth = async () => {
  try {
    const { data } = await window.supabaseClient.auth.getSession();
    const user = data?.session?.user;
    console.log('✅ Auth Session:', user?.id, user?.email);
    return user;
  } catch (err) {
    console.error('❌ Auth Error:', err.message);
    return null;
  }
};

// Test 2: Fetch profile directly
const testProfileFetch = async (userId) => {
  try {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    console.log('✅ Profile Fetched:', data);
    console.log('   Role:', data.role);
    return data;
  } catch (err) {
    console.error('❌ Profile Fetch Error:', err.message);
    return null;
  }
};

// Test 3: Check React Context
const testReactContext = () => {
  // This assumes useAuth is available - might need adjustment
  console.log('📌 React Context should show in component logs');
};

// Run tests
(async () => {
  const user = await testSupabaseAuth();
  if (user) {
    const profile = await testProfileFetch(user.id);
    if (profile) {
      const isManager = profile.role === 'manager';
      console.log('\n🎯 RESULT:', isManager ? '✅ IS MANAGER' : '❌ NOT MANAGER');
    }
  }
  console.log('\n📋 Check console for logs: "ProjectSelector" and "AuthContext updated"');
})();
