import { describe, it, expect } from 'vitest';
import { phanLoaiXoa, duongDanPhieu, type PhieuDangDung } from './hang-hoa-dang-dung';

const phieu = (p: Partial<PhieuDangDung> & Pick<PhieuDangDung, 'idHangHoa' | 'idPhieu'>): PhieuDangDung => ({
  loai: 'phieu_kho',
  soPhieu: `NK-${p.idPhieu}`,
  ngay: '2026-05-01',
  trangThai: 'Đã duyệt',
  soDong: 1,
  ...p,
});

describe('phanLoaiXoa', () => {
  it('hàng không có phiếu nào → xoá được hết', () => {
    expect(phanLoaiXoa(['1', '2'], [])).toEqual({ xoaDuoc: ['1', '2'], dangDung: [], tongPhieu: 0 });
  });

  it('tách hàng đang dùng, giữ thứ tự chọn ban đầu', () => {
    const kq = phanLoaiXoa(['3', '1', '2'], [phieu({ idHangHoa: '2', idPhieu: '10' }), phieu({ idHangHoa: '3', idPhieu: '11' })]);
    expect(kq.xoaDuoc).toEqual(['1']);
    expect(kq.dangDung.map((h) => h.idHangHoa)).toEqual(['3', '2']);
  });

  it('một phiếu dùng nhiều hàng chỉ đếm một lần; cùng id khác loại là hai phiếu', () => {
    const kq = phanLoaiXoa(
      ['1', '2'],
      [
        phieu({ idHangHoa: '1', idPhieu: '10' }),
        phieu({ idHangHoa: '2', idPhieu: '10' }),
        phieu({ idHangHoa: '2', idPhieu: '10', loai: 'don_dat_hang' }),
      ]
    );
    expect(kq.tongPhieu).toBe(2);
  });

  it('bỏ qua tham chiếu của hàng không nằm trong danh sách xoá, và id chọn trùng', () => {
    const kq = phanLoaiXoa(['1', '1'], [phieu({ idHangHoa: '9', idPhieu: '10' })]);
    expect(kq).toEqual({ xoaDuoc: ['1'], dangDung: [], tongPhieu: 0 });
  });

  it('phiếu của một hàng sắp theo loại, rồi ngày mới nhất trước', () => {
    const kq = phanLoaiXoa(
      ['1'],
      [
        phieu({ idHangHoa: '1', idPhieu: '1', loai: 'don_dat_hang', ngay: '2026-09-01' }),
        phieu({ idHangHoa: '1', idPhieu: '2', ngay: '2026-01-01' }),
        phieu({ idHangHoa: '1', idPhieu: '3', ngay: '2026-08-01' }),
        phieu({ idHangHoa: '1', idPhieu: '4', ngay: null }),
      ]
    );
    expect(kq.dangDung[0].phieu.map((p) => p.idPhieu)).toEqual(['3', '2', '4', '1']);
  });
});

describe('duongDanPhieu', () => {
  it('phiếu kho / ĐĐH / phiếu kho PT có trang xem; phiếu kiểm kê chưa có', () => {
    expect(duongDanPhieu('phieu_kho', '5')).toBe('/mua-hang/phieu-kho/preview/5');
    expect(duongDanPhieu('don_dat_hang', '5')).toBe('/mua-hang/don-dat-hang/preview/5');
    expect(duongDanPhieu('phieu_kho_pt', '5')).toBe('/quan-ly-nha-so-che/phieu-kho-phan-thuoc/preview/5');
    expect(duongDanPhieu('phieu_kiem_ke', '5')).toBeNull();
  });
});
