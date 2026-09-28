import { describe, it, expect } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { planPhongBanImport } from './import-phong-ban';

describe('planPhongBanImport', () => {
  it('trạng thái nhận nhãn / không dấu; trống = Đang dùng; chữ lạ → lỗi thay vì lặng lẽ thành Đang dùng', () => {
    const plan = planPhongBanImport([
      { [IMPORT_ROW_KEY]: 2, ten_phong_ban: 'Kỹ thuật', trang_thai: 'ngung' },
      { [IMPORT_ROW_KEY]: 3, ten_phong_ban: 'Kế toán', tt: '2' },
      { [IMPORT_ROW_KEY]: 4, ten_phong_ban: 'Kho', trang_thai: 'tạm nghỉ' },
    ]);
    expect(plan.toCreate.map((r) => r.data.trang_thai)).toEqual(['Ngừng', 'Đang dùng']);
    expect(plan.toCreate[1].data.tt).toBe(2);
    expect(plan.errors.map((e) => e.row)).toEqual([4]);
  });

  it('tên quá ngắn → lỗi của form', () => {
    expect(planPhongBanImport([{ [IMPORT_ROW_KEY]: 2, ten_phong_ban: 'K' }]).errors).toHaveLength(1);
  });
});
