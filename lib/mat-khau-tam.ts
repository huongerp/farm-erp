/**
 * Mật khẩu tạm cấp khi admin tạo tài khoản / đặt lại mật khẩu mà không tự nhập — thay cho
 * mật khẩu mặc định cố định (ai biết "123456" là đăng nhập được mọi tài khoản mới).
 * Luôn đi kèm cờ `phai_doi_mat_khau = true` để nhân viên đổi ở lần đăng nhập đầu.
 *
 * Bỏ ký tự dễ đọc nhầm khi đọc / chép tay: 0 O o, 1 l I.
 */
const BANG_KY_TU = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function taoMatKhauTam(doDai = 10): string {
  // Loại giá trị ≥ bội lớn nhất của độ dài bảng để mỗi ký tự có xác suất như nhau.
  const nguong = 256 - (256 % BANG_KY_TU.length);
  let kq = '';
  const buf = new Uint8Array(doDai * 2);
  while (kq.length < doDai) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < nguong) kq += BANG_KY_TU[b % BANG_KY_TU.length];
      if (kq.length === doDai) break;
    }
  }
  return kq;
}
