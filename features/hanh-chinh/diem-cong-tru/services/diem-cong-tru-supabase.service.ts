/**
 * Service điểm cộng trừ – đọc/ghi Supabase (fp_hr_diem_cong_tru).
 * Bảng liên kết: id_hang_muc → fp_hr_thiet_lap_diem_cong_tru(id); id_nhan_vien → fp_var_nhan_vien(id).
 */
import {
  db,
  fetchAllRows,
  fetchTablePage,
  throwSupabaseError,
  type PaginatedTableResult,
} from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import {
  DIEM_CT_SORTABLE_DB_COLUMNS,
  DIEM_CT_SORT_MAC_DINH,
  type DiemCongTruListServerQuery,
} from './diem-cong-tru-list-query';
import type { DiemCongTruRecord } from '../core/types';
import type { DiemCongTruFormValues } from '../core/schema';
import { getPayrollPointGroups } from '../../thiet-lap-cong-luong/services/payroll-point-group-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hr_diem_cong_tru';

const ROW_COLUMNS =
  'id,id_nhan_vien,nam,thang,loai,id_hang_muc,ten_hang_muc,diem,mo_ta,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat';

interface DbRow {
  id: number;
  id_nhan_vien: number;
  nam: number;
  thang: number;
  loai: string;
  id_hang_muc: number;
  ten_hang_muc: string | null;
  diem: number;
  mo_ta: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToItem(
  row: DbRow,
  employeeMap: Map<string, { ho_ten?: string; ma_nhan_vien?: string }>,
  hangMucMap: Map<string, { ten?: string; ma?: string }>
): DiemCongTruRecord {
  const idNv = String(row.id_nhan_vien);
  const idHm = String(row.id_hang_muc);
  const emp = employeeMap.get(idNv);
  const hm = hangMucMap.get(idHm);
  const moTa = (row.ghi_chu ?? row.mo_ta)?.trim() || undefined;
  return {
    id: String(row.id),
    id_nhan_vien: idNv,
    ten_nhan_vien: emp?.ho_ten,
    ma_nhan_vien: emp?.ma_nhan_vien,
    nam: Number(row.nam),
    thang: Number(row.thang),
    loai: row.loai === 'tru' ? 'tru' : 'cong',
    id_hang_muc: idHm,
    ten_hang_muc: (row.ten_hang_muc?.trim() || hm?.ten) ?? undefined,
    ma_hang_muc: hm?.ma,
    diem: Number(row.diem),
    mo_ta: moTa,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

/** Cột tham gia ô tìm kiếm ở server. */
const DIEM_CT_SEARCH_SPEC = {
  text: ['ten_hang_muc', 'mo_ta', 'ghi_chu', 'loai'],
  numeric: ['id', 'nam', 'thang', 'diem'],
} as const;

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDiemCtListQuery(q: any, query: DiemCongTruListServerQuery, nhanVienIds: number[] | null): any {
  let sel = q;

  if (query.loai.length > 0) sel = sel.in('loai', query.loai);
  if (/^\d{4}-\d{2}$/.test(query.yearMonth)) {
    const [y, m] = query.yearMonth.split('-').map(Number);
    sel = sel.eq('nam', y).eq('thang', m);
  }
  if (query.idNhanVien) {
    const n = Number(query.idNhanVien);
    sel = Number.isFinite(n) ? sel.eq('id_nhan_vien', n) : sel.eq('id', -1);
  }
  if (nhanVienIds != null) {
    sel = nhanVienIds.length === 0 ? sel.eq('id', -1) : sel.in('id_nhan_vien', nhanVienIds);
  }

  sel = applyPostgrestSearch(sel, query.searchTerm, DIEM_CT_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && DIEM_CT_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : DIEM_CT_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : DIEM_CT_SORT_MAC_DINH.ascending;

  sel = sel.order(sortCol, { ascending });
  if (sortCol === 'nam') sel = sel.order('thang', { ascending });
  return sel.order('id', { ascending: false });
}

/**
 * Tên nhân viên nằm ở bảng khác nên không `OR` chung với cột bảng điểm được:
 * tra id trước rồi lọc `id_nhan_vien.in.(...)`.
 */
async function timNhanVienIdsTheoTuKhoa(term: string): Promise<number[]> {
  const t = term.trim();
  if (!t) return [];
  const esc = t.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const pat = postgrestQuotedIlikePattern(`%${esc}%`);
  const { data, error } = await db
    .from('fp_var_nhan_vien')
    .select('id')
    .or(`ho_va_ten.ilike.${pat},ma_nhan_vien.ilike.${pat}`)
    .limit(500);
  if (error) throwSupabaseError(error, { resource: 'fp_var_nhan_vien.search' });
  return (data ?? []).map((r) => Number((r as { id: unknown }).id)).filter(Number.isFinite);
}

export async function getDiemCongTruPage(
  query: DiemCongTruListServerQuery
): Promise<PaginatedTableResult<DiemCongTruRecord>> {
  const term = query.searchTerm.trim();
  const [nhanVienIdsTheoTen, pointGroups, employees] = await Promise.all([
    term ? timNhanVienIdsTheoTuKhoa(term) : Promise.resolve(null),
    getPayrollPointGroups(),
    getEmployeesRef(),
  ]);

  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    let sel = applyDiemCtListQuery(
      db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }),
      query,
      null
    );
    // Từ khoá khớp tên nhân viên HOẶC các cột của chính bảng điểm.
    if (nhanVienIdsTheoTen != null && nhanVienIdsTheoTen.length > 0) {
      sel = sel.or(`id_nhan_vien.in.(${nhanVienIdsTheoTen.join(',')})`);
    }
    const res = await sel.range(from, to);
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });

