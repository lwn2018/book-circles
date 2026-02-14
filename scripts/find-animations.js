const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Animation classes/styles ===');
try {
  console.log(execSync(`grep -rn "animate-\\|animation\\|transition\\|@keyframes" --include="*.tsx" --include="*.css" ${dir}/app 2>/dev/null | grep -v node_modules | head -40`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
