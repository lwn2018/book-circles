const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== RLS Policies in migrations ===');
try {
  console.log(execSync(`grep -r "CREATE POLICY\\|ALTER POLICY\\|policy" --include="*.sql" ${dir}/migrations ${dir}/supabase 2>/dev/null | grep -i books | head -30`, { encoding: 'utf8' }));
} catch (e) { 
  console.log('Grep failed or no results');
}
