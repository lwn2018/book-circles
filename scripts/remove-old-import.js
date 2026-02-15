const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = '/home/clawdbot/clawd/book-circles/app/library/import';

// Remove directory recursively
function rmdir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        rmdir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

rmdir(dir);
console.log('Removed old import folder');

// Commit
const gitDir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${gitDir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${gitDir} commit -m "fix: Remove duplicate import folder (build conflict)"`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${gitDir} push`, { encoding: 'utf8' }));
