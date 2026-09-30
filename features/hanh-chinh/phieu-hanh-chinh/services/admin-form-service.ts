import { db, fetchAllRows, fetchTablePage, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import {
  ADMIN_FORM_SORTABLE_DB_COLUMNS,
  ADMIN_FORM_SORT_MAC_DINH,
  khoangNgayCuaThang,
  type AdminFormListServerQuery,
} from './admin-form-list-query';
import type { AdminFormRequest, AdminFormTomTat } from '../core/types';
import type { AdminFormValues } from '../core/schema';
import type { AdminFormStatus, ApprovalStatus } from '../core/constants';
import type { AdminFormType } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormShift } from '../core/constants';
import {
  caTuKhoang,
  giaoNhau,
  khoangTuCa,
  khoangTuForm,
  type AdminFormSession,
  type KhoangPhieu,
} from '../core/khoang-nghi';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hr_phieu_hanh_chinh';
const TABLE_NHOM = 'fp_hr_nhom_phieu_hanh_chinh';
const TABLE_NHAN_VIEN = 'fp_var_nhan_vien';

const ADMIN_FORM_ROW_COLUMNS =
  'id,loai_phieu_id,ngay,den_ngay,tu_buoi,den_buoi,ca,ly_do,trang_thai,ghi_chu,nguoi_tao_id,tg_tao,tg_cap_nhat';

/** Loại phiếu: tiếng Việt (DB) <-> mã (app) */
const LOAI_PHIEU_VI_TO_APP: Record<string, AdminFormType> = {
  'Đi muộn / về sớm': 'late_early',
  'Công tác': 'business_trip',
  'Quên chấm công': 'missed_checkin',
  'Tăng ca': 'overtime',
  'Xin nghỉ không lương': 'leave_unpaid',
  'Xin nghỉ phép': 'leave_paid',
};
const LOAI_PHIEU_APP_TO_VI: Record<AdminFormType, string> = {
  late_early: 'Đi muộn / về sớm',
  business_trip: 'Công tác',
  missed_checkin: 'Quên chấm công',
  overtime: 'Tăng ca',
  leave_unpaid: 'Xin nghỉ không lương',
  leave_paid: 'Xin nghỉ phép',
};

const CA_VI_TO_APP: Record<string, AdminFormShift> = {
  'Sáng': 'morning',
  'Chiều': 'afternoon',
  'Cả ngày': 'full',
};
const CA_APP_TO_VI: Record<AdminFormShift, string> = {
  morning: 'Sáng',
  afternoon: 'Chiều',
  full: 'Cả ngày',
};

const BUOI_VI_TO_APP: Record<string, AdminFormSession> = { 'Sáng': 'morning', 'Chiều': 'afternoon' };
const BUOI_APP_TO_VI: Record<AdminFormSession, string> = { morning: 'Sáng', afternoon: 'Chiều' };

/** 1 cấp duyệt: trạng thái Chờ duyệt | Đã duyệt | Từ chối | Đã hủy */
const TRANG_THAI_VI_TO_APP: Record<string, AdminFormStatus> = {
  'Chờ duyệt': 'pending',
  'Đã duyệt': 'approved',
  'Từ chối': 'rejected',
  'Đã hủy': 'cancelled',
};

const DUYET_VI_TO_APP: Record<string, ApprovalStatus> = {
  'Chờ duyệt': 'pending',
  'Đã duyệt': 'approved',
  'Từ chối': 'rejected',
};

type Row = Record<string, unknown>;

