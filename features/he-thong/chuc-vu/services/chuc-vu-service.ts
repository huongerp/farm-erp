import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { Position } from '../core/types';
import type { PositionFormValues } from '../core/schema';
import { TRANG_THAI, TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';
import { getJobLevels } from '../../cap-bac/services/cap-bac-service';
import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_var_chuc_vu';

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  const s = val != null ? String(val).trim() : '';
  if (s === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG || s === TRANG_THAI.NGUNG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToPosition(
  row: Record<string, unknown>,
  deptMap: Map<string, string>,
  levelMap: Map<string, string>,
  capBacNumberMap: Map<string, number>
): Position {
  const phongBanId = row.phong_ban_id != null ? String(row.phong_ban_id) : null;
  const capBacId = row.cap_bac_id != null ? String(row.cap_bac_id) : null;
  return {
    id: String(row.id),
    ten_chuc_vu: ((row.ten_chuc_vu as string) ?? '').trim(),
    phong_ban_id: phongBanId,
    cap_bac_id: capBacId,
    ten_phong_ban: phongBanId ? deptMap.get(phongBanId) : undefined,
    ten_cap_bac: capBacId ? levelMap.get(capBacId) : undefined,
    cap_bac: capBacId ? capBacNumberMap.get(capBacId) : undefined,
    mo_ta: (row.mo_ta as string)?.trim() ?? null,
    tt: row.tt != null ? Number(row.tt) : 0,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ? new Date(row.tg_tao as string).toISOString() : '',
    tg_cap_nhat: row.tg_cap_nhat ? new Date(row.tg_cap_nhat as string).toISOString() : '',
  };
}

async function buildLookupMaps() {
  const [departments, jobLevels] = await Promise.all([getDepartments(), getJobLevels()]);
  return {
    deptMap: new Map(departments.map((d) => [d.id, d.ten_phong_ban])),
    levelMap: new Map(jobLevels.map((l) => [l.id, l.ten_cap_bac])),
    capBacNumberMap: new Map(jobLevels.map((l) => [l.id, l.cap_bac])),
  };
}

export const getPositions = async (): Promise<Position[]> => {
  const data = await fetchAllRows<Record<string, unknown>>((from, to) =>
    supabase
      .from(TABLE)
      .select('id, ten_chuc_vu, phong_ban_id, cap_bac_id, mo_ta, tt, trang_thai, tg_tao, tg_cap_nhat')
      .order('tt', { ascending: true, nullsFirst: false })
      .order('ten_chuc_vu', { ascending: true })
      .range(from, to)
  );
  const { deptMap, levelMap, capBacNumberMap } = await buildLookupMaps();
  return data.map((row) => rowToPosition(row, deptMap, levelMap, capBacNumberMap));
};

export const createPosition = async (data: PositionFormValues): Promise<Position> => {
  const row = {
    ten_chuc_vu: data.ten_chuc_vu.trim(),
    phong_ban_id: data.phong_ban_id || null,
    cap_bac_id: data.cap_bac_id || null,
    mo_ta: data.mo_ta?.trim() || null,
    tt: data.tt ?? 0,
    trang_thai: data.trang_thai,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('id, ten_chuc_vu, phong_ban_id, cap_bac_id, mo_ta, tt, trang_thai, tg_tao, tg_cap_nhat')
    .single();

  if (error) throw new Error(error.message);
  const { deptMap, levelMap, capBacNumberMap } = await buildLookupMaps();
  return rowToPosition(inserted, deptMap, levelMap, capBacNumberMap);
};

export const updatePosition = async (id: string, data: PositionFormValues): Promise<Position> => {
  const row = {
    ten_chuc_vu: data.ten_chuc_vu.trim(),
    phong_ban_id: data.phong_ban_id || null,
    cap_bac_id: data.cap_bac_id || null,
    mo_ta: data.mo_ta?.trim() || null,
    tt: data.tt ?? 0,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('id, ten_chuc_vu, phong_ban_id, cap_bac_id, mo_ta, tt, trang_thai, tg_tao, tg_cap_nhat')
    .single();

  if (error) throw new Error(error.message ?? i18n.t('position.service.notFound'));
  const { deptMap, levelMap, capBacNumberMap } = await buildLookupMaps();
  return rowToPosition(updated, deptMap, levelMap, capBacNumberMap);
};

export const updatePositionStatus = async (
  ids: string[],
  status: TrangThaiHoatDong
): Promise<Position | undefined> => {
  if (ids.length === 1) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
      .eq('id', ids[0])
      .select('id, ten_chuc_vu, phong_ban_id, cap_bac_id, mo_ta, tt, trang_thai, tg_tao, tg_cap_nhat')
      .single();

    if (error) throw new Error(error.message);
    if (!data) return undefined;
    const { deptMap, levelMap, capBacNumberMap } = await buildLookupMaps();
    return rowToPosition(data, deptMap, levelMap, capBacNumberMap);
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .in('id', ids);

  if (error) throw new Error(error.message);
  return undefined;
};

export const deletePositions = async (ids: string[]): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().in('id', ids);
  if (error) throw new Error(error.message);
};
