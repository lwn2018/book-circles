const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Running Next.js lint check...');
try {
  const result = execSync(`cd ${dir} && npm run lint 2>&1`, { encoding: 'utf8', timeout: 60000 });
  console.log(result);
} catch (e) {
  console.log('Lint output:');
  console.log(e.stdout || e.stderr || e.message);
}
