import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { Branch } from '../core/types';
import type { BranchFormValues } from '../core/schema';
import type { TrangThai } from '../../../../lib/constants';
import { TRANG_THAI } from '../../../../lib/constants';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_var_chi_nhanh';

function rowToBranch(row: Record<string, unknown>): Branch {
  return {
    id: String(row.id),
    ma_chi_nhanh: (row.ma_chi_nhanh as string) ?? '',
    ten_chi_nhanh: (row.ten_chi_nhanh as string) ?? '',
    dia_chi: (row.dia_chi as string) ?? '',
    tinh_thanh: (row.tinh_thanh as string) ?? '',
    quan_huyen: (row.quan_huyen as string) ?? '',
    vi_do: row.vi_do != null ? Number(row.vi_do) : null,
    kinh_do: row.kinh_do != null ? Number(row.kinh_do) : null,
    duong_dan_map: (row.duong_dan_map as string) ?? null,
    trang_thai: (row.trang_thai as TrangThai) ?? TRANG_THAI.DANG_DUNG,
    tg_tao: (row.tg_tao as string) ?? new Date().toISOString(),
    tg_cap_nhat: (row.tg_cap_nhat as string) ?? new Date().toISOString(),
  };
}

export async function getBranches(): Promise<Branch[]> {
  const data = await fetchAllRows<Record<string, unknown>>((from, to) =>
    supabase.from(TABLE).select('*').order('ten_chi_nhanh', { ascending: true }).range(from, to)
  );
  return data.map(rowToBranch);
}

export async function createBranch(data: BranchFormValues): Promise<Branch> {
  const row = {
    ma_chi_nhanh: data.ma_chi_nhanh.trim().toUpperCase(),
    ten_chi_nhanh: data.ten_chi_nhanh.trim(),
    dia_chi: data.dia_chi.trim(),
    tinh_thanh: data.tinh_thanh.trim(),
    quan_huyen: data.quan_huyen.trim(),
    vi_do: data.vi_do != null ? Number(data.vi_do) : null,
    kinh_do: data.kinh_do != null ? Number(data.kinh_do) : null,
    duong_dan_map: data.duong_dan_map?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToBranch(inserted);
}

export async function updateBranch(id: string, data: BranchFormValues): Promise<Branch> {
  const row = {
    ma_chi_nhanh: data.ma_chi_nhanh.trim().toUpperCase(),
    ten_chi_nhanh: data.ten_chi_nhanh.trim(),
    dia_chi: data.dia_chi.trim(),
    tinh_thanh: data.tinh_thanh.trim(),
    quan_huyen: data.quan_huyen.trim(),
    vi_do: data.vi_do != null ? Number(data.vi_do) : null,
    kinh_do: data.kinh_do != null ? Number(data.kinh_do) : null,
    duong_dan_map: data.duong_dan_map?.trim() || null,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message ?? i18n.t('branch.service.notFound'));
  return rowToBranch(updated);
}

export async function updateBranchStatus(ids: string[], status: TrangThai): Promise<Branch | undefined> {
  if (ids.length === 0) return undefined;
  const updatePayload = { trang_thai: status, tg_cap_nhat: new Date().toISOString() };
  if (ids.length === 1) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updatePayload)
      .eq('id', ids[0])
      .select()
      .single();
    if (error) throw new Error(error.message ?? i18n.t('branch.service.notFound'));
    return data ? rowToBranch(data) : undefined;
  }
  const { error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .in('id', ids);
  if (error) throw new Error(error.message ?? i18n.t('branch.service.notFound'));
  return undefined;
}

export async function deleteBranches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', ids);
  if (error) throw new Error(error.message ?? i18n.t('branch.service.notFound'));
}
