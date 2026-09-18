/**
 * Phép sửa cache cho cập nhật lạc quan của chuông.
 *
 * Tách khỏi lớp hook để test được: đây là chỗ dễ sai lặng lẽ — đếm nhầm một
 * đơn vị thì badge lệch, và người dùng chỉ phát hiện khi thấy con số vô lý.
 */

import type { DemTheoModule, ThongBao, TrangThongBao } from './types';

export interface KetQuaSuaTrang {
  trang: TrangThongBao;
  /** Bản ghi trước khi sửa; undefined nghĩa là trang này không chứa nó. */
  truoc?: ThongBao;
}

/**
 * Áp một phép sửa lên đúng một thông báo trong trang.
 * `sua` trả null nghĩa là bỏ dòng đó khỏi danh sách.
 */
export function suaTrang(
  trang: TrangThongBao,
  id: string,
  sua: (tb: ThongBao) => ThongBao | null
): KetQuaSuaTrang {
  if (!trang.items.some((x) => x.id === id)) return { trang };

  let truoc: ThongBao | undefined;
  const items: ThongBao[] = [];

  for (const tb of trang.items) {
    if (tb.id !== id) {
      items.push(tb);
      continue;
    }
    truoc = tb;
    const moi = sua(tb);
    if (moi) items.push(moi);
  }

  const soBiBo = trang.items.length - items.length;
  return { trang: { items, tong: Math.max(0, trang.tong - soBiBo) }, truoc };
}

/** Đánh dấu đã đọc, giữ nguyên tham chiếu nếu vốn đã đọc rồi. */
export const danhDauDaDoc = (tb: ThongBao): ThongBao => (tb.daDoc ? tb : { ...tb, daDoc: true });

/** Bỏ khỏi danh sách. */
export const boKhoiDanhSach = (): null => null;

/** Giảm một đơn vị ở bộ đếm theo module, bỏ hẳn khoá khi về 0. */
export function giamDemTheoModule(dem: DemTheoModule, moduleId: string): DemTheoModule {
  const conLai = Math.max(0, (dem[moduleId] ?? 0) - 1);
  const moi = { ...dem };
  if (conLai === 0) delete moi[moduleId];
  else moi[moduleId] = conLai;
  return moi;
}
