import { db, fetchAllRows } from '../../../../lib/db';
import type { PayrollAdminFormGroup } from '../core/types';
import type { PayrollAdminFormGroupFormValues } from '../core/schema';
import type { AdminFormType } from '../core/constants';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';

const TABLE = 'fp_hr_nhom_phieu_hanh_chinh';

const ROW_COLUMNS = 'id,loai_phieu,so_luong_thang,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

/** Map loại phiếu tiếng Việt (DB) <-> mã (app) */
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

type Row = Record<string, unknown>;

function rowToGroup(row: Row): PayrollAdminFormGroup {
  const loaiVi = (row.loai_phieu as string) ?? '';
  const loai_phieu: AdminFormType = LOAI_PHIEU_VI_TO_APP[loaiVi] ?? 'late_early';
  return {
    id: String(row.id),
    loai_phieu,
    so_luong_thang: Number(row.so_luong_thang) || 0,
    ghi_chu: (row.ghi_chu as string) ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: (row.tg_tao as string) ?? new Date().toISOString(),
    tg_cap_nhat: (row.tg_cap_nhat as string) ?? new Date().toISOString(),
  };
}

export async function getPayrollAdminFormGroups(): Promise<PayrollAdminFormGroup[]> {
  const rows = await fetchAllRows<Row>((from, to) =>
    db.from(TABLE).select(ROW_COLUMNS).order('tg_tao', { ascending: false }).range(from, to)
  );
  return rows.map(rowToGroup);
}

export async function createPayrollAdminFormGroup(
  data: PayrollAdminFormGroupFormValues
): Promise<PayrollAdminFormGroup> {
  const row = {
    loai_phieu: LOAI_PHIEU_APP_TO_VI[data.loai_phieu],
    so_luong_thang: data.so_luong_thang,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await db
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToGroup(inserted);
}

export async function updatePayrollAdminFormGroup(
  id: string,
  data: PayrollAdminFormGroupFormValues
): Promise<PayrollAdminFormGroup> {
  const row = {
    loai_phieu: LOAI_PHIEU_APP_TO_VI[data.loai_phieu],
    so_luong_thang: data.so_luong_thang,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('payrollIp.groups.service.notFound'));
  const { data: updated, error } = await db
    .from(TABLE)
    .update(row)
    .eq('id', idNum)
    .select(ROW_COLUMNS)
    .single();

  if (error) throw new Error(error.message ?? i18n.t('payrollIp.groups.service.notFound'));
  return rowToGroup(updated);
}

export async function updatePayrollAdminFormGroupStatus(ids: string[], status: TrangThaiHoatDong): Promise<void> {
  if (ids.length === 0) return;
  const payload = { trang_thai: status, tg_cap_nhat: new Date().toISOString() };
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).update(payload).in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('payrollIp.groups.service.notFound'));
}

export async function deletePayrollAdminFormGroups(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('payrollIp.groups.service.notFound'));
}
