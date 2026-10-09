/**
 * Thành phẩm của phiếu GSCL = hàng hoá Nhà sơ chế thuộc nhóm "Thành phẩm"
 * (danh mục mã THANH-PHAM / THANHPHAM) hoặc mọi nhóm con của nó.
 */

interface DanhMucLite {
  id: string;
  ma_danh_muc: string;
  id_cha: string | null;
}

interface HangHoaLite {
  danh_muc_id: string | null;
  danh_muc_cha_id: string | null;
}

const MA_THANH_PHAM = 'THANHPHAM';

const chuanHoaMa = (ma: string) => ma.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Id các danh mục thuộc nhánh Thành phẩm (gốc + mọi cấp con). */
export function idDanhMucThanhPham(danhMuc: DanhMucLite[]): Set<string> {
  const ids = new Set(danhMuc.filter((d) => chuanHoaMa(d.ma_danh_muc) === MA_THANH_PHAM).map((d) => d.id));
  let them = true;
  while (them) {
    them = false;
    for (const d of danhMuc) {
      if (d.id_cha && ids.has(d.id_cha) && !ids.has(d.id)) {
        ids.add(d.id);
        them = true;
      }
    }
  }
  return ids;
}

/** Lọc hàng thuộc nhóm Thành phẩm. Chưa khai nhóm Thành phẩm → trả cả danh sách để form không trống. */
export function locThanhPham<T extends HangHoaLite>(hangHoa: T[], danhMuc: DanhMucLite[]): T[] {
  const ids = idDanhMucThanhPham(danhMuc);
  if (ids.size === 0) return hangHoa;
  return hangHoa.filter(
    (h) => (h.danh_muc_id != null && ids.has(h.danh_muc_id)) || (h.danh_muc_cha_id != null && ids.has(h.danh_muc_cha_id))
  );
}
