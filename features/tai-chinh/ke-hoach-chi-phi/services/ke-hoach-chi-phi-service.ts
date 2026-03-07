import type { KeHoachChiPhi, ThucChiTheoThang } from '../core/types';
import type { KeHoachChiPhiFormValues } from '../core/schema';
import { MOCK_KE_HOACH_CHI_PHI } from '../../../../mocks/tai-chinh';
import { MOCK_THU_CHI } from '../../../../mocks/tai-chinh';
import { MOCK_DANH_MUC_TAI_CHINH } from '../../../../mocks/tai-chinh';
import { getDepartments } from '../../../he-thong/phong-ban/services/phong-ban-service';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

let db: KeHoachChiPhi[] = JSON.parse(JSON.stringify(MOCK_KE_HOACH_CHI_PHI));

const THANG_KEYS = [
  'thang_1', 'thang_2', 'thang_3', 'thang_4', 'thang_5', 'thang_6',
  'thang_7', 'thang_8', 'thang_9', 'thang_10', 'thang_11', 'thang_12',
] as const;

function getTenDanhMuc(id: string): string {
  return MOCK_DANH_MUC_TAI_CHINH.find((d) => d.id === id)?.ten_danh_muc ?? id;
}

async function getTenPhongBan(id: string): Promise<string> {
  if (!id) return '';
  try {
    const depts = await getDepartments();
    return depts.find((d) => d.id === id)?.ten_phong_ban ?? '';
  } catch {
    return '';
  }
}

function sumTongNam(d: Record<string, number>): number {
  return THANG_KEYS.reduce((s, k) => s + (d[k] ?? 0), 0);
}

/** Từ form values build object so_luong, don_gia, tong_sl cho entity. */
function buildSlDgTongSl(data: KeHoachChiPhiFormValues): Partial<KeHoachChiPhi> {
  const out: Partial<KeHoachChiPhi> = {};
  let tongSl = 0;
  for (let i = 1; i <= 12; i++) {
    const sl = (data as any)[`thang_${i}_so_luong`] as number | undefined;
    const tien = (data as any)[`thang_${i}`] as number | undefined;
    const amount = typeof tien === 'number' && !Number.isNaN(tien) ? tien : 0;
    const hasSl = sl != null && typeof sl === 'number' && !Number.isNaN(sl) && sl > 0;
    (out as any)[`thang_${i}_so_luong`] = hasSl ? sl : undefined;
    (out as any)[`thang_${i}_don_gia`] = hasSl ? amount / sl : undefined;
    if (hasSl) tongSl += sl;
  }
  out.tong_sl = tongSl;
  return out;
}

/** Lấy tháng (1-12) từ chuỗi ngày ISO. */
function getMonthFromDate(ngayGiaoDich: string): number {
  const d = new Date(ngayGiaoDich);
  return d.getMonth() + 1;
}

/** Lấy năm từ chuỗi ngày. */
function getYearFromDate(ngayGiaoDich: string): number {
  return new Date(ngayGiaoDich).getFullYear();
}

export const getAllKeHoachChiPhi = async (): Promise<KeHoachChiPhi[]> => {
  await delay(300);
  return [...db];
};

export const getKeHoachChiPhiById = async (id: string): Promise<KeHoachChiPhi | null> => {
  await delay(200);
  const item = db.find((d) => d.id === id) ?? null;
  return item ? { ...item } : null;
};

/** Danh sách dòng kế hoạch theo năm. */
export const getKeHoachChiPhiByNam = async (nam: number): Promise<KeHoachChiPhi[]> => {
  await delay(200);
  return db.filter((d) => d.nam === nam);
};

/** Aggregate kế hoạch theo năm: gộp theo id_danh_muc (tổng 12 tháng) cho tab So sánh / Báo cáo. */
export interface PlanRowAggregated {
  id_danh_muc: string;
  ten_danh_muc: string;
  thang_1: number;
  thang_2: number;
  thang_3: number;
  thang_4: number;
  thang_5: number;
  thang_6: number;
  thang_7: number;
  thang_8: number;
  thang_9: number;
  thang_10: number;
  thang_11: number;
  thang_12: number;
  tong_nam: number;
}

