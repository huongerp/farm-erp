import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { Department } from '../core/types';
import type { DepartmentFormValues } from '../core/schema';
import type { TrangThai } from '../../../../lib/constants';
import { TRANG_THAI } from '../../../../lib/constants';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_var_phong_ban';

/** Chuẩn hóa giá trị trạng thái từ DB (0/1 hoặc text) sang TrangThai text */
function normalizeTrangThai(value: unknown): TrangThai {
  if (value === 1 || value === '1') return TRANG_THAI.DANG_DUNG;
  if (value === 0 || value === '0') return TRANG_THAI.NGUNG;
  if (value === TRANG_THAI.DANG_DUNG || value === TRANG_THAI.NGUNG) return value as TrangThai;
  return TRANG_THAI.DANG_DUNG;
}

function rowToDepartment(row: Record<string, unknown>): Department {
  return {
    id: String(row.id),
    ten_phong_ban: (row.ten_phong_ban as string) ?? '',
    chuc_nang: (row.chuc_nang as string) ?? null,
    tt: Number(row.tt) ?? 0,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: (row.tg_tao as string) ?? new Date().toISOString(),
    tg_cap_nhat: (row.tg_cap_nhat as string) ?? null,
  };
}

export const getDepartments = async (): Promise<Department[]> => {
  const data = await fetchAllRows<Record<string, unknown>>((from, to) =>
    supabase.from(TABLE).select('*').order('tt', { ascending: true }).range(from, to)
  );
  return data.map(rowToDepartment);
};

export const createDepartment = async (data: DepartmentFormValues): Promise<Department> => {
  const row = {
    ten_phong_ban: data.ten_phong_ban.trim(),
    chuc_nang: data.chuc_nang?.trim() || null,
    tt: data.tt ?? 0,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToDepartment(inserted);
};

export const updateDepartment = async (id: string, data: DepartmentFormValues): Promise<Department> => {
  const row = {
    ten_phong_ban: data.ten_phong_ban.trim(),
    chuc_nang: data.chuc_nang?.trim() || null,
    tt: data.tt ?? 0,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message ?? i18n.t('department.service.notFound'));
  return rowToDepartment(updated);
};

export const updateDepartmentStatus = async (id: string, status: TrangThai): Promise<Department> => {
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message ?? i18n.t('department.service.notFound'));
  return rowToDepartment(updated);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const importDepartments = async (
  rows: DepartmentFormValues[]
): Promise<{ created: number; errors: string[] }> => {
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      await createDepartment(rows[i]);
      created++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi';
      errors.push(`Dòng ${i + 2}: ${msg}`);
    }
  }
  return { created, errors };
};
