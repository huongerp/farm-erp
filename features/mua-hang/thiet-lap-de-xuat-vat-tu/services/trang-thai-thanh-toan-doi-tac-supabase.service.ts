/**
 * Service trạng thái thanh toán đối tác – đọc/ghi Supabase (fp_mh_trang_thai_thanh_toan_doi_tac).
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { TrangThaiThanhToanDoiTac } from '../core/types';
import type { TrangThaiThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const TABLE = 'fp_mh_trang_thai_thanh_toan_doi_tac';

const ROW_COLUMNS = 'id,ma,ten,thu_tu,mau,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

interface DbRow {
  id: number;
  ma: string;
  ten: string;
  thu_tu: number;
  mau: string | null;
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

function rowToItem(row: DbRow): TrangThaiThanhToanDoiTac {
  return {
    id: String(row.id),
    ma: row.ma ?? '',
    ten: row.ten ?? '',
    thu_tu: Number(row.thu_tu),
    mau: row.mau ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getTrangThaiThanhToanDoiTacList(): Promise<TrangThaiThanhToanDoiTac[]> {
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

export async function createTrangThaiThanhToanDoiTac(
  data: TrangThaiThanhToanDoiTacFormValues
): Promise<TrangThaiThanhToanDoiTac> {
  const ma = data.ma.trim();
  const { data: existing } = await supabase.from(TABLE).select('id').eq('ma', ma).maybeSingle();
  if (existing) throw new Error(i18n.t('thietLapDeXuatVatTu.thanhToan.service.duplicateMa'));

  const payload = {
    ma,
    ten: data.ten.trim(),
    thu_tu: Number(data.thu_tu),
    mau: data.mau?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throw new Error(error.message);
  return rowToItem(inserted as DbRow);
}

export async function updateTrangThaiThanhToanDoiTac(
  id: string,
  data: TrangThaiThanhToanDoiTacFormValues
): Promise<TrangThaiThanhToanDoiTac> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thietLapDeXuatVatTu.thanhToan.service.notFound'));

  const ma = data.ma.trim();
  const { data: other } = await supabase.from(TABLE).select('id').eq('ma', ma).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('thietLapDeXuatVatTu.thanhToan.service.duplicateMa'));

  const payload = {
    ma,
    ten: data.ten.trim(),
    thu_tu: Number(data.thu_tu),
    mau: data.mau?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error } = await supabase.from(TABLE).update(payload).eq('id', idNum);
  if (error) throw new Error(error.message);

  const { data: row, error: fetchErr } = await supabase.from(TABLE).select(ROW_COLUMNS).eq('id', idNum).single();
  if (fetchErr || !row) throw new Error(i18n.t('thietLapDeXuatVatTu.thanhToan.service.notFound'));
  return rowToItem(row as DbRow);
}

export async function updateTrangThaiThanhToanDoiTacStatus(
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

export async function deleteTrangThaiThanhToanDoiTacList(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}
