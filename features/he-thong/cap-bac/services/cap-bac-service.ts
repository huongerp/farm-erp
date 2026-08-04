import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { JobLevel } from '../core/types';
import type { JobLevelFormValues } from '../core/schema';
import { TRANG_THAI, TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';

const TABLE = 'fp_var_cap_bac';

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  const s = val != null ? String(val).trim() : '';
  if (s === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG || s === TRANG_THAI.NGUNG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToJobLevel(row: Record<string, unknown>): JobLevel {
  return {
    id: String(row.id),
    ten_cap_bac: ((row.ten_cap_bac as string) ?? '').trim(),
    cap_bac: row.cap_bac != null ? Number(row.cap_bac) : 0,
    mo_ta: (row.mo_ta as string)?.trim() ?? null,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ? new Date(row.tg_tao as string).toISOString() : '',
    tg_cap_nhat: row.tg_cap_nhat ? new Date(row.tg_cap_nhat as string).toISOString() : '',
  };
}

export const getJobLevels = async (): Promise<JobLevel[]> => {
  const data = await fetchAllRows<Record<string, unknown>>((from, to) =>
    supabase
      .from(TABLE)
      .select('id, ten_cap_bac, cap_bac, mo_ta, trang_thai, tg_tao, tg_cap_nhat')
      .order('cap_bac', { ascending: true, nullsFirst: false })
      .range(from, to)
  );
  return data.map(rowToJobLevel);
};

export const createJobLevel = async (data: JobLevelFormValues): Promise<JobLevel> => {
  const payload = {
    ten_cap_bac: data.ten_cap_bac?.trim() || null,
    cap_bac: data.cap_bac != null ? Number(data.cap_bac) : null,
    mo_ta: data.mo_ta?.trim() || null,
    trang_thai: data.trang_thai,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select('id, ten_cap_bac, cap_bac, mo_ta, trang_thai, tg_tao, tg_cap_nhat')
    .single();

  if (error) throw new Error(error.message);
  return rowToJobLevel(inserted);
};

export const updateJobLevel = async (id: string, data: JobLevelFormValues): Promise<JobLevel> => {
  const payload = {
    ten_cap_bac: data.ten_cap_bac?.trim() || null,
    cap_bac: data.cap_bac != null ? Number(data.cap_bac) : null,
    mo_ta: data.mo_ta?.trim() || null,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('id, ten_cap_bac, cap_bac, mo_ta, trang_thai, tg_tao, tg_cap_nhat')
    .single();

  if (error) throw new Error(error.message);
  return rowToJobLevel(updated);
};

export const updateJobLevelStatus = async (ids: string[], status: TrangThaiHoatDong): Promise<JobLevel | undefined> => {
  if (ids.length === 1) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
      .eq('id', ids[0])
      .select('id, ten_cap_bac, cap_bac, mo_ta, trang_thai, tg_tao, tg_cap_nhat')
      .single();

    if (error) throw new Error(error.message);
    return data ? rowToJobLevel(data) : undefined;
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .in('id', ids);

  if (error) throw new Error(error.message);
  return undefined;
};

export const deleteJobLevels = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .in('id', ids);

  if (error) throw new Error(error.message);
};
