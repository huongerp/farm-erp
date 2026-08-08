/**
 * Service phiếu cấp phát / thu hồi – Master-Detail trên Supabase.
 * Bảng cha: fp_ts_phieu_cap_phat_thu_hoi (header)
 * Bảng con: fp_ts_phieu_cap_phat_thu_hoi_ct (chi tiết – mỗi dòng 1 tài sản)
 */
import { db, throwSupabaseError } from '@/lib/db';
import type {
  LoaiPhieu,
  PhieuCapPhatThuHoi,
  PhieuCapPhatThuHoiCreate,
  PhieuCapPhatThuHoiChiTiet,
  PhieuChiTietWithHeader,
  PhieuChiTietRow,
} from '../core/types';
import { getTaiSanList, updateTaiSanLocationAndHolder } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

const TABLE = 'fp_ts_phieu_cap_phat_thu_hoi';
const TABLE_CT = 'fp_ts_phieu_cap_phat_thu_hoi_ct';

const PHIEU_CP_TH_COLUMNS =
  'id,ma_phieu,loai_phieu,id_nguoi_giu_truoc,ten_nguoi_giu_truoc,ma_nguoi_giu_truoc,id_nguoi_giu_sau,ten_nguoi_giu_sau,ma_nguoi_giu_sau,ngay_thuc_hien,id_nguoi_thuc_hien,ten_nguoi_thuc_hien,id_nguoi_tao,ten_nguoi_tao,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';
const PHIEU_CP_CT_COLUMNS =
  'id,id_phieu,id_tai_san,ma_tai_san,ten_tai_san,id_noi_luu_truoc,ten_noi_luu_truoc,id_noi_luu_sau,ten_noi_luu_sau,ghi_chu,tg_tao,tg_cap_nhat';

// ---------------------------------------------------------------------------
// Loại phiếu mapping: app key ↔ DB text
// ---------------------------------------------------------------------------

const LOAI_PHIEU_TO_DB: Record<LoaiPhieu, string> = {
  cap_phat: 'Cấp phát',
  thu_hoi: 'Thu hồi',
  luan_chuyen_vi_tri: 'Luân chuyển vị trí',
  luan_chuyen_nguoi: 'Luân chuyển người quản lý',
  luan_chuyen_ca_hai: 'Luân chuyển cả hai',
};

const LOAI_PHIEU_FROM_DB: Record<string, LoaiPhieu> = {
  'Cấp phát': 'cap_phat',
  'Thu hồi': 'thu_hoi',
  'Luân chuyển vị trí': 'luan_chuyen_vi_tri',
  'Luân chuyển người quản lý': 'luan_chuyen_nguoi',
  'Luân chuyển cả hai': 'luan_chuyen_ca_hai',
};

function loaiPhieuFromDb(value: string | null): LoaiPhieu {
  if (!value) return 'cap_phat';
  return LOAI_PHIEU_FROM_DB[value] ?? 'cap_phat';
}

// ---------------------------------------------------------------------------
// DB row types
// ---------------------------------------------------------------------------