function toDateString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  const d = new Date(v as string | number | Date);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Map loại phiếu + tên NV từ id (không dùng embed để tránh 400) */
function rowToRequest(
  row: Row,
  mapLoaiPhieu: Record<number, string>,
  mapTenNhanVien: Record<number, string>
): AdminFormRequest {
  const loaiPhieuId = row.loai_phieu_id != null ? Number(row.loai_phieu_id) : null;
  const nguoiTaoId = row.nguoi_tao_id != null ? Number(row.nguoi_tao_id) : null;
  const loaiVi = (loaiPhieuId != null ? mapLoaiPhieu[loaiPhieuId] : '') ?? '';
  const caVi = (row.ca as string) ?? '';
  const ttVi = (row.trang_thai as string) ?? '';
  const approvalStatus: ApprovalStatus = DUYET_VI_TO_APP[ttVi] ?? 'pending';
  const ngay = toDateString(row.ngay);
  // Dòng chưa có khoảng (trước migration 002) → suy từ ca như trigger DB.
  const caCu = CA_VI_TO_APP[caVi];
  const khoangCu = khoangTuCa(ngay, caCu ?? 'full');
  const khoang: KhoangPhieu = {
    tu_ngay: ngay,
    den_ngay: toDateString(row.den_ngay) || ngay,
    tu_buoi: BUOI_VI_TO_APP[row.tu_buoi as string] ?? khoangCu.tu_buoi,
    den_buoi: BUOI_VI_TO_APP[row.den_buoi as string] ?? khoangCu.den_buoi,
  };
  return {
    id: String(row.id),
    loai_phieu: LOAI_PHIEU_VI_TO_APP[loaiVi] ?? 'late_early',
    ca: caCu ?? caTuKhoang(khoang) ?? 'full',
    ngay,
    den_ngay: khoang.den_ngay,
    tu_buoi: khoang.tu_buoi,
    den_buoi: khoang.den_buoi,
    ly_do: (row.ly_do as string) ?? '',
    nguoi_tao_id: String(row.nguoi_tao_id ?? ''),
    ten_nguoi_tao: (nguoiTaoId != null ? mapTenNhanVien[nguoiTaoId] : '') ?? '',
    id_phong_ban: null,
    ten_phong_ban: null,
    quan_ly_id: null,
    ten_quan_ly: null,
    hcns_id: null,
    ten_hcns: null,
    trang_thai_quan_ly: approvalStatus,
    trang_thai_hcns: 'approved',
    trang_thai: TRANG_THAI_VI_TO_APP[ttVi] ?? 'pending',
    ghi_chu: (row.ghi_chu as string) ?? undefined,
    tg_tao: (row.tg_tao as string) ?? new Date().toISOString(),
    tg_cap_nhat: (row.tg_cap_nhat as string) ?? new Date().toISOString(),
  };
}

async function fetchMaps(rows: Row[]): Promise<{ mapLoaiPhieu: Record<number, string>; mapTenNhanVien: Record<number, string> }> {
  const loaiPhieuIds = [...new Set((rows.map((r) => r.loai_phieu_id).filter((id) => id != null) as number[]))];
  const nguoiTaoIds = [...new Set((rows.map((r) => r.nguoi_tao_id).filter((id) => id != null) as number[]))];
  const mapLoaiPhieu: Record<number, string> = {};
  const mapTenNhanVien: Record<number, string> = {};

  if (loaiPhieuIds.length > 0) {
    const { data: nhomRows } = await db.from(TABLE_NHOM).select('id, loai_phieu').in('id', loaiPhieuIds);
    (nhomRows ?? []).forEach((r: Row) => { mapLoaiPhieu[Number(r.id)] = (r.loai_phieu as string) ?? ''; });
  }
  if (nguoiTaoIds.length > 0) {
    const { data: nvRows } = await db.from(TABLE_NHAN_VIEN).select('id, ho_va_ten').in('id', nguoiTaoIds);
    (nvRows ?? []).forEach((r: Row) => { mapTenNhanVien[Number(r.id)] = (r.ho_va_ten as string) ?? ''; });
  }
  return { mapLoaiPhieu, mapTenNhanVien };
}

/** Cột tham gia ô tìm kiếm ở server. */
const ADMIN_FORM_SEARCH_SPEC = {
  text: ['ly_do', 'ghi_chu', 'ca', 'trang_thai'],
  numeric: ['id'],
  dates: ['ngay'],
} as const;

/** Id nhóm phiếu ứng với các mã loại phiếu app đã chọn. */
async function timLoaiPhieuIds(types: string[]): Promise<number[]> {
  if (types.length === 0) return [];
  const tenVi = types.map((t) => LOAI_PHIEU_APP_TO_VI[t as AdminFormType]).filter(Boolean);
  if (tenVi.length === 0) return [];
  const { data } = await db.from(TABLE_NHOM).select('id').in('loai_phieu', tenVi);
  return (data ?? []).map((r) => Number((r as Row).id)).filter(Number.isFinite);
}

