import { supabase, fetchAllRows } from '../../../../lib/supabase';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import type { Kho } from '../core/types';
import type { KhoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const TABLE = 'fp_mh_danh_sach_kho';

/** Row từ Supabase fp_mh_danh_sach_kho */
interface KhoRow {
  id: number;
  chi_nhanh_id: number | null;
  ma_kho: string | null;
  ten_kho: string | null;
  dia_chi: string | null;
  mo_ta: string | null;
  thu_tu: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToKho(row: KhoRow, tenChiNhanh?: string): Kho {
  return {
    id: String(row.id),
    ma_kho: row.ma_kho ?? '',
    ten_kho: row.ten_kho ?? '',
    dia_chi: row.dia_chi ?? undefined,
    mo_ta: row.mo_ta ?? undefined,
    id_chi_nhanh: row.chi_nhanh_id != null ? String(row.chi_nhanh_id) : null,
    ten_chi_nhanh: tenChiNhanh,
    trang_thai: (row.trang_thai as Kho['trang_thai']) ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

/** Lấy danh sách kho từ Supabase và enrich ten_chi_nhanh từ module chi nhánh */
export const getKhoList = async (): Promise<Kho[]> => {
  const [rows, branches] = await Promise.all([
    fetchAllRows<KhoRow>((from, to) =>
      supabase
        .from(TABLE)
        .select('*')
        .order('thu_tu', { ascending: true })
        .order('ma_kho', { ascending: true })
        .range(from, to)
    ),
    getBranches(),
  ]);
  const branchMap: Record<string, string> = {};
  branches.forEach((b) => {
    branchMap[b.id] = b.ten_chi_nhanh;
  });
  return rows.map((row) => {
    const tenChiNhanh = row.chi_nhanh_id != null ? branchMap[String(row.chi_nhanh_id)] : undefined;
    return rowToKho(row, tenChiNhanh);
  });
};

export const getKhoById = async (id: string): Promise<Kho | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const branches = await getBranches();
  const tenChiNhanh =
    row.chi_nhanh_id != null
      ? branches.find((b) => b.id === String(row.chi_nhanh_id))?.ten_chi_nhanh
      : undefined;
  return rowToKho(row as KhoRow, tenChiNhanh);
};

export const createKho = async (data: KhoFormValues): Promise<Kho> => {
  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('ma_kho', data.ma_kho.trim().toUpperCase())
    .limit(1);
  if (existing && existing.length > 0) throw new Error(i18n.t('kho.service.duplicateCode'));

  const payload = {
    chi_nhanh_id: data.id_chi_nhanh && data.id_chi_nhanh.trim() ? Number(data.id_chi_nhanh) : null,
    ma_kho: data.ma_kho.trim().toUpperCase(),
    ten_kho: data.ten_kho.trim(),
    dia_chi: data.dia_chi?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  const branches = await getBranches();
  const tenChiNhanh =
    inserted.chi_nhanh_id != null
      ? branches.find((b) => b.id === String(inserted.chi_nhanh_id))?.ten_chi_nhanh
      : undefined;
  return rowToKho(inserted as KhoRow, tenChiNhanh);
};

export const updateKho = async (id: string, data: KhoFormValues): Promise<Kho> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kho.service.notFound'));

  const { data: duplicate } = await supabase
    .from(TABLE)
    .select('id')
    .eq('ma_kho', data.ma_kho.trim().toUpperCase())
    .neq('id', idNum)
    .limit(1);
  if (duplicate && duplicate.length > 0) throw new Error(i18n.t('kho.service.duplicateCode'));

  const payload = {
    chi_nhanh_id: data.id_chi_nhanh && data.id_chi_nhanh.trim() ? Number(data.id_chi_nhanh) : null,
    ma_kho: data.ma_kho.trim().toUpperCase(),
    ten_kho: data.ten_kho.trim(),
    dia_chi: data.dia_chi?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('kho.service.notFound'));
  const branches = await getBranches();
  const tenChiNhanh =
    updated.chi_nhanh_id != null
      ? branches.find((b) => b.id === String(updated.chi_nhanh_id))?.ten_chi_nhanh
      : undefined;
  return rowToKho(updated as KhoRow, tenChiNhanh);
};

export const updateKhoStatus = async (id: string, status: Kho['trang_thai']): Promise<Kho> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kho.service.notFound'));
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('kho.service.notFound'));
  const branches = await getBranches();
  const tenChiNhanh =
    updated.chi_nhanh_id != null
      ? branches.find((b) => b.id === String(updated.chi_nhanh_id))?.ten_chi_nhanh
      : undefined;
  return rowToKho(updated as KhoRow, tenChiNhanh);
};

export const deleteKho = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kho.service.notFound'));
  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('kho.service.notFound'));
};

export const deleteKhoMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('kho.service.notFound'));
};

export const importKho = async (
  rows: (KhoFormValues & { ma_kho?: string; ten_kho?: string; id_chi_nhanh?: string | null })[]
): Promise<{ created: number; errors: string[] }> => {
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const idChiNhanh = row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== ''
        ? String(row.id_chi_nhanh).trim()
        : null;
      if (!idChiNhanh) {
        errors.push(`Dòng ${i + 2}: ${i18n.t('kho.validation.branchRequired')}`);
        continue;
      }
      const data: KhoFormValues = {
        ma_kho: String(row.ma_kho ?? '').trim().toUpperCase(),
        ten_kho: String(row.ten_kho ?? '').trim(),
        dia_chi: row.dia_chi != null ? String(row.dia_chi).trim() : undefined,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        id_chi_nhanh: idChiNhanh,
        trang_thai:
          String(row.trang_thai).trim() === 'Ngừng hoạt động'
            ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
            : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
        thu_tu: Math.max(1, Number(row.thu_tu) || 1),
      };
      if (!data.ma_kho || !data.ten_kho) {
        errors.push(`Dòng ${i + 2}: ${i18n.t('kho.validation.codeMin')}`);
        continue;
      }
      await createKho(data);
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : 'Lỗi'}`);
    }
  }
  return { created, errors };
};
