import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { DanhMucHangHoa } from '../core/types';
import type { DanhMucHangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const TABLE = 'fp_mh_danh_muc_hang_hoa';

/** Row từ Supabase fp_mh_danh_muc_hang_hoa */
interface DanhMucHangHoaRow {
  id: number;
  ma_danh_muc: string | null;
  ten_danh_muc: string | null;
  danh_muc_cha_id: number | null;
  thu_tu: number | null;
  mo_ta: string | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToDanhMuc(row: DanhMucHangHoaRow): DanhMucHangHoa {
  return {
    id: String(row.id),
    ma_danh_muc: row.ma_danh_muc ?? '',
    ten_danh_muc: row.ten_danh_muc ?? '',
    id_cha: row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    mo_ta: row.mo_ta ?? undefined,
    trang_thai: (row.trang_thai as DanhMucHangHoa['trang_thai']) ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export const getAllDanhMucHangHoa = async (): Promise<DanhMucHangHoa[]> => {
  const data = await fetchAllRows<DanhMucHangHoaRow>((from, to) =>
    supabase
      .from(TABLE)
      .select('*')
      .order('thu_tu', { ascending: true })
      .order('ma_danh_muc', { ascending: true })
      .range(from, to)
  );
  return data.map(rowToDanhMuc);
};

/** Danh mục cấp 2 (có danh_muc_cha_id), kèm tên danh mục cha để hiển thị "Cấp 1 / Cấp 2". */
export interface DanhMucCap2WithParent {
  id: string;
  ten_danh_muc: string;
  id_cha: string | null;
  ten_danh_muc_cha: string;
}

/** Chỉ lấy các danh mục cấp 2 (dùng cho form Danh sách hàng hóa – chọn danh mục cấp 2, tự suy ra cấp 1). */
export const getDanhMucCap2WithParent = async (): Promise<DanhMucCap2WithParent[]> => {
  const all = await getAllDanhMucHangHoa();
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

export const getDanhMucHangHoaById = async (id: string): Promise<DanhMucHangHoa | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  return rowToDanhMuc(row as DanhMucHangHoaRow);
};

export const createDanhMucHangHoa = async (
  data: DanhMucHangHoaFormValues
): Promise<DanhMucHangHoa> => {
  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return rowToDanhMuc(inserted as DanhMucHangHoaRow);
};

export const updateDanhMucHangHoa = async (
  id: string,
  data: DanhMucHangHoaFormValues
): Promise<DanhMucHangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('danhMucHangHoa.service.notFound'));

  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('danhMucHangHoa.service.notFound'));
  return rowToDanhMuc(updated as DanhMucHangHoaRow);
};

export const deleteDanhMucHangHoa = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('danhMucHangHoa.service.notFound'));

  const { data: children, error: errSelect } = await supabase
    .from(TABLE)
    .select('id')
    .eq('danh_muc_cha_id', idNum)
    .limit(1);
  if (errSelect) throw new Error(errSelect.message);
  if (children && children.length > 0) throw new Error(i18n.t('danhMucHangHoa.service.hasChildren'));

  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('danhMucHangHoa.service.notFound'));
};

export const deleteDanhMucHangHoaMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;

  const { data: children } = await supabase
    .from(TABLE)
    .select('id, danh_muc_cha_id')
    .in('danh_muc_cha_id', idNums)
    .limit(1);
  if (children && children.length > 0) throw new Error(i18n.t('danhMucHangHoa.service.hasChildren'));

  const { error } = await supabase.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('danhMucHangHoa.service.notFound'));
};
