const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Adding files...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });

console.log('Committing...');
const result = execSync(`git -C ${dir} commit -m "fix: use email allowlist for admin check"`, { encoding: 'utf8' });
console.log(result);

console.log('Pushing...');
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
