// In hash sha256 của các thẻ <script> inline trong dist/index.html để dán vào script-src
// của deploy/nginx-security-headers.conf. Chạy sau `npm run build`.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
for (const m of html.matchAll(re)) {
  console.log(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
}
