require('dotenv').config({ path: '/home/clawdbot/clawd/book-circles/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find Mathieu's profile and set is_beta_tester
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca');
  if (!mathieu) {
    console.log('User not found');
    return;
  }

  console.log('Found user:', mathieu.id, mathieu.email);

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_beta_tester: true })
    .eq('id', mathieu.id)
    .select();

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Updated profile:', data);
  }
}

main();
