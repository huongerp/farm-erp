/**
 * Service đợt kiểm kê kho – Supabase (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import { supabase } from '../../../../lib/supabase';
import type {
  DotKiemKeKho,
  ChiTietKiemKeKho,
  DotKiemKeKhoCreate,
  ChiTietKiemKeKhoUpdate,
  TrangThaiDotKiemKeKho,
  KetQuaKiemKeKho,
} from '../core/types';
/** Tham số lọc danh sách đợt (trùng shape với GetDotKiemKeKhoListParams) */
export interface GetDotKiemKeKhoListParamsSupabase {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKeKho[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
  id_kho?: string[];
}

export interface TaoDanhSachKiemKeKhoFiltersSupabase {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}
import { getTonKhoTheoKho } from '../../phieu-kho/services/ton-kho-service';
import { getKhoRef } from '../../danh-sach-kho/services/kho-service';
import { getHangHoaRef } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

const TABLE_DOT = 'fp_mh_dot_kiem_ke_kho';
const TABLE_DOT_KHO = 'fp_mh_dot_kiem_ke_kho_kho';
const TABLE_CHI_TIET = 'fp_mh_dot_kiem_ke_kho_chi_tiet';

const DOT_KK_KHO_COLUMNS =
  'id,ma_dot,ten_dot,ngay_bat_dau,ngay_ket_thuc,trang_thai,id_nguoi_phu_trach,ghi_chu,tg_tao,tg_cap_nhat';
const CHI_TIET_KK_KHO_COLUMNS =
  'id,id_dot_kiem_ke_kho,id_kho,id_hang_hoa,so_luong_so,so_luong_thuc_te,ket_qua,ghi_chu_dong,id_nguoi_kiem,ngay_kiem,tg_tao,tg_cap_nhat,id_phieu_kho_dieu_chinh,so_luong_dieu_chinh,tg_dieu_chinh_ton';

interface DotRow {
  id: number;
  ma_dot: string | null;
  ten_dot: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  trang_thai: string | null;
  id_nguoi_phu_trach: number;
  ghi_chu: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DotKhoRow {
  id_dot_kiem_ke_kho: number;
  id_kho: number;
}

interface ChiTietRow {
  id: number;
  id_dot_kiem_ke_kho: number;
  id_kho: number;
  id_hang_hoa: number;
  so_luong_so: number;
  so_luong_thuc_te: number | null;
  ket_qua: string | null;
  ghi_chu_dong: string | null;
  id_nguoi_kiem: number | null;
  ngay_kiem: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
  id_phieu_kho_dieu_chinh?: number | null;
  so_luong_dieu_chinh?: number | null;
  tg_dieu_chinh_ton?: string | null;
}

function rowToDot(
  row: DotRow,
  idKhoList: string[],
  enrich?: { ten_nguoi_phu_trach?: string | null; ma_nguoi_phu_trach?: string | null },
  stats?: { so_hang_hoa: number; so_lech: number }
): DotKiemKeKho {
  return {
    id: String(row.id),
    ma_dot: row.ma_dot ?? '',
    ten_dot: row.ten_dot ?? '',
    ngay_bat_dau: row.ngay_bat_dau ?? '',
    ngay_ket_thuc: row.ngay_ket_thuc ?? '',
    trang_thai: (row.trang_thai as TrangThaiDotKiemKeKho) ?? 'draft',
    id_nguoi_phu_trach: String(row.id_nguoi_phu_trach),
    ten_nguoi_phu_trach: enrich?.ten_nguoi_phu_trach ?? null,
    ma_nguoi_phu_trach: enrich?.ma_nguoi_phu_trach ?? null,
    id_kho: idKhoList,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai_active: 1,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    so_kho: idKhoList.length,
    so_hang_hoa: stats?.so_hang_hoa ?? 0,
    so_lech: stats?.so_lech ?? 0,
  };
}

function rowToChiTiet(
  row: ChiTietRow,
  enrich?: { ten_kho?: string; ma_kho?: string; ma_hang?: string; ten_hang?: string; don_vi_tinh?: string }
): ChiTietKiemKeKho {
  return {
    id: String(row.id),
    id_dot_kiem_ke_kho: String(row.id_dot_kiem_ke_kho),
    id_kho: String(row.id_kho),
    ten_kho: enrich?.ten_kho ?? null,
    ma_kho: enrich?.ma_kho ?? null,
    id_hang_hoa: String(row.id_hang_hoa),
    ma_hang: enrich?.ma_hang ?? null,
    ten_hang: enrich?.ten_hang ?? null,
    don_vi_tinh: enrich?.don_vi_tinh ?? null,
    so_luong_so: Number(row.so_luong_so),
    so_luong_thuc_te: row.so_luong_thuc_te != null ? Number(row.so_luong_thuc_te) : null,
    ket_qua: (row.ket_qua as KetQuaKiemKeKho) ?? 'chua_kiem',
    ghi_chu_dong: row.ghi_chu_dong ?? null,
    id_nguoi_kiem: row.id_nguoi_kiem != null ? String(row.id_nguoi_kiem) : null,
    ten_nguoi_kiem: null,
    ngay_kiem: row.ngay_kiem ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    id_phieu_kho_dieu_chinh:
      row.id_phieu_kho_dieu_chinh != null ? String(row.id_phieu_kho_dieu_chinh) : null,
    so_luong_dieu_chinh:
      row.so_luong_dieu_chinh != null ? Number(row.so_luong_dieu_chinh) : null,
    tg_dieu_chinh_ton: row.tg_dieu_chinh_ton ?? null,
  };
}

function computeKetQua(soLuongSo: number, soLuongThucTe: number | null): KetQuaKiemKeKho {
  if (soLuongThucTe == null) return 'chua_kiem';
  if (soLuongSo === soLuongThucTe) return 'khop';
  if (soLuongThucTe < soLuongSo) return 'thieu';
  return 'thua';
}

/** Lấy danh sách id_kho của một đợt */
async function getDotKhoIds(idDot: number): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE_DOT_KHO)
    .select('id_kho')
    .eq('id_dot_kiem_ke_kho', idDot);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { id_kho: number }) => String(r.id_kho));
}

