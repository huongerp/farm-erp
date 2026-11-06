/**
 * Ẩn giá nhập trong đồng bộ Google Sheet: cùng luật `useXemGiaNhap` ở app — chỉ nhân viên toàn
 * quyền (cấp bậc 1 hoặc super admin) mới thấy đơn giá / thành tiền / tổng tiền của phiếu kho.
 * Server tự lọc theo chủ lịch, không tin danh sách cột client gửi (lịch tạo trước đây có thể
 * đã lưu cột giá).
 */
import { NGUON_DONG_BO } from './nguon-dong-bo.ts';

/** Bản sao `COT_GIA_PHIEU_KHO_PT` (features/.../phieu-kho-phan-thuoc/utils/loc-cot-gia.ts). */
export const COT_GIA: ReadonlySet<string> = new Set(['tong_tien', 'don_gia', 'thanh_tien']);

/** Bỏ cột giá khi chủ lịch không toàn quyền. Module không khai `anGiaNhap` thì giữ nguyên. */
export function locCotGia<T extends { key: string }>(cot: readonly T[], moduleId: string, toanQuyen: boolean): T[] {
  if (toanQuyen || !NGUON_DONG_BO[moduleId]?.anGiaNhap) return [...cot];
  return cot.filter((c) => !COT_GIA.has(c.key));
}

/**
 * Sheet còn cột đã bị bỏ nằm bên phải bảng mới (vd cột giá ở cuối) — `giongHeader` chỉ so
 * phần đầu nên không thấy, phải ép ghi lại toàn bộ để xoá cột cũ.
 */
export function conCotDaBo(headerCu: readonly string[], soCotMoi: number, nhanDaBo: readonly string[]): boolean {
  if (nhanDaBo.length === 0) return false;
  const bo = new Set(nhanDaBo.map((n) => n.trim()));
  return headerCu.slice(soCotMoi).some((h) => bo.has(h.trim()));
}
