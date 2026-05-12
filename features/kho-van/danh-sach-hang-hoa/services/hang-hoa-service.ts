import { supabase, fetchAllRows } from '../../../../lib/supabase';
import { getCachedRef, REF_CACHE_KEYS } from '../../../../lib/ref-cache';
import type { HangHoa } from '../core/types';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import {
  getAllDanhMucHangHoa,
  getDanhMucHangHoaRefRows,
} from '../../danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';

const TABLE = 'fp_mh_danh_sach_hang_hoa';

/** Danh sách — có mo_ta cho cột mô tả; vẫn bỏ hinh_anh (base64 nặng). */
const HANG_HOA_LIST_COLUMNS =
  'id,danh_muc_id,danh_muc_cha_id,ma_hang_hoa,ten_hang_hoa,dvt,thu_tu,trang_thai,don_gia,mo_ta,tg_tao,tg_cap_nhat';

/** Chi tiết form/preview — đủ mo_ta, hinh_anh. */
const HANG_HOA_DETAIL_COLUMNS =
  'id,danh_muc_id,danh_muc_cha_id,ma_hang_hoa,ten_hang_hoa,dvt,thu_tu,trang_thai,don_gia,mo_ta,hinh_anh,tg_tao,tg_cap_nhat';

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

/** Chuẩn hóa trang_thai từ DB: chỉ "Ngừng hoạt động" coi là ngừng, còn lại coi là Đang hoạt động (tránh lỗi không chọn được hàng khi DB null/khác chuỗi). */
function normalizeTrangThaiHangHoa(raw: string | null): HangHoa['trang_thai'] {
  const s = raw?.trim();
  return s === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToHangHoa(row: HangHoaRow, danhMuc?: { ten_danh_muc?: string; ten_danh_muc_cap1?: string; ten_danh_muc_cap2?: string }): HangHoa {
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
    trang_thai: normalizeTrangThaiHangHoa(row.trang_thai),
    don_gia: Number.isNaN(donGia) ? null : donGia,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    ten_danh_muc: danhMuc?.ten_danh_muc,
    ten_danh_muc_cap1: danhMuc?.ten_danh_muc_cap1,
    ten_danh_muc_cap2: danhMuc?.ten_danh_muc_cap2,
    ma_hang: ma,
    ten_hang: ten,
    don_vi_tinh: unit,
    mo_ta: row.mo_ta ?? null,
    hinh_anh: row.hinh_anh ?? null,
  };
}

function buildDanhMucNames(
  danhMucList: { id: string; ten_danh_muc: string; id_cha: string | null }[],
  danh_muc_id: string | null,
  danh_muc_cha_id: string | null
): { ten_danh_muc?: string; ten_danh_muc_cap1?: string; ten_danh_muc_cap2?: string } {
  if (!danh_muc_id) return {};
  const cap2 = danhMucList.find((d) => d.id === danh_muc_id);
  if (!cap2) return {};
  const cap1 = danh_muc_cha_id ? danhMucList.find((d) => d.id === danh_muc_cha_id) : null;
  return {
    ten_danh_muc: cap1 ? `${cap1.ten_danh_muc} / ${cap2.ten_danh_muc}` : cap2.ten_danh_muc,
    ten_danh_muc_cap1: cap1?.ten_danh_muc,
    ten_danh_muc_cap2: cap2.ten_danh_muc,
  };
}

async function enrichWithTenDanhMuc(rows: HangHoaRow[]): Promise<HangHoa[]> {
  let dmList: Awaited<ReturnType<typeof getAllDanhMucHangHoa>> = [];
  try {
    dmList = await getAllDanhMucHangHoa();
  } catch (e) {
    console.warn('[hang-hoa-service] Không tải được danh mục hàng hóa – bỏ qua enrich:', e);
  }
  return rows.map((row) => {
    const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
    const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
    const danhMuc = buildDanhMucNames(dmList, danh_muc_id, danh_muc_cha_id);
    return rowToHangHoa(row, danhMuc);
  });
}

