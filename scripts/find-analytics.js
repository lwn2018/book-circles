const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== analytics.track calls in API routes ===');
try {
  console.log(execSync(`grep -rn "analytics.track" --include="*.ts" ${dir}/app/api 2>/dev/null`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found or error)'); }
