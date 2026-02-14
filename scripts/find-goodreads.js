const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Goodreads files ===');
try {
  console.log(execSync(`find ${dir} -name "*oodreads*" -o -name "*Goodreads*" 2>/dev/null | grep -v node_modules`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

console.log('\n=== Goodreads references in code ===');
try {
  console.log(execSync(`grep -rn "goodreads\\|Goodreads" --include="*.tsx" ${dir}/app 2>/dev/null | grep -v node_modules | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
