/**
 * Service nhóm điểm cộng trừ – đọc/ghi Supabase (fp_hr_thiet_lap_diem_cong_tru).
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { PayrollPointGroup } from '../core/types';
import type { PayrollPointGroupFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const TABLE = 'fp_hr_thiet_lap_diem_cong_tru';

const ROW_COLUMNS = 'id,ma,ten,loai,thu_tu,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

interface DbRow {
  id: number;
  ma: string;
  ten: string;
  loai: string;
  thu_tu: number;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function normalizeTrangThai(val: string | null): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToItem(row: DbRow): PayrollPointGroup {
  return {
    id: String(row.id),
    ma: row.ma ?? '',
    ten: row.ten ?? '',
    loai: row.loai === 'tru' ? 'tru' : 'cong',
    thu_tu: Number(row.thu_tu),
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getPayrollPointGroups(): Promise<PayrollPointGroup[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    supabase
      .from(TABLE)
      .select(ROW_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(rowToItem);
}

export async function createPayrollPointGroup(
  data: PayrollPointGroupFormValues
): Promise<PayrollPointGroup> {
  const ma = data.ma.trim();
  const { data: existing } = await supabase.from(TABLE).select('id').eq('ma', ma).maybeSingle();
  if (existing) throw new Error(i18n.t('payrollIp.pointGroups.service.duplicateMa'));

  const payload = {
    ma,
    ten: data.ten.trim(),
    loai: data.loai === 'tru' ? 'tru' : 'cong',
    thu_tu: Number(data.thu_tu),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throw new Error(error.message);
  return rowToItem(inserted as DbRow);
}

export async function updatePayrollPointGroup(
  id: string,
  data: PayrollPointGroupFormValues
): Promise<PayrollPointGroup> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('payrollIp.pointGroups.service.notFound'));

  const ma = data.ma.trim();
  const { data: other } = await supabase.from(TABLE).select('id').eq('ma', ma).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('payrollIp.pointGroups.service.duplicateMa'));

  const payload = {
    ma,
    ten: data.ten.trim(),
    loai: data.loai === 'tru' ? 'tru' : 'cong',
    thu_tu: Number(data.thu_tu),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error } = await supabase.from(TABLE).update(payload).eq('id', idNum);
  if (error) throw new Error(error.message);

  const { data: row, error: fetchErr } = await supabase.from(TABLE).select(ROW_COLUMNS).eq('id', idNum).single();
  if (fetchErr || !row) throw new Error(i18n.t('payrollIp.pointGroups.service.notFound'));
  return rowToItem(row as DbRow);
}

export async function updatePayrollPointGroupStatus(
  ids: string[],
  status: import('../../../../lib/constants').TrangThaiHoatDong
): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status })
    .in('id', numIds);
  if (error) throw new Error(error.message);
}

export async function deletePayrollPointGroups(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}
