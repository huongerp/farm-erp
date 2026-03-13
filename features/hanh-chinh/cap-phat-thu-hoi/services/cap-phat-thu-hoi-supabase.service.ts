/**
 * Service phiếu cấp phát / thu hồi – đọc/ghi Supabase (bảng fp_ts_phieu_cap_phat_thu_hoi).
 * Loại phiếu trong DB lưu tiếng Việt có dấu (Cấp phát, Thu hồi, ...). App dùng LoaiPhieu (cap_phat, thu_hoi, ...).
 */
import { supabase } from '@/lib/supabase';
import type { LoaiPhieu, PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate } from '../core/types';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { updateTaiSanLocationAndHolder } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

const TABLE = 'fp_ts_phieu_cap_phat_thu_hoi';

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

export interface DbPhieuRow {
  id: number;
  loai_phieu: string;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_noi_luu_truoc: number;
  ten_noi_luu_truoc: string | null;
  id_noi_luu_sau: number;
  ten_noi_luu_sau: string | null;
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

function rowToPhieu(row: DbPhieuRow): PhieuCapPhatThuHoi {
  return {
    id: String(row.id),
    loai_phieu: loaiPhieuFromDb(row.loai_phieu),
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? undefined,
    ten_tai_san: row.ten_tai_san ?? undefined,
    id_noi_luu_truoc: String(row.id_noi_luu_truoc),
    ten_noi_luu_truoc: row.ten_noi_luu_truoc ?? undefined,
    id_noi_luu_sau: String(row.id_noi_luu_sau),
    ten_noi_luu_sau: row.ten_noi_luu_sau ?? undefined,
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
  };
}

function toNum(val: string | undefined | null): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

export interface GetPhieuListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  id_tai_san?: string;
}

export async function getPhieuListSupabase(
  params: GetPhieuListParams = {}
): Promise<PhieuCapPhatThuHoi[]> {
  let query = supabase.from(TABLE).select('*').order('tg_tao', { ascending: false });

  if (params.id_tai_san != null && params.id_tai_san !== '') {
    const numTs = Number(params.id_tai_san);
    if (!Number.isNaN(numTs)) query = query.eq('id_tai_san', numTs);
  }

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
        (p.ma_tai_san && p.ma_tai_san.toLowerCase().includes(q)) ||
        (p.ten_tai_san && p.ten_tai_san.toLowerCase().includes(q)) ||
        (p.ten_nguoi_thuc_hien && p.ten_nguoi_thuc_hien.toLowerCase().includes(q)) ||
        (p.ten_noi_luu_truoc && p.ten_noi_luu_truoc.toLowerCase().includes(q)) ||
        (p.ten_noi_luu_sau && p.ten_noi_luu_sau.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getPhieuByIdSupabase(id: string): Promise<PhieuCapPhatThuHoi | null> {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (error || !data) return null;
  return rowToPhieu(data as DbPhieuRow);
}

async function buildPhieuPayload(
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<Record<string, unknown>> {
  const [locations, employees, assets] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
    getTaiSanList(),
  ]);
  const ten_noi_luu_truoc = locations.find((l) => l.id === data.id_noi_luu_truoc)?.ten_noi_luu ?? null;
  const ten_noi_luu_sau = locations.find((l) => l.id === data.id_noi_luu_sau)?.ten_noi_luu ?? null;
  const getEmp = (id: string | null | undefined) => {
    if (!id) return { ten: null, ma: null };
    const e = employees.find((x) => x.id === id);
    return { ten: e?.ho_ten ?? null, ma: e?.ma_nhan_vien ?? null };
  };
  const asset = assets.find((a) => a.id === data.id_tai_san);
  const truoc = getEmp(data.id_nguoi_giu_truoc);
  const sau = getEmp(data.id_nguoi_giu_sau);
  const performer = getEmp(data.id_nguoi_thuc_hien);

  return {
    loai_phieu: LOAI_PHIEU_TO_DB[data.loai_phieu],
    id_tai_san: Number(data.id_tai_san),
    ma_tai_san: asset?.ma_tai_san ?? null,
    ten_tai_san: asset?.ten_tai_san ?? null,
    id_noi_luu_truoc: Number(data.id_noi_luu_truoc),
    ten_noi_luu_truoc,
    id_noi_luu_sau: Number(data.id_noi_luu_sau),
    ten_noi_luu_sau,
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

export async function createPhieuSupabase(
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<PhieuCapPhatThuHoi> {
  const payload = await buildPhieuPayload(data, id_nguoi_thuc_hien, id_nguoi_tao, ten_nguoi_tao);
  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select('*').single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));

  await updateTaiSanLocationAndHolder(data.id_tai_san, {
    id_noi_luu: data.id_noi_luu_sau,
    id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
  });

  return rowToPhieu(inserted as DbPhieuRow);
}

export async function updatePhieuSupabase(
  id: string,
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error('Phiếu không tồn tại');

  const payload = await buildPhieuPayload(data, id_nguoi_thuc_hien);
  const { error } = await supabase.from(TABLE).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));

  await updateTaiSanLocationAndHolder(data.id_tai_san, {
    id_noi_luu: data.id_noi_luu_sau,
    id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
  });

  const { data: updated, error: err2 } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error('Phiếu không tồn tại');
  return rowToPhieu(updated as DbPhieuRow);
}

export async function deletePhieuSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}
