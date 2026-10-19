import { describe, expect, it } from 'vitest';
import { conHangChuaDu, ghepDongChon, tinhConLai, timDongVuot, tongTheoHangHoa } from './thuc-hien-tung-phan';

describe('tongTheoHangHoa', () => {
  it('gộp dòng trùng hàng, bỏ dòng thiếu hàng hoặc số lượng không dương', () => {
    const tong = tongTheoHangHoa([
      { id_hang_hoa: '1', so_luong: 10 },
      { id_hang_hoa: 1, so_luong: '5' },
      { id_hang_hoa: '', so_luong: 3 },
      { id_hang_hoa: '2', so_luong: 0 },
      { id_hang_hoa: '3', so_luong: -1 },
    ]);
    expect([...tong]).toEqual([['1', 15]]);
  });

  it('cộng số thập phân không lệch dấu phẩy động', () => {
    expect(tongTheoHangHoa([{ id_hang_hoa: 'a', so_luong: 0.1 }, { id_hang_hoa: 'a', so_luong: 0.2 }]).get('a')).toBe(0.3);
  });
});

describe('tinhConLai', () => {
  const nguon = [
    { id_hang_hoa: 'keo', so_luong: 24 },
    { id_hang_hoa: 'bang', so_luong: 40 },
    { id_hang_hoa: 'keo', so_luong: 6 },
  ];

  it('chưa có phiếu đích → còn lại bằng nguồn, giữ thứ tự nguồn', () => {
    expect(tinhConLai(nguon, [])).toEqual([
      { id_hang_hoa: 'keo', so_luong_nguon: 30, da_thuc_hien: 0, con_lai: 30 },
      { id_hang_hoa: 'bang', so_luong_nguon: 40, da_thuc_hien: 0, con_lai: 40 },
    ]);
  });

  it('nhập nhiều lần cùng hàng được cộng dồn; nhập dư không ra số âm', () => {
    const r = tinhConLai(nguon, [
      { id_hang_hoa: 'keo', so_luong: 10 },
      { id_hang_hoa: 'keo', so_luong: 5 },
      { id_hang_hoa: 'bang', so_luong: 45 },
    ]);
    expect(r.map((x) => [x.id_hang_hoa, x.da_thuc_hien, x.con_lai])).toEqual([
      ['keo', 15, 15],
      ['bang', 45, 0],
    ]);
    expect(conHangChuaDu(r)).toBe(true);
  });

  it('nhập đủ hết → không còn hàng chưa đủ', () => {
    const r = tinhConLai(nguon, [{ id_hang_hoa: 'keo', so_luong: 30 }, { id_hang_hoa: 'bang', so_luong: 40 }]);
    expect(conHangChuaDu(r)).toBe(false);
  });
});

describe('timDongVuot', () => {
  const nguon = [{ id_hang_hoa: 'keo', so_luong: 24 }, { id_hang_hoa: 'bang', so_luong: 40 }];

  it('đúng bằng phần còn lại thì hợp lệ', () => {
    expect(timDongVuot(nguon, [{ id_hang_hoa: 'keo', so_luong: 20 }], [{ id_hang_hoa: 'keo', so_luong: 4 }])).toEqual([]);
  });

  it('vượt phần còn lại → báo hàng vượt kèm tối đa', () => {
    expect(timDongVuot(nguon, [{ id_hang_hoa: 'keo', so_luong: 20 }], [{ id_hang_hoa: 'keo', so_luong: 5 }])).toEqual([
      { id_hang_hoa: 'keo', so_luong_nguon: 24, da_thuc_hien: 20, lan_nay: 5, toi_da: 4 },
    ]);
  });

  it('phiếu đang lưu có hai dòng cùng hàng → cộng lại rồi mới so', () => {
    const vuot = timDongVuot(nguon, [], [{ id_hang_hoa: 'bang', so_luong: 30 }, { id_hang_hoa: 'bang', so_luong: 11 }]);
    expect(vuot.map((v) => v.id_hang_hoa)).toEqual(['bang']);
  });

  it('hàng ngoài phiếu nguồn được thêm tự do (không theo dõi)', () => {
    expect(timDongVuot(nguon, [], [{ id_hang_hoa: 'la', so_luong: 99 }])).toEqual([]);
  });

  it('sửa phiếu cũ đã vượt: giữ nguyên hoặc giảm thì cho lưu, tăng thêm thì chặn', () => {
    const cu = [{ id_hang_hoa: 'keo', so_luong: 30 }];
    expect(timDongVuot(nguon, [], [{ id_hang_hoa: 'keo', so_luong: 30 }], cu)).toEqual([]);
    expect(timDongVuot(nguon, [], [{ id_hang_hoa: 'keo', so_luong: 26 }], cu)).toEqual([]);
    expect(timDongVuot(nguon, [], [{ id_hang_hoa: 'keo', so_luong: 31 }], cu)).toHaveLength(1);
  });
});

describe('ghepDongChon', () => {
  it('lấy dòng nguồn đầu tiên của hàng, theo thứ tự lựa chọn, bỏ hàng lạ và SL 0', () => {
    const nguon = [
      { id_hang_hoa: '1', so_luong: 5, ghi_chu: 'a' },
      { id_hang_hoa: '2', so_luong: 3, ghi_chu: 'b' },
      { id_hang_hoa: '1', so_luong: 2, ghi_chu: 'c' },
    ];
    const r = ghepDongChon(nguon, [
      { id_hang_hoa: '2', so_luong: 1 },
      { id_hang_hoa: '1', so_luong: 6 },
      { id_hang_hoa: '9', so_luong: 1 },
      { id_hang_hoa: '1', so_luong: 0 },
    ]);
    expect(r.map((x) => [x.dong.ghi_chu, x.so_luong])).toEqual([
      ['b', 1],
      ['a', 6],
    ]);
  });
});
