const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

// Find all API routes
console.log('=== API Routes ===');
console.log(execSync(`find ${dir}/app/api -name "route.ts" | sort`, { encoding: 'utf8' }));

// Find components with "book" in name
console.log('=== Book Components ===');
console.log(execSync(`find ${dir}/app -name "*[Bb]ook*" -type f | sort`, { encoding: 'utf8' }));

// Find components with "handoff" in name
console.log('=== Handoff files ===');
console.log(execSync(`find ${dir} -name "*[Hh]andoff*" -type f | sort`, { encoding: 'utf8' }));
