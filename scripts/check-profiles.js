process.chdir('/home/clawdbot/clawd/book-circles');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Get all profiles
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) { console.error(error); return; }
  
  // Show column names
  if (data && data.length > 0) {
    console.log('Profile columns:', Object.keys(data[0]).join(', '));
    console.log('---');
    
    // Find mathieu
    const mathieu = data.find(p => p.display_name?.toLowerCase().includes('mathieu'));
    if (mathieu) {
      console.log('\nMathieu profile:');
      Object.entries(mathieu).forEach(([k, v]) => {
        if (v !== null) console.log(`  ${k}: ${v}`);
      });
    }
    
    // Show all users with any "admin" or "role" fields set
    console.log('\n--- All profiles summary ---');
    data.forEach(p => {
      const flags = [];
      Object.entries(p).forEach(([k, v]) => {
        if (v === true || (typeof v === 'string' && v.includes('admin'))) {
          flags.push(`${k}=${v}`);
        }
      });
      console.log(`${p.display_name || p.id}: ${flags.length ? flags.join(', ') : '(no special flags)'}`);
    });
  }
}
main();
