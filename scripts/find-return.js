const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Return book / handoff completion code ===');
try {
  console.log(execSync(`grep -rn "return\\|handoff.*complete\\|both_confirmed" --include="*.ts" ${dir}/lib 2>/dev/null | head -30`, { encoding: 'utf8' }));
} catch (e) { console.log(e.message); }
