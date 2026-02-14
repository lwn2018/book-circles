const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('=== Book-specific animations ===');
try {
  console.log(execSync(`grep -rn "fly\\|flip\\|spin.*book\\|book.*anim\\|float\\|bounce" --include="*.tsx" --include="*.css" ${dir}/app 2>/dev/null | grep -v node_modules`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

console.log('\n=== globals.css animations ===');
try {
  console.log(execSync(`cat ${dir}/app/globals.css | grep -A5 "@keyframes"`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
