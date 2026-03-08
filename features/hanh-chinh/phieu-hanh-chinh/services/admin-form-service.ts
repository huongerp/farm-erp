import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { AdminFormRequest } from '../core/types';
import type { AdminFormValues } from '../core/schema';
import type { AdminFormStatus, ApprovalStatus } from '../core/constants';
import type { AdminFormType } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormShift } from '../core/constants';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hr_phieu_hanh_chinh';
const TABLE_NHOM = 'fp_hr_nhom_phieu_hanh_chinh';
const TABLE_NHAN_VIEN = 'fp_var_nhan_vien';

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

/** 1 cấp duyệt: trạng thái Chờ duyệt | Đã duyệt | Từ chối | Đã hủy */
const TRANG_THAI_VI_TO_APP: Record<string, AdminFormStatus> = {
  'Chờ duyệt': 'pending',
  'Đã duyệt': 'approved',
  'Từ chối': 'rejected',
  'Đã hủy': 'cancelled',
};
const TRANG_THAI_APP_TO_VI: Record<AdminFormStatus, string> = {
  pending: 'Chờ duyệt',
  manager_approved: 'Đã duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
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
  return {
    id: String(row.id),
    loai_phieu: LOAI_PHIEU_VI_TO_APP[loaiVi] ?? 'late_early',
    ca: CA_VI_TO_APP[caVi] ?? 'full',
    ngay: toDateString(row.ngay),
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
    const { data: nhomRows } = await supabase.from(TABLE_NHOM).select('id, loai_phieu').in('id', loaiPhieuIds);
    (nhomRows ?? []).forEach((r: Row) => { mapLoaiPhieu[Number(r.id)] = (r.loai_phieu as string) ?? ''; });
  }
  if (nguoiTaoIds.length > 0) {
    const { data: nvRows } = await supabase.from(TABLE_NHAN_VIEN).select('id, ho_va_ten').in('id', nguoiTaoIds);
    (nvRows ?? []).forEach((r: Row) => { mapTenNhanVien[Number(r.id)] = (r.ho_va_ten as string) ?? ''; });
  }
  return { mapLoaiPhieu, mapTenNhanVien };
}

export async function getAdminForms(): Promise<AdminFormRequest[]> {
  const rows = await fetchAllRows<Row>(async (from, to) =>
    supabase.from(TABLE).select('*').order('ngay', { ascending: false }).range(from, to)
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
      ? supabase
          .from(TABLE)
          .select('*')
          .eq('nguoi_tao_id', nguoiTaoId)
          .gte('ngay', prefix + '01')
          .lte('ngay', prefix + '31')
          .order('ngay', { ascending: false })
          .range(from, to)
      : supabase
          .from(TABLE)
          .select('*')
          .gte('ngay', prefix + '01')
          .lte('ngay', prefix + '31')
          .order('ngay', { ascending: false })
          .range(from, to);
  const rows = await fetchAllRows<Row>(run);
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps(rows);
  let list = rows.map((r) => rowToRequest(r, mapLoaiPhieu, mapTenNhanVien));
  if (!isNum) list = list.filter((f) => f.nguoi_tao_id === userId);
  return list;
}

/** Resolve loai_phieu (app) -> id nhóm phiếu (bigint) */
async function resolveLoaiPhieuId(loaiPhieuApp: AdminFormType): Promise<number | null> {
  const loaiVi = LOAI_PHIEU_APP_TO_VI[loaiPhieuApp];
  const { data } = await supabase
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

export async function createAdminForm(
  data: AdminFormValues,
  creator: { id: string; name: string }
): Promise<AdminFormRequest> {
  const loaiPhieuId = await resolveLoaiPhieuId(data.loai_phieu);
  const nguoiTaoId = resolveNguoiTaoId(creator.id);
  if (nguoiTaoId == null) throw new Error(i18n.t('adminForm.service.notFound'));

  const row = {
    loai_phieu_id: loaiPhieuId,
    ngay: data.ngay || null,
    ca: CA_APP_TO_VI[data.ca],
    ly_do: data.ly_do?.trim() || null,
    trang_thai: 'Chờ duyệt',
    ghi_chu: null,
    nguoi_tao_id: nguoiTaoId,
    tg_cap_nhat: null,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select('*').single();
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
    ngay: data.ngay || null,
    ca: CA_APP_TO_VI[data.ca],
    ly_do: data.ly_do?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', idNum)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
  const updatedRow = updated as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([updatedRow]);
  return rowToRequest(updatedRow, mapLoaiPhieu, mapTenNhanVien);
}

export async function cancelAdminForm(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: 'Đã hủy', tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function deleteAdminForm(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function deleteAdminForms(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function cancelAdminForms(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase
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
  const { error } = await supabase
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
  const { error } = await supabase
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
  const row = {
    loai_phieu_id: loaiPhieuId,
    ngay: data.date,
    ca: CA_APP_TO_VI[data.shift],
    ly_do: data.reason?.trim() || null,
    trang_thai: 'Chờ duyệt',
    ghi_chu: null,
    nguoi_tao_id: nguoiTaoId,
    tg_cap_nhat: null,
  };
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message);
  const out = inserted as Row;
  const { mapLoaiPhieu, mapTenNhanVien } = await fetchMaps([out]);
  return rowToRequest(out, mapLoaiPhieu, mapTenNhanVien);
}

export async function updateAdminFormGhiChu(id: string, ghiChu: string | null): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await supabase
    .from(TABLE)
    .update({ ghi_chu: ghiChu?.trim() || null, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function approveAdminFormByManager(id: string): Promise<void> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('adminForm.service.notFound'));
  const { error } = await supabase
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
  const { error } = await supabase
    .from(TABLE)
    .update({
      trang_thai: 'Từ chối',
      tg_cap_nhat: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('adminForm.service.notFound'));
}

export async function approveAdminFormByHcns(id: string): Promise<void> {
  return Promise.resolve();
}

export async function rejectAdminFormByHcns(id: string): Promise<void> {
  return rejectAdminFormByManager(id);
}
