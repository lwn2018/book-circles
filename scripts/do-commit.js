const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Adding files...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });

console.log('Committing...');
const result = execSync(`git -C ${dir} commit -m "fix: use service role client for book insert to bypass RLS"`, { encoding: 'utf8' });
console.log(result);

console.log('Pushing...');
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