export const getAllHangHoa = async (): Promise<HangHoa[]> => {
  const rows = await fetchAllRows<HangHoaRow>((from, to) =>
    supabase
      .from(TABLE)
      .select(HANG_HOA_LIST_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('ma_hang_hoa', { ascending: true })
      .range(from, to)
  );
  return enrichWithTenDanhMuc(rows);
};

/** Danh sách hàng hóa tối thiểu (không gọi danh mục enrich) — dùng map ma/ten/dvt trong phiếu kho, PO, kiểm kê. */
export type HangHoaRefLite = {
  id: string;
  ma_hang: string;
  ma_hang_hoa: string;
  ten_hang: string;
  ten_hang_hoa: string;
  don_vi_tinh: string | undefined;
  dvt: string | null;
  danh_muc_id: string | null;
  ten_danh_muc?: string;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
  /** Đơn giá mặc định (phiếu kho / đơn đặt hàng). */
  don_gia: number | null;
  /** Chuẩn hóa giống HangHoa — dùng lọc tạo danh sách kiểm kê kho. */
  trang_thai: HangHoa['trang_thai'];
};

export const getHangHoaRef = async (): Promise<HangHoaRefLite[]> => {
  return getCachedRef(REF_CACHE_KEYS.hangHoa, async () => {
    const [rows, dmList] = await Promise.all([
      fetchAllRows<HangHoaRow>((from, to) =>
        supabase
          .from(TABLE)
          .select('id, ma_hang_hoa, ten_hang_hoa, dvt, danh_muc_id, danh_muc_cha_id, thu_tu, trang_thai, don_gia')
          .order('thu_tu', { ascending: true })
          .order('ma_hang_hoa', { ascending: true })
          .range(from, to)
      ),
      getDanhMucHangHoaRefRows().catch((e) => {
        console.warn('[hang-hoa-service] getHangHoaRef: không tải được danh mục hàng hóa – cột Danh mục có thể trống:', e);
        return [] as Awaited<ReturnType<typeof getDanhMucHangHoaRefRows>>;
      }),
    ]);
    return rows.map((row) => {
      const ma = row.ma_hang_hoa ?? '';
      const ten = row.ten_hang_hoa ?? '';
      const unit = row.dvt ?? undefined;
      const donGiaRaw = row.don_gia;
      const donGia =
        donGiaRaw != null && donGiaRaw !== ''
          ? Number(donGiaRaw)
          : null;
      const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
      const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
      const danhMuc = dmList.length ? buildDanhMucNames(dmList, danh_muc_id, danh_muc_cha_id) : {};
      return {
        id: String(row.id),
        ma_hang: ma,
        ma_hang_hoa: ma,
        ten_hang: ten,
        ten_hang_hoa: ten,
        don_vi_tinh: unit,
        dvt: row.dvt ?? null,
        danh_muc_id,
        ten_danh_muc: danhMuc.ten_danh_muc,
        ten_danh_muc_cap1: danhMuc.ten_danh_muc_cap1,
        ten_danh_muc_cap2: danhMuc.ten_danh_muc_cap2,
        don_gia: Number.isFinite(donGia) ? donGia : null,
        trang_thai: normalizeTrangThaiHangHoa(row.trang_thai),
      };
    });
  });
};

export const getHangHoaById = async (id: string): Promise<HangHoa | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE)
    .select(HANG_HOA_DETAIL_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const [enriched] = await enrichWithTenDanhMuc([row as HangHoaRow]);
  return enriched;
};

/** Chi tiết đủ mo_ta, hinh_anh — form/preview; danh sách getAllHangHoa có mo_ta, không hinh_anh. */
export const getHangHoaDetail = getHangHoaById;

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

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(HANG_HOA_DETAIL_COLUMNS).single();
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
    .select(HANG_HOA_DETAIL_COLUMNS)
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
    .select(HANG_HOA_DETAIL_COLUMNS)
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

/** Dòng dữ liệu import từ Excel (key theo cột đã map). */
export interface HangHoaImportRow {
  ma_hang_hoa?: string;
  ten_hang_hoa?: string;
  danh_muc?: string;
  dvt?: string;
  don_gia?: string | number;
  mo_ta?: string;
  trang_thai?: string;
}

export type ImportMode = 'create' | 'upsert';

export interface ImportHangHoaResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; ma_hang_hoa: string; ten_hang_hoa: string; msg: string }>;
}

