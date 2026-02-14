process.chdir('/home/clawdbot/clawd/book-circles');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== Recent user_events ===\n');
  
  const { data, error } = await supabase
    .from('user_events')
    .select('event_type, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No events found yet.');
    return;
  }

  data.forEach(e => {
    const time = new Date(e.created_at).toISOString().slice(0, 19);
    console.log(`${time} | ${e.event_type}`);
    console.log(`  metadata: ${JSON.stringify(e.metadata)}`);
  });

  console.log('\n=== Event type counts ===\n');
  
  const { data: counts } = await supabase
    .from('user_events')
    .select('event_type');

  if (counts) {
    const typeCounts = {};
    counts.forEach(e => {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    });
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }
}

main();
