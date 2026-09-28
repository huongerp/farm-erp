/**
 * Service IP wifi chấm công — đọc/ghi PostgREST (fp_hr_ip_wifi_cham_cong).
 * Bảng tạo ở docs/vps-12-fp_hr_ip_wifi_cham_cong.sql. Trước đây là dữ liệu giả trong bộ nhớ.
 */
import { db, fetchAllRows, throwSupabaseError } from '../../../../lib/db';
import { bulkInsert } from '../../../../lib/import-bulk';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';
import type { PayrollWifiIp } from '../core/types';
import type { PayrollWifiIpFormValues } from '../core/schema';

const TABLE = 'fp_hr_ip_wifi_cham_cong';
const ROW_COLUMNS = 'id,id_chi_nhanh,ten_chi_nhanh,ip_wifi,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';
/** Postgres unique_violation — ràng buộc (id_chi_nhanh, ip_wifi). */
const UNIQUE_VIOLATION = '23505';

interface DbRow {
  id: number;
  id_chi_nhanh: number;
  ten_chi_nhanh: string | null;
  ip_wifi: string;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  return val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToItem(row: DbRow): PayrollWifiIp {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.ten_chi_nhanh ?? undefined,
    ip_wifi: row.ip_wifi,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  };
}

async function tenChiNhanh(idChiNhanh: string): Promise<string | null> {
  const branches = await getBranches();
  return branches.find((b) => String(b.id) === String(idChiNhanh))?.ten_chi_nhanh ?? null;
}

function toPayload(data: PayrollWifiIpFormValues, ten: string | null) {
  return {
    id_chi_nhanh: Number(data.id_chi_nhanh),
    ten_chi_nhanh: ten,
    ip_wifi: data.ip_wifi.trim(),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: normalizeTrangThai(data.trang_thai),
  };
}

/** IP trùng trong cùng chi nhánh → thông điệp dễ hiểu thay cho lỗi ràng buộc thô. */
function throwWriteError(error: { code?: string }): never {
  if (error.code === UNIQUE_VIOLATION) throw new Error(i18n.t('payrollIp.importErrors.duplicateIp'));
  throwSupabaseError(error);
}

export const getPayrollWifiIps = async (): Promise<PayrollWifiIp[]> => {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    db.from(TABLE).select(ROW_COLUMNS).order('tg_tao', { ascending: false }).range(from, to)
  );
  return rows.map(rowToItem);
};

export const createPayrollWifiIp = async (data: PayrollWifiIpFormValues): Promise<PayrollWifiIp> => {
  const { data: inserted, error } = await db
    .from(TABLE)
    .insert(toPayload(data, await tenChiNhanh(data.id_chi_nhanh)))
    .select(ROW_COLUMNS)
    .single();
  if (error) throwWriteError(error);
  return rowToItem(inserted as DbRow);
};

export const updatePayrollWifiIp = async (id: string, data: PayrollWifiIpFormValues): Promise<PayrollWifiIp> => {
  const { data: updated, error } = await db
    .from(TABLE)
    .update(toPayload(data, await tenChiNhanh(data.id_chi_nhanh)))
    .eq('id', Number(id))
    .select(ROW_COLUMNS)
    .maybeSingle();
  if (error) throwWriteError(error);
  if (!updated) throw new Error(i18n.t('payrollIp.service.notFound'));
  return rowToItem(updated as DbRow);
};

export const updatePayrollWifiIpStatus = async (ids: string[], status: TrangThaiHoatDong): Promise<void> => {
  const numIds = ids.map(Number).filter(Number.isFinite);
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).update({ trang_thai: status }).in('id', numIds);
  if (error) throwSupabaseError(error);
};

export const deletePayrollWifiIps = async (ids: string[]): Promise<void> => {
  const numIds = ids.map(Number).filter(Number.isFinite);
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
};

/**
 * Import các dòng đã validate ở `planIpWifiImport`. IP đã có trong chi nhánh bị loại trước
 * (một SELECT), phần còn lại ghi theo lô; lỗi gắn lại đúng dòng Excel.
 */
export const importPayrollWifiIps = async (
  items: { row: number; values: Record<string, unknown>; data: PayrollWifiIpFormValues }[]
): Promise<{ created: number; errors: ImportErrorRow[] }> => {
  const errors: ImportErrorRow[] = [];
  const [branches, existing] = await Promise.all([
    getBranches(),
    fetchAllRows<{ id_chi_nhanh: number; ip_wifi: string }>((from, to) =>
      db.from(TABLE).select('id_chi_nhanh,ip_wifi').range(from, to)
    ),
  ]);
  const tenById = new Map(branches.map((b) => [String(b.id), b.ten_chi_nhanh]));
  const existingKeys = new Set(existing.map((e) => `${e.id_chi_nhanh}|${e.ip_wifi}`));

  const toWrite = items.flatMap((item) => {
    const fail = (msg: string) => errors.push({ row: item.row, msg, values: item.values });
    if (!tenById.has(String(item.data.id_chi_nhanh))) {
      fail(i18n.t('payrollIp.importErrors.branchNotFound'));
      return [];
    }
    const payload = toPayload(item.data, tenById.get(String(item.data.id_chi_nhanh)) ?? null);
    if (existingKeys.has(`${payload.id_chi_nhanh}|${payload.ip_wifi}`)) {
      fail(i18n.t('payrollIp.importErrors.duplicateIp'));
      return [];
    }
    return [{ ...item, payload }];
  });

  const outcome = await bulkInsert(TABLE, toWrite);
  outcome.failed.forEach((f) => errors.push({ row: f.item.row, msg: f.msg, values: f.item.values }));
  errors.sort((a, b) => a.row - b.row);
  return { created: outcome.done.length, errors };
};
