/**
 * Thực hiện chứng từ TỪNG PHẦN: một phiếu nguồn (đề xuất mua hàng, đơn đặt hàng, đề xuất vật tư)
 * sinh nhiều phiếu đích (phiếu nhập kho, đơn đặt hàng) qua nhiều lần, cùng một hàng hoá có thể
 * xuất hiện ở nhiều phiếu đích nhưng TỔNG không được vượt số lượng ở phiếu nguồn.
 *
 * Đối chiếu theo `id_hang_hoa` (không theo id dòng): service cập nhật phiếu nguồn xoá rồi chèn
 * lại toàn bộ dòng chi tiết nên id dòng không ổn định. Nguồn có nhiều dòng cùng hàng → cộng gộp.
 */

export interface DongSoLuong {
  id_hang_hoa: string | number | null | undefined;
  so_luong: number | string | null | undefined;
}

export interface ConLaiTheoHang {
  id_hang_hoa: string;
  so_luong_nguon: number;
  da_thuc_hien: number;
  con_lai: number;
}

/** Một hàng được chọn ở popup tạo phiếu từng phần: số lượng LẦN NÀY. */
export interface DongDaChon {
  id_hang_hoa: string;
  so_luong: number;
}

export interface DongVuot {
  id_hang_hoa: string;
  /** Số lượng nguồn (0 nếu hàng không có trong phiếu nguồn). */
  so_luong_nguon: number;
  /** Đã thực hiện ở các phiếu đích khác (không tính phiếu đang lưu). */
  da_thuc_hien: number;
  /** Số lượng của phiếu đang lưu. */
  lan_nay: number;
  /** Tối đa còn được phép cho phiếu đang lưu. */
  toi_da: number;
}

/** Cột numeric(18,4): làm tròn 4 chữ số để 0,1 + 0,2 không thành 0,30000000000000004. */
const lamTron = (n: number) => Math.round(n * 1e4) / 1e4;

const khoaHang = (id: DongSoLuong['id_hang_hoa']) => String(id ?? '').trim();

/** Tổng số lượng theo hàng hoá; bỏ dòng thiếu hàng hoá hoặc số lượng không dương. */
export function tongTheoHangHoa(lines: readonly DongSoLuong[] | null | undefined): Map<string, number> {
  const tong = new Map<string, number>();
  for (const l of lines ?? []) {
    const id = khoaHang(l.id_hang_hoa);
    const sl = Number(l.so_luong);
    if (!id || !Number.isFinite(sl) || sl <= 0) continue;
    tong.set(id, lamTron((tong.get(id) ?? 0) + sl));
  }
  return tong;
}

/** Số đã thực hiện / còn lại theo từng hàng của phiếu nguồn, giữ thứ tự xuất hiện ở nguồn. */
export function tinhConLai(
  nguon: readonly DongSoLuong[] | null | undefined,
  daThucHien: readonly DongSoLuong[] | null | undefined
): ConLaiTheoHang[] {
  const tongNguon = tongTheoHangHoa(nguon);
  const tongDa = tongTheoHangHoa(daThucHien);
  return [...tongNguon].map(([id, slNguon]) => {
    const da = tongDa.get(id) ?? 0;
    return { id_hang_hoa: id, so_luong_nguon: slNguon, da_thuc_hien: da, con_lai: Math.max(0, lamTron(slNguon - da)) };
  });
}

/** Còn hàng nào chưa thực hiện đủ không (để bật/tắt nút tạo phiếu). */
export function conHangChuaDu(conLai: readonly ConLaiTheoHang[]): boolean {
  return conLai.some((r) => r.con_lai > 0);
}

/**
 * Hàng của phiếu đang lưu làm tổng vượt số lượng nguồn. `daThucHienKhac` KHÔNG được chứa chính
 * phiếu đang lưu (khi sửa phiếu cũ phải loại nó ra trước).
 * - Hàng KHÔNG có trong nguồn được bỏ qua: thực tế vẫn thêm hàng ngoài đề xuất / đơn khi mua.
 * - `dongCu` (bản đã lưu của phiếu đang sửa): phiếu lập trước khi có luật này có thể đã vượt; sửa
 *   lại không bắt giảm, chỉ chặn TĂNG quá mức cũ.
 */