/** null = mọi người; mảng rỗng / id lạ = không dòng nào (không bao giờ lộ cả bảng). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function locTheoNguoiTao(sel: any, nguoiTaoIds: string[] | null): any {
  if (nguoiTaoIds == null) return sel;
  const ids = nguoiTaoIds.map(Number).filter(Number.isFinite);
  return ids.length === 0 ? sel.eq('id', -1) : sel.in('nguoi_tao_id', ids);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyAdminFormListQuery(q: any, query: AdminFormListServerQuery, loaiPhieuIds: number[] | null): any {
  let sel = q;

  if (query.status.length > 0) sel = sel.in('trang_thai', query.status);
  if (loaiPhieuIds != null) {
    sel = loaiPhieuIds.length === 0 ? sel.eq('id', -1) : sel.in('loai_phieu_id', loaiPhieuIds);
  }

  // Phiếu nhiều ngày khớp tháng khi khoảng của nó chạm vào tháng.
  const thang = khoangNgayCuaThang(query.month);
  if (thang) sel = sel.lte('ngay', thang.to).gte('den_ngay', thang.from);

  sel = locTheoNguoiTao(sel, query.nguoiTaoIds);

  sel = applyPostgrestSearch(sel, query.searchTerm, ADMIN_FORM_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && ADMIN_FORM_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : ADMIN_FORM_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : ADMIN_FORM_SORT_MAC_DINH.ascending;

  return sel.order(sortCol, { ascending }).order('id', { ascending: false });
}

export async function getAdminFormPage(
  query: AdminFormListServerQuery
): Promise<PaginatedTableResult<AdminFormRequest>> {
  const loaiPhieuIds = query.type.length > 0 ? await timLoaiPhieuIds(query.type) : null;
  const result = await fetchTablePage<Row>(query.page, query.pageSize, async (from, to) => {
    const res = await applyAdminFormListQuery(
      db.from(TABLE).select(ADMIN_FORM_ROW_COLUMNS, { count: 'exact' }),
      query,
      loaiPhieuIds
    ).range(from, to);
    return { data: (res.data as Row[] | null) ?? null, error: res.error, count: res.count };
  });
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(result.data);
  return { ...result, data: result.data.map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien)) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllAdminFormsForListQuery(
  query: AdminFormListServerQuery
): Promise<AdminFormRequest[]> {
  const loaiPhieuIds = query.type.length > 0 ? await timLoaiPhieuIds(query.type) : null;
  const rows = await fetchAllRows<Row>((from, to) =>
    applyAdminFormListQuery(db.from(TABLE).select(ADMIN_FORM_ROW_COLUMNS), query, loaiPhieuIds).range(from, to)
  );
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  return rows.map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien));
}

export async function getAdminFormsByUserAndMonth(
  userId: string,
  monthKey: string
): Promise<AdminFormRequest[]> {
  const prefix = monthKey + '-';
  const nguoiTaoId = parseInt(userId, 10);
  const isNum = !Number.isNaN(nguoiTaoId);
  const run = async (from: number, to: number) =>
    isNum
      ? db
          .from(TABLE)
          .select(ADMIN_FORM_ROW_COLUMNS)
          .eq('nguoi_tao_id', nguoiTaoId)
          .gte('den_ngay', prefix + '01')
          .lte('ngay', prefix + '31')
          .order('ngay', { ascending: false })
          .range(from, to)
      : db
          .from(TABLE)
          .select(ADMIN_FORM_ROW_COLUMNS)
          .gte('den_ngay', prefix + '01')
          .lte('ngay', prefix + '31')
          .order('ngay', { ascending: false })
          .range(from, to);
  const rows = await fetchAllRows<Row>(run);
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  let list = rows.map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien));
  if (!isNum) list = list.filter((f) => f.nguoi_tao_id === userId);
  return list;
}

/**
 * Một phiếu theo id — phục vụ deep-link `?phieu=<id>` từ thông báo. Phiếu cần
 * mở thường KHÔNG nằm trong trang đang xem vì danh sách phân trang ở server.
 * Trả null khi phiếu đã bị xoá, để tầng gọi phân biệt "không thấy" với lỗi mạng.
 */
export async function getAdminFormById(id: string): Promise<AdminFormRequest | null> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) return null;
  const { data, error } = await db
    .from(TABLE)
    .select(ADMIN_FORM_ROW_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([row]);
  return rowToRequest(row, mapLoaiPhieu, mapTenNhanVien);
}

/**
 * Bản vài cột cho chip lọc + số đếm (Trạng thái / Loại / Người gửi / tháng):
 * đếm trên TOÀN BỘ phạm vi xem, không theo trang đang xem.
 */
export async function getAdminFormTomTat(nguoiTaoIds: string[] | null): Promise<AdminFormTomTat[]> {
  const rows = await fetchAllRows<Row>((from, to) =>
    locTheoNguoiTao(
      db.from(TABLE).select('id,nguoi_tao_id,loai_phieu_id,trang_thai,ngay,den_ngay'),
      nguoiTaoIds
    )
      .order('id', { ascending: false })
      .range(from, to)
  );
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  return rows.map((r) => {
    const ngay = toDateString(r.ngay);
    const nguoiTaoId = r.nguoi_tao_id != null ? Number(r.nguoi_tao_id) : null;
    const loaiVi = r.loai_phieu_id != null ? mapLoaiPhieu[Number(r.loai_phieu_id)] ?? '' : '';
    return {
      id: String(r.id),
      nguoi_tao_id: String(r.nguoi_tao_id ?? ''),
      ten_nguoi_tao: (nguoiTaoId != null ? mapTenNhanVien[nguoiTaoId] : '') ?? '',
      loai_phieu: LOAI_PHIEU_VI_TO_APP[loaiVi] ?? 'late_early',
      trang_thai: TRANG_THAI_VI_TO_APP[(r.trang_thai as string) ?? ''] ?? 'pending',
      ngay,
      den_ngay: toDateString(r.den_ngay) || ngay,
    };
  });
}

