import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { HangHoa } from '../core/types';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { getAllDanhMucHangHoa } from '../../danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';

const TABLE = 'fp_mh_danh_sach_hang_hoa';

/** Row từ Supabase fp_mh_danh_sach_hang_hoa */
interface HangHoaRow {
  id: number;
  danh_muc_id: number | null;
  danh_muc_cha_id: number | null;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  thu_tu: number | null;
  trang_thai: string | null;
  don_gia: string | number | null;
  mo_ta: string | null;
  hinh_anh: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToHangHoa(row: HangHoaRow, tenDanhMuc?: string): HangHoa {
  const donGia = row.don_gia != null ? Number(row.don_gia) : null;
  const ma = row.ma_hang_hoa ?? '';
  const ten = row.ten_hang_hoa ?? '';
  const unit = row.dvt ?? null;
  return {
    id: String(row.id),
    danh_muc_id: row.danh_muc_id != null ? String(row.danh_muc_id) : null,
    danh_muc_cha_id: row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null,
    ma_hang_hoa: ma,
    ten_hang_hoa: ten,
    dvt: unit,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    trang_thai: (row.trang_thai as HangHoa['trang_thai']) ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    don_gia: Number.isNaN(donGia) ? null : donGia,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    ten_danh_muc: tenDanhMuc,
    ma_hang: ma,
    ten_hang: ten,
    don_vi_tinh: unit,
    mo_ta: row.mo_ta ?? null,
    hinh_anh: row.hinh_anh ?? null,
  };
}

function buildTenDanhMuc(danhMucList: { id: string; ten_danh_muc: string; id_cha: string | null }[], danh_muc_id: string | null, danh_muc_cha_id: string | null): string | undefined {
  if (!danh_muc_id) return undefined;
  const cap2 = danhMucList.find((d) => d.id === danh_muc_id);
  const cap1 = danh_muc_cha_id ? danhMucList.find((d) => d.id === danh_muc_cha_id) : null;
  if (!cap2) return undefined;
  if (cap1) return `${cap1.ten_danh_muc} / ${cap2.ten_danh_muc}`;
  return cap2.ten_danh_muc;
}

async function enrichWithTenDanhMuc(rows: HangHoaRow[]): Promise<HangHoa[]> {
  const dmList = await getAllDanhMucHangHoa();
  return rows.map((row) => {
    const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
    const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
    const ten_danh_muc = buildTenDanhMuc(dmList, danh_muc_id, danh_muc_cha_id);
    return rowToHangHoa(row, ten_danh_muc);
  });
}

export const getAllHangHoa = async (): Promise<HangHoa[]> => {
  const rows = await fetchAllRows<HangHoaRow>((from, to) =>
    supabase
      .from(TABLE)
      .select('*')
      .order('thu_tu', { ascending: true })
      .order('ma_hang_hoa', { ascending: true })
      .range(from, to)
  );
  return enrichWithTenDanhMuc(rows);
};

export const getHangHoaById = async (id: string): Promise<HangHoa | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const [enriched] = await enrichWithTenDanhMuc([row as HangHoaRow]);
  return enriched;
};

/** Thứ tự mới khi tạo: max(thu_tu) + 1, tối thiểu 1. */
export const getNextThuTu = async (): Promise<number> => {
  const { data, error } = await supabase.from(TABLE).select('thu_tu').order('thu_tu', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  const max = data?.thu_tu != null ? Number(data.thu_tu) : 0;
  return Math.max(1, max + 1);
};

export const createHangHoa = async (data: HangHoaFormValues): Promise<HangHoa> => {
  const dmList = await getAllDanhMucHangHoa();
  const cap2 = data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .limit(1);
  if (existing && existing.length > 0) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const nextThuTu = await getNextThuTu();
  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    thu_tu: data.thu_tu != null ? Math.max(1, data.thu_tu) : nextThuTu,
    trang_thai: data.trang_thai,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    mo_ta: data.mo_ta?.trim() || null,
    hinh_anh: data.hinh_anh?.trim() || null,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  const [enriched] = await enrichWithTenDanhMuc([inserted as HangHoaRow]);
  return enriched;
};

export const updateHangHoa = async (id: string, data: HangHoaFormValues): Promise<HangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));

  const dmList = await getAllDanhMucHangHoa();
  const cap2 = data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: duplicate } = await supabase
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .neq('id', idNum)
    .limit(1);
  if (duplicate && duplicate.length > 0) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    mo_ta: data.mo_ta?.trim() || null,
    hinh_anh: data.hinh_anh?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
  const [enriched] = await enrichWithTenDanhMuc([updated as HangHoaRow]);
  return enriched;
};

export const updateHangHoaStatus = async (id: string, status: HangHoa['trang_thai']): Promise<HangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
  const [enriched] = await enrichWithTenDanhMuc([updated as HangHoaRow]);
  return enriched;
};

export const deleteHangHoa = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));
  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
};

export const deleteHangHoaMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
};
