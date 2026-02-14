const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== RequestConfirmationDialog ===');
try {
  console.log(execSync(`find ${dir}/app -name "*Request*" -type f | head -10`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
