const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${dir} commit -m "fix: Final import progress copy"`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${dir} push`, { encoding: 'utf8' }));
