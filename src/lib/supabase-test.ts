/**
 * Supabase Connection Test
 * اختبار الاتصال بـ Supabase Cloud
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ribugqwbqdvihnifnmwp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_g3QbNEOeJrzHLQ9wj67ukw_5zRtqC92';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test Supabase Connection
 */
export async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

  try {
    // Test 1: Check Auth
    console.log('\n📋 Test 1: Getting current user...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn('⚠️ Auth Error:', authError.message);
      console.log('✅ This is OK - no user logged in yet\n');
    } else {
      console.log('✅ Auth connected! User:', user?.email || 'Anonymous');
    }

    // Test 2: List Tables
    console.log('📋 Test 2: Checking database...');
    const { data, error } = await supabase.from('users').select('count()', {
      count: 'exact',
      head: true,
    });

    if (error) {
      console.error('❌ Database Error:', error.message);
      return false;
    }

    console.log('✅ Database connected!');

    // Test 3: Check Tables
    console.log('\n📋 Test 3: Listing available tables...');
    const tables = [
      'users',
      'recipients',
      'letters',
      'letter_replies',
      'security_questions',
      'security_logs',
      'admin_users',
    ];

    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (tableError && !tableError.message.includes('not found')) {
          throw tableError;
        }

        console.log(`  ✅ ${table}`);
      } catch (err: any) {
        console.log(`  ⚠️ ${table} - ${err.message}`);
      }
    }

    console.log('\n✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

/**
 * Example: Get all users
 */
export async function getUsers() {
  console.log('\n📋 Fetching users...');
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ Users:', data);
  return data;
}

/**
 * Example: Get all recipients
 */
export async function getRecipients() {
  console.log('\n📋 Fetching recipients...');
  const { data, error } = await supabase.from('recipients').select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ Recipients:', data);
  return data;
}

/**
 * Example: Get all letters
 */
export async function getLetters() {
  console.log('\n📋 Fetching letters...');
  const { data, error } = await supabase.from('letters').select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ Letters:', data);
  return data;
}

/**
 * Example: Get security logs
 */
export async function getSecurityLogs() {
  console.log('\n📋 Fetching security logs...');
  const { data, error } = await supabase.from('security_logs').select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ Security Logs:', data);
  return data;
}

/**
 * Example: Listen to Real-time Updates (Subscriptions)
 */
export function subscribeToUsers() {
  console.log('\n🔴 Subscribing to users changes...');

  const subscription = supabase
    .from('users')
    .on('*', (payload: any) => {
      console.log('📬 User change detected:', payload);
    })
    .subscribe();

  return subscription;
}

/**
 * Example: Insert new user
 */
export async function createUser(email: string, metadata: any = {}) {
  console.log(`\n📝 Creating user: ${email}`);

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, ...metadata }])
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ User created:', data);
  return data;
}

/**
 * Example: Update user
 */
export async function updateUser(id: string, updates: any) {
  console.log(`\n✏️ Updating user: ${id}`);

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log('✅ User updated:', data);
  return data;
}

/**
 * Example: Delete user
 */
export async function deleteUser(id: string) {
  console.log(`\n🗑️ Deleting user: ${id}`);

  const { error } = await supabase.from('users').delete().eq('id', id);

  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }

  console.log('✅ User deleted');
  return true;
}

// Run tests if this is executed directly
if (typeof window === 'undefined') {
  console.log('🚀 Running Supabase Connection Tests\n');
  testSupabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { supabase };
