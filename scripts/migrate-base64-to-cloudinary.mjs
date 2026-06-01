#!/usr/bin/env node
/**
 * Migrate ảnh base64 trong Supabase → URL Cloudinary (chạy một lần).
 *
 * Cần trong .env (hoặc export):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   CLOUDINARY_URL=cloudinary://key:secret@cloud_name
 *
 * Usage:
 *   node scripts/migrate-base64-to-cloudinary.mjs
 *   node scripts/migrate-base64-to-cloudinary.mjs --dry-run
 *   node scripts/migrate-base64-to-cloudinary.mjs --table=fp_farm_bao_cao_nhan_cong
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      if (!process.env[key]) process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();

const dryRun = process.argv.includes('--dry-run');
const tableArg = process.argv.find((a) => a.startsWith('--table='));
const onlyTable = tableArg ? tableArg.split('=')[1] : null;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Thiếu SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!process.env.CLOUDINARY_URL) {
  console.error('Thiếu CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name)');
  process.exit(1);
}

cloudinary.config({ secure: true });
const supabase = createClient(supabaseUrl, serviceKey);

async function uploadDataUrl(dataUrl, folder) {
  const res = await cloudinary.uploader.upload(dataUrl, { folder, resource_type: 'image' });
  return res.secure_url;
}

async function migrateNhanVien() {
  const { data, error } = await supabase
    .from('fp_var_nhan_vien')
    .select('id, hinh_anh')
    .like('hinh_anh', 'data:image/%');
  if (error) throw error;
  for (const row of data ?? []) {
    const url = await uploadDataUrl(row.hinh_anh, 'farm-erp/migrate/nhan-vien');
    console.log(`nhan_vien ${row.id} → ${url.slice(0, 60)}...`);
    if (!dryRun) {
      await supabase.from('fp_var_nhan_vien').update({ hinh_anh: url }).eq('id', row.id);
    }
  }
}

async function migrateTaiSan() {
  const { data, error } = await supabase
    .from('fp_ts_tai_san')
    .select('id, hinh_anh')
    .like('hinh_anh', 'data:image/%');
  if (error) throw error;
  for (const row of data ?? []) {
    const url = await uploadDataUrl(row.hinh_anh, 'farm-erp/migrate/tai-san');
    console.log(`tai_san ${row.id} → ${url.slice(0, 60)}...`);
    if (!dryRun) {
      await supabase.from('fp_ts_tai_san').update({ hinh_anh: url }).eq('id', row.id);
    }
  }
}

async function migrateHangHoa() {
  const { data, error } = await supabase
    .from('fp_mh_danh_sach_hang_hoa')
    .select('id, hinh_anh')
    .like('hinh_anh', 'data:image/%');
  if (error) throw error;
  for (const row of data ?? []) {
    const url = await uploadDataUrl(row.hinh_anh, 'farm-erp/migrate/hang-hoa');
    console.log(`hang_hoa ${row.id} → ${url.slice(0, 60)}...`);
    if (!dryRun) {
      await supabase.from('fp_mh_danh_sach_hang_hoa').update({ hinh_anh: url }).eq('id', row.id);
    }
  }
}

async function migrateBaoCaoNhanCong() {
  const { data, error } = await supabase.from('fp_farm_bao_cao_nhan_cong').select('id, hinh_anh_urls');
  if (error) throw error;
  for (const row of data ?? []) {
    const raw = row.hinh_anh_urls;
    if (!Array.isArray(raw) || raw.length === 0) continue;
    let changed = false;
    const next = [];
    for (const item of raw) {
      if (typeof item === 'string' && item.startsWith('data:image/')) {
        next.push(await uploadDataUrl(item, 'farm-erp/migrate/bao-cao-nhan-cong'));
        changed = true;
      } else {
        next.push(item);
      }
    }
    if (!changed) continue;
    console.log(`bao_cao_nhan_cong ${row.id} → ${next.length} url(s)`);
    if (!dryRun) {
      await supabase.from('fp_farm_bao_cao_nhan_cong').update({ hinh_anh_urls: next }).eq('id', row.id);
    }
  }
}

const tasks = [
  ['fp_var_nhan_vien', migrateNhanVien],
  ['fp_ts_tai_san', migrateTaiSan],
  ['fp_mh_danh_sach_hang_hoa', migrateHangHoa],
  ['fp_farm_bao_cao_nhan_cong', migrateBaoCaoNhanCong],
];

for (const [name, fn] of tasks) {
  if (onlyTable && onlyTable !== name) continue;
  console.log(`\n=== ${name} ===`);
  await fn();
}

console.log(dryRun ? '\n(dry-run — không ghi DB)' : '\nDone. Chạy VACUUM FULL trên các bảng trên Supabase nếu cần thu hồi disk.');
