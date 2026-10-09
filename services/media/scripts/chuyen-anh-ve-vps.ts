/**
 * Chuyển ảnh cũ (base64 trong DB + link Cloudinary) về kho ảnh trên VPS (service media),
 * rồi thay giá trị trong DB bằng đường dẫn `/media/f/...`. Chạy MỘT lần, từ máy dev:
 *
 *   bash scripts/db-backup.sh truoc-chuyen-anh
 *   bash scripts/chuyen-anh-ve-vps.sh            # chạy thử: chỉ đếm, không ghi
 *   bash scripts/chuyen-anh-ve-vps.sh --chay     # ghi thật
 *
 * Cập nhật trong phiên `session_replication_role = replica` (cần superuser): KHÔNG kích hoạt
 * trigger nhật ký (nếu không ~200 MB base64 cũ bị chép sang fp_var_nhat_ky_thay_doi), không
 * đổi tg_cap_nhat, không vướng trigger khoá phiếu đã nộp. Mỗi dòng cập nhật có điều kiện
 * giá trị cũ còn nguyên — ai vừa sửa dòng đó thì bỏ qua, không ghi đè.
 * Bảng đối chiếu cũ → mới ghi vào backup/chuyen-anh-<thời điểm>.json (thư mục đã gitignore).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { SignJWT } from 'jose';

type Kieu = 'text' | 'text[]' | 'jsonb';
interface Cot {
  bang: string;
  cot: string;
  kieu: Kieu;
  thuMuc: string;
}

/** Đủ các cột có ảnh trên DB thật (đếm ngày 2026-10-09). */
const DS_COT: Cot[] = [
  { bang: 'fp_farm_bao_cao_nhan_cong', cot: 'hinh_anh_urls', kieu: 'jsonb', thuMuc: 'bao-cao-nhan-cong' },
  { bang: 'fp_mh_danh_sach_hang_hoa', cot: 'hinh_anh', kieu: 'text', thuMuc: 'hang-hoa' },
  { bang: 'fp_ts_tai_san', cot: 'hinh_anh', kieu: 'text', thuMuc: 'tai-san' },
  { bang: 'fp_var_nhan_vien', cot: 'hinh_anh', kieu: 'text', thuMuc: 'nhan-vien' },
  { bang: 'fp_mh_hop_dong', cot: 'hinh_anh_urls', kieu: 'text[]', thuMuc: 'hop-dong' },
  { bang: 'fp_var_tt_cong_ty', cot: 'logo', kieu: 'text', thuMuc: 'cong-ty' },
  { bang: 'fp_farm_dang_ky_nhan_hang', cot: 'hinh_anh_urls', kieu: 'text[]', thuMuc: 'dang-ky-nhan-hang' },
  { bang: 'fp_farm_giam_sat_chat_luong_ct', cot: 'hinh_anh_urls', kieu: 'text[]', thuMuc: 'giam-sat-chat-luong' },
];

const CAN_CHUYEN = (s: string) => s.startsWith('data:image/') || s.startsWith('https://res.cloudinary.com/');

function batBuoc(ten: string): string {
  const v = process.env[ten];
  if (!v) throw new Error(`Thiếu biến môi trường ${ten} (.env).`);
  return v;
}

const chay = process.argv.includes('--chay');
const mediaUrl = (process.env.MEDIA_PUBLIC_URL ?? 'https://fpfarm.5fedu.com').replace(/\/$/, '');
const client = new pg.Client({ connectionString: batBuoc('VPS_DB_URL') });

