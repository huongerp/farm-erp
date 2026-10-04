/**
 * Truy cập Postgres bằng role `sheets_service` — chỉ chạm bảng của service này
 * (docs/migrations/011-*.sql). Không đọc bảng nghiệp vụ: dữ liệu nguồn của đồng bộ
 * đọc qua PostgREST bằng JWT của người tạo lịch, để RLS áp đúng như trên app.
 */
import { Pool } from 'pg';
import { config } from './config.ts';
import { giaiMa, maHoa } from './core/ma-hoa.ts';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[sheets/db] lỗi trên connection rảnh:', err.message);
});

export async function kiemTraKetNoi(): Promise<void> {
  await pool.query('SELECT 1');
}

export async function dongPool(): Promise<void> {
  await pool.end();
}

// --- Kết nối Google -----------------------------------------------------------

export interface KetNoi {
  nhanVienId: number;
  email: string;
  refreshToken: string;
  accessToken: string | null;
  hetHan: Date | null;
  trangThai: 'hoat_dong' | 'hong';
}

export async function layKetNoi(nhanVienId: number): Promise<KetNoi | null> {
  const kq = await pool.query<{
    google_email: string;
    refresh_token_mahoa: string;
    access_token_mahoa: string | null;
    access_token_het_han: Date | null;
    trang_thai: 'hoat_dong' | 'hong';
  }>(
    `SELECT google_email, refresh_token_mahoa, access_token_mahoa, access_token_het_han, trang_thai
       FROM public.fp_var_google_ket_noi WHERE nhan_vien_id = $1`,
    [nhanVienId],
  );
  const r = kq.rows[0];
  if (!r) return null;
  return {
    nhanVienId,
    email: r.google_email,
    refreshToken: giaiMa(r.refresh_token_mahoa, config.tokenKey),
    accessToken: r.access_token_mahoa ? giaiMa(r.access_token_mahoa, config.tokenKey) : null,
    hetHan: r.access_token_het_han,
    trangThai: r.trang_thai,
  };
}

/**
 * Lưu sau khi đổi code. Google không phải lần nào cũng trả refresh_token mới —
 * khi thiếu thì giữ cái cũ (COALESCE), đừng ghi đè bằng NULL.
 */
export async function luuKetNoi(v: {
  nhanVienId: number;
  email: string;
  refreshToken: string | null;
  accessToken: string;
  hetHan: Date;
}): Promise<boolean> {
  const rt = v.refreshToken ? maHoa(v.refreshToken, config.tokenKey) : null;
  const kq = await pool.query(
    `INSERT INTO public.fp_var_google_ket_noi
            (nhan_vien_id, google_email, refresh_token_mahoa, access_token_mahoa, access_token_het_han, trang_thai)
     SELECT $1, $2, $3, $4, $5, 'hoat_dong' WHERE $3::text IS NOT NULL
     ON CONFLICT (nhan_vien_id) DO UPDATE SET
       google_email = EXCLUDED.google_email,
       refresh_token_mahoa = COALESCE($3, public.fp_var_google_ket_noi.refresh_token_mahoa),
       access_token_mahoa = EXCLUDED.access_token_mahoa,
       access_token_het_han = EXCLUDED.access_token_het_han,
       trang_thai = 'hoat_dong',
       tg_cap_nhat = now()`,
    [v.nhanVienId, v.email, rt, maHoa(v.accessToken, config.tokenKey), v.hetHan],
  );
  if ((kq.rowCount ?? 0) > 0) return true;
  // Chưa có dòng và Google không trả refresh_token → UPDATE cho trường hợp đã có dòng.
  const up = await pool.query(
    `UPDATE public.fp_var_google_ket_noi
        SET google_email = $2, access_token_mahoa = $3, access_token_het_han = $4,
            trang_thai = 'hoat_dong', tg_cap_nhat = now()
      WHERE nhan_vien_id = $1`,
    [v.nhanVienId, v.email, maHoa(v.accessToken, config.tokenKey), v.hetHan],
  );
  return (up.rowCount ?? 0) > 0;
}

export async function capNhatAccessToken(nhanVienId: number, accessToken: string, hetHan: Date): Promise<void> {
  await pool.query(
    `UPDATE public.fp_var_google_ket_noi
        SET access_token_mahoa = $2, access_token_het_han = $3, tg_cap_nhat = now()
      WHERE nhan_vien_id = $1`,
    [nhanVienId, maHoa(accessToken, config.tokenKey), hetHan],
  );
}

export async function danhDauHong(nhanVienId: number): Promise<void> {
  await pool.query(
    `UPDATE public.fp_var_google_ket_noi
        SET trang_thai = 'hong', access_token_mahoa = NULL, access_token_het_han = NULL, tg_cap_nhat = now()
      WHERE nhan_vien_id = $1`,
    [nhanVienId],
  );
}