export const getPlanRowsAggregatedByNam = async (nam: number): Promise<PlanRowAggregated[]> => {
  await delay(150);
  const rows = db.filter((d) => d.nam === nam);
  const byDanhMuc = new Map<string, { ten_danh_muc: string; thang: Record<number, number> }>();
  for (const r of rows) {
    if (!byDanhMuc.has(r.id_danh_muc)) {
      byDanhMuc.set(r.id_danh_muc, {
        ten_danh_muc: r.ten_danh_muc,
        thang: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      });
    }
    const entry = byDanhMuc.get(r.id_danh_muc)!;
    for (let m = 1; m <= 12; m++) {
      const key = `thang_${m}` as keyof KeHoachChiPhi;
      entry.thang[m] = (entry.thang[m] ?? 0) + (Number(r[key]) ?? 0);
    }
  }
  const result: PlanRowAggregated[] = [];
  byDanhMuc.forEach((v, id_danh_muc) => {
    const t = v.thang;
    const tong_nam = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + (t[m] ?? 0), 0);
    result.push({
      id_danh_muc,
      ten_danh_muc: v.ten_danh_muc,
      thang_1: t[1] ?? 0,
      thang_2: t[2] ?? 0,
      thang_3: t[3] ?? 0,
      thang_4: t[4] ?? 0,
      thang_5: t[5] ?? 0,
      thang_6: t[6] ?? 0,
      thang_7: t[7] ?? 0,
      thang_8: t[8] ?? 0,
      thang_9: t[9] ?? 0,
      thang_10: t[10] ?? 0,
      thang_11: t[11] ?? 0,
      thang_12: t[12] ?? 0,
      tong_nam,
    });
  });
  return result;
};

export const createKeHoachChiPhi = async (
  data: KeHoachChiPhiFormValues
): Promise<KeHoachChiPhi> => {
  await delay(500);
  const id = `khcp-${data.nam}-${Date.now()}`;
  const ten_phong_ban = data.id_phong_ban ? await getTenPhongBan(data.id_phong_ban) : '';
  const ten_danh_muc = getTenDanhMuc(data.id_danh_muc);
  const row = {
    thang_1: data.thang_1 ?? 0,
    thang_2: data.thang_2 ?? 0,
    thang_3: data.thang_3 ?? 0,
    thang_4: data.thang_4 ?? 0,
    thang_5: data.thang_5 ?? 0,
    thang_6: data.thang_6 ?? 0,
    thang_7: data.thang_7 ?? 0,
    thang_8: data.thang_8 ?? 0,
    thang_9: data.thang_9 ?? 0,
    thang_10: data.thang_10 ?? 0,
    thang_11: data.thang_11 ?? 0,
    thang_12: data.thang_12 ?? 0,
  };
  const slDg = buildSlDgTongSl(data);
  const newItem: KeHoachChiPhi = {
    id,
    nam: data.nam,
    id_phong_ban: data.id_phong_ban || undefined,
    ten_phong_ban: ten_phong_ban || undefined,
    id_danh_muc: data.id_danh_muc,
    ten_danh_muc,
    mo_ta: data.mo_ta ?? undefined,
    ...row,
    tong_nam: sumTongNam(row),
    ...slDg,
    ghi_chu: data.ghi_chu ?? undefined,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, newItem];
  return newItem;
};

export const updateKeHoachChiPhi = async (
  id: string,
  data: KeHoachChiPhiFormValues
): Promise<KeHoachChiPhi> => {
  await delay(500);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('keHoachChiPhi.service.notFound'));
  const existing = db[index];
  const ten_phong_ban = data.id_phong_ban ? await getTenPhongBan(data.id_phong_ban) : '';
  const ten_danh_muc = getTenDanhMuc(data.id_danh_muc);
  const row = {
    thang_1: data.thang_1 ?? 0,
    thang_2: data.thang_2 ?? 0,
    thang_3: data.thang_3 ?? 0,
    thang_4: data.thang_4 ?? 0,
    thang_5: data.thang_5 ?? 0,
    thang_6: data.thang_6 ?? 0,
    thang_7: data.thang_7 ?? 0,
    thang_8: data.thang_8 ?? 0,
    thang_9: data.thang_9 ?? 0,
    thang_10: data.thang_10 ?? 0,
    thang_11: data.thang_11 ?? 0,
    thang_12: data.thang_12 ?? 0,
  };
  const slDg = buildSlDgTongSl(data);
  const updated: KeHoachChiPhi = {
    ...existing,
    id_phong_ban: data.id_phong_ban || undefined,
    ten_phong_ban: ten_phong_ban || undefined,
    id_danh_muc: data.id_danh_muc,
    ten_danh_muc,
    mo_ta: data.mo_ta ?? undefined,
    ...row,
    tong_nam: sumTongNam(row),
    ...slDg,
    ghi_chu: data.ghi_chu ?? undefined,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};

