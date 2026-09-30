/**
 * Tìm / lọc / đi dòng kế tiếp trên bảng chi tiết kiểm kê trong drawer.
 *
 * Dùng chung cho hai module kiểm kê (`kho-van/kiem-ke-kho`,
 * `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc`): phần này chỉ cần vài cột hiển
 * thị giống hệt nhau, không dính kiểu dữ liệu riêng của từng module.
 */
import { matchesSearch } from './search-text';

export type KetQuaKiemKeChung = 'khop' | 'thieu' | 'thua' | 'chua_kiem';

export interface DongKiemKeTimLoc {
  id: string;
  ket_qua: KetQuaKiemKeChung;
  ten_hang?: string | null;
  ma_hang?: string | null;
  ten_kho?: string | null;
  ma_kho?: string | null;
  ghi_chu_dong?: string | null;
}

export interface BoLocChiTietKiemKe {
  /** Từ khoá: tên / mã hàng, kho, ghi chú dòng — bỏ dấu, mọi từ phải khớp. */
  q: string;
  /** `null` = mọi kết quả. */
  ketQua: KetQuaKiemKeChung | null;
}

export function locChiTietKiemKe<T extends DongKiemKeTimLoc>(rows: T[], boLoc: BoLocChiTietKiemKe): T[] {
  const q = boLoc.q.trim();
  if (!q && !boLoc.ketQua) return rows;
  return rows.filter(
    (r) =>
      (!boLoc.ketQua || r.ket_qua === boLoc.ketQua) &&
      matchesSearch([r.ten_hang, r.ma_hang, r.ten_kho, r.ma_kho, r.ghi_chu_dong], q)
  );
}

/**
 * Dòng CHƯA KIỂM kế tiếp sau `currentId` theo đúng thứ tự đang hiển thị — phục vụ
 * nút "Lưu & dòng tiếp". Hết phía dưới thì vòng lên đầu để không sót dòng đã bỏ
 * qua; không còn dòng nào thì `null`.
 *
 * `currentId` luôn bị loại: lúc gọi, danh sách vẫn là bản trước khi lưu nên dòng
 * vừa nhập có thể còn mang `chua_kiem`.
 */
export function timDongChuaKiemTiepTheo<T extends Pick<DongKiemKeTimLoc, 'id' | 'ket_qua'>>(
  rows: T[],
  currentId: string
): T | null {
  const start = rows.findIndex((r) => r.id === currentId);
  const n = rows.length;
  for (let step = 1; step <= n; step += 1) {
    const r = rows[(start + step + n) % n];
    if (r && r.id !== currentId && r.ket_qua === 'chua_kiem') return r;
  }
  return null;
}
