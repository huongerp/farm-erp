/**
 * Bộ đếm khoá cuộn trang dùng chung cho mọi overlay (drawer, sheet, modal).
 *
 * Vấn đề: mỗi overlay trước đây tự làm `const goc = document.body.style.overflow`
 * rồi đặt `'hidden'`, khi đóng thì trả lại `goc`. Nếu mở sheet B trong khi sheet A
 * còn mở, B chụp được giá trị đã bị A đặt là `'hidden'` và coi đó là "giá trị gốc"
 * — đóng cả hai xong body vẫn kẹt `overflow: hidden`, người dùng không cuộn trang
 * được nữa và chỉ còn cách tải lại.
 *
 * Ở đây chỉ overlay ĐẦU TIÊN ghi nhớ giá trị thật và khoá; overlay cuối cùng đóng
 * mới trả lại. Cùng tinh thần với lib/overlay-stack.ts.
 */

let soOverlayDangKhoa = 0;
let giaTriGoc: string | null = null;

/**
 * Khoá cuộn body, trả về hàm nhả. Gọi hàm nhả nhiều lần cũng an toàn (chỉ trừ 1 lần),
 * nên dùng trực tiếp làm cleanup của useEffect.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (soOverlayDangKhoa === 0) {
    giaTriGoc = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  soOverlayDangKhoa += 1;

  let daNha = false;
  return () => {
    if (daNha) return;
    daNha = true;
    soOverlayDangKhoa -= 1;
    if (soOverlayDangKhoa <= 0) {
      soOverlayDangKhoa = 0;
      document.body.style.overflow = giaTriGoc ?? '';
      giaTriGoc = null;
    }
  };
}
