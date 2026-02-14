const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

// Find book deletion/removal
console.log('=== Book Removal ===');
try {
  console.log(execSync(`grep -r "delete.*book\\|remove.*book\\|book.*delete\\|book.*remove" --include="*.ts" --include="*.tsx" ${dir}/app ${dir}/lib 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

// Find circle leave functionality  
console.log('\n=== Circle Leave ===');
try {
  console.log(execSync(`grep -r "leave.*circle\\|circle.*leave\\|circle_members.*delete" --include="*.ts" --include="*.tsx" ${dir}/app ${dir}/lib 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

// Find off-shelf toggle
console.log('\n=== Off Shelf Toggle ===');
try {
  console.log(execSync(`grep -r "off.shelf\\|off_shelf" --include="*.ts" --include="*.tsx" ${dir}/app ${dir}/lib 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

// Find gift functionality
console.log('\n=== Gift ===');
try {
  console.log(execSync(`grep -r "gift" --include="*.ts" --include="*.tsx" ${dir}/app ${dir}/lib 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }

// Find affiliate/amazon
console.log('\n=== Affiliate/Amazon ===');
try {
  console.log(execSync(`grep -r "affiliate\\|amazon\\|purchase.click" --include="*.ts" --include="*.tsx" ${dir}/app ${dir}/lib 2>/dev/null | head -20`, { encoding: 'utf8' }));
} catch (e) { console.log('(none found)'); }