async function layBytes(giaTri: string): Promise<{ data: Buffer; type: string }> {
  if (giaTri.startsWith('data:')) {
    const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(giaTri);
    if (!m) throw new Error('data URL hỏng');
    const data = m[2] ? Buffer.from(m[3]!, 'base64') : Buffer.from(decodeURIComponent(m[3]!));
    return { data, type: m[1]! };
  }
  const res = await fetch(giaTri);
  if (!res.ok) throw new Error(`Cloudinary trả ${res.status}`);
  return { data: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') ?? 'image/jpeg' };
}

async function taiLen(token: string, thuMuc: string, giaTri: string): Promise<string> {
  const { data, type } = await layBytes(giaTri);
  const form = new FormData();
  form.append('thu_muc', thuMuc);
  form.append('file', new Blob([new Uint8Array(data)], { type }), 'anh');
  const res = await fetch(`${mediaUrl}/media/upload`, { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => ({}))) as { url?: string; thongDiep?: string };
  if (!res.ok || !json.url) throw new Error(json.thongDiep ?? `upload trả ${res.status}`);
  return json.url;
}

function docMang(kieu: Kieu, v: unknown): string[] | null {
  if (kieu === 'text') return typeof v === 'string' ? [v] : null;
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return null;
}

async function main() {
  await client.connect();
  const { rows: nvRows } = await client.query<{ id: number }>(
    'SELECT id FROM public.fp_var_nhan_vien WHERE cap_bac = 1 ORDER BY id LIMIT 1',
  );
  if (!nvRows[0]) throw new Error('Không tìm thấy nhân viên cấp bậc 1 để ký token tải ảnh.');
  const token = await new SignJWT({ role: 'authenticated', nv: nvRows[0].id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(new TextEncoder().encode(batBuoc('PGRST_JWT_SECRET')));

  if (chay) {
    const khoe = await fetch(`${mediaUrl}/media/khoe`).then((r) => r.ok).catch(() => false);
    if (!khoe) throw new Error(`Service media chưa chạy ở ${mediaUrl}/media/khoe — deploy trước rồi chạy lại.`);
    await client.query('SET session_replication_role = replica');
  }

  const doiChieu: Array<{ bang: string; cot: string; id: number; cu: string; moi: string }> = [];
  const loi: Array<{ bang: string; id: number; loi: string }> = [];
  let tongAnh = 0;
  let tongDong = 0;

  for (const c of DS_COT) {
    const dieuKien =
      c.kieu === 'text'
        ? `${c.cot} LIKE 'data:image/%' OR ${c.cot} LIKE 'https://res.cloudinary.com/%'`
        : c.kieu === 'jsonb'
          ? `${c.cot}::text LIKE '%data:image/%' OR ${c.cot}::text LIKE '%res.cloudinary.com%'`
          : `array_to_string(${c.cot}, ' ') LIKE '%data:image/%' OR array_to_string(${c.cot}, ' ') LIKE '%res.cloudinary.com%'`;
    const { rows } = await client.query<{ id: number; v: unknown }>(
      `SELECT id, ${c.cot} AS v FROM public.${c.bang} WHERE ${dieuKien} ORDER BY id`,
    );
    const soAnh = rows.reduce((n, r) => n + (docMang(c.kieu, r.v)?.filter(CAN_CHUYEN).length ?? 0), 0);
    console.log(`${c.bang}.${c.cot}: ${rows.length} dòng, ${soAnh} ảnh cần chuyển`);
    tongAnh += soAnh;
    tongDong += rows.length;
    if (!chay) continue;

    for (const r of rows) {
      const cu = docMang(c.kieu, r.v);
      if (!cu) continue;
      const moi: string[] = [];
      let hong = false;
      for (const giaTri of cu) {
        if (!CAN_CHUYEN(giaTri)) {
          moi.push(giaTri);
          continue;
        }
        try {
          const url = await taiLen(token, c.thuMuc, giaTri);
          moi.push(url);
          doiChieu.push({ bang: c.bang, cot: c.cot, id: r.id, cu: giaTri.startsWith('data:') ? `${giaTri.slice(0, 40)}…(${giaTri.length} ký tự)` : giaTri, moi: url });
        } catch (e) {
          hong = true;
          loi.push({ bang: c.bang, id: r.id, loi: e instanceof Error ? e.message : String(e) });
          moi.push(giaTri);
        }
      }
      if (hong && moi.every((x, i) => x === cu[i])) continue;
      const giaTriMoi = c.kieu === 'text' ? moi[0] : c.kieu === 'jsonb' ? JSON.stringify(moi) : moi;
      const ep = c.kieu === 'jsonb' ? '::jsonb' : c.kieu === 'text[]' ? '::text[]' : '';
      const res = await client.query(
        `UPDATE public.${c.bang} SET ${c.cot} = $1${ep} WHERE id = $2 AND ${c.cot} IS NOT DISTINCT FROM $3${ep}`,
        [giaTriMoi, r.id, c.kieu === 'jsonb' ? JSON.stringify(r.v) : r.v],
      );
      if (res.rowCount !== 1) loi.push({ bang: c.bang, id: r.id, loi: 'dòng vừa bị sửa trong lúc chuyển — bỏ qua' });
      process.stdout.write('.');
    }
    if (rows.length) process.stdout.write('\n');
  }

  console.log(`\nTổng: ${tongDong} dòng, ${tongAnh} ảnh${chay ? '' : ' (CHẠY THỬ — thêm --chay để ghi thật)'}`);
  if (chay) {
    const thuMuc = path.resolve(import.meta.dirname, '../../../backup');
    await mkdir(thuMuc, { recursive: true });
    const file = path.join(thuMuc, `chuyen-anh-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await writeFile(file, JSON.stringify({ doiChieu, loi }, null, 2));
    console.log(`Đã chuyển ${doiChieu.length} ảnh, lỗi ${loi.length}. Đối chiếu: ${path.relative(process.cwd(), file)}`);
    for (const l of loi) console.log(`  ✗ ${l.bang}#${l.id}: ${l.loi}`);
  }
  await client.end();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await client.end().catch(() => undefined);
  process.exit(1);
});
