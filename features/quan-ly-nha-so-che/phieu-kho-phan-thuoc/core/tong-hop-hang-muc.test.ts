import { describe, it, expect } from 'vitest';
import { chuanHoaGiaTriXuatChuyen, tongHopHangMuc } from './tong-hop-hang-muc';

describe('tongHopHangMuc', () => {
  it('quy chuỗi số về number, tong = tiền xuất + tiền luân chuyển', () => {
    const { dong } = tongHopHangMuc([
      { hangMuc: 'Phân bón', tienXuat: '120.5', tienChuyen: '30', soDong: '3' },
    ]);
    expect(dong).toEqual([
      { hangMuc: 'Phân bón', tienXuat: 120.5, tienChuyen: 30, tong: 150.5, soDong: 3 },
    ]);
  });

  it('ô trống / không phải số → 0, không ném lỗi', () => {
    const { dong, tongCong } = tongHopHangMuc([{ hangMuc: '', tienXuat: null, tienChuyen: 'abc' }]);
    expect(dong[0]).toEqual({ hangMuc: null, tienXuat: 0, tienChuyen: 0, tong: 0, soDong: 0 });
    expect(tongCong).toEqual({ tienXuat: 0, tienChuyen: 0, tong: 0, soDong: 0 });
  });

  it('sắp theo tổng giảm dần', () => {
    const { dong } = tongHopHangMuc([
      { hangMuc: 'A', tienXuat: 10, tienChuyen: 0 },
      { hangMuc: 'B', tienXuat: 100, tienChuyen: 0 },
      { hangMuc: 'C', tienXuat: 50, tienChuyen: 0 },
    ]);
    expect(dong.map((d) => d.hangMuc)).toEqual(['B', 'C', 'A']);
  });

  it('tổng bằng nhau thì theo tên (locale vi), null luôn xếp cuối', () => {
    const { dong } = tongHopHangMuc([
      { hangMuc: null, tienXuat: 999, tienChuyen: 0 },
      { hangMuc: 'Đạm', tienXuat: 10, tienChuyen: 0 },
      { hangMuc: 'Thuốc', tienXuat: 10, tienChuyen: 0 },
    ]);
    // 'Thuốc' và 'Đạm' cùng tổng 10 → so tên; dòng null (tổng 999) vẫn đứng cuối.
    expect(dong.map((d) => d.hangMuc)).toEqual(['Đạm', 'Thuốc', null]);
  });

  it('dòng rỗng → kết quả rỗng, tổng cộng bằng 0', () => {
    const { dong, tongCong } = tongHopHangMuc([]);
    expect(dong).toEqual([]);
    expect(tongCong).toEqual({ tienXuat: 0, tienChuyen: 0, tong: 0, soDong: 0 });
  });

  it('tổng cộng gộp đúng từng cột của mọi dòng', () => {
    const { tongCong } = tongHopHangMuc([
      { hangMuc: 'A', tienXuat: 10, tienChuyen: 5, soDong: 1 },
      { hangMuc: 'B', tienXuat: 20, tienChuyen: 15, soDong: 2 },
    ]);
    expect(tongCong).toEqual({ tienXuat: 30, tienChuyen: 20, tong: 50, soDong: 3 });
  });
});

describe('chuanHoaGiaTriXuatChuyen', () => {
  it('null / thiếu mảng → kết quả rỗng, tổng 0', () => {
    const kq = chuanHoaGiaTriXuatChuyen(null);
    expect(kq.tong).toEqual({ tienXuat: 0, tienChuyen: 0, soDong: 0, soDongChuaGia: 0 });
    expect(kq.luanChuyen).toEqual([]);
    expect(kq.theoKho).toEqual([]);
    expect(kq.chuaCoGia).toEqual([]);
    expect(kq.hangMuc.dong).toEqual([]);
  });

  it('quy chuỗi số, sắp tuyến luân chuyển theo tiền rồi số dòng', () => {
    const kq = chuanHoaGiaTriXuatChuyen({
      tong: { tien_xuat: '100', tien_chuyen: '40', so_dong: '5', so_dong_chua_gia: '2' },
      luanChuyen: [
        { id_kho_di: '1', ten_kho_di: 'fp1', id_kho_den: '2', ten_kho_den: 'fp2', so_dong: '9', tien: '0' },
        { id_kho_di: '3', ten_kho_di: 'fp3', id_kho_den: '1', ten_kho_den: 'fp1', so_dong: '1', tien: '40' },
        { id_kho_di: '2', ten_kho_di: '', id_kho_den: '3', ten_kho_den: null, so_dong: '20', tien: '0' },
      ],
    });
    expect(kq.tong).toEqual({ tienXuat: 100, tienChuyen: 40, soDong: 5, soDongChuaGia: 2 });
    expect(kq.luanChuyen.map((d) => d.id)).toEqual(['3-1', '2-3', '1-2']);
    // Tên trống → rơi về id kho.
    expect(kq.luanChuyen[1]).toMatchObject({ tenKhoDi: '2', tenKhoDen: '3', soDong: 20 });
  });

  it('theo kho sắp theo tổng xuất + chuyển đi + nhận về; hạng mục đi qua tongHopHangMuc', () => {
    const kq = chuanHoaGiaTriXuatChuyen({
      theoKho: [
        { id_kho: '1', ten_kho: 'A', tien_xuat: '10', tien_chuyen_di: 0, tien_nhan_ve: 0 },
        { id_kho: '2', ten_kho: 'B', tien_xuat: 0, tien_chuyen_di: '5', tien_nhan_ve: '20' },
      ],
      theoHangMuc: [
        { hang_muc: null, tien_xuat: 0, tien_chuyen: 0, so_dong: 7 },
        { hang_muc: 'Phục vụ sản xuất', tien_xuat: '0', tien_chuyen: '440000', so_dong: 1 },
      ],
    });
    expect(kq.theoKho.map((k) => k.tenKho)).toEqual(['B', 'A']);
    expect(kq.hangMuc.dong.map((d) => d.hangMuc)).toEqual(['Phục vụ sản xuất', null]);
    expect(kq.hangMuc.tongCong).toEqual({ tienXuat: 0, tienChuyen: 440000, tong: 440000, soDong: 8 });
  });

  it('phẩm cấp: chuỗi số → number, nhóm trống (null/rỗng) xếp cuối, tổng cộng gộp đủ', () => {
    const kq = chuanHoaGiaTriXuatChuyen({
      theoPhamCap: [
        { pham_cap: null, tien_xuat: '900', tien_chuyen: '100', so_dong: '939' },
        { pham_cap: 'NĐ', tien_xuat: '50', tien_chuyen: 0, so_dong: 109 },
        { pham_cap: ' XK ', tien_xuat: '300', tien_chuyen: '20', so_dong: '158' },
      ],
    });
    expect(kq.phamCap.dong.map((d) => d.hangMuc)).toEqual(['XK', 'NĐ', null]);
    expect(kq.phamCap.dong[0]).toEqual({ hangMuc: 'XK', tienXuat: 300, tienChuyen: 20, tong: 320, soDong: 158 });
    expect(kq.phamCap.tongCong).toEqual({ tienXuat: 1250, tienChuyen: 120, tong: 1370, soDong: 1206 });
    expect(chuanHoaGiaTriXuatChuyen(null).phamCap.dong).toEqual([]);
  });
});
