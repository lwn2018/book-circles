const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Return button/action ===');
try {
  console.log(execSync(`grep -rn "handleReturn\\|Return.*book\\|initiateReturn" --include="*.tsx" --include="*.ts" ${dir}/app 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
