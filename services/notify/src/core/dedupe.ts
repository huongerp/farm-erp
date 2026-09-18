/**
 * Gộp thông báo trùng.
 *
 * Duyệt hàng loạt hay sửa phiếu liên tiếp sinh ra một chuỗi sự kiện gần như
 * giống hệt. Không gộp thì chuông đầy 20 dòng cùng nội dung và người dùng tắt
 * thông báo ngay hôm sau.
 */

/** Hai sự kiện cùng loại trên cùng bản ghi cách nhau dưới ngần này thì gộp. */
export const CUA_SO_GOP_MS = 60_000;

export interface KhoaGop {
  nguoiNhanId: number;
  bang: string;
  banGhiId: number;
  loaiSuKien: string;
}

export function khoaGopToString(k: KhoaGop): string {
  return `${k.nguoiNhanId}|${k.bang}|${k.banGhiId}|${k.loaiSuKien}`;
}

/**
 * Có gộp vào dòng cũ thay vì tạo dòng mới không.
 *
 * `tgCapNhatDongCu` null nghĩa là chưa có dòng nào khớp khoá → phải tạo mới.
 * Mốc so là thời điểm CẬP NHẬT gần nhất chứ không phải thời điểm tạo: chuỗi sự
 * kiện rải đều mỗi 30 giây vẫn gộp hết vào một dòng, đúng ý "một việc một dòng".
 */
export function nenGop(
  tgCapNhatDongCu: Date | null,
  bayGio: Date,
  cuaSoMs: number = CUA_SO_GOP_MS
): boolean {
  if (tgCapNhatDongCu === null) return false;
  const cach = bayGio.getTime() - tgCapNhatDongCu.getTime();
  return cach >= 0 && cach < cuaSoMs;
}
