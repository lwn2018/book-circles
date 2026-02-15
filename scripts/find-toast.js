const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Floating toast implementations ===');
try {
  console.log(execSync(`grep -rn "fixed.*bottom\\|bottom-4\\|bottom-20" --include="*.tsx" ${dir}/app 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
