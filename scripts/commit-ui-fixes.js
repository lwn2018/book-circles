const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${dir} commit -m "fix: UI tweaks - 2-line titles, bug button position

- Card view titles: Allow 2 lines with line-clamp-2 before truncating
- Bug/feedback button: Moved to bottom-right, changed to flag icon
- List view: Keep truncate (1 line is fine for compact view)"`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${dir} push`, { encoding: 'utf8' }));
