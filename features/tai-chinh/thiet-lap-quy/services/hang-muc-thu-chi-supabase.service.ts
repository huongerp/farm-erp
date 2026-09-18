/**
 * Service hạng mục thu chi quỹ — đọc/ghi PostgREST (fp_tc_hang_muc_thu_chi).
 * Danh mục nhỏ (vài chục dòng) nên đọc hết một lần, cache dài ở tầng hook.
 */
import { db, fetchAllRows, throwSupabaseError } from '../../../../lib/db';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { HangMucThuChi, LoaiHangMuc } from '../core/types';
import type { HangMucThuChiFormValues } from '../core/schema';
import { maHangMucDuyNhat } from '../core/ma-hang-muc';

const TABLE = 'fp_tc_hang_muc_thu_chi';

const ROW_COLUMNS = 'id,ma,ten,loai,thu_tu,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

interface DbRow {
  id: number;
  ma: string;
  ten: string;
  loai: string;
  thu_tu: number;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function normalizeLoai(val: string | null): LoaiHangMuc {
  if (val === 'thu' || val === 'chi') return val;
  return 'ca_hai';
}

function normalizeTrangThai(val: string | null): TrangThaiHoatDong {
  return val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToItem(row: DbRow): HangMucThuChi {
  return {
    id: String(row.id),
    ma: row.ma ?? '',
    ten: row.ten ?? '',
    loai: normalizeLoai(row.loai),
    thu_tu: Number(row.thu_tu ?? 0),
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function toPayload(data: HangMucThuChiFormValues, ma: string) {
  return {
    ma,
    ten: data.ten.trim(),
    loai: data.loai,
    thu_tu: Number(data.thu_tu),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };
}

export async function getHangMucThuChiList(): Promise<HangMucThuChi[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    db
      .from(TABLE)
      .select(ROW_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(rowToItem);
}

/** Mã đang dùng (để sinh mã mới không trùng); `trừId` là bản ghi đang sửa. */
async function layMaDangDung(truId?: string): Promise<string[]> {
  const { data, error } = await db.from(TABLE).select('id,ma');
  if (error) throwSupabaseError(error);
  return ((data ?? []) as { id: number; ma: string }[])
    .filter((r) => (truId ? String(r.id) !== truId : true))
    .map((r) => r.ma ?? '');
}

/** Tên hạng mục phải khác nhau — mã sinh tự động từ tên nên tên trùng là nhập nhằng. */
async function chanTenTrung(ten: string, truId?: string): Promise<void> {
  let sel = db.from(TABLE).select('id').ilike('ten', ten.trim());
  if (truId) sel = sel.neq('id', Number(truId));
  const { data } = await sel.maybeSingle();
  if (data) throw new Error(i18n.t('thietLapQuy.hangMuc.service.duplicateTen'));
}

export async function createHangMucThuChi(data: HangMucThuChiFormValues): Promise<HangMucThuChi> {
  await chanTenTrung(data.ten);
  const ma = maHangMucDuyNhat(data.ten, await layMaDangDung());
  const payload = toPayload(data, ma);

  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);
  return rowToItem(inserted as unknown as DbRow);
}

export async function updateHangMucThuChi(
  id: string,
  data: HangMucThuChiFormValues
): Promise<HangMucThuChi> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thietLapQuy.hangMuc.service.notFound'));

  await chanTenTrung(data.ten, id);
  // Giữ nguyên mã cũ khi sửa: mã đã nằm trong phiếu quỹ / file import cũ.
  const { data: current } = await db.from(TABLE).select('ma').eq('id', idNum).maybeSingle();
  const maCu = (current as { ma?: string } | null)?.ma;
  const ma = maCu || maHangMucDuyNhat(data.ten, await layMaDangDung(id));
  const payload = toPayload(data, ma);

  const { error } = await db.from(TABLE).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const { data: row, error: fetchErr } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', idNum).single();
  if (fetchErr || !row) throw new Error(i18n.t('thietLapQuy.hangMuc.service.notFound'));
  return rowToItem(row as unknown as DbRow);
}

export async function updateHangMucThuChiStatus(
  ids: string[],
  status: TrangThaiHoatDong
): Promise<void> {
  const numIds = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).update({ trang_thai: status }).in('id', numIds);
  if (error) throwSupabaseError(error);
}

export async function deleteHangMucThuChiList(ids: string[]): Promise<void> {
  const numIds = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}
