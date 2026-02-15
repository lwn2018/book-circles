const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing New Books carousel fix...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Borrow button in New in this circle now works

- Added RequestConfirmationDialog to BooksListWithFilters
- Borrow and Join Queue buttons now open the dialog
- Previously just tried to scroll to main list (broken)"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
