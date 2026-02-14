const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== AddBookModal imports ===');
try {
  console.log(execSync(`grep -r "AddBookModal" --include="*.tsx" ${dir}/app | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

console.log('\n=== AppHeader ===');
try {
  console.log(execSync(`find ${dir}/app -name "*Header*" -type f`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
