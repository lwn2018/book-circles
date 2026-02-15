const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${dir} commit -m "feat: Better import progress UX with navigation links

When importing 5+ books, shows friendly message:
- 'This might take a minute. Why not explore while you wait?'
- Links to Circles, Library, Shelf
- Note that books will appear when done

Keeps users engaged instead of staring at progress bar."`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${dir} push`, { encoding: 'utf8' }));
