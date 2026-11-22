/**
 * Dữ liệu cũ của «Năng suất nhóm» (bỏ từ 21/11/2026 — thưởng vượt lấy thùng vượt thu hồi của Báo cáo sơ chế,
 * xem `thuong-vuot-thung.ts`). Cột `so_thung_nhom` / `muc_tieu_ns_nhom` vẫn còn trong DB; form chỉ giữ
 * nguyên giá trị khi đọc / lưu, không hiển thị, không dùng để tính.
 */
import { SO_NHOM_TOI_DA } from './tong-hop-nhom';

/** Mục tiêu mặc định (thùng / giờ-người) khi tạo phiếu. */
export const MUC_TIEU_NS_NHOM_MAC_DINH = 3;

/** Số thùng theo nhóm của một chuyền: khoá "1".."9" → số ≥ 0; thiếu khoá = chưa nhập. */
export type SoThungNhom = Record<string, number>;

/** Chuẩn hoá jsonb `so_thung_nhom` từ DB / form: chỉ giữ khoá 1–9 có số ≥ 0. */
export function chuanHoaSoThungNhom(raw: unknown): SoThungNhom {
  const out: SoThungNhom = {};
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (let n = 1; n <= SO_NHOM_TOI_DA; n++) {
    const v = (raw as Record<string, unknown>)[String(n)];
    const so = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof so === 'number' && Number.isFinite(so) && so >= 0) out[String(n)] = so;
  }
  return out;
}

/** Mục tiêu của phiếu (dữ liệu cũ / sai → mặc định 3). */
export function mucTieuNsNhom(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : MUC_TIEU_NS_NHOM_MAC_DINH;
}
