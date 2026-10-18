import { describe, expect, it } from 'vitest';
import { idTrangThaiKhongKiemKe } from './constants';

describe('idTrangThaiKhongKiemKe', () => {
  it('chỉ loại trạng thái Thanh lý và Mất / Hỏng, tra theo mã không phân biệt hoa thường', () => {
    const statuses = [
      { id: '1', ma: 'MOI' },
      { id: '2', ma: 'DANG_SU_DUNG' },
      { id: '6', ma: 'thanh_ly' },
      { id: '7', ma: ' MAT_HONG ' },
    ];
    expect([...idTrangThaiKhongKiemKe(statuses)].sort()).toEqual(['6', '7']);
  });

  it('danh mục rỗng → không loại gì', () => {
    expect(idTrangThaiKhongKiemKe([]).size).toBe(0);
  });
});
