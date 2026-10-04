import { describe, expect, it } from 'vitest';
import { doiSoatKeTiep, kiemTraYeuCauLich, lanChayKeTiep, thuLaiSau } from './lich.ts';

/** Giờ VN → Date (UTC+7). */
const vn = (s: string) => new Date(`${s}+07:00`);

describe('lanChayKeTiep', () => {
  const base = { gio: 7, thu: null, ngayThang: null };

  it('khi_thay_doi không có lịch cố định', () => {
    expect(lanChayKeTiep({ ...base, tanSuat: 'khi_thay_doi' }, vn('2026-10-04T10:00:00'))).toBeNull();
  });

  it('mỗi giờ / 4 giờ tính từ phút hiện tại', () => {
    expect(lanChayKeTiep({ ...base, tanSuat: 'moi_gio' }, vn('2026-10-04T10:15:42'))).toEqual(vn('2026-10-04T11:15:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'moi_4_gio' }, vn('2026-10-04T22:30:00'))).toEqual(vn('2026-10-05T02:30:00'));
  });

  it('hằng ngày: chưa tới giờ → hôm nay, qua giờ → mai (theo giờ VN, kể cả khi UTC đã sang ngày)', () => {
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_ngay' }, vn('2026-10-04T06:59:00'))).toEqual(vn('2026-10-04T07:00:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_ngay' }, vn('2026-10-04T07:00:00'))).toEqual(vn('2026-10-05T07:00:00'));
    // 01:00 VN ngày 5 = 18:00 UTC ngày 4
    expect(lanChayKeTiep({ ...base, gio: 6, tanSuat: 'hang_ngay' }, vn('2026-10-05T01:00:00'))).toEqual(vn('2026-10-05T06:00:00'));
  });

  it('hằng tuần: 1 = Thứ Hai, 7 = Chủ nhật', () => {
    // 2026-10-04 là Chủ nhật
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_tuan', thu: 1 }, vn('2026-10-04T10:00:00'))).toEqual(vn('2026-10-05T07:00:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_tuan', thu: 7 }, vn('2026-10-04T06:00:00'))).toEqual(vn('2026-10-04T07:00:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_tuan', thu: 7 }, vn('2026-10-04T08:00:00'))).toEqual(vn('2026-10-11T07:00:00'));
  });

  it('hằng tháng: ngày 31 = ngày cuối tháng, qua năm mới', () => {
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_thang', ngayThang: 31 }, vn('2027-02-10T00:00:00'))).toEqual(vn('2027-02-28T07:00:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_thang', ngayThang: 31 }, vn('2028-02-29T08:00:00'))).toEqual(vn('2028-03-31T07:00:00'));
    expect(lanChayKeTiep({ ...base, tanSuat: 'hang_thang', ngayThang: 5 }, vn('2026-12-06T00:00:00'))).toEqual(vn('2027-01-05T07:00:00'));
  });
});

describe('doiSoatKeTiep / thuLaiSau', () => {
  it('03:00 VN kế tiếp', () => {
    expect(doiSoatKeTiep(vn('2026-10-04T02:59:00'))).toEqual(vn('2026-10-04T03:00:00'));
    expect(doiSoatKeTiep(vn('2026-10-04T03:00:00'))).toEqual(vn('2026-10-05T03:00:00'));
  });

  it('lùi 2, 4, 8 … tối đa 60 phút', () => {
    const now = vn('2026-10-04T10:00:00');
    expect(thuLaiSau(1, now)).toEqual(vn('2026-10-04T10:02:00'));
    expect(thuLaiSau(3, now)).toEqual(vn('2026-10-04T10:08:00'));
    expect(thuLaiSau(10, now)).toEqual(vn('2026-10-04T11:00:00'));
  });
});

describe('kiemTraYeuCauLich', () => {
  const hopLe = {
    moduleId: 'mua-hang/don-dat-hang',
    cot: [
      { key: 'so_po', label: 'Số PO' },
      { key: 'id', label: 'Mã', type: 'number' },
      { key: 'ngay_dat', label: 'Ngày đặt', type: 'date' },
    ],
    tanSuat: 'hang_tuan',
    gio: 8,
    thu: 3,
  };

  it('đưa cột id lên đầu, ép kiểu text', () => {
    const kq = kiemTraYeuCauLich(hopLe);
    expect('ok' in kq && kq.ok.cot.map((c) => c.key)).toEqual(['id', 'so_po', 'ngay_dat']);
    expect('ok' in kq && kq.ok.cot[0]).toEqual({ key: 'id', label: 'Mã', type: 'text' });
  });

  it('thiếu id thì tự thêm', () => {
    const kq = kiemTraYeuCauLich({ ...hopLe, cot: [{ key: 'so_po', label: 'Số PO' }] });
    expect('ok' in kq && kq.ok.cot[0]).toEqual({ key: 'id', label: 'ID', type: 'text' });
  });

  it('chặn key có thể chèn cú pháp PostgREST', () => {
    for (const key of ['so_po,ten:mat_khau_hash', 'a.b', 'X', '1abc', 'cot(con)']) {
      expect('loi' in kiemTraYeuCauLich({ ...hopLe, cot: [{ key, label: 'x' }] })).toBe(true);
    }
  });

  it('giờ/thứ/ngày chỉ giữ khi tần suất cần, ngoài khoảng thì về mặc định', () => {
    const tuan = kiemTraYeuCauLich(hopLe);
    expect('ok' in tuan && [tuan.ok.gio, tuan.ok.thu, tuan.ok.ngayThang]).toEqual([8, 3, null]);
    const thayDoi = kiemTraYeuCauLich({ ...hopLe, tanSuat: 'khi_thay_doi' });
    expect('ok' in thayDoi && [thayDoi.ok.gio, thayDoi.ok.thu]).toEqual([null, null]);
    const sai = kiemTraYeuCauLich({ ...hopLe, tanSuat: 'hang_thang', gio: 99, ngayThang: 40 });
    expect('ok' in sai && [sai.ok.gio, sai.ok.ngayThang]).toEqual([7, 1]);
  });

  it('từ chối module / tần suất lạ', () => {
    expect('loi' in kiemTraYeuCauLich({ ...hopLe, moduleId: '../x' })).toBe(true);
    expect('loi' in kiemTraYeuCauLich({ ...hopLe, tanSuat: 'moi_phut' })).toBe(true);
  });
});