  const employeeMap = new Map(employees.map((e) => [e.id, { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien }]));
  const hangMucMap = new Map(pointGroups.map((g) => [g.id, { ten: g.ten, ma: g.ma }]));
  return { ...result, data: result.data.map((row) => rowToItem(row, employeeMap, hangMucMap)) };
}

export async function getDiemCongTruRecords(): Promise<DiemCongTruRecord[]> {
  const [rows, pointGroups, employees] = await Promise.all([
    fetchAllRows<DbRow>((from, to) =>
      db
        .from(TABLE)
        .select(ROW_COLUMNS)
        .order('nam', { ascending: false })
        .order('thang', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    ),
    getPayrollPointGroups(),
    getEmployeesRef(),
  ]);

  const employeeMap = new Map(employees.map((e) => [e.id, { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien }]));
  const hangMucMap = new Map(pointGroups.map((g) => [g.id, { ten: g.ten, ma: g.ma }]));

  return rows.map((row) => rowToItem(row, employeeMap, hangMucMap));
}

export async function createDiemCongTruRecord(
  data: DiemCongTruFormValues,
  id_nguoi_tao?: string
): Promise<DiemCongTruRecord> {
  const idNhanVien = Number(data.id_nhan_vien);
  const idHangMuc = Number(data.id_hang_muc);
  if (Number.isNaN(idNhanVien) || Number.isNaN(idHangMuc)) {
    throw new Error(i18n.t('diemCongTru.service.notFound'));
  }

  const [pointGroups] = await Promise.all([getPayrollPointGroups()]);
  const hangMuc = pointGroups.find((g) => g.id === data.id_hang_muc);
  const tenHangMuc = hangMuc?.ten ?? null;
  const idNguoiTaoNum =
    id_nguoi_tao != null && !Number.isNaN(Number(id_nguoi_tao)) ? Number(id_nguoi_tao) : null;
  const ghiChu = data.mo_ta?.trim() || null;

  const payload = {
    id_nhan_vien: idNhanVien,
    nam: data.nam,
    thang: data.thang,
    loai: data.loai === 'tru' ? 'tru' : 'cong',
    id_hang_muc: idHangMuc,
    ten_hang_muc: tenHangMuc,
    diem: Number(data.diem),
    mo_ta: ghiChu,
    ghi_chu: ghiChu,
    id_nguoi_tao: idNguoiTaoNum,
  };

  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);

  const [groups, employees] = await Promise.all([getPayrollPointGroups(), getEmployeesRef()]);
  const employeeMap = new Map(employees.map((e) => [e.id, { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien }]));
  const hangMucMap = new Map(groups.map((g) => [g.id, { ten: g.ten, ma: g.ma }]));

  return rowToItem(inserted as DbRow, employeeMap, hangMucMap);
}

export async function updateDiemCongTruRecord(
  id: string,
  data: DiemCongTruFormValues
): Promise<DiemCongTruRecord> {
  const idNum = Number(id);
  const idNhanVien = Number(data.id_nhan_vien);
  const idHangMuc = Number(data.id_hang_muc);
  if (Number.isNaN(idNum) || Number.isNaN(idNhanVien) || Number.isNaN(idHangMuc)) {
    throw new Error(i18n.t('diemCongTru.service.notFound'));
  }

  const [pointGroups] = await Promise.all([getPayrollPointGroups()]);
  const hangMuc = pointGroups.find((g) => g.id === data.id_hang_muc);
  const tenHangMuc = hangMuc?.ten ?? null;
  const ghiChu = data.mo_ta?.trim() || null;

  const payload = {
    id_nhan_vien: idNhanVien,
    nam: data.nam,
    thang: data.thang,
    loai: data.loai === 'tru' ? 'tru' : 'cong',
    id_hang_muc: idHangMuc,
    ten_hang_muc: tenHangMuc,
    diem: Number(data.diem),
    mo_ta: ghiChu,
    ghi_chu: ghiChu,
  };

  const { error } = await db.from(TABLE).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const { data: row, error: fetchErr } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', idNum).single();
  if (fetchErr || !row) throw new Error(i18n.t('diemCongTru.service.notFound'));

  const [groups, employees] = await Promise.all([getPayrollPointGroups(), getEmployeesRef()]);
  const employeeMap = new Map(employees.map((e) => [e.id, { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien }]));
  const hangMucMap = new Map(groups.map((g) => [g.id, { ten: g.ten, ma: g.ma }]));

  return rowToItem(row as DbRow, employeeMap, hangMucMap);
}

export async function deleteDiemCongTruRecords(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}
