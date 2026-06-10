#!/usr/bin/env node
/**
 * Kiểm tra key trùng giữa các file vi.json trong features (locales/vi.json).
 * Usage: node scripts/check-i18n-keys.mjs
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('find features -name vi.json -path "*/locales/*" | sort', {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

const seen = new Map();
const duplicates = [];

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key of Object.keys(json)) {
    if (seen.has(key)) {
      duplicates.push({ key, a: seen.get(key), b: file });
    } else {
      seen.set(key, file);
    }
  }
}

console.log(`Scanned ${files.length} feature vi.json files, ${seen.size} unique keys.`);

if (duplicates.length > 0) {
  console.error(`\nDuplicate keys (${duplicates.length}):`);
  for (const d of duplicates.slice(0, 20)) {
    console.error(`  ${d.key}\n    ${d.a}\n    ${d.b}`);
  }
  process.exit(1);
}

console.log('No duplicate keys.');
