/** Tiện ích quét QR bằng camera — dùng chung cho components/shared/QrScannerDialog. */

/**
 * Bộ lọc quét trùng khi quét liên tục. Mọi thùng cùng loại có CÙNG một mã, nên phải
 * phân biệt "vẫn đang chĩa vào thùng cũ" với "đã sang thùng mới":
 *
 * - `thay(ma)` mỗi khung hình đọc được mã → `true` nếu được tính là một thùng mới.
 * - `trong()` mỗi khung hình đọc xong mà KHÔNG có mã (camera đã rời tem).
 *
 * Cùng mã chỉ được tính lại khi đã thấy khung trống liên tục ≥ `roiTemMs`. Không dựa vào
 * khoảng thời gian giữa hai lần đọc: máy quét có thể khựng cả giây (máy yếu, đang ghi
 * dữ liệu) trong khi tem vẫn nằm trong khung — lúc đó không có khung trống nào.
 * Mã khác mã trước → luôn tính.
 */
export function taoBoLocQuetTrung(roiTemMs = 500) {
  let maCuoi: string | null = null;
  let trongTu: number | null = null;
  return {
    thay(ma: string, bayGio: number): boolean {
      const daRoiTem = trongTu != null && bayGio - trongTu >= roiTemMs;
      const tinh = ma !== maCuoi || daRoiTem;
      maCuoi = ma;
      trongTu = null;
      return tinh;
    },
    trong(bayGio: number): void {
      if (maCuoi != null && trongTu == null) trongTu = bayGio;
    },
    /** Sau khi hoàn tác / nhập tay: lần quét kế tiếp luôn được tính. */
    datLai(): void {
      maCuoi = null;
      trongTu = null;
    },
  };
}
