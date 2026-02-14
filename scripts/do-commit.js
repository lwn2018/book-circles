const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Adding files...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });

console.log('Committing...');
const result = execSync(`git -C ${dir} commit -m "fix: Bug 1 & 2 - Mark all read + Buy on Amazon

Bug 1: Mark all read now uses service role to bypass RLS
Bug 2: Buy on Amazon now uses anchor tag (Safari never blocks)"`, { encoding: 'utf8' });
console.log(result);

console.log('Pushing...');
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
