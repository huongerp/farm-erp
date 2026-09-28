import { describe, expect, it } from 'vitest';
import { sinhNhatTrongKhoang, type SinhNhatNhanVien } from './sinh-nhat';

const nv = (id: string, ho_ten: string, ngay: number, thang: number): SinhNhatNhanVien => ({
  id,
  ho_ten,
  anh_dai_dien: null,
  ngay,
  thang,
});

const DS = [nv('1', 'Bình', 30, 9), nv('2', 'An', 30, 9), nv('3', 'Cúc', 2, 1), nv('4', 'Dũng', 29, 2), nv('5', 'Em', 5, 10)];

describe('sinhNhatTrongKhoang', () => {
  it('lọc trong tuần, sắp theo ngày rồi tên', () => {
    const kq = sinhNhatTrongKhoang(DS, '2026-09-28', '2026-10-04');
    expect(kq.map((x) => [x.ho_ten, x.ngayDuong])).toEqual([
      ['An', '2026-09-30'],
      ['Bình', '2026-09-30'],
    ]);
  });

  it('khoảng vắt năm', () => {
    const kq = sinhNhatTrongKhoang(DS, '2026-12-28', '2027-01-03');
    expect(kq.map((x) => [x.ho_ten, x.ngayDuong])).toEqual([['Cúc', '2027-01-02']]);
  });

  it('29/02 năm không nhuận tính vào 28/02, năm nhuận giữ 29/02', () => {
    expect(sinhNhatTrongKhoang(DS, '2027-02-27', '2027-03-01').map((x) => x.ngayDuong)).toEqual(['2027-02-28']);
    expect(sinhNhatTrongKhoang(DS, '2028-02-27', '2028-03-01').map((x) => x.ngayDuong)).toEqual(['2028-02-29']);
  });
});