export function timDongVuot(
  nguon: readonly DongSoLuong[] | null | undefined,
  daThucHienKhac: readonly DongSoLuong[] | null | undefined,
  dongPhieuNay: readonly DongSoLuong[] | null | undefined,
  dongCu?: readonly DongSoLuong[] | null
): DongVuot[] {
  const tongNguon = tongTheoHangHoa(nguon);
  const tongDa = tongTheoHangHoa(daThucHienKhac);
  const tongCu = tongTheoHangHoa(dongCu);
  const vuot: DongVuot[] = [];
  for (const [id, lanNay] of tongTheoHangHoa(dongPhieuNay)) {
    const slNguon = tongNguon.get(id);
    if (slNguon == null) continue;
    const da = tongDa.get(id) ?? 0;
    const toiDa = Math.max(0, lamTron(slNguon - da));
    if (lanNay > Math.max(toiDa, tongCu.get(id) ?? 0)) {
      vuot.push({ id_hang_hoa: id, so_luong_nguon: slNguon, da_thuc_hien: da, lan_nay: lanNay, toi_da: toiDa });
    }
  }
  return vuot;
}

/**
 * Ghép lựa chọn ở popup (hàng + SL lần này) với dòng nguồn ĐẦU TIÊN của hàng đó, để phiếu đích
 * mang theo ghi chú / đơn giá… của nguồn. Thứ tự theo lựa chọn; hàng không có trong nguồn bị bỏ.
 */
export function ghepDongChon<T extends DongSoLuong>(
  nguon: readonly T[] | null | undefined,
  dongChon: readonly DongDaChon[]
): { dong: T; so_luong: number }[] {
  const dauTien = new Map<string, T>();
  for (const d of nguon ?? []) {
    const id = khoaHang(d.id_hang_hoa);
    if (id && !dauTien.has(id)) dauTien.set(id, d);
  }
  return dongChon.flatMap((c) => {
    const dong = dauTien.get(khoaHang(c.id_hang_hoa));
    return dong && c.so_luong > 0 ? [{ dong, so_luong: c.so_luong }] : [];
  });
}

/** Dòng hiển thị ở popup chọn hàng: số liệu còn lại + tên / mã / ĐVT lấy từ dòng nguồn. */
export interface DongChonTaoPhieu extends ConLaiTheoHang {
  ten_hang: string;
  ma_hang?: string | null;
  don_vi_tinh?: string | null;
}

export function ganThongTinHang<T extends DongSoLuong>(
  conLai: readonly ConLaiTheoHang[],
  nguon: readonly T[] | null | undefined,
  info: (dong: T) => { ten_hang?: string | null; ma_hang?: string | null; don_vi_tinh?: string | null }
): DongChonTaoPhieu[] {
  const dauTien = new Map<string, T>();
  for (const d of nguon ?? []) {
    const id = khoaHang(d.id_hang_hoa);
    if (id && !dauTien.has(id)) dauTien.set(id, d);
  }
  return conLai.map((r) => {
    const d = dauTien.get(r.id_hang_hoa);
    const i = d ? info(d) : {};
    return { ...r, ten_hang: i.ten_hang ?? '', ma_hang: i.ma_hang ?? null, don_vi_tinh: i.don_vi_tinh ?? null };
  });
}

/** Chuỗi liệt kê hàng vượt cho toast: "Keo đỏ (tối đa 4), Băng keo (tối đa 0)". */
export function moTaDongVuot(
  vuot: readonly DongVuot[],
  tenHang: (idHangHoa: string) => string,
  dinhDang: (ten: string, toiDa: number) => string
): string {
  return vuot.map((v) => dinhDang(tenHang(v.id_hang_hoa) || v.id_hang_hoa, v.toi_da)).join(', ');
}
