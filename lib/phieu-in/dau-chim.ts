/**
 * Dấu chìm theo TRẠNG THÁI chứng từ (thuần). Trạng thái mỗi module lưu một kiểu — mã
 * (`cho_duyet`, `draft`, `rejected`…) hay nhãn tiếng Việt (`Chờ duyệt`, `Không duyệt`…) — nên
 * chuẩn hoá (bỏ dấu, thường hoá, khoảng trắng → `_`) rồi xếp vào một trong 4 loại. Bản chính
 * thức (đã duyệt, hoàn thành…) → null = không in dấu chìm.
 */
export type LoaiDauChim = 'nhap' | 'choDuyet' | 'daHuy' | 'khongDuyet';

export function chuanHoaTrangThai(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

const NHAP = new Set(['nhap', 'ban_nhap', 'draft', 'luu_nhap']);
const HUY = new Set(['huy', 'da_huy', 'bi_huy', 'cancelled', 'canceled', 'cancel', 'huy_bo', 'da_huy_bo']);
const KHONG_DUYET = new Set(['khong_duyet', 'tu_choi', 'bi_tu_choi', 'da_tu_choi', 'rejected', 'reject', 'khong_phe_duyet']);
const CHO_DUYET = new Set(['cho_duyet', 'doi_duyet', 'pending', 'cho_phe_duyet', 'dang_cho_duyet']);

/** Một trạng thái → loại dấu chìm (null = bản chính thức / không nhận ra). */
export function loaiDauChim(trangThai: string | null | undefined): LoaiDauChim | null {
  if (!trangThai) return null;
  const s = chuanHoaTrangThai(trangThai);
  if (NHAP.has(s)) return 'nhap';
  if (HUY.has(s)) return 'daHuy';
  if (KHONG_DUYET.has(s)) return 'khongDuyet';
  if (CHO_DUYET.has(s) || /^cho_.*duyet$/.test(s)) return 'choDuyet';
  return null;
}

/**
 * Nhiều trạng thái (vd trạng thái chung + trạng thái từng cấp duyệt) → loại «nặng» nhất:
 * huỷ > không duyệt > nháp > chờ duyệt.
 */
export function loaiDauChimNhieu(...ds: (string | null | undefined)[]): LoaiDauChim | null {
  const thuTu: LoaiDauChim[] = ['daHuy', 'khongDuyet', 'nhap', 'choDuyet'];
  const co = new Set(ds.map(loaiDauChim).filter((x): x is LoaiDauChim => x !== null));
  return thuTu.find((l) => co.has(l)) ?? null;
}
