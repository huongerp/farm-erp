import { describe, expect, it } from 'vitest';
import { chonFarmMacDinh } from './farm-mac-dinh';

const TAT_CA = ['1', '2', '10', '11'];

describe('chonFarmMacDinh', () => {
  it('giữ farm đang chọn nếu còn trong phạm vi', () => {
    expect(
      chonFarmMacDinh({ hienTai: '11', viewAll: false, allowedBranchIds: ['10', '11'], tatCaBranchIds: TAT_CA, farmCuaToi: '10' })
    ).toBe('11');
  });

  it('farm đang chọn ngoài phạm vi → ưu tiên farm của tôi', () => {
    expect(
      chonFarmMacDinh({ hienTai: '2', viewAll: false, allowedBranchIds: ['10', '11'], tatCaBranchIds: TAT_CA, farmCuaToi: '11' })
    ).toBe('11');
  });

  it('farm của tôi ngoài phạm vi → farm đầu tiên được phép', () => {
    expect(
      chonFarmMacDinh({ hienTai: null, viewAll: false, allowedBranchIds: ['10', '11'], tatCaBranchIds: TAT_CA, farmCuaToi: '1' })
    ).toBe('10');
  });

  it('xem tất cả: dùng farm của tôi, không có thì farm đầu danh sách', () => {
    expect(
      chonFarmMacDinh({ hienTai: null, viewAll: true, allowedBranchIds: [], tatCaBranchIds: TAT_CA, farmCuaToi: '2' })
    ).toBe('2');
    expect(
      chonFarmMacDinh({ hienTai: null, viewAll: true, allowedBranchIds: [], tatCaBranchIds: TAT_CA, farmCuaToi: null })
    ).toBe('1');
  });

  it('không có farm nào hợp lệ → null', () => {
    expect(
      chonFarmMacDinh({ hienTai: '10', viewAll: false, allowedBranchIds: [], tatCaBranchIds: TAT_CA, farmCuaToi: '10' })
    ).toBeNull();
    expect(
      chonFarmMacDinh({ hienTai: null, viewAll: true, allowedBranchIds: [], tatCaBranchIds: [], farmCuaToi: null })
    ).toBeNull();
  });
});