export interface DbPhieuRow {
  id: number;
  ma_phieu: string;
  loai_phieu: string;
  id_nguoi_giu_truoc: number | null;
  ten_nguoi_giu_truoc: string | null;
  ma_nguoi_giu_truoc: string | null;
  id_nguoi_giu_sau: number | null;
  ten_nguoi_giu_sau: string | null;
  ma_nguoi_giu_sau: string | null;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: number;
  ten_nguoi_thuc_hien: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

export interface DbPhieuChiTietRow {
  id: number;
  id_phieu: number;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_noi_luu_truoc: number | null;
  ten_noi_luu_truoc: string | null;
  id_noi_luu_sau: number | null;
  ten_noi_luu_sau: string | null;
  ghi_chu: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

// ---------------------------------------------------------------------------
// Row → App model mappers
// ---------------------------------------------------------------------------

function rowToPhieu(row: DbPhieuRow, chi_tiet?: PhieuCapPhatThuHoiChiTiet[]): PhieuCapPhatThuHoi {
  return {
    id: String(row.id),
    ma_phieu: row.ma_phieu,
    loai_phieu: loaiPhieuFromDb(row.loai_phieu),
    id_nguoi_giu_truoc: row.id_nguoi_giu_truoc != null ? String(row.id_nguoi_giu_truoc) : null,
    ten_nguoi_giu_truoc: row.ten_nguoi_giu_truoc ?? null,
    ma_nguoi_giu_truoc: row.ma_nguoi_giu_truoc ?? null,
    id_nguoi_giu_sau: row.id_nguoi_giu_sau != null ? String(row.id_nguoi_giu_sau) : null,
    ten_nguoi_giu_sau: row.ten_nguoi_giu_sau ?? null,
    ma_nguoi_giu_sau: row.ma_nguoi_giu_sau ?? null,
    ngay_thuc_hien: row.ngay_thuc_hien,
    id_nguoi_thuc_hien: String(row.id_nguoi_thuc_hien),
    ten_nguoi_thuc_hien: row.ten_nguoi_thuc_hien ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: row.trang_thai === 'Đang hoạt động' ? 1 : 0,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    chi_tiet,
  };
}

function rowToChiTiet(row: DbPhieuChiTietRow): PhieuCapPhatThuHoiChiTiet {
  return {
    id: String(row.id),
    id_phieu: String(row.id_phieu),
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? undefined,
    ten_tai_san: row.ten_tai_san ?? undefined,
    id_noi_luu_truoc: row.id_noi_luu_truoc != null ? String(row.id_noi_luu_truoc) : null,
    ten_noi_luu_truoc: row.ten_noi_luu_truoc ?? null,
    id_noi_luu_sau: row.id_noi_luu_sau != null ? String(row.id_noi_luu_sau) : null,
    ten_noi_luu_sau: row.ten_noi_luu_sau ?? null,
    ghi_chu: row.ghi_chu ?? null,
    tg_tao: row.tg_tao ?? undefined,
    tg_cap_nhat: row.tg_cap_nhat ?? undefined,
  };
}

function toNum(val: string | undefined | null): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export interface GetPhieuListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  id_tai_san?: string;
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

export async function getPhieuListSupabase(
  params: GetPhieuListParams = {}
): Promise<PhieuCapPhatThuHoi[]> {
  const query = db.from(TABLE).select(PHIEU_CP_TH_COLUMNS).order('tg_tao', { ascending: false });

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  let list = (data ?? []).map((row) => rowToPhieu(row as DbPhieuRow));

  if (params.filter === 'mine' && params.id_nguoi) {
    const numNguoi = Number(params.id_nguoi);
    if (!Number.isNaN(numNguoi)) {
      list = list.filter(
        (p) =>
          Number(p.id_nguoi_thuc_hien) === numNguoi ||
          (p.id_nguoi_giu_truoc != null && Number(p.id_nguoi_giu_truoc) === numNguoi) ||
          (p.id_nguoi_giu_sau != null && Number(p.id_nguoi_giu_sau) === numNguoi)
      );
    }
  }

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.ma_phieu.toLowerCase().includes(q) ||
        (p.ten_nguoi_thuc_hien && p.ten_nguoi_thuc_hien.toLowerCase().includes(q)) ||
        (p.ten_nguoi_giu_sau && p.ten_nguoi_giu_sau.toLowerCase().includes(q)) ||
        (p.ten_nguoi_giu_truoc && p.ten_nguoi_giu_truoc.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getPhieuByIdSupabase(id: string): Promise<PhieuCapPhatThuHoi | null> {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;

  const { data, error } = await db.from(TABLE).select(PHIEU_CP_TH_COLUMNS).eq('id', numId).single();
  if (error || !data) return null;

  const { data: ctData } = await db
    .from(TABLE_CT)
    .select(PHIEU_CP_CT_COLUMNS)
    .eq('id_phieu', numId)
    .order('id', { ascending: true });

  const chi_tiet = (ctData ?? []).map((r) => rowToChiTiet(r as DbPhieuChiTietRow));
  return rowToPhieu(data as DbPhieuRow, chi_tiet);
}

/**
 * Lấy lịch sử cấp phát/thu hồi của 1 tài sản cụ thể.
 * Query bảng con JOIN header để trả về chi tiết + thông tin phiếu.
 */
export async function getPhieuChiTietByTaiSanIdSupabase(
  idTaiSan: string
): Promise<PhieuChiTietWithHeader[]> {
  const numTs = Number(idTaiSan);
  if (Number.isNaN(numTs)) return [];

  const { data: ctRows, error } = await db
    .from(TABLE_CT)
    .select(PHIEU_CP_CT_COLUMNS)
    .eq('id_tai_san', numTs)
    .order('id', { ascending: false });

  if (error || !ctRows || ctRows.length === 0) return [];

  const phieuIds = [...new Set((ctRows as DbPhieuChiTietRow[]).map((r) => r.id_phieu))];
  const { data: headerRows } = await db
    .from(TABLE)
    .select(PHIEU_CP_TH_COLUMNS)
    .in('id', phieuIds);

  const headerMap = new Map<number, DbPhieuRow>();
  (headerRows ?? []).forEach((r) => headerMap.set((r as DbPhieuRow).id, r as DbPhieuRow));

  return (ctRows as DbPhieuChiTietRow[])
    .map((ct) => {
      const header = headerMap.get(ct.id_phieu);
      if (!header) return null;
      const base = rowToChiTiet(ct);
      return {
        ...base,
        ma_phieu: header.ma_phieu,
        loai_phieu: loaiPhieuFromDb(header.loai_phieu),
        ngay_thuc_hien: header.ngay_thuc_hien,
        ten_nguoi_giu_sau: header.ten_nguoi_giu_sau ?? null,
        ten_nguoi_thuc_hien: header.ten_nguoi_thuc_hien ?? null,
      } as PhieuChiTietWithHeader;
    })
    .filter(Boolean) as PhieuChiTietWithHeader[];
}

/**
 * Lấy toàn bộ dòng chi tiết (bảng con) kèm thông tin header (mã phiếu, loại, ngày...).
 * Dùng cho tab "Chi tiết" tổng hợp.
 */
export async function getAllPhieuChiTietSupabase(): Promise<PhieuChiTietRow[]> {
  const { data: headers, error: hErr } = await db
    .from(TABLE)
    .select(PHIEU_CP_TH_COLUMNS)
    .order('tg_tao', { ascending: false });
  if (hErr) throwSupabaseError(hErr);
  if (!headers?.length) return [];

  const headerMap = new Map<number, DbPhieuRow>();
  (headers as DbPhieuRow[]).forEach((h) => headerMap.set(h.id, h));

  const { data: ctRows, error: cErr } = await db
    .from(TABLE_CT)
    .select(PHIEU_CP_CT_COLUMNS)
    .order('id_phieu', { ascending: false });
  if (cErr) throwSupabaseError(cErr);
  if (!ctRows?.length) return [];

  return (ctRows as DbPhieuChiTietRow[])
    .map((ct) => {
      const header = headerMap.get(ct.id_phieu);
      if (!header) return null;
      const base = rowToChiTiet(ct);
      return {
        ...base,
        ma_phieu: header.ma_phieu,
        loai_phieu: loaiPhieuFromDb(header.loai_phieu),
        ngay_thuc_hien: header.ngay_thuc_hien,
        ten_nguoi_giu_truoc: header.ten_nguoi_giu_truoc ?? null,
        ten_nguoi_giu_sau: header.ten_nguoi_giu_sau ?? null,
        ten_nguoi_thuc_hien: header.ten_nguoi_thuc_hien ?? null,
      } as PhieuChiTietRow;
    })
    .filter(Boolean) as PhieuChiTietRow[];
}

// ---------------------------------------------------------------------------
// BUILD PAYLOAD (snapshot names)
// ---------------------------------------------------------------------------

async function buildHeaderPayload(
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<Record<string, unknown>> {
  const employees = await getEmployeesRef();
  const getEmp = (id: string | null | undefined) => {
    if (!id) return { ten: null, ma: null };
    const e = employees.find((x) => x.id === id);
    return { ten: e?.ho_ten ?? null, ma: e?.ma_nhan_vien ?? null };
  };
  const truoc = getEmp(data.id_nguoi_giu_truoc);
  const sau = getEmp(data.id_nguoi_giu_sau);
  const performer = getEmp(data.id_nguoi_thuc_hien);

  return {
    loai_phieu: LOAI_PHIEU_TO_DB[data.loai_phieu],
    id_nguoi_giu_truoc: toNum(data.id_nguoi_giu_truoc ?? null),
    ten_nguoi_giu_truoc: truoc.ten,
    ma_nguoi_giu_truoc: truoc.ma,
    id_nguoi_giu_sau: toNum(data.id_nguoi_giu_sau ?? null),
    ten_nguoi_giu_sau: sau.ten,
    ma_nguoi_giu_sau: sau.ma,
    ngay_thuc_hien: data.ngay_thuc_hien,
    id_nguoi_thuc_hien: Number(data.id_nguoi_thuc_hien),
    ten_nguoi_thuc_hien: performer.ten,
    id_nguoi_tao: toNum(id_nguoi_tao ?? id_nguoi_thuc_hien),
    ten_nguoi_tao: ten_nguoi_tao ?? performer.ten,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: 'Đang hoạt động',
  };
}

async function buildChiTietRows(
  idPhieu: number,
  chiTiet: PhieuCapPhatThuHoiCreate['chi_tiet']
): Promise<Record<string, unknown>[]> {
  const [assets, locations] = await Promise.all([
    getTaiSanList(),
    getAssetStorageLocations(),
  ]);

  return chiTiet.map((ct) => {
    const asset = assets.find((a) => a.id === ct.id_tai_san);
    const noiLuuSau = locations.find((l) => l.id === ct.id_noi_luu_sau);
    return {
      id_phieu: idPhieu,
      id_tai_san: Number(ct.id_tai_san),
      ma_tai_san: asset?.ma_tai_san ?? null,
      ten_tai_san: asset?.ten_tai_san ?? null,
      id_noi_luu_truoc: asset?.id_noi_luu ? Number(asset.id_noi_luu) : null,
      ten_noi_luu_truoc: asset?.ten_noi_luu ?? null,
      id_noi_luu_sau: Number(ct.id_noi_luu_sau),
      ten_noi_luu_sau: noiLuuSau?.ten_noi_luu ?? null,
      ghi_chu: ct.ghi_chu?.trim() || null,
    };
  });
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createPhieuSupabase(
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<PhieuCapPhatThuHoi> {
  const loaiDb = LOAI_PHIEU_TO_DB[data.loai_phieu];

  const { data: maResult, error: maError } = await db.rpc('get_next_ma_phieu_cpth', { p_loai: loaiDb });
  if (maError) throwSupabaseError(maError);
  const ma_phieu = maResult as string;

  const headerPayload = await buildHeaderPayload(data, id_nguoi_thuc_hien, id_nguoi_tao, ten_nguoi_tao);
  const { data: inserted, error } = await db
    .from(TABLE)
    .insert({ ...headerPayload, ma_phieu })
    .select(PHIEU_CP_TH_COLUMNS)
    .single();
  if (error) throwSupabaseError(error);

  const phieuId = (inserted as DbPhieuRow).id;

  const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san);
  if (validLines.length > 0) {
    const ctRows = await buildChiTietRows(phieuId, validLines);
    const { error: ctError } = await db.from(TABLE_CT).insert(ctRows);
    if (ctError) throwSupabaseError(ctError);

    for (const ct of validLines) {
      await updateTaiSanLocationAndHolder(ct.id_tai_san, {
        id_noi_luu: ct.id_noi_luu_sau,
        id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
      });
    }
  }

  return getPhieuByIdSupabase(String(phieuId)) as Promise<PhieuCapPhatThuHoi>;
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updatePhieuSupabase(
  id: string,
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error('Phiếu không tồn tại');

  const headerPayload = await buildHeaderPayload(data, id_nguoi_thuc_hien);
  const { error } = await db.from(TABLE).update(headerPayload).eq('id', numId);
  if (error) throwSupabaseError(error);

  const { error: delError } = await db.from(TABLE_CT).delete().eq('id_phieu', numId);
  if (delError) throwSupabaseError(delError);

  const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san);
  if (validLines.length > 0) {
    const ctRows = await buildChiTietRows(numId, validLines);
    const { error: ctError } = await db.from(TABLE_CT).insert(ctRows);
    if (ctError) throwSupabaseError(ctError);

    for (const ct of validLines) {
      await updateTaiSanLocationAndHolder(ct.id_tai_san, {
        id_noi_luu: ct.id_noi_luu_sau,
        id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
      });
    }
  }

  return getPhieuByIdSupabase(id) as Promise<PhieuCapPhatThuHoi>;
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function deletePhieuSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

export type PhieuCapPhatThuHoiImportRow = {
  loai_phieu?: string;
  ngay_thuc_hien?: string;
  ma_nguoi_thuc_hien?: string;
  ma_nguoi_giu_truoc?: string;
  ma_nguoi_giu_sau?: string;
  ghi_chu_phieu?: string;
  ma_tai_san?: string;
  ma_noi_luu_sau?: string;
  ghi_chu_dong?: string;
};

const LOAI_PHIEU_KEYS: LoaiPhieu[] = [
  'cap_phat',
  'thu_hoi',
  'luan_chuyen_vi_tri',
  'luan_chuyen_nguoi',
  'luan_chuyen_ca_hai',
];

function parseLoaiPhieu(raw: string): LoaiPhieu | null {
  const s = raw.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if ((LOAI_PHIEU_KEYS as string[]).includes(lower)) return lower as LoaiPhieu;
  if (LOAI_PHIEU_FROM_DB[s]) return LOAI_PHIEU_FROM_DB[s];
  const byLabel = Object.entries(LOAI_PHIEU_TO_DB).find(([, label]) => label.toLowerCase() === lower);
  return byLabel ? (byLabel[0] as LoaiPhieu) : null;
}

/** Chuẩn hóa ngày về YYYY-MM-DD (Excel serial hoặc chuỗi). */
function parseNgayThucHien(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial date (days since 1899-12-30)
    const ms = (raw - 25569) * 86400 * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

function resolveEmployeeId(
  code: string,
  byMa: Map<string, string>,
  byId: Map<string, string>
): string | null {
  const s = code.trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  return byMa.get(upper) ?? byId.get(s) ?? byId.get(upper.replace(/^NV/i, '')) ?? null;
}

type ResolvedLine = {
  rowNum: number;
  loai_phieu: LoaiPhieu;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: string;
  id_nguoi_giu_truoc: string | null;
  id_nguoi_giu_sau: string | null;
  ghi_chu_phieu: string | null;
  id_tai_san: string;
  id_noi_luu_sau: string;
  ghi_chu_dong: string | null;
};

function groupKey(line: ResolvedLine): string {
  return [
    line.loai_phieu,
    line.ngay_thuc_hien,
    line.id_nguoi_thuc_hien,
    line.id_nguoi_giu_truoc ?? '',
    line.id_nguoi_giu_sau ?? '',
    line.ghi_chu_phieu ?? '',
  ].join('|');
}

/**
 * Import phiếu từ dòng Excel phẳng (1 dòng = 1 tài sản).
 * Gộp phiếu theo khóa header rồi gọi createPhieuSupabase từng nhóm.
 */
export async function importPhieuCapPhatThuHoiListSupabase(
  rows: PhieuCapPhatThuHoiImportRow[]
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  const [employees, assets, locations] = await Promise.all([
    getEmployeesRef(),
    getTaiSanList(),
    getAssetStorageLocations(),
  ]);

  const empByMa = new Map(employees.map((e) => [e.ma_nhan_vien.trim().toUpperCase(), e.id]));
  const empById = new Map(employees.map((e) => [e.id, e.id]));
  const assetByMa = new Map(assets.map((a) => [a.ma_tai_san.trim().toUpperCase(), a.id]));
  const locByMa = new Map(locations.map((l) => [l.ma_noi_luu.trim().toUpperCase(), l.id]));

  const resolved: ResolvedLine[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const rowErrors: string[] = [];

    const loai = parseLoaiPhieu(String(row.loai_phieu ?? ''));
    if (!loai) rowErrors.push('Loại phiếu không hợp lệ');

    const ngay = parseNgayThucHien(row.ngay_thuc_hien);
    if (!ngay) rowErrors.push('Ngày thực hiện không hợp lệ (YYYY-MM-DD)');

    const maNguoiTh = String(row.ma_nguoi_thuc_hien ?? '').trim();
    const idNguoiTh = resolveEmployeeId(maNguoiTh, empByMa, empById);
    if (!maNguoiTh || !idNguoiTh) rowErrors.push(`Không tìm thấy người thực hiện: ${maNguoiTh || '(trống)'}`);

    const maGiuTruoc = String(row.ma_nguoi_giu_truoc ?? '').trim();
    let idGiuTruoc: string | null = null;
    if (maGiuTruoc) {
      idGiuTruoc = resolveEmployeeId(maGiuTruoc, empByMa, empById);
      if (!idGiuTruoc) rowErrors.push(`Không tìm thấy người giữ trước: ${maGiuTruoc}`);
    }

    const maGiuSau = String(row.ma_nguoi_giu_sau ?? '').trim();
    let idGiuSau: string | null = null;
    if (maGiuSau) {
      idGiuSau = resolveEmployeeId(maGiuSau, empByMa, empById);
      if (!idGiuSau) rowErrors.push(`Không tìm thấy người giữ sau: ${maGiuSau}`);
    }

    if (
      loai &&
      (loai === 'cap_phat' || loai === 'luan_chuyen_nguoi' || loai === 'luan_chuyen_ca_hai') &&
      !idGiuSau
    ) {
      rowErrors.push('Loại phiếu này bắt buộc người giữ sau');
    }

    const maTs = String(row.ma_tai_san ?? '').trim().toUpperCase();
    const idTs = maTs ? assetByMa.get(maTs) : undefined;
    if (!maTs || !idTs) rowErrors.push(`Không tìm thấy tài sản: ${maTs || '(trống)'}`);

    const maNoi = String(row.ma_noi_luu_sau ?? '').trim().toUpperCase();
    const idNoi = maNoi ? locByMa.get(maNoi) : undefined;
    if (!maNoi || !idNoi) rowErrors.push(`Không tìm thấy nơi lưu sau: ${maNoi || '(trống)'}`);

    if (rowErrors.length > 0) {
      errors.push(`Dòng ${rowNum}: ${rowErrors.join('; ')}`);
      continue;
    }

    resolved.push({
      rowNum,
      loai_phieu: loai!,
      ngay_thuc_hien: ngay!,
      id_nguoi_thuc_hien: idNguoiTh!,
      id_nguoi_giu_truoc: idGiuTruoc,
      id_nguoi_giu_sau: idGiuSau,
      ghi_chu_phieu: String(row.ghi_chu_phieu ?? '').trim() || null,
      id_tai_san: idTs!,
      id_noi_luu_sau: idNoi!,
      ghi_chu_dong: String(row.ghi_chu_dong ?? '').trim() || null,
    });
  }

  const groups = new Map<string, ResolvedLine[]>();
  for (const line of resolved) {
    const key = groupKey(line);
    const list = groups.get(key);
    if (list) list.push(line);
    else groups.set(key, [line]);
  }

  for (const lines of groups.values()) {
    const first = lines[0];
    const data: PhieuCapPhatThuHoiCreate = {
      loai_phieu: first.loai_phieu,
      ngay_thuc_hien: first.ngay_thuc_hien,
      id_nguoi_thuc_hien: first.id_nguoi_thuc_hien,
      id_nguoi_giu_truoc: first.id_nguoi_giu_truoc,
      id_nguoi_giu_sau: first.id_nguoi_giu_sau,
      ghi_chu: first.ghi_chu_phieu,
      chi_tiet: lines.map((l) => ({
        id_tai_san: l.id_tai_san,
        id_noi_luu_sau: l.id_noi_luu_sau,
        ghi_chu: l.ghi_chu_dong,
      })),
    };
    try {
      await createPhieuSupabase(data, first.id_nguoi_thuc_hien);
      created++;
    } catch (e: unknown) {
      const rowHint = lines.map((l) => l.rowNum).join(', ');
      errors.push(`Nhóm dòng ${rowHint}: ${(e as Error).message || 'Lỗi tạo phiếu'}`);
    }
  }

  return { created, errors };
}
