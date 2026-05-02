import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { FarmDanhMuc } from '../core/types';
import type { FarmDanhMucFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_farm_danh_muc_hang_hoa';
const TABLE_HANG_HOA = 'fp_farm_danh_sach_hang_hoa';

async function assertNoHangHoaReferences(idNums: number[]): Promise<void> {
  if (idNums.length === 0) return;
  const { data: byDm, error: e1 } = await supabase.from(TABLE_HANG_HOA).select('id').in('danh_muc_id', idNums).limit(1);
  if (e1) throw new Error(e1.message);
  if (byDm && byDm.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasHangHoa'));
  const { data: byCha, error: e2 } = await supabase.from(TABLE_HANG_HOA).select('id').in('danh_muc_cha_id', idNums).limit(1);
  if (e2) throw new Error(e2.message);
  if (byCha && byCha.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasHangHoa'));
}

const DM_COLUMNS = 'id,ma_danh_muc,ten_danh_muc,danh_muc_cha_id,thu_tu,mo_ta,tg_tao,tg_cap_nhat';

interface FarmDanhMucRow {
  id: number;
  ma_danh_muc: string | null;
  ten_danh_muc: string | null;
  danh_muc_cha_id: number | null;
  thu_tu: number | null;
  mo_ta: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToFarmDanhMuc(row: FarmDanhMucRow): FarmDanhMuc {
  return {
    id: String(row.id),
    ma_danh_muc: row.ma_danh_muc ?? '',
    ten_danh_muc: row.ten_danh_muc ?? '',
    id_cha: row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    mo_ta: row.mo_ta ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAllFarmDanhMuc(): Promise<FarmDanhMuc[]> {
  const data = await fetchAllRows<FarmDanhMucRow>((from, to) =>
    supabase
      .from(TABLE)
      .select(DM_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('ma_danh_muc', { ascending: true })
      .range(from, to)
  );
  return data.map(rowToFarmDanhMuc);
}

export interface FarmDanhMucCap2WithParent {
  id: string;
  ten_danh_muc: string;
  id_cha: string | null;
  ten_danh_muc_cha: string;
}

export const getFarmDanhMucCap2WithParent = async (): Promise<FarmDanhMucCap2WithParent[]> => {
  const all = await getAllFarmDanhMuc();
  const byId: Record<string, string> = {};
  all.forEach((d) => {
    byId[d.id] = d.ten_danh_muc;
  });
  return all
    .filter((d) => d.id_cha != null && d.id_cha.trim() !== '')
    .map((d) => ({
      id: d.id,
      ten_danh_muc: d.ten_danh_muc,
      id_cha: d.id_cha,
      ten_danh_muc_cha: (d.id_cha && byId[d.id_cha]) ?? '',
    }));
};

export const getFarmDanhMucById = async (id: string): Promise<FarmDanhMuc | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase.from(TABLE).select(DM_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  return rowToFarmDanhMuc(row as FarmDanhMucRow);
};

export const createFarmDanhMuc = async (data: FarmDanhMucFormValues): Promise<FarmDanhMuc> => {
  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
  };
  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(DM_COLUMNS).single();
  if (error) throw new Error(error.message);
  return rowToFarmDanhMuc(inserted as FarmDanhMucRow);
};

export const updateFarmDanhMuc = async (id: string, data: FarmDanhMucFormValues): Promise<FarmDanhMuc> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select(DM_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  return rowToFarmDanhMuc(updated as FarmDanhMucRow);
};

export const deleteFarmDanhMuc = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  const { data: children, error: errSelect } = await supabase
    .from(TABLE)
    .select('id')
    .eq('danh_muc_cha_id', idNum)
    .limit(1);
  if (errSelect) throw new Error(errSelect.message);
  if (children && children.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasChildren'));
  await assertNoHangHoaReferences([idNum]);
  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
};

export const deleteFarmDanhMucMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { data: children } = await supabase
    .from(TABLE)
    .select('id, danh_muc_cha_id')
    .in('danh_muc_cha_id', idNums)
    .limit(1);
  if (children && children.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasChildren'));
  await assertNoHangHoaReferences(idNums);
  const { error } = await supabase.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
};
