import { describe, it, expect } from 'vitest';
import { tongHopHangMuc } from './tong-hop-hang-muc';

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