export async function xoaKetNoi(nhanVienId: number): Promise<void> {
  await pool.query('DELETE FROM public.fp_var_google_ket_noi WHERE nhan_vien_id = $1', [nhanVienId]);
}

// --- Người tạo lịch (RPC SECURITY DEFINER, migration 012) -------------------------

export interface NguoiTao {
  email: string | null;
  conLam: boolean;
  toanPhamVi: boolean;
}

export async function kiemNguoiTao(nhanVienId: number, moduleId: string): Promise<NguoiTao | null> {
  const kq = await pool.query<{ email: string | null; con_lam: boolean; toan_pham_vi: boolean }>(
    'SELECT email, con_lam, toan_pham_vi FROM public.rpc_sheets_nguoi_tao($1, $2)',
    [nhanVienId, moduleId],
  );
  const r = kq.rows[0];
  return r ? { email: r.email, conLam: r.con_lam, toanPhamVi: r.toan_pham_vi } : null;
}

export async function baoLoiVaoChuong(lichId: number, tieuDe: string, noiDung: string): Promise<void> {
  try {
    await pool.query('SELECT public.rpc_sheets_bao_loi($1, $2, $3)', [lichId, tieuDe, noiDung]);
  } catch (e) {
    console.error('[sheets/db] không ghi được thông báo lỗi:', (e as Error).message);
  }
}

// --- Lịch đồng bộ ----------------------------------------------------------------

export interface Lich {
  id: number;
  nhanVienId: number;
  moduleId: string;
  nguon: string;
  bangGoc: string[];
  cot: { key: string; label: string; type?: string }[];
  spreadsheetId: string;
  spreadsheetUrl: string;
  tenFile: string | null;
  sheetTitle: string;
  tanSuat: string;
  gio: number | null;
  thu: number | null;
  ngayThang: number | null;
  bat: boolean;
  lanChayKeTiep: Date | null;
  doiSoatKeTiep: Date | null;
  vanTay: string | null;
  lanChayCuoi: Date | null;
  ketQuaCuoi: 'ok' | 'loi' | null;
  thongDiepCuoi: string | null;
  soDongCuoi: number | null;
  soLoiLienTiep: number;
  canChay: boolean;
  tgTao: Date;
}

type DongLich = Record<string, unknown>;

function veLich(r: DongLich): Lich {
  return {
    id: Number(r.id),
    nhanVienId: Number(r.nhan_vien_id),
    moduleId: String(r.module_id),
    nguon: String(r.nguon),
    bangGoc: (r.bang_goc as string[]) ?? [],
    cot: (r.cot as Lich['cot']) ?? [],
    spreadsheetId: String(r.spreadsheet_id),
    spreadsheetUrl: String(r.spreadsheet_url),
    tenFile: (r.ten_file as string | null) ?? null,
    sheetTitle: String(r.sheet_title),
    tanSuat: String(r.tan_suat),
    gio: (r.gio as number | null) ?? null,
    thu: (r.thu as number | null) ?? null,
    ngayThang: (r.ngay_thang as number | null) ?? null,
    bat: Boolean(r.bat),
    lanChayKeTiep: (r.lan_chay_ke_tiep as Date | null) ?? null,
    doiSoatKeTiep: (r.doi_soat_ke_tiep as Date | null) ?? null,
    vanTay: (r.van_tay as string | null) ?? null,
    lanChayCuoi: (r.lan_chay_cuoi as Date | null) ?? null,
    ketQuaCuoi: (r.ket_qua_cuoi as Lich['ketQuaCuoi']) ?? null,
    thongDiepCuoi: (r.thong_diep_cuoi as string | null) ?? null,
    soDongCuoi: (r.so_dong_cuoi as number | null) ?? null,
    soLoiLienTiep: Number(r.so_loi_lien_tiep ?? 0),
    canChay: Boolean(r.can_chay),
    tgTao: r.tg_tao as Date,
  };
}

export class TrungDichLoi extends Error {}