/** Mọi phiếu của một người (tab Định mức) — trước đây tab này tải cả bảng rồi lọc ở client. */
export async function getAdminFormsCuaNguoi(userId: string, month: string): Promise<AdminFormRequest[]> {
  const thang = khoangNgayCuaThang(month);
  const rows = await fetchAllRows<Row>((from, to) => {
    let q = locTheoNguoiTao(db.from(TABLE).select(ADMIN_FORM_ROW_COLUMNS), [userId]);
    if (thang) q = q.lte('ngay', thang.to).gte('den_ngay', thang.from);
    return q.order('ngay', { ascending: false }).order('id', { ascending: false }).range(from, to);
  });
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  return rows.map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien));
}

/**
 * Phiếu Chờ duyệt / Đã duyệt khác của cùng người có chung ít nhất nửa ngày với
 * khoảng đang nhập — chỉ để CẢNH BÁO trên form, không chặn lưu.
 */
export async function timPhieuTrung(
  nguoiTaoId: string,
  khoang: KhoangPhieu,
  boQuaId: string | null
): Promise<AdminFormRequest[]> {
  const n = Number(nguoiTaoId);
  if (!Number.isFinite(n) || !khoang.tu_ngay || !khoang.den_ngay) return [];
  let q = db
    .from(TABLE)
    .select(ADMIN_FORM_ROW_COLUMNS)
    .eq('nguoi_tao_id', n)
    .in('trang_thai', ['Chờ duyệt', 'Đã duyệt'])
    .lte('ngay', khoang.den_ngay)
    .gte('den_ngay', khoang.tu_ngay);
  const boQua = boQuaId != null ? Number(boQuaId) : NaN;
  if (Number.isFinite(boQua)) q = q.neq('id', boQua);
  const { data, error } = await q.order('ngay', { ascending: true }).limit(20);
  if (error) throw new Error(error.message);
  const rows = (data as Row[] | null) ?? [];
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  return rows
    .map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien))
    .filter((p) =>
      giaoNhau(khoang, { tu_ngay: p.ngay, tu_buoi: p.tu_buoi, den_ngay: p.den_ngay, den_buoi: p.den_buoi })
    );
}

/** Resolve loai_phieu (app) -> id nhóm phiếu (bigint) */
async function resolveLoaiPhieuId(loaiPhieuApp: AdminFormType): Promise<number | null> {
  const loaiVi = LOAI_PHIEU_APP_TO_VI[loaiPhieuApp];
  const { data } = await db
    .from(TABLE_NHOM)
    .select('id')
    .eq('loai_phieu', loaiVi)
    .limit(1)
    .maybeSingle();
  return data?.id != null ? Number(data.id) : null;
}

/** Resolve creator.id (string) -> bigint; nếu không parse được trả về null */
function resolveNguoiTaoId(creatorId: string): number | null {
  const n = parseInt(creatorId, 10);
  return Number.isNaN(n) ? null : n;
}

/** 5 cột thời gian sẽ ghi: ngay (từ ngày), den_ngay, tu_buoi, den_buoi, ca (null nếu nhiều ngày). */
function cotKhoang(data: AdminFormValues) {
  const k = khoangTuForm(data);
  const ca = caTuKhoang(k);
  return {
    ngay: k.tu_ngay || null,
    den_ngay: k.den_ngay || null,
    tu_buoi: BUOI_APP_TO_VI[k.tu_buoi],
    den_buoi: BUOI_APP_TO_VI[k.den_buoi],
    ca: ca ? CA_APP_TO_VI[ca] : null,
  };
}

