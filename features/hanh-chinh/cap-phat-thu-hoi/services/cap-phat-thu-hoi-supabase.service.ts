/**
 * Service phiếu cấp phát / thu hồi – Master-Detail trên Supabase.
 * Bảng cha: fp_ts_phieu_cap_phat_thu_hoi (header)
 * Bảng con: fp_ts_phieu_cap_phat_thu_hoi_ct (chi tiết – mỗi dòng 1 tài sản)
 */
import { supabase } from '@/lib/supabase';
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
  let query = supabase.from(TABLE).select(PHIEU_CP_TH_COLUMNS).order('tg_tao', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
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

  const { data, error } = await supabase.from(TABLE).select(PHIEU_CP_TH_COLUMNS).eq('id', numId).single();
  if (error || !data) return null;

  const { data: ctData } = await supabase
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

  const { data: ctRows, error } = await supabase
    .from(TABLE_CT)
    .select(PHIEU_CP_CT_COLUMNS)
    .eq('id_tai_san', numTs)
    .order('id', { ascending: false });

  if (error || !ctRows || ctRows.length === 0) return [];

  const phieuIds = [...new Set((ctRows as DbPhieuChiTietRow[]).map((r) => r.id_phieu))];
  const { data: headerRows } = await supabase
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
  const { data: headers, error: hErr } = await supabase
    .from(TABLE)
    .select(PHIEU_CP_TH_COLUMNS)
    .order('tg_tao', { ascending: false });
  if (hErr) throw new Error((hErr as { message?: string }).message ?? String(hErr));
  if (!headers?.length) return [];

  const headerMap = new Map<number, DbPhieuRow>();
  (headers as DbPhieuRow[]).forEach((h) => headerMap.set(h.id, h));

  const { data: ctRows, error: cErr } = await supabase
    .from(TABLE_CT)
    .select(PHIEU_CP_CT_COLUMNS)
    .order('id_phieu', { ascending: false });
  if (cErr) throw new Error((cErr as { message?: string }).message ?? String(cErr));
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

  const { data: maResult, error: maError } = await supabase.rpc('get_next_ma_phieu_cpth', { p_loai: loaiDb });
  if (maError) throw new Error(maError.message ?? 'Không thể tạo mã phiếu');
  const ma_phieu = maResult as string;

  const headerPayload = await buildHeaderPayload(data, id_nguoi_thuc_hien, id_nguoi_tao, ten_nguoi_tao);
  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({ ...headerPayload, ma_phieu })
    .select(PHIEU_CP_TH_COLUMNS)
    .single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));

  const phieuId = (inserted as DbPhieuRow).id;

  const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san);
  if (validLines.length > 0) {
    const ctRows = await buildChiTietRows(phieuId, validLines);
    const { error: ctError } = await supabase.from(TABLE_CT).insert(ctRows);
    if (ctError) throw new Error(ctError.message ?? 'Không thể tạo chi tiết phiếu');

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
  const { error } = await supabase.from(TABLE).update(headerPayload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));

  const { error: delError } = await supabase.from(TABLE_CT).delete().eq('id_phieu', numId);
  if (delError) throw new Error(delError.message ?? 'Không thể xóa chi tiết cũ');

  const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san);
  if (validLines.length > 0) {
    const ctRows = await buildChiTietRows(numId, validLines);
    const { error: ctError } = await supabase.from(TABLE_CT).insert(ctRows);
    if (ctError) throw new Error(ctError.message ?? 'Không thể tạo chi tiết phiếu');

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
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}
