import { describe, expect, it } from 'vitest';
import { chuanHoaDanhSachKhach, chuanHoaSdt, dongKhachIn, nguoiDaiDienMacDinh } from './khach';

describe('chuanHoaSdt', () => {
  it('bỏ ký tự phân cách, giữ + đầu', () => {
    expect(chuanHoaSdt(' 0835.535 879 ')).toBe('0835535879');
    expect(chuanHoaSdt('+84 835-535-879')).toBe('+84835535879');
    expect(chuanHoaSdt('  ')).toBeNull();
  });
});

describe('chuanHoaDanhSachKhach', () => {
  it('bỏ dòng trống, đánh lại STT, gọn khoảng trắng', () => {
    const out = chuanHoaDanhSachKhach([
      { ho_ten: '  A   Vỹ ', gioi_tinh: 'nam', so_dien_thoai: '0835 535 879' },
      { ho_ten: '', quoc_tich: ' ' },
      { ho_ten: 'Lee Soo-ah', gioi_tinh: 'xyz' },
    ]);
    expect(out.map((k) => [k.stt, k.ho_ten, k.gioi_tinh, k.so_dien_thoai])).toEqual([
      [1, 'A Vỹ', 'nam', '0835535879'],
      [2, 'Lee Soo-ah', null, null],
    ]);
  });

  it('dòng thiếu họ tên nhưng có thông tin khác vẫn giữ (để form báo lỗi, không mất dữ liệu)', () => {
    const out = chuanHoaDanhSachKhach([{ ho_ten: '', don_vi_lam_viec: '365' }]);
    expect(out).toHaveLength(1);
    expect(out[0].ho_ten).toBe('');
  });
});

describe('phiếu in', () => {
  it('đệm dòng trống tới tối thiểu, không cắt khi nhiều hơn', () => {
    const k = chuanHoaDanhSachKhach([{ ho_ten: 'A' }, { ho_ten: 'B' }]);
    expect(dongKhachIn(k, 5)).toHaveLength(5);
    expect(dongKhachIn(k, 1)).toHaveLength(2);
  });

  it('người đại diện mặc định là khách đầu', () => {
    const k = chuanHoaDanhSachKhach([{ ho_ten: 'A Vỹ' }]);
    expect(nguoiDaiDienMacDinh(k, '')).toBe('A Vỹ');
    expect(nguoiDaiDienMacDinh(k, 'Trưởng đoàn')).toBe('Trưởng đoàn');
  });
});
