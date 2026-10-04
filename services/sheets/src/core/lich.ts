/**
 * Lịch đồng bộ: kiểm yêu cầu tạo lịch + tính lần chạy kế tiếp theo giờ Việt Nam.
 * Hàm thuần, có test (luật tính kỳ/ngày/hạn — loại CLAUDE.md bắt buộc test).
 */
import type { KieuCotXuat } from './dinh-dang.ts';

export type TanSuat = 'khi_thay_doi' | 'moi_gio' | 'moi_4_gio' | 'hang_ngay' | 'hang_tuan' | 'hang_thang';
export const DS_TAN_SUAT: readonly TanSuat[] = ['khi_thay_doi', 'moi_gio', 'moi_4_gio', 'hang_ngay', 'hang_tuan', 'hang_thang'];

/** "Khi có thay đổi": chờ ngần này phút từ thay đổi ĐẦU TIÊN rồi ghi một lần (gộp loạt sửa liên tiếp). */
export const CUA_SO_CHO_PHUT = 5;
/** Giờ VN đối soát ghi lại toàn bộ cho lịch "khi có thay đổi" — sửa lệch do ai đó gõ tay vào Sheet. */
export const GIO_DOI_SOAT = 3;

/** Việt Nam UTC+7 cố định, không có giờ mùa hè. */
const LECH_VN_MS = 7 * 3_600_000;
const PHUT_MS = 60_000;

interface GioVN {
  y: number;
  m: number;
  d: number;
  /** 1 = Thứ Hai … 7 = Chủ nhật. */
  thu: number;
}

function ngayVN(ms: number): GioVN {
  const v = new Date(ms + LECH_VN_MS);
  const dow = v.getUTCDay();
  return { y: v.getUTCFullYear(), m: v.getUTCMonth() + 1, d: v.getUTCDate(), thu: dow === 0 ? 7 : dow };
}

/** Giờ treo tường VN → mốc UTC. Date.UTC tự tràn ngày/tháng nên cộng ngày thoải mái. */
function tuVN(y: number, m: number, d: number, gio: number): number {
  return Date.UTC(y, m - 1, d, gio, 0, 0) - LECH_VN_MS;
}

