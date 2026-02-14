const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Running TypeScript check...');
try {
  const result = execSync(`cd ${dir} && npx tsc --noEmit 2>&1 | head -50`, { encoding: 'utf8' });
  console.log(result || 'No TypeScript errors!');
} catch (e) {
  console.log('TypeScript errors found:');
  console.log(e.stdout || e.message);
}