export async function createAdminForm(
  data: AdminFormValues,
  creator: { id: string; name: string }
): Promise<AdminFormRequest> {
  const loaiPhieuId = await resolveLoaiPhieuId(data.loai_phieu);
  const nguoiTaoId = resolveNguoiTaoId(creator.id);
  if (nguoiTaoId == null) throw new Error(i18n.t('adminForm.service.notFound'));

  const row = {
    loai_phieu_id: loaiPhieuId,
    ...cotKhoang(data),
    ly_do: data.ly_do?.trim() || null,
    trang_thai: 'Chờ duyệt',
    ghi_chu: null,
    nguoi_tao_id: nguoiTaoId,
    tg_cap_nhat: null,
  };

  const { data: inserted, error } = await db.from(TABLE).insert(row).select(ADMIN_FORM_ROW_COLUMNS).single();
  if (error) throw new Error(error.message);
  const insertedRow = inserted as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([insertedRow]);
  return rowToRequest(insertedRow, mapLoaiPhieu, mapTenNhanVien);
}

export async function updateAdminForm(id: string, data: AdminFormValues): Promise<AdminFormRequest> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const loaiPhieuId = await resolveLoaiPhieuId(data.loai_phieu);
  const row = {
    loai_phieu_id: loaiPhieuId,
    ...cotKhoang(data),
    ly_do: data.ly_do?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };
  const { data: updated, error } = await db
    .from(TABLE)
    .update(row)
    .eq('id', idNum)
    .select(ADMIN_FORM_ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
  const updatedRow = updated as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([updatedRow]);
  return rowToRequest(updatedRow, mapLoaiPhieu, mapTenNhanVien);
}

export async function cancelAdminForm(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await db
    .from(TABLE)
    .update({ trang_thai: 'Đã hủy', tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function deleteAdminForm(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function deleteAdminForms(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function cancelAdminForms(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db
    .from(TABLE)
    .update({ trang_thai: 'Đã hủy', tg_cap_nhat: new Date().toISOString() })
    .in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

/** 1 cấp duyệt: quản lý duyệt */
export async function approveAdminFormsByManager(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db
    .from(TABLE)
    .update({
      trang_thai: 'Đã duyệt',
      tg_cap_nhat: new Date().toISOString(),
    })
    .in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function rejectAdminFormsByManager(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db
    .from(TABLE)
    .update({
      trang_thai: 'Từ chối',
      tg_cap_nhat: new Date().toISOString(),
    })
    .in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

/** 1 cấp duyệt: giữ API HCNS cho tương thích, coi như đã duyệt */
export async function approveAdminFormsByHcns(_ids: string[]): Promise<void> {
  return Promise.resolve();
}

export async function rejectAdminFormsByHcns(ids: string[]): Promise<void> {
  return rejectAdminFormsByManager(ids);
}

export async function createAdminFormSystem(data: {
  userId: string;
  userName?: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'full';
  reason: string;
}): Promise<AdminFormRequest> {
  const nguoiTaoId = resolveNguoiTaoId(data.userId);
  if (nguoiTaoId == null) throw new Error(i18n.t('adminForm.service.notFound'));
  const loaiPhieuId = await resolveLoaiPhieuId('late_early');
  const khoang = khoangTuCa(data.date, data.shift);
  const row = {
    loai_phieu_id: loaiPhieuId,
    ngay: data.date,
    den_ngay: khoang.den_ngay,
    tu_buoi: BUOI_APP_TO_VI[khoang.tu_buoi],
    den_buoi: BUOI_APP_TO_VI[khoang.den_buoi],
    ca: CA_APP_TO_VI[data.shift],
    ly_do: data.reason?.trim() || null,
    trang_thai: 'Chờ duyệt',
    ghi_chu: null,
    nguoi_tao_id: nguoiTaoId,
    tg_cap_nhat: null,
  };
  const { data: inserted, error } = await db.from(TABLE).insert(row).select(ADMIN_FORM_ROW_COLUMNS).single();
  if (error) throw new Error(error.message);
  const out = inserted as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([out]);
  return rowToRequest(out, mapLoaiPhieu, mapTenNhanVien);
}

export async function updateAdminFormGhiChu(id: string, ghiChu: string | null): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await db
    .from(TABLE)
    .update({ ghi_chu: ghiChu?.trim() || null, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function approveAdminFormByManager(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await db
    .from(TABLE)
    .update({
      trang_thai: 'Đã duyệt',
      tg_cap_nhat: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function rejectAdminFormByManager(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await db
    .from(TABLE)
    .update({
      trang_thai: 'Từ chối',
      tg_cap_nhat: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

/** Chỉ 1 cấp duyệt thật ở DB (trang_thai) — giữ API HCNS cho tương thích, coi như đã duyệt. */
export async function approveAdminFormByHcns(_id: string): Promise<void> {
  return Promise.resolve();
}

export async function rejectAdminFormByHcns(id: string): Promise<void> {
  return rejectAdminFormByManager(id);
}
