import { describe, it, expect } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { planCongViecImport, type CongViecImportInput } from './import-cong-viec';

const input: CongViecImportInput = {
  nhanVien: [
    { id: '7', ma_nhan_vien: 'NV7', ho_ten: 'Nguyễn Văn An' },
    { id: '8', ma_nhan_vien: 'NV8', ho_ten: 'Trần Bình' },
    { id: '9', ma_nhan_vien: 'NV9', ho_ten: 'Trần Bình' },
  ],
  uuTienOptions: [
    { value: 'cao', labels: ['Cao'] },
    { value: 'trung_binh', labels: ['Trung bình'] },
    { value: 'thap', labels: ['Thấp'] },
  ],
  trangThaiOptions: [
    { value: 'draft', labels: ['Nháp'] },
    { value: 'dang_thuc_hien', labels: ['Đang thực hiện'] },
  ],
};

describe('planCongViecImport', () => {
  it('trách nhiệm theo mã NV hoặc họ tên; ưu tiên / trạng thái theo nhãn tiếng Việt', () => {
    const plan = planCongViecImport(
      [{ [IMPORT_ROW_KEY]: 2, tieu_de: 'Phun thuốc lô A', trach_nhiem: 'nguyễn văn an', nguoi_ho_tro: 'NV8, NV9', uu_tien: 'cao', trang_thai: 'đang thực hiện' }],
      input
    );
    expect(plan.errors).toEqual([]);
    expect(plan.toCreate[0].data).toMatchObject({ trach_nhiem: 7, nguoi_ho_tro: [8, 9], uu_tien: 'cao', trang_thai: 'dang_thuc_hien' });
  });

  it('giá trị sai → lỗi dòng thay vì lặng lẽ gán mặc định', () => {
    const plan = planCongViecImport(
      [{ [IMPORT_ROW_KEY]: 5, tieu_de: 'A', trach_nhiem: 'NV7', uu_tien: 'gấp', trang_thai: 'xong' }],
      input
    );
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.errors[0]).toMatchObject({ row: 5 });
    expect(plan.errors[0].msg.split('; ')).toHaveLength(2);
  });

  it('họ tên trùng → không đoán; thiếu trách nhiệm → lỗi bắt buộc như form', () => {
    expect(planCongViecImport([{ [IMPORT_ROW_KEY]: 2, tieu_de: 'A', trach_nhiem: 'Trần Bình' }], input).errors).toHaveLength(1);
    expect(planCongViecImport([{ [IMPORT_ROW_KEY]: 2, tieu_de: 'A' }], input).errors).toHaveLength(1);
  });
});
