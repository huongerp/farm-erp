import { describe, expect, it } from 'vitest';
import {
  chuanHoaCaiDatIn,
  coChuHienThi,
  doiCoChu,
  dungLuoiBang,
  kichThuocGiayIn,
  laLeDeu,
  phanKhacMacDinh,
} from './cai-dat-in';

describe('chuanHoaCaiDatIn', () => {
  it('rỗng → mặc định của mẫu; leMm của mẫu thành lề đều bốn cạnh', () => {
    const c = chuanHoaCaiDatIn(undefined, { kho: 'a5', huong: 'ngang', leMm: 8 });
    expect(c).toMatchObject({ kho: 'a5', huong: 'ngang', font: 'mac-dinh', tiLeChu: 1, soLien: 1, qr: false });
    expect(c.le).toEqual({ tren: 8, phai: 8, duoi: 8, trai: 8 });
  });

  it('mẫu khai `le` từng cạnh đè lên `leMm`', () => {
    const c = chuanHoaCaiDatIn({}, { leMm: 10, le: { trai: 20 } });
    expect(c.le).toEqual({ tren: 10, phai: 10, duoi: 10, trai: 20 });
  });

  it('migrate bản lưu cũ có leMm → lề đều', () => {
    const c = chuanHoaCaiDatIn({ kho: 'a4', leMm: 18, cot: { '0': [40, 60] } }, { leMm: 12 });
    expect(c.le).toEqual({ tren: 18, phai: 18, duoi: 18, trai: 18 });
    expect(c.cot).toEqual({ '0': [40, 60] });
  });

  it('`le` mới thắng `leMm` cũ, thiếu cạnh thì lấy mặc định', () => {
    const c = chuanHoaCaiDatIn({ leMm: 18, le: { tren: 5 } }, { leMm: 12 });
    expect(c.le).toEqual({ tren: 5, phai: 12, duoi: 12, trai: 12 });
  });

  it('kẹp lề, tỉ lệ chữ, số liên; nhận A3', () => {
    const c = chuanHoaCaiDatIn({ kho: 'a3', le: { tren: 99, trai: -3 }, tiLeChu: 5, soLien: 9, font: 'times' });
    expect(c.kho).toBe('a3');
    expect(c.le.tren).toBe(40);
    expect(c.le.trai).toBe(0);
    expect(c.tiLeChu).toBe(1.6);
    expect(c.soLien).toBe(3);
    expect(c.font).toBe('times');
  });

  it('bỏ giá trị lạ, mảng cột không tổng 100, ẩn cột không phải số nguyên', () => {
    const c = chuanHoaCaiDatIn({
      kho: 'a2',
      font: 'comic',
      cot: { '0': [50, 50], '1': [10, 10], '2': 'x' },
      anCot: { '0': [2, 2, 1, -1, 1.5, 'a'], '1': [] },
      dauChan: { soTrang: 'co', nguoiIn: true },
      hienLogo: 0,
    });
    expect(c.kho).toBe('a4');
    expect(c.font).toBe('mac-dinh');
    expect(c.cot).toEqual({ '0': [50, 50] });
    expect(c.anCot).toEqual({ '0': [1, 2] });
    expect(c.dauChan).toEqual({ soTrang: true, gioIn: true, nguoiIn: true, lapTieuDeBang: true });
    expect(c.hienLogo).toBe(true);
  });
});

describe('phanKhacMacDinh', () => {
  const md = { kho: 'a5' as const, leMm: 10 };

  it('trùng mặc định → rỗng (khôi phục = xoá khỏi máy)', () => {
    expect(phanKhacMacDinh(chuanHoaCaiDatIn({}, md), md)).toEqual({});
  });

  it('chỉ giữ phần đã đổi', () => {
    const c = chuanHoaCaiDatIn({ huong: 'ngang', le: { tren: 10, phai: 10, duoi: 10, trai: 15 } }, md);
    expect(phanKhacMacDinh(c, md)).toEqual({ huong: 'ngang', le: { tren: 10, phai: 10, duoi: 10, trai: 15 } });
  });

  it('bản cũ leMm bằng mặc định → không còn gì để lưu', () => {
    expect(phanKhacMacDinh(chuanHoaCaiDatIn({ leMm: 10 }, md), md)).toEqual({});
  });
});

describe('laLeDeu', () => {
  it('bốn cạnh bằng nhau', () => {
    expect(laLeDeu({ tren: 5, phai: 5, duoi: 5, trai: 5 })).toBe(true);
    expect(laLeDeu({ tren: 5, phai: 5, duoi: 5, trai: 6 })).toBe(false);
  });
});

describe('kichThuocGiayIn', () => {
  it('theo khổ + hướng', () => {
    expect(kichThuocGiayIn('a5', 'ngang')).toEqual({ wMm: 210, hMm: 148 });
    expect(kichThuocGiayIn('a4', 'doc')).toEqual({ wMm: 210, hMm: 297 });
    expect(kichThuocGiayIn('a3', 'ngang')).toEqual({ wMm: 420, hMm: 297 });
  });
});

describe('cỡ chữ', () => {
  it('hiển thị pt làm tròn 0,5 và đổi từng bước', () => {
    expect(coChuHienThi(10.5, 1)).toBe(10.5);
    expect(doiCoChu(10, 1, 1)).toBe(1.05);
    expect(doiCoChu(10, 1, -2)).toBe(0.9);
  });

  it('không vượt giới hạn tỉ lệ', () => {
    expect(doiCoChu(10, 1.6, 3)).toBe(1.6);
    expect(doiCoChu(10, 0.6, -3)).toBe(0.6);
  });
});

describe('dungLuoiBang', () => {
  it('tiêu đề hai tầng có rowSpan + colSpan', () => {
    // | STT (rs2) | Mẫu 1 (cs2) | Mẫu 2 (cs2) |
    // |           | a | b       | a | b       |
    const { soCot, o } = dungLuoiBang([
      [
        { colSpan: 1, rowSpan: 2 },
        { colSpan: 2, rowSpan: 1 },
        { colSpan: 2, rowSpan: 1 },
      ],
      [
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
    ]);
    expect(soCot).toBe(5);
    expect(o.filter((x) => x.hang === 1).map((x) => x.cotDau)).toEqual([1, 2, 3, 4]);
    expect(o.find((x) => x.hang === 0 && x.o === 2)?.cotDau).toBe(3);
  });

  it('dòng tổng gộp ô: ô sau ô gộp mang đúng vị trí cột thật (ẩn cột không nhầm)', () => {
    // | STT | Tên | ĐVT | SL |   ← tiêu đề
    // | Tổng cộng (cs3)   | SL |   ← ô thứ 2 của hàng là cột 3, không phải cột 1
    const { o } = dungLuoiBang([
      [1, 1, 1, 1].map(() => ({ colSpan: 1, rowSpan: 1 })),
      [
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
    ]);
    const dongTong = o.filter((x) => x.hang === 1);
    expect(dongTong).toEqual([
      { hang: 1, o: 0, cotDau: 0, soCot: 3 },
      { hang: 1, o: 1, cotDau: 3, soCot: 1 },
    ]);
  });

  it('rowSpan ở thân bảng đẩy ô hàng dưới sang phải', () => {
    // DongTongTheoDvt: nhãn rowSpan 2 → hàng 2 bắt đầu từ cột ĐVT.
    const { o } = dungLuoiBang([
      [
        { colSpan: 2, rowSpan: 2 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
      [
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
    ]);
    expect(o.filter((x) => x.hang === 1).map((x) => x.cotDau)).toEqual([2, 3]);
  });
});
