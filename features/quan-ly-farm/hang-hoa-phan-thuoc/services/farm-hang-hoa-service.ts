import { db, fetchAllRows } from '../../../../lib/db';
import type { FarmHangHoa } from '../core/types';
import type { FarmHangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getAllFarmDanhMuc } from './farm-danh-muc-service';

const TABLE = 'fp_farm_danh_sach_hang_hoa';

const HANG_HOA_COLUMNS =
  'id,danh_muc_id,danh_muc_cha_id,ma_hang_hoa,ten_hang_hoa,dvt,don_gia,mo_ta,tg_tao,tg_cap_nhat';

interface FarmHangHoaRow {
  id: number;
  danh_muc_id: number | null;
  danh_muc_cha_id: number | null;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  don_gia: string | number | null;
  mo_ta: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToFarmHangHoa(row: FarmHangHoaRow, tenDanhMuc?: string): FarmHangHoa {
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
    don_gia: Number.isNaN(donGia) ? null : donGia,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    ten_danh_muc: tenDanhMuc,
    ma_hang: ma,
    ten_hang: ten,
    don_vi_tinh: unit,
    mo_ta: row.mo_ta ?? null,
  };
}

function buildTenDanhMuc(
  danhMucList: { id: string; ten_danh_muc: string; id_cha: string | null }[],
  danh_muc_id: string | null,
  danh_muc_cha_id: string | null,
): string | undefined {
  if (!danh_muc_id) return undefined;
  const cap2 = danhMucList.find((d) => d.id === danh_muc_id);
  const cap1 = danh_muc_cha_id ? danhMucList.find((d) => d.id === danh_muc_cha_id) : null;
  if (!cap2) return undefined;
  if (cap1) return `${cap1.ten_danh_muc} / ${cap2.ten_danh_muc}`;
  return cap2.ten_danh_muc;
}

async function enrichWithTenDanhMuc(rows: FarmHangHoaRow[]): Promise<FarmHangHoa[]> {
  let dmList: Awaited<ReturnType<typeof getAllFarmDanhMuc>> = [];
  try {
    dmList = await getAllFarmDanhMuc();
  } catch (e) {
    console.warn('[farm-hang-hoa-service] Không tải được danh mục farm:', e);
  }
  return rows.map((row) => {
    const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
    const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
    const ten_danh_muc = buildTenDanhMuc(dmList, danh_muc_id, danh_muc_cha_id);
    return rowToFarmHangHoa(row, ten_danh_muc);
  });
}

export const getAllFarmHangHoa = async (): Promise<FarmHangHoa[]> => {
  const rows = await fetchAllRows<FarmHangHoaRow>((from, to) =>
    db
      .from(TABLE)
      .select(HANG_HOA_COLUMNS)
      .order('ma_hang_hoa', { ascending: true })
      .range(from, to)
  );
  return enrichWithTenDanhMuc(rows);
};

export const getFarmHangHoaById = async (id: string): Promise<FarmHangHoa | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db.from(TABLE).select(HANG_HOA_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const [enriched] = await enrichWithTenDanhMuc([row as FarmHangHoaRow]);
  return enriched;
};

export const createFarmHangHoa = async (data: FarmHangHoaFormValues): Promise<FarmHangHoa> => {
  const dmList = await getAllFarmDanhMuc();
  const cap2 =
    data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: existing } = await db
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .limit(1);
  if (existing && existing.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.hangHoa.service.duplicateCode'));

  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    mo_ta: data.mo_ta?.trim() || null,
  };

  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(HANG_HOA_COLUMNS).single();
  if (error) throw new Error(error.message);
  const [enriched] = await enrichWithTenDanhMuc([inserted as FarmHangHoaRow]);
  return enriched;
};

export const updateFarmHangHoa = async (id: string, data: FarmHangHoaFormValues): Promise<FarmHangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.hangHoa.service.notFound'));

  const dmList = await getAllFarmDanhMuc();
  const cap2 =
    data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: duplicate } = await db
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .neq('id', idNum)
    .limit(1);
  if (duplicate && duplicate.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.hangHoa.service.duplicateCode'));

  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    mo_ta: data.mo_ta?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await db
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select(HANG_HOA_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.hangHoa.service.notFound'));
  const [enriched] = await enrichWithTenDanhMuc([updated as FarmHangHoaRow]);
  return enriched;
};

export const deleteFarmHangHoa = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.hangHoa.service.notFound'));
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.hangHoa.service.notFound'));
};

export const deleteFarmHangHoaMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.hangHoa.service.notFound'));
};
