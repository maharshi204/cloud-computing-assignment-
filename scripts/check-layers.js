const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
        filesList.push(fullPath);
      }
    }
  }
  return filesList;
}

const rootDir = path.join(__dirname, '..');
const businessFiles = getFiles(path.join(rootDir, 'business'));
const dataFiles = getFiles(path.join(rootDir, 'data'));
const presentationFiles = getFiles(path.join(rootDir, 'presentation'));

let violations = 0;
let fileCount = 0;

function checkFile(filePath, rules) {
  fileCount++;
  const content = fs.readFileSync(filePath, 'utf8');
  // simple regex for requires and imports
  const requires = [...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  const imports = [...content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
  
  const allDeps = [...requires, ...imports];
  let fileViolations = 0;

  for (const dep of allDeps) {
    for (const rule of rules) {
      if (rule.pattern.test(dep)) {
        if (!rule.allowList || !rule.allowList.some(allow => allow.test(dep))) {
          console.error(`\x1b[31m✗ ${path.relative(rootDir, filePath)} → forbidden import '${dep}'\x1b[0m`);
          violations++;
          fileViolations++;
        }
      }
    }
  }

  // specific presentation/web logic
  if (filePath.includes(path.join('presentation', 'web'))) {
    if (/postgres|pg|DATABASE_URL/.test(content)) {
      console.error(`\x1b[31m✗ ${path.relative(rootDir, filePath)} → contains forbidden string (postgres/pg/DATABASE_URL)\x1b[0m`);
      violations++;
      fileViolations++;
    }
  }

  if (fileViolations === 0) {
    console.log(`✓ ${path.relative(rootDir, filePath)}`);
  }
}

// RULES
// Business: MUST NOT import pg, express, dotenv, http, anything under /data, anything under /presentation
const businessRules = [
  { pattern: /^pg$/ },
  { pattern: /^express$/ },
  { pattern: /^dotenv$/ },
  { pattern: /^http$/ },
  { pattern: /data(\/|$)/ },
  { pattern: /presentation(\/|$)/ }
];

// Data: MUST NOT import express, anything under /business (except BookRepository base class), anything under /presentation
const dataRules = [
  { pattern: /^express$/ },
  { pattern: /presentation(\/|$)/ },
  { 
    pattern: /business(\/|$)/, 
    allowList: [/business\/ports\/BookRepository/]
  }
];

// Presentation: MUST NOT import pg, anything under /data
const presentationRules = [
  { pattern: /^pg$/ },
  { pattern: /data(\/|$)/ }
];

console.log('--- LAYER CHECK ---');

businessFiles.forEach(f => checkFile(f, businessRules));
dataFiles.forEach(f => checkFile(f, dataRules));
presentationFiles.forEach(f => checkFile(f, presentationRules));

console.log('\n');
if (violations === 0) {
  console.log(`\x1b[1mLAYER CHECK PASSED — 0 violations in ${fileCount} files\x1b[0m`);
  process.exit(0);
} else {
  console.log(`\x1b[31mLAYER CHECK FAILED — ${violations} violations found in ${fileCount} files\x1b[0m`);
  process.exit(1);
}
