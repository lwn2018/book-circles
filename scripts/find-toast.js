const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Toast usage ===');
try {
  console.log(execSync(`grep -r "toast\\|Toast\\|sonner\\|react-hot-toast" --include="*.tsx" --include="*.ts" ${dir}/app ${dir}/lib ${dir}/package.json 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
