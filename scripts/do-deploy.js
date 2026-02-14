const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Deploying to Vercel...');
const result = execSync(`cd ${dir} && vercel --prod --yes`, { encoding: 'utf8' });
console.log(result);