export const deleteKeHoachChiPhi = async (id: string): Promise<void> => {
  await delay(400);
  const idx = db.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('keHoachChiPhi.service.notFound'));
  db = db.filter((d) => d.id !== id);
};

export const deleteKeHoachChiPhiMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  db = db.filter((d) => !ids.includes(d.id));
};

/**
 * Aggregate thực chi từ MOCK_THU_CHI: chỉ giao dịch loại "chi" và trang_thai "hoan_thanh",
 * group theo id_danh_muc và tháng trong năm chỉ định.
 */
export const getThucChiTheoThang = async (
  nam: number
): Promise<ThucChiTheoThang[]> => {
  await delay(300);
  const chiOnly = MOCK_THU_CHI.filter(
    (g) => (g as { loai?: string }).loai === 'chi' && g.trang_thai === 'hoan_thanh'
  );
  const byCategory = new Map<
    string,
    { ten_danh_muc: string; thang: Record<number, number> }
  >();
  for (const g of chiOnly) {
    const year = getYearFromDate(g.ngay_giao_dich);
    if (year !== nam) continue;
    const id = g.id_danh_muc;
    if (!id) continue;
    const thang = getMonthFromDate(g.ngay_giao_dich);
    const ten = g.ten_danh_muc ?? getTenDanhMuc(id);
    if (!byCategory.has(id)) {
      byCategory.set(id, {
        ten_danh_muc: ten,
        thang: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      });
    }
    const entry = byCategory.get(id)!;
    entry.thang[thang] = (entry.thang[thang] ?? 0) + g.so_tien;
  }
  const result: ThucChiTheoThang[] = [];
  byCategory.forEach((v, id_danh_muc) => {
    const t = v.thang;
    const tong_nam = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + (t[m] ?? 0), 0);
    result.push({
      id_danh_muc,
      ten_danh_muc: v.ten_danh_muc,
      thang_1: t[1] ?? 0,
      thang_2: t[2] ?? 0,
      thang_3: t[3] ?? 0,
      thang_4: t[4] ?? 0,
      thang_5: t[5] ?? 0,
      thang_6: t[6] ?? 0,
      thang_7: t[7] ?? 0,
      thang_8: t[8] ?? 0,
      thang_9: t[9] ?? 0,
      thang_10: t[10] ?? 0,
      thang_11: t[11] ?? 0,
      thang_12: t[12] ?? 0,
      tong_nam,
    });
  });
  return result;
};

/** Giao dịch thu chi (type từ core). */
interface ThuChiGiaoDich {
  id: string;
  ma_giao_dich: string;
  ngay_giao_dich: string;
  so_tien: number;
  loai: string;
  id_danh_muc: string;
  ten_danh_muc: string;
  noi_dung: string;
  ten_nhan_vien?: string;
  trang_thai: string;
}

export const getThuChiDrillDown = async (
  nam: number,
  thang: number,
  id_danh_muc: string
): Promise<ThuChiGiaoDich[]> => {
  await delay(150);
  const chiOnly = MOCK_THU_CHI.filter(
    (g) => (g as { loai?: string }).loai === 'chi' && g.trang_thai === 'hoan_thanh'
  );
  return chiOnly.filter((g) => {
    const d = new Date(g.ngay_giao_dich);
    return d.getFullYear() === nam && d.getMonth() + 1 === thang && g.id_danh_muc === id_danh_muc;
  }).map((g) => ({
    id: g.id,
    ma_giao_dich: g.ma_giao_dich,
    ngay_giao_dich: g.ngay_giao_dich,
    so_tien: g.so_tien,
    loai: g.loai,
    id_danh_muc: g.id_danh_muc,
    ten_danh_muc: g.ten_danh_muc,
    noi_dung: g.noi_dung,
    ten_nhan_vien: g.ten_nhan_vien,
    trang_thai: g.trang_thai,
  }));
};