/**
 * Resolve danh mục cấp 2 từ giá trị người dùng nhập (mã hoặc tên).
 * Thử match: ma_danh_muc (exact uppercase) → ten_danh_muc (case-insensitive).
 */
function resolveDanhMucCap2(
  input: string,
  dmByMa: Map<string, { id: string; id_cha: string | null }>,
  dmByTen: Map<string, { id: string; id_cha: string | null }>,
): { danh_muc_id: number; danh_muc_cha_id: number | null } | null {
  const s = input.trim();
  if (!s) return null;
  const byMa = dmByMa.get(s.toUpperCase());
  if (byMa) return { danh_muc_id: Number(byMa.id), danh_muc_cha_id: byMa.id_cha ? Number(byMa.id_cha) : null };
  const byTen = dmByTen.get(s.toLowerCase());
  if (byTen) return { danh_muc_id: Number(byTen.id), danh_muc_cha_id: byTen.id_cha ? Number(byTen.id_cha) : null };
  return null;
}

const BATCH_SIZE = 200;

/**
 * Import hàng hóa — batch validate + batch insert/upsert.
 * Cột danh_muc: chấp nhận mã danh mục cấp 2 HOẶC tên danh mục cấp 2 (case-insensitive).
 */
export const importHangHoa = async (
  rows: HangHoaImportRow[],
  mode: ImportMode = 'create',
): Promise<ImportHangHoaResult> => {
  const errors: ImportHangHoaResult['errors'] = [];
  let created = 0;
  let updated = 0;

  // Phase 1: Load reference data (1 request)
  const dmList = await getAllDanhMucHangHoa();
  const danhMucCap2 = dmList.filter((d) => d.id_cha != null && d.id_cha.trim() !== '');
  const dmByMa = new Map(danhMucCap2.map((d) => [d.ma_danh_muc.trim().toUpperCase(), { id: d.id, id_cha: d.id_cha }]));
  const dmByTen = new Map(danhMucCap2.map((d) => [d.ten_danh_muc.trim().toLowerCase(), { id: d.id, id_cha: d.id_cha }]));

  // Phase 2: Load existing ma_hang_hoa for duplicate check (1 request)
  const { data: existingRows } = await supabase.from(TABLE).select('id, ma_hang_hoa');
  const existingByMa = new Map<string, number>();
  (existingRows ?? []).forEach((r: { id: number; ma_hang_hoa: string | null }) => {
    if (r.ma_hang_hoa) existingByMa.set(r.ma_hang_hoa.trim().toUpperCase(), r.id);
  });

  // Phase 3: Get current max thu_tu (1 request)
  const { data: maxRow } = await supabase.from(TABLE).select('thu_tu').order('thu_tu', { ascending: false }).limit(1).maybeSingle();
  let nextThuTu = Math.max(1, (maxRow?.thu_tu != null ? Number(maxRow.thu_tu) : 0) + 1);

  // Phase 4: Validate all rows client-side
  interface ValidatedInsert {
    rowIdx: number;
    payload: Record<string, unknown>;
  }
  interface ValidatedUpdate {
    rowIdx: number;
    existingId: number;
    payload: Record<string, unknown>;
  }
  const toInsert: ValidatedInsert[] = [];
  const toUpdate: ValidatedUpdate[] = [];
  const seenMaCodes = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ma = String(row.ma_hang_hoa ?? '').trim().toUpperCase();
    const ten = String(row.ten_hang_hoa ?? '').trim();
    const danhMucInput = String(row.danh_muc ?? '').trim();
    const dvt = row.dvt != null && String(row.dvt).trim() !== '' ? String(row.dvt).trim() : null;
    const rawTrangThai = String(row.trang_thai ?? '').trim();
    const trangThai =
      rawTrangThai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ||
      rawTrangThai.toLowerCase() === 'ngừng hoạt động' ||
      rawTrangThai.toLowerCase() === 'ngừng' ||
      rawTrangThai === '0'
        ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
        : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

    const rowErrors: string[] = [];
    if (!ma) rowErrors.push(i18n.t('hangHoa.validation.codeRequired'));
    if (!ten) rowErrors.push(i18n.t('hangHoa.validation.nameRequired'));

    const dm = resolveDanhMucCap2(danhMucInput, dmByMa, dmByTen);
    if (!dm) rowErrors.push(i18n.t('hangHoa.import.categoryNotFound', { value: danhMucInput || '(trống)' }));
    if (!dvt) rowErrors.push(i18n.t('hangHoa.validation.unitRequired'));

    if (seenMaCodes.has(ma) && ma) {
      rowErrors.push(i18n.t('hangHoa.import.duplicateInFile'));
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 2, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: rowErrors.join('; ') });
      continue;
    }
    seenMaCodes.add(ma);

    const donGiaRaw = row.don_gia;
    const donGia = donGiaRaw != null && donGiaRaw !== '' && !Number.isNaN(Number(donGiaRaw)) ? Number(donGiaRaw) : 0;

    const existingId = existingByMa.get(ma);
    if (existingId != null) {
      if (mode === 'upsert') {
        toUpdate.push({
          rowIdx: i,
          existingId,
          payload: {
            danh_muc_id: dm!.danh_muc_id,
            danh_muc_cha_id: dm!.danh_muc_cha_id,
            ma_hang_hoa: ma,
            ten_hang_hoa: ten,
            dvt,
            trang_thai: trangThai,
            don_gia: donGia,
            mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() || null : null,
            tg_cap_nhat: new Date().toISOString(),
          },
        });
      } else {
        errors.push({ row: i + 2, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: i18n.t('hangHoa.service.duplicateCode') });
      }
    } else {
      toInsert.push({
        rowIdx: i,
        payload: {
          danh_muc_id: dm!.danh_muc_id,
          danh_muc_cha_id: dm!.danh_muc_cha_id,
          ma_hang_hoa: ma,
          ten_hang_hoa: ten,
          dvt,
          thu_tu: nextThuTu++,
          trang_thai: trangThai,
          don_gia: donGia,
          mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() || null : null,
        },
      });
    }
  }

  // Phase 5: Batch insert (chunks of BATCH_SIZE)
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const chunk = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(TABLE).insert(chunk.map((c) => c.payload));
    if (error) {
      chunk.forEach((c) => {
        const row = rows[c.rowIdx];
        errors.push({
          row: c.rowIdx + 2,
          ma_hang_hoa: String(row.ma_hang_hoa ?? ''),
          ten_hang_hoa: String(row.ten_hang_hoa ?? ''),
          msg: error.message,
        });
      });
    } else {
      created += chunk.length;
    }
  }

  // Phase 6: Batch update for upsert (individual updates — Supabase doesn't support batch update by different IDs)
  if (toUpdate.length > 0) {
    const UPDATE_CHUNK = 50;
    for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
      const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
      const results = await Promise.allSettled(
        chunk.map((c) =>
          supabase.from(TABLE).update(c.payload).eq('id', c.existingId)
        )
      );
      results.forEach((res, idx) => {
        const c = chunk[idx];
        const row = rows[c.rowIdx];
        if (res.status === 'fulfilled' && !res.value.error) {
          updated++;
        } else {
          const errMsg = res.status === 'rejected'
            ? (res.reason as Error).message
            : res.value.error?.message ?? 'Unknown error';
          errors.push({
            row: c.rowIdx + 2,
            ma_hang_hoa: String(row.ma_hang_hoa ?? ''),
            ten_hang_hoa: String(row.ten_hang_hoa ?? ''),
            msg: errMsg,
          });
        }
      });
    }
  }

  return { created, updated, errors };
};

/** Lấy danh mục cấp 2 kèm tên cha (dùng cho sheet tham chiếu trong template import). */
export const getDanhMucRefForImport = async (): Promise<Array<{ ma_danh_muc: string; ten_danh_muc: string; ten_cap1: string }>> => {
  const dmList = await getAllDanhMucHangHoa();
  const byId: Record<string, string> = {};
  dmList.forEach((d) => { byId[d.id] = d.ten_danh_muc; });
  return dmList
    .filter((d) => d.id_cha != null && d.id_cha.trim() !== '')
    .map((d) => ({
      ma_danh_muc: d.ma_danh_muc,
      ten_danh_muc: d.ten_danh_muc,
      ten_cap1: (d.id_cha && byId[d.id_cha]) ?? '',
    }));
};
