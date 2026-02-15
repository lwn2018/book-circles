const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing Done Reading UX fix...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Simplify Done Reading flow - fewer popups, no auto-navigate

- Removed second popup (alert) after confirmation
- No longer auto-navigates to handoff page
- Shows inline success message under the book
- User stays on shelf, handoff appears in Pending Handoffs
- Go to handoff page via notification or Pending Handoffs section"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
