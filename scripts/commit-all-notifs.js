const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing notification improvements...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Complete notification system for handoffs

- Bell notifications: Both parties get in-app notification
- Email notifications: Both parties get email with handoff link
- Fixed column name (action_url) so notifications appear in bell
- Done reading flow now sends emails to giver AND receiver
- Consistent messaging for all touchpoints"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