function soNgayCuaThang(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export interface CauHinhLich {
  tanSuat: TanSuat;
  gio: number | null;
  thu: number | null;
  ngayThang: number | null;
}

/** Lần chạy kế tiếp SAU `now`. "Khi có thay đổi" không có lịch cố định → null. */
export function lanChayKeTiep(l: CauHinhLich, now: Date): Date | null {
  const ms = Math.floor(now.getTime() / PHUT_MS) * PHUT_MS;
  const gio = l.gio ?? 7;
  switch (l.tanSuat) {
    case 'khi_thay_doi':
      return null;
    case 'moi_gio':
      return new Date(ms + 60 * PHUT_MS);
    case 'moi_4_gio':
      return new Date(ms + 240 * PHUT_MS);
    case 'hang_ngay': {
      const h = ngayVN(ms);
      let t = tuVN(h.y, h.m, h.d, gio);
      if (t <= now.getTime()) t = tuVN(h.y, h.m, h.d + 1, gio);
      return new Date(t);
    }
    case 'hang_tuan': {
      const thu = l.thu ?? 1;
      const h = ngayVN(ms);
      let cach = (thu - h.thu + 7) % 7;
      let t = tuVN(h.y, h.m, h.d + cach, gio);
      if (t <= now.getTime()) {
        cach += 7;
        t = tuVN(h.y, h.m, h.d + cach, gio);
      }
      return new Date(t);
    }
    case 'hang_thang': {
      // 31 = ngày cuối tháng: tháng 2 chạy ngày 28/29, không nhảy sang tháng 3.
      const muon = l.ngayThang ?? 1;
      const h = ngayVN(ms);
      let y = h.y;
      let m = h.m;
      let t = tuVN(y, m, Math.min(muon, soNgayCuaThang(y, m)), gio);
      if (t <= now.getTime()) {
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
        t = tuVN(y, m, Math.min(muon, soNgayCuaThang(y, m)), gio);
      }
      return new Date(t);
    }
  }
}

/** 03:00 giờ VN kế tiếp, sau `now`. */
export function doiSoatKeTiep(now: Date): Date {
  const h = ngayVN(now.getTime());
  let t = tuVN(h.y, h.m, h.d, GIO_DOI_SOAT);
  if (t <= now.getTime()) t = tuVN(h.y, h.m, h.d + 1, GIO_DOI_SOAT);
  return new Date(t);
}

/** Thử lại sau lỗi tạm thời: 2, 4, 8 … tối đa 60 phút. */
export function thuLaiSau(soLoiLienTiep: number, now: Date): Date {
  const phut = Math.min(60, 2 ** Math.max(1, soLoiLienTiep));
  return new Date(now.getTime() + phut * PHUT_MS);
}

// --- Kiểm yêu cầu tạo / sửa lịch ------------------------------------------------

export interface CotLich {
  key: string;
  label: string;
  type?: KieuCotXuat;
}

const KIEU_HOP_LE = new Set(['text', 'number', 'money', 'percent', 'date', 'datetime', 'boolean']);
/** Key ghép thẳng vào `select=` của PostgREST — chỉ cho tên cột trần, chặn chèn cú pháp. */
const LA_TEN_COT = /^[a-z_][a-z0-9_]{0,62}$/;

export interface YeuCauLich {
  moduleId: string;
  cot: CotLich[];
  tanSuat: TanSuat;
  gio: number | null;
  thu: number | null;
  ngayThang: number | null;
}

function soNguyenTrong(v: unknown, min: number, max: number, macDinh: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : macDinh;
}

/**
 * Chuẩn hoá phần cột + tần suất của yêu cầu lịch. Cột đầu luôn là `id` (khoá để cập nhật
 * đúng dòng khi đồng bộ) — người dùng bỏ tick `id` thì vẫn được thêm lại ở đầu.
 */
export function kiemTraYeuCauLich(body: unknown): { loi: string } | { ok: YeuCauLich } {
  if (!body || typeof body !== 'object') return { loi: 'Dữ liệu gửi lên không hợp lệ.' };
  const b = body as Record<string, unknown>;

  const moduleId = typeof b.moduleId === 'string' ? b.moduleId : '';
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(moduleId)) return { loi: 'Module không hợp lệ.' };

  if (!Array.isArray(b.cot) || b.cot.length === 0) return { loi: 'Chưa chọn cột.' };
  if (b.cot.length > 200) return { loi: 'Tối đa 200 cột.' };
  const cot: CotLich[] = [];
  const daCo = new Set<string>();
  for (const c of b.cot) {
    const o = (c ?? {}) as Record<string, unknown>;
    const key = String(o.key ?? '');
    if (!LA_TEN_COT.test(key)) return { loi: `Cột "${key}" không hợp lệ.` };
    if (daCo.has(key)) continue;
    daCo.add(key);
    const label = String(o.label ?? key).slice(0, 200);
    const type = typeof o.type === 'string' && KIEU_HOP_LE.has(o.type) ? (o.type as KieuCotXuat) : undefined;
    cot.push({ key, label, type });
  }
  const iId = cot.findIndex((c) => c.key === 'id');
  const cotId: CotLich = iId >= 0 ? { ...cot[iId]!, type: 'text' } : { key: 'id', label: 'ID', type: 'text' };
  if (iId >= 0) cot.splice(iId, 1);
  cot.unshift(cotId);

  const tanSuat = DS_TAN_SUAT.includes(b.tanSuat as TanSuat) ? (b.tanSuat as TanSuat) : null;
  if (!tanSuat) return { loi: 'Tần suất không hợp lệ.' };
  const canGio = tanSuat === 'hang_ngay' || tanSuat === 'hang_tuan' || tanSuat === 'hang_thang';
  return {
    ok: {
      moduleId,
      cot,
      tanSuat,
      gio: canGio ? soNguyenTrong(b.gio, 0, 23, 7) : null,
      thu: tanSuat === 'hang_tuan' ? soNguyenTrong(b.thu, 1, 7, 1) : null,
      ngayThang: tanSuat === 'hang_thang' ? soNguyenTrong(b.ngayThang, 1, 31, 1) : null,
    },
  };
}