export async function getDotKiemKeKhoListSupabase(
  params: GetDotKiemKeKhoListParamsSupabase = {}
): Promise<DotKiemKeKho[]> {
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));

  let query = supabase.from(TABLE_DOT).select(DOT_KK_KHO_COLUMNS).order('ngay_ket_thuc', { ascending: false });

  if (params.trang_thai_dot?.length) {
    query = query.in('trang_thai', params.trang_thai_dot);
  }
  if (params.dateFrom) {
    query = query.gte('ngay_ket_thuc', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('ngay_bat_dau', params.dateTo);
  }
  if (params.id_nguoi_phu_trach?.length) {
    query = query.in('id_nguoi_phu_trach', params.id_nguoi_phu_trach.map(Number));
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  const dotRows = (rows ?? []) as DotRow[];

  const dotIds = dotRows.map((r) => r.id);
  const chiTietCounts: Record<number, { so_hang_hoa: number; so_lech: number }> = {};
  if (dotIds.length > 0) {
    const { data: chiTietRows } = await supabase
      .from(TABLE_CHI_TIET)
      .select('id_dot_kiem_ke_kho, ket_qua')
      .in('id_dot_kiem_ke_kho', dotIds);
    const rows = (chiTietRows ?? []) as { id_dot_kiem_ke_kho: number; ket_qua: string | null }[];
    for (const r of rows) {
      if (!chiTietCounts[r.id_dot_kiem_ke_kho]) {
        chiTietCounts[r.id_dot_kiem_ke_kho] = { so_hang_hoa: 0, so_lech: 0 };
      }
      chiTietCounts[r.id_dot_kiem_ke_kho].so_hang_hoa += 1;
      if (r.ket_qua === 'thieu' || r.ket_qua === 'thua') {
        chiTietCounts[r.id_dot_kiem_ke_kho].so_lech += 1;
      }
    }
  }

  const result: DotKiemKeKho[] = [];
  for (const row of dotRows) {
    const idKhoList = await getDotKhoIds(row.id);
    if (params.id_kho?.length && !idKhoList.some((k) => params.id_kho!.includes(k))) continue;
    if (params.filter === 'mine' && params.id_nguoi && String(row.id_nguoi_phu_trach) !== params.id_nguoi) continue;
    if (params.q?.trim()) {
      const q = params.q.trim().toLowerCase();
      const ten = empMap.get(String(row.id_nguoi_phu_trach))?.ten ?? '';
      const ma = empMap.get(String(row.id_nguoi_phu_trach))?.ma ?? '';
      if (
        !(row.ma_dot?.toLowerCase().includes(q) || row.ten_dot?.toLowerCase().includes(q) || ten.toLowerCase().includes(q) || ma.toLowerCase().includes(q))
      )
        continue;
    }
    const emp = empMap.get(String(row.id_nguoi_phu_trach));
    const stats = chiTietCounts[row.id];
    result.push(
      rowToDot(row, idKhoList, { ten_nguoi_phu_trach: emp?.ten ?? null, ma_nguoi_phu_trach: emp?.ma ?? null }, stats)
    );
  }
  return result;
}

export async function getDotKiemKeKhoByIdSupabase(id: string): Promise<DotKiemKeKho | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase.from(TABLE_DOT).select(DOT_KK_KHO_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const idKhoList = await getDotKhoIds((row as DotRow).id);
  const employees = await getEmployeesRef();
  const emp = employees.find((e) => e.id === String((row as DotRow).id_nguoi_phu_trach));
  return rowToDot(row as DotRow, idKhoList, {
    ten_nguoi_phu_trach: emp?.ho_ten ?? null,
    ma_nguoi_phu_trach: emp?.ma_nhan_vien ?? null,
  });
}

export async function getChiTietByDotSupabase(id_dot_kiem_ke_kho: string): Promise<ChiTietKiemKeKho[]> {
  const idNum = Number(id_dot_kiem_ke_kho);
  if (Number.isNaN(idNum)) return [];
  const { data: rows, error } = await supabase
    .from(TABLE_CHI_TIET)
    .select(CHI_TIET_KK_KHO_COLUMNS)
    .eq('id_dot_kiem_ke_kho', idNum)
    .order('id_kho')
    .order('id_hang_hoa');
  if (error) throw new Error(error.message);
  const [khoList, hangHoaList, employees] = await Promise.all([getKhoRef(), getHangHoaRef(), getEmployeesRef()]);
  const khoMap = new Map(khoList.map((k) => [k.id, { ten: k.ten_kho, ma: k.ma_kho }]));
  const hhMap = new Map(hangHoaList.map((h) => [h.id, { ma: h.ma_hang_hoa ?? h.ma_hang, ten: h.ten_hang_hoa ?? h.ten_hang, dvt: h.dvt ?? h.don_vi_tinh }]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const out: ChiTietKiemKeKho[] = [];
  for (const r of rows ?? []) {
    const row = r as ChiTietRow;
    const kho = khoMap.get(String(row.id_kho));
    const hh = hhMap.get(String(row.id_hang_hoa));
    const tenNguoiKiem = row.id_nguoi_kiem != null ? empMap.get(String(row.id_nguoi_kiem)) ?? null : null;
    const ct = rowToChiTiet(row, {
      ten_kho: kho?.ten ?? undefined,
      ma_kho: kho?.ma ?? undefined,
      ma_hang: hh?.ma ?? undefined,
      ten_hang: hh?.ten ?? undefined,
      don_vi_tinh: hh?.dvt ?? undefined,
    }) as ChiTietKiemKeKho;
    if (tenNguoiKiem) ct.ten_nguoi_kiem = tenNguoiKiem;
    out.push(ct);
  }
  return out;
}

export async function createDotKiemKeKhoSupabase(data: DotKiemKeKhoCreate): Promise<DotKiemKeKho> {
  const { data: row, error } = await supabase
    .from(TABLE_DOT)
    .insert({
      ma_dot: data.ma_dot.trim(),
      ten_dot: data.ten_dot.trim(),
      ngay_bat_dau: data.ngay_bat_dau,
      ngay_ket_thuc: data.ngay_ket_thuc,
      trang_thai: 'draft',
      id_nguoi_phu_trach: Number(data.id_nguoi_phu_trach),
      ghi_chu: data.ghi_chu?.trim() || null,
    })
    .select(DOT_KK_KHO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  const idDot = (row as DotRow).id;
  if ((data.id_kho ?? []).length > 0) {
    const { error: errKho } = await supabase.from(TABLE_DOT_KHO).insert(
      data.id_kho!.map((id_kho) => ({ id_dot_kiem_ke_kho: idDot, id_kho: Number(id_kho) }))
    );
    if (errKho) throw new Error(errKho.message);
  }
  const created = await getDotKiemKeKhoByIdSupabase(String(idDot));
  if (!created) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return created;
}

export async function updateDotKiemKeKhoSupabase(id: string, data: Partial<DotKiemKeKhoCreate>): Promise<DotKiemKeKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const existing = await getDotKiemKeKhoByIdSupabase(id);
  if (!existing) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (existing.trang_thai === 'hoan_thanh') {
    const onlyGhiChu = data.ghi_chu !== undefined && Object.keys(data).length === 1;
    if (!onlyGhiChu) throw new Error(i18n.t('kiemKeKho.service.onlyEditDraft'));
  }
  const payload: Record<string, unknown> = {};
  if (data.ma_dot != null) payload.ma_dot = data.ma_dot.trim();
  if (data.ten_dot != null) payload.ten_dot = data.ten_dot.trim();
  if (data.ngay_bat_dau != null) payload.ngay_bat_dau = data.ngay_bat_dau;
  if (data.ngay_ket_thuc != null) payload.ngay_ket_thuc = data.ngay_ket_thuc;
  if (data.id_nguoi_phu_trach != null) payload.id_nguoi_phu_trach = Number(data.id_nguoi_phu_trach);
  if (data.ghi_chu !== undefined) payload.ghi_chu = data.ghi_chu?.trim() || null;
  if (Object.keys(payload).length > 0) {
    const { error: updateErr } = await supabase.from(TABLE_DOT).update(payload).eq('id', idNum);
    if (updateErr) throw new Error(updateErr.message);
  }
  if (data.id_kho != null) {
    await supabase.from(TABLE_DOT_KHO).delete().eq('id_dot_kiem_ke_kho', idNum);
    if (data.id_kho.length > 0) {
      const { error: errKho } = await supabase
        .from(TABLE_DOT_KHO)
        .insert(data.id_kho.map((id_kho) => ({ id_dot_kiem_ke_kho: idNum, id_kho: Number(id_kho) })));
      if (errKho) throw new Error(errKho.message);
    }
  }
  const updated = await getDotKiemKeKhoByIdSupabase(id);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

export async function deleteDotKiemKeKhoSupabase(ids: string[]): Promise<void> {
  const idNums = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { data: dots } = await supabase.from(TABLE_DOT).select('id, trang_thai').in('id', idNums);
  const completed = (dots ?? []).filter((d: { trang_thai: string }) => d.trang_thai === 'hoan_thanh');
  if (completed.length > 0) throw new Error(i18n.t('kiemKeKho.service.onlyDeleteNotCompleted'));
  const { error } = await supabase.from(TABLE_DOT).delete().in('id', idNums);
  if (error) throw new Error(error.message);
}

export async function changeTrangThaiDotSupabase(id: string, trang_thai: TrangThaiDotKiemKeKho): Promise<DotKiemKeKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const { error } = await supabase.from(TABLE_DOT).update({ trang_thai }).eq('id', idNum);
  if (error) throw new Error(error.message);
  const updated = await getDotKiemKeKhoByIdSupabase(id);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

export async function taoDanhSachKiemKeSupabase(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFiltersSupabase
): Promise<ChiTietKiemKeKho[]> {
  const dot = await getDotKiemKeKhoByIdSupabase(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (dot.trang_thai === 'hoan_thanh') throw new Error(i18n.t('kiemKeKho.service.onlyTaoDanhSachWhenDraft'));
  if (!dot.id_kho?.length) throw new Error(i18n.t('kiemKeKho.service.dotChuaChonKho'));

  const hangHoaList = await getHangHoaRef();
  const existing = await getChiTietByDotSupabase(id_dot_kiem_ke_kho);
  const existingKeys = new Set(existing.map((c) => `${c.id_kho}|${c.id_hang_hoa}`));
  const idDotNum = Number(id_dot_kiem_ke_kho);
  const khoIdsToProcess = (filters?.id_kho?.length
    ? filters.id_kho.filter((k) => dot.id_kho.includes(k))
    : dot.id_kho) as string[];

  const activeHangHoa = hangHoaList.filter((h) => {
    if (h.trang_thai === 'Ngừng hoạt động') return false;
    if (filters?.id_hang_hoa?.length && !filters.id_hang_hoa.includes(h.id)) return false;
    if (filters?.id_danh_muc?.length && (!h.danh_muc_id || !filters.id_danh_muc.includes(h.danh_muc_id))) return false;
    return true;
  });

  const tonByKho = new Map<string, Map<string, number>>();
  for (const id_kho of khoIdsToProcess) {
    const tonTheoKho = await getTonKhoTheoKho(id_kho);
    const m = new Map<string, number>();
    for (const { id_hang_hoa, so_luong } of tonTheoKho) {
      m.set(id_hang_hoa, so_luong);
    }
    tonByKho.set(id_kho, m);
  }

  const toInsert: { id_dot_kiem_ke_kho: number; id_kho: number; id_hang_hoa: number; so_luong_so: number; ket_qua: string }[] = [];
  for (const id_kho of khoIdsToProcess) {
    const tonMap = tonByKho.get(id_kho) ?? new Map<string, number>();
    for (const hh of activeHangHoa) {
      const key = `${id_kho}|${hh.id}`;
      if (existingKeys.has(key)) continue;
      const so_luong_so = tonMap.get(hh.id) ?? 0;
      toInsert.push({
        id_dot_kiem_ke_kho: idDotNum,
        id_kho: Number(id_kho),
        id_hang_hoa: Number(hh.id),
        so_luong_so,
        ket_qua: 'chua_kiem',
      });
      existingKeys.add(key);
    }
  }

  if (toInsert.length === 0) {
    throw new Error(i18n.t('kiemKeKho.service.taoDanhSachEmpty'));
  }
  const { error } = await supabase.from(TABLE_CHI_TIET).insert(toInsert);
  if (error) throw new Error(error.message);
  const { error: updateDotErr } = await supabase
    .from(TABLE_DOT)
    .update({ trang_thai: 'dang_kiem_ke' })
    .eq('id', idDotNum);
  if (updateDotErr) throw new Error(updateDotErr.message);
  return getChiTietByDotSupabase(id_dot_kiem_ke_kho);
}

export async function createChiTietKiemKeSupabase(
  id_dot_kiem_ke_kho: string,
  id_kho: string,
  id_hang_hoa: string
): Promise<ChiTietKiemKeKho> {
  const dot = await getDotKiemKeKhoByIdSupabase(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (dot.trang_thai === 'hoan_thanh') throw new Error(i18n.t('kiemKeKho.service.onlyEditDraft'));
  if (!dot.id_kho.includes(id_kho)) throw new Error(i18n.t('kiemKeKho.service.khoNotInDot'));
  const existing = await getChiTietByDotSupabase(id_dot_kiem_ke_kho);
  if (existing.some((c) => c.id_kho === id_kho && c.id_hang_hoa === id_hang_hoa))
    throw new Error(i18n.t('kiemKeKho.service.chiTietAlreadyExists'));
  const tonTheoKho = await getTonKhoTheoKho(id_kho);
  const ton = tonTheoKho.find((t) => t.id_hang_hoa === id_hang_hoa);
  const so_luong_so = ton?.so_luong ?? 0;
  const { data: row, error } = await supabase
    .from(TABLE_CHI_TIET)
    .insert({
      id_dot_kiem_ke_kho: Number(id_dot_kiem_ke_kho),
      id_kho: Number(id_kho),
      id_hang_hoa: Number(id_hang_hoa),
      so_luong_so,
      so_luong_thuc_te: null,
      ket_qua: 'chua_kiem',
      ghi_chu_dong: null,
      id_nguoi_kiem: null,
      ngay_kiem: null,
    })
    .select(CHI_TIET_KK_KHO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  const list = await getChiTietByDotSupabase(id_dot_kiem_ke_kho);
  const found = list.find((c) => c.id === String((row as ChiTietRow).id));
  if (!found) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  return found;
}

export async function deleteChiTietKiemKeSupabase(id_chi_tiet: string): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await supabase.from(TABLE_CHI_TIET).select('id_dot_kiem_ke_kho').eq('id', idNum).maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const dot = await getDotKiemKeKhoByIdSupabase(String((row as { id_dot_kiem_ke_kho: number }).id_dot_kiem_ke_kho));
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (dot.trang_thai === 'hoan_thanh') throw new Error(i18n.t('kiemKeKho.service.onlyEditDraft'));
  const { error } = await supabase.from(TABLE_CHI_TIET).delete().eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function updateChiTietKetQuaSupabase(
  id_chi_tiet: string,
  data: ChiTietKiemKeKhoUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKeKho> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await supabase.from(TABLE_CHI_TIET).select(CHI_TIET_KK_KHO_COLUMNS).eq('id', idNum).maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const r = row as ChiTietRow;
  const soLuongThucTe = data.so_luong_thuc_te !== undefined ? data.so_luong_thuc_te : r.so_luong_thuc_te;
  const ghiChuDong = data.ghi_chu_dong !== undefined ? data.ghi_chu_dong : r.ghi_chu_dong;
  const ketQua = computeKetQua(Number(r.so_luong_so), soLuongThucTe ?? null);
  const { error: updateErr } = await supabase
    .from(TABLE_CHI_TIET)
    .update({
      so_luong_thuc_te: soLuongThucTe ?? null,
      ghi_chu_dong: ghiChuDong?.trim() || null,
      ket_qua: ketQua,
      id_nguoi_kiem: Number(id_nguoi_kiem),
      ngay_kiem: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (updateErr) throw new Error(updateErr.message);
  const list = await getChiTietByDotSupabase(String(r.id_dot_kiem_ke_kho));
  const found = list.find((c) => c.id === id_chi_tiet);
  if (!found) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  return found;
}

function throwKiemKeRpcError(err: { message?: string }): never {
  const m = String(err.message ?? '');
  if (m.includes('kiem_ke_chi_tiet_not_found')) throw new Error(i18n.t('kiemKeKho.service.rpcChiTietNotFound'));
  if (m.includes('kiem_ke_dot_not_found')) throw new Error(i18n.t('kiemKeKho.service.rpcDotNotFound'));
  if (m.includes('kiem_ke_dot_not_dang_kiem_ke')) throw new Error(i18n.t('kiemKeKho.service.rpcDotNotDangKiemKe'));
  if (m.includes('kiem_ke_already_adjusted')) throw new Error(i18n.t('kiemKeKho.service.rpcAlreadyAdjusted'));
  if (m.includes('kiem_ke_no_thuc_te')) throw new Error(i18n.t('kiemKeKho.service.noThucTeForDieuChinh'));
  if (m.includes('kiem_ke_no_variance')) throw new Error(i18n.t('kiemKeKho.service.rpcNoVariance'));
  throw new Error(m || i18n.t('kiemKeKho.service.rpcUnknown'));
}

export async function dieuChinhTonTheoKetQuaSupabase(
  id_chi_tiet: string,
  p_nguoi_tao_id?: number | null
): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const nv =
    p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { error } = await supabase.rpc('kiem_ke_apply_dieu_chinh_chi_tiet', {
    p_id_chi_tiet: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKeRpcError(error);
}

export async function dieuChinhTonTheoDotSupabase(
  id_dot_kiem_ke_kho: string,
  p_nguoi_tao_id?: number | null
): Promise<number> {
  const idNum = Number(id_dot_kiem_ke_kho);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const nv =
    p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { data, error } = await supabase.rpc('kiem_ke_apply_dieu_chinh_dot', {
    p_id_dot: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKeRpcError(error);
  const n = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(n) ? n : 0;
}

export async function hoanThanhDotSupabase(id_dot_kiem_ke_kho: string): Promise<DotKiemKeKho> {
  const dot = await getDotKiemKeKhoByIdSupabase(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (dot.trang_thai !== 'dang_kiem_ke') throw new Error(i18n.t('kiemKeKho.service.onlyHoanThanhWhenDangKiem'));
  const idNum = Number(id_dot_kiem_ke_kho);
  const { error } = await supabase.from(TABLE_DOT).update({ trang_thai: 'hoan_thanh' }).eq('id', idNum);
  if (error) throw new Error(error.message);
  const updated = await getDotKiemKeKhoByIdSupabase(id_dot_kiem_ke_kho);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

/** Trả về số thứ tự tiếp theo cho mã đợt (app format: KK-YYYY-NNNN). */
export async function getNextMaDotDotKiemKeKhoSupabase(): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_ma_dot_dot_kiem_ke_kho');
  if (error) throw new Error(error.message);
  if (typeof data === 'number' && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 1;
}