const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Amazon/Buy button references ===');
try {
  console.log(execSync(`grep -rn "Buy on Amazon\\|Opening\\|amazon\\|window.open" --include="*.tsx" ${dir}/app 2>/dev/null | grep -v node_modules | head -30`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
