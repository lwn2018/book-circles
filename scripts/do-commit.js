const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Adding files...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });

console.log('Committing...');
const result = execSync(`git -C ${dir} commit -m "feat: comprehensive event logging per spec

Events added:
- book_added (manual, search, barcode, goodreads)
- book_removed
- handoff_confirmed (both parties)
- borrow_requested
- borrow_confirmed
- return_confirmed
- circle_left
- off_shelf_toggled (on/off)
- gift_given / gift_received
- affiliate_click
- goodreads_imported

Price capture:
- retail_price_cad in book_added events
- retail_price_cad snapshot in handoff_confirmed"`, { encoding: 'utf8' });
console.log(result);

console.log('Pushing...');
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