export async function taoLich(v: {
  nhanVienId: number;
  moduleId: string;
  nguon: string;
  bangGoc: string[];
  cot: Lich['cot'];
  spreadsheetId: string;
  spreadsheetUrl: string;
  tenFile: string;
  sheetTitle: string;
  tanSuat: string;
  gio: number | null;
  thu: number | null;
  ngayThang: number | null;
  lanChayKeTiep: Date | null;
  doiSoatKeTiep: Date | null;
}): Promise<Lich> {
  try {
    const kq = await pool.query<DongLich>(
      `INSERT INTO public.fp_var_dong_bo_sheet
         (nhan_vien_id, module_id, nguon, bang_goc, cot, spreadsheet_id, spreadsheet_url, ten_file, sheet_title,
          tan_suat, gio, thu, ngay_thang, lan_chay_ke_tiep, doi_soat_ke_tiep)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        v.nhanVienId, v.moduleId, v.nguon, v.bangGoc, JSON.stringify(v.cot), v.spreadsheetId, v.spreadsheetUrl,
        v.tenFile, v.sheetTitle, v.tanSuat, v.gio, v.thu, v.ngayThang, v.lanChayKeTiep, v.doiSoatKeTiep,
      ],
    );
    return veLich(kq.rows[0]!);
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new TrungDichLoi('Tab này đã có một lịch đồng bộ khác ghi vào.');
    throw e;
  }
}

export async function dsLich(nhanVienId: number, moduleId?: string): Promise<Lich[]> {
  const kq = await pool.query<DongLich>(
    `SELECT * FROM public.fp_var_dong_bo_sheet
      WHERE nhan_vien_id = $1 AND ($2::text IS NULL OR module_id = $2)
      ORDER BY id DESC`,
    [nhanVienId, moduleId ?? null],
  );
  return kq.rows.map(veLich);
}

export async function layLichCuaNguoi(id: number, nhanVienId: number): Promise<Lich | null> {
  const kq = await pool.query<DongLich>('SELECT * FROM public.fp_var_dong_bo_sheet WHERE id = $1 AND nhan_vien_id = $2', [id, nhanVienId]);
  return kq.rows[0] ? veLich(kq.rows[0]) : null;
}

export async function xoaLich(id: number, nhanVienId: number): Promise<boolean> {
  const kq = await pool.query('DELETE FROM public.fp_var_dong_bo_sheet WHERE id = $1 AND nhan_vien_id = $2', [id, nhanVienId]);
  return (kq.rowCount ?? 0) > 0;
}

/**
 * Bật/tắt + đổi tần suất. Bật lại thì xoá đếm lỗi và — với "khi có thay đổi" — đánh dấu
 * cần chạy ngay để bắt kịp những gì đổi trong lúc tắt.
 */
export async function capNhatLich(
  id: number,
  nhanVienId: number,
  v: { bat: boolean; tanSuat: string; gio: number | null; thu: number | null; ngayThang: number | null; lanChayKeTiep: Date | null; doiSoatKeTiep: Date | null },
): Promise<Lich | null> {
  const kq = await pool.query<DongLich>(
    `UPDATE public.fp_var_dong_bo_sheet
        SET bat = $3, tan_suat = $4, gio = $5, thu = $6, ngay_thang = $7,
            lan_chay_ke_tiep = $8, doi_soat_ke_tiep = $9,
            so_loi_lien_tiep = CASE WHEN $3 AND NOT bat THEN 0 ELSE so_loi_lien_tiep END,
            can_chay = CASE WHEN $3 AND NOT bat AND $4 = 'khi_thay_doi' THEN true ELSE can_chay END,
            thay_doi_dau_luc = CASE WHEN $3 AND NOT bat AND $4 = 'khi_thay_doi' THEN now() - interval '1 day' ELSE thay_doi_dau_luc END,
            tg_cap_nhat = now()
      WHERE id = $1 AND nhan_vien_id = $2
      RETURNING *`,
    [id, nhanVienId, v.bat, v.tanSuat, v.gio, v.thu, v.ngayThang, v.lanChayKeTiep, v.doiSoatKeTiep],
  );
  return kq.rows[0] ? veLich(kq.rows[0]) : null;
}

export interface LichDaNhan extends Lich {
  doiSoatDenHan: boolean;
}

/**
 * Nhận tối đa `gioiHan` lịch đến hạn và giữ lease. Đồng thời TIÊU cờ thay đổi (can_chay =
 * false): thay đổi xảy ra TRONG lúc đang chạy sẽ bật cờ lại → lượt sau, không bị nuốt mất.
 * SKIP LOCKED để hai worker (lỡ chạy hai bản) không nhận trùng.
 */
export async function nhanLichDenHan(gioiHan: number, cuaSoChoPhut: number): Promise<LichDaNhan[]> {
  const kq = await pool.query<DongLich>(
    `WITH chon AS (
       SELECT id, (doi_soat_ke_tiep IS NOT NULL AND doi_soat_ke_tiep <= now()) AS doi_soat_den_han
         FROM public.fp_var_dong_bo_sheet
        WHERE bat
          AND (dang_chay_tu IS NULL OR dang_chay_tu < now() - interval '15 minutes')
          AND (
               (tan_suat = 'khi_thay_doi' AND can_chay
                  AND thay_doi_dau_luc <= now() - make_interval(mins => $2)
                  AND (lan_chay_ke_tiep IS NULL OR lan_chay_ke_tiep <= now()))
            OR (tan_suat <> 'khi_thay_doi' AND lan_chay_ke_tiep <= now())
            OR (doi_soat_ke_tiep <= now())
          )
        ORDER BY id
        LIMIT $1
        FOR UPDATE SKIP LOCKED
     )
     UPDATE public.fp_var_dong_bo_sheet d
        SET dang_chay_tu = now(), can_chay = false, thay_doi_dau_luc = NULL
       FROM chon
      WHERE d.id = chon.id
     RETURNING d.*, chon.doi_soat_den_han`,
    [gioiHan, cuaSoChoPhut],
  );
  return kq.rows.map((r) => ({ ...veLich(r), doiSoatDenHan: Boolean(r.doi_soat_den_han) }));
}

/** "Đồng bộ ngay" / chạy lần đầu: giữ lease cho đúng một lịch; đang có worker chạy thì null. */
export async function nhanMotLich(id: number, nhanVienId: number): Promise<LichDaNhan | null> {
  const kq = await pool.query<DongLich>(
    `UPDATE public.fp_var_dong_bo_sheet
        SET dang_chay_tu = now(), can_chay = false, thay_doi_dau_luc = NULL
      WHERE id = $1 AND nhan_vien_id = $2
        AND (dang_chay_tu IS NULL OR dang_chay_tu < now() - interval '15 minutes')
      RETURNING *`,
    [id, nhanVienId],
  );
  return kq.rows[0] ? { ...veLich(kq.rows[0]), doiSoatDenHan: false } : null;
}

export async function ketThucThanhCong(
  id: number,
  v: { soDong: number; vanTay: string; thongDiep: string; lanChayKeTiep: Date | null; doiSoatKeTiep: Date | null },
): Promise<void> {
  await pool.query(
    `UPDATE public.fp_var_dong_bo_sheet
        SET dang_chay_tu = NULL, lan_chay_cuoi = now(), ket_qua_cuoi = 'ok', thong_diep_cuoi = $2,
            so_dong_cuoi = $3, van_tay = $4, so_loi_lien_tiep = 0,
            lan_chay_ke_tiep = $5, doi_soat_ke_tiep = $6, tg_cap_nhat = now()
      WHERE id = $1`,
    [id, v.thongDiep, v.soDong, v.vanTay, v.lanChayKeTiep, v.doiSoatKeTiep],
  );
}

/**
 * Lỗi: `tat` = tắt lịch (lỗi vĩnh viễn / quá nhiều lần). Lỗi tạm thì trả lại cờ thay đổi
 * (đã tiêu lúc nhận) để lần thử sau vẫn chạy, và lùi `lan_chay_ke_tiep`.
 */
export async function ketThucLoi(id: number, v: { thongDiep: string; tat: boolean; thuLaiLuc: Date | null }): Promise<number> {
  const kq = await pool.query<{ so_loi_lien_tiep: number }>(
    `UPDATE public.fp_var_dong_bo_sheet
        SET dang_chay_tu = NULL, lan_chay_cuoi = now(), ket_qua_cuoi = 'loi', thong_diep_cuoi = $2,
            so_loi_lien_tiep = so_loi_lien_tiep + 1,
            bat = CASE WHEN $3 THEN false ELSE bat END,
            lan_chay_ke_tiep = COALESCE($4, lan_chay_ke_tiep),
            can_chay = CASE WHEN NOT $3 AND tan_suat = 'khi_thay_doi' THEN true ELSE can_chay END,
            thay_doi_dau_luc = CASE WHEN NOT $3 AND tan_suat = 'khi_thay_doi'
                                    THEN COALESCE(thay_doi_dau_luc, now() - interval '1 day') ELSE thay_doi_dau_luc END,
            tg_cap_nhat = now()
      WHERE id = $1
      RETURNING so_loi_lien_tiep`,
    [id, v.thongDiep, v.tat, v.thuLaiLuc],
  );
  return kq.rows[0]?.so_loi_lien_tiep ?? 0;
}

/** Kết nối Google của người này hỏng → mọi lịch của họ dừng (chạy tiếp chỉ đốt lỗi). */
export async function tatMoiLichCuaNguoi(nhanVienId: number, thongDiep: string): Promise<number[]> {
  const kq = await pool.query<{ id: number }>(
    `UPDATE public.fp_var_dong_bo_sheet
        SET bat = false, ket_qua_cuoi = 'loi', thong_diep_cuoi = $2, dang_chay_tu = NULL, tg_cap_nhat = now()
      WHERE nhan_vien_id = $1 AND bat
      RETURNING id`,
    [nhanVienId, thongDiep],
  );
  return kq.rows.map((r) => Number(r.id));
}
