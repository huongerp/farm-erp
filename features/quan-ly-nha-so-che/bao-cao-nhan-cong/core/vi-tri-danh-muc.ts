/**
 * Gộp gợi ý ô «Vị trí công việc»: danh mục chuẩn (đang dùng, đúng thứ tự thu_tu) trước,
 * sau đó các vị trí còn xuất hiện trong danh mục nhân viên / dòng đang sửa nhưng chưa có
 * trong danh mục — để phiếu cũ vẫn chọn lại được mà không bị mất chữ.
 */
import { khoaTen, tenKhongTrung } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import type { VarViTriSoChe } from './types';

export function gopViTriOptions(
  danhMuc: readonly VarViTriSoChe[],
  tenKhac: readonly (string | null | undefined)[]
): string[] {
  const daCo = new Set<string>();
  const ketQua: string[] = [];

  for (const vt of danhMuc) {
    if (!vt.dang_dung) continue;
    const ten = vt.ten.trim();
    const k = khoaTen(ten);
    if (!k || daCo.has(k)) continue;
    daCo.add(k);
    ketQua.push(ten);
  }

  for (const ten of tenKhongTrung(tenKhac)) {
    const k = khoaTen(ten);
    if (daCo.has(k)) continue;
    daCo.add(k);
    ketQua.push(ten);
  }

  return ketQua;
}
