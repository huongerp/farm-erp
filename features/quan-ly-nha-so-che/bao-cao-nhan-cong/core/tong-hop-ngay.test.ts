import { describe, expect, it } from 'vitest';
import { laNgayYmdHopLe, tongHopNhanSuTheoNgay, type PhieuTongHopNgay } from './tong-hop-ngay';

const ct = (loai_chuyen: string, sl_cong_ngay: unknown, sl_cong_nua: unknown, sl_tang_ca: unknown = 0) => ({
  loai_chuyen,
  sl_cong_ngay,
  sl_cong_nua,
  sl_tang_ca,
});

const phieu = (id: string, ten: string, chi_tiet: PhieuTongHopNgay['chi_tiet']): PhieuTongHopNgay => ({
  id_chi_nhanh: id,
  ten_chi_nhanh: ten,
  chi_tiet,
});

describe('tongHopNhanSuTheoNgay', () => {
  it('ánh xạ đúng cột, gộp xắn + tỉa, ô = ngày + nửa (không chia đôi, không tăng ca)', () => {
    const { dong } = tongHopNhanSuTheoNgay(
      [
        phieu('1', 'Nhà A', [
          ct('CONG_DINH_BIEN_KHONG_SAN_XUAT', 2, 1),
          ct('XAN_NAI', 5, 0),
          ct('TIA_DANH_GIA', 3, 2),
          ct('CAN_TEM_DONG_THUNG', 4, 1, 9),
          ct('KHO_HUT_CHAN_KHONG', 1, 0, 7),
          ct('CONG_TANG_CUONG', 0, 3),
        ]),
      ],
      []
    );
    expect(dong).toHaveLength(1);
    expect(dong[0]!.soNguoi).toEqual({ quanLy: 3, xanTia: 10, canDongThung: 5, kho: 1, tangCuong: 3 });
    expect(dong[0]!.tongNs).toBe(22);
    expect(dong[0]!.daBaoCao).toBe(true);
  });

  it('hai phiếu cùng nhà sơ chế cộng dồn vào một dòng', () => {
    const { dong, tongCong } = tongHopNhanSuTheoNgay(
      [phieu('1', 'Nhà A', [ct('XAN_NAI', 2, 0)]), phieu('1', 'Nhà A', [ct('XAN_NAI', 3, 1)])],
      []
    );
    expect(dong).toHaveLength(1);
    expect(dong[0]!.soNguoi.xanTia).toBe(6);
    expect(tongCong.xanTia).toBe(6);
    expect(tongCong.tongNs).toBe(6);
  });

  it('nhà sơ chế chưa báo cáo vẫn có dòng nhưng không vào tổng cộng; sắp theo tên', () => {
    const { dong, tongCong } = tongHopNhanSuTheoNgay(
      [phieu('2', 'Nhà Bình', [ct('KHO_HUT_CHAN_KHONG', 4, 0)])],
      [
        { id_chi_nhanh: '2', ten_chi_nhanh: 'Nhà Bình' },
        { id_chi_nhanh: '3', ten_chi_nhanh: 'Nhà An' },
        { id_chi_nhanh: '3', ten_chi_nhanh: 'Nhà An' },
      ]
    );
    expect(dong.map((d) => [d.tenChiNhanh, d.daBaoCao])).toEqual([
      ['Nhà An', false],
      ['Nhà Bình', true],
    ]);
    expect(tongCong).toEqual({ quanLy: 0, xanTia: 0, canDongThung: 0, kho: 4, tangCuong: 0, tongNs: 4 });
  });

  it('giá trị rỗng / null / chuỗi lỗi → 0, chuỗi số vẫn cộng', () => {
    const { dong } = tongHopNhanSuTheoNgay(
      [phieu('1', 'Nhà A', [ct('XAN_NAI', null, ''), ct('TIA_DANH_GIA', 'abc', undefined), ct('KHO_HUT_CHAN_KHONG', '2', '1')])],
      []
    );
    expect(dong[0]!.soNguoi).toEqual({ quanLy: 0, xanTia: 0, canDongThung: 0, kho: 3, tangCuong: 0 });
    expect(Number.isNaN(dong[0]!.tongNs)).toBe(false);
  });

  it('tổng cộng cộng theo cột nhiều nhà sơ chế, bỏ qua loại chuyền lạ', () => {
    const { tongCong } = tongHopNhanSuTheoNgay(
      [
        phieu('1', 'Nhà A', [ct('CONG_DINH_BIEN_KHONG_SAN_XUAT', 1, 0), ct('LOAI_LA', 99, 99)]),
        phieu('2', 'Nhà B', [ct('CONG_DINH_BIEN_KHONG_SAN_XUAT', 2, 1), ct('CONG_TANG_CUONG', 5, 0)]),
      ],
      []
    );
    expect(tongCong).toEqual({ quanLy: 4, xanTia: 0, canDongThung: 0, kho: 0, tangCuong: 5, tongNs: 9 });
  });

  it('không có phiếu, không có nhà sơ chế → rỗng', () => {
    const { dong, tongCong } = tongHopNhanSuTheoNgay([], []);
    expect(dong).toEqual([]);
    expect(tongCong.tongNs).toBe(0);
  });
});

describe('laNgayYmdHopLe', () => {
  it('chỉ nhận yyyy-mm-dd có thật', () => {
    expect(laNgayYmdHopLe('2026-10-27')).toBe(true);
    expect(laNgayYmdHopLe('2026-02-30')).toBe(false);
    expect(laNgayYmdHopLe('27/10/2026')).toBe(false);
    expect(laNgayYmdHopLe(null)).toBe(false);
  });
});
