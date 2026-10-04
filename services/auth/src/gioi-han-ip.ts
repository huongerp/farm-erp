/**
 * Chặn dò mật khẩu theo IP — bổ sung cho lớp chặn theo email trong DB (10 lần sai / 15 phút
 * / email). Lớp email không cản được kiểu thử MỘT mật khẩu yếu trên rất nhiều email.
 *
 * Chỉ đếm lần đăng nhập SAI: cả văn phòng thường ra Internet chung một IP, đếm cả lần đúng
 * thì người dùng hợp lệ bị chặn lây. Lưu trong bộ nhớ (một instance auth-service) — khởi
 * động lại là reset, chấp nhận được cho mục đích hãm tốc.
 */
export interface BoGioiHan {
  /** true nếu khoá này đã chạm ngưỡng trong cửa sổ hiện tại. */
  biChan(khoa: string, bayGio?: number): boolean;
  /** Ghi một lần sai. */
  ghiLanSai(khoa: string, bayGio?: number): void;
}

export function taoBoGioiHan(soLanToiDa: number, cuaSoMs: number, soKhoaToiDa = 10_000): BoGioiHan {
  const lanSai = new Map<string, number[]>();

  const conHan = (khoa: string, bayGio: number): number[] => {
    const ds = (lanSai.get(khoa) ?? []).filter((t) => bayGio - t < cuaSoMs);
    if (ds.length === 0) lanSai.delete(khoa);
    else lanSai.set(khoa, ds);
    return ds;
  };

  return {
    biChan(khoa, bayGio = Date.now()) {
      return conHan(khoa, bayGio).length >= soLanToiDa;
    },
    ghiLanSai(khoa, bayGio = Date.now()) {
      // Giới hạn bộ nhớ khi bị dội từ rất nhiều IP: bỏ khoá cũ nhất (Map giữ thứ tự chèn).
      if (!lanSai.has(khoa) && lanSai.size >= soKhoaToiDa) {
        const cuNhat = lanSai.keys().next().value;
        if (cuNhat !== undefined) lanSai.delete(cuNhat);
      }
      const ds = conHan(khoa, bayGio);
      ds.push(bayGio);
      lanSai.set(khoa, ds);
    },
  };
}
