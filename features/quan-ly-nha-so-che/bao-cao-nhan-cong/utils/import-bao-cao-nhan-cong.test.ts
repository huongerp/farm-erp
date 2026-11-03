import { describe, expect, it } from 'vitest';
import vi from '../locales/vi.json';
import i18n from '../../../../lib/i18n';
import { planBaoCaoNhanCongImport } from './import-bao-cao-nhan-cong';

i18n.addResourceBundle('vi', 'translation', vi, true, true);
const branches = [{ id: '1', ma: 'FP1', ten: 'Nhà sơ chế 1' }];
const row = { ngay: '03/11/2026', chi_nhanh: 'FP1', loai_chuyen: 'XAN_NAI', ho_ten: 'Nguyễn Văn An', cham_cong: 'CA_NGAY' };
const plan = (rows: Record<string, unknown>[]) => planBaoCaoNhanCongImport(rows, branches, []);

describe('planBaoCaoNhanCongImport', () => {
  it('gom theo ngày/chi nhánh, chuẩn hóa mã/tên và tính tổng theo danh sách người', () => {
    const result = plan([row, { ...row, ho_ten: 'Trần Bình', cham_cong: 'Sáng', so_gio_tc: '1,5', chi_nhanh: ' nhà sơ chế 1 ' }, { ...row, ngay: '04/11/2026' }]);
    expect(result.errors).toEqual([]);
    expect(result.phieu).toHaveLength(2);
    const ct = result.phieu[0].values.chi_tiet[0];
    expect(ct).toMatchObject({ sl_cong_ngay: 1, sl_cong_nua: 1, sl_tang_ca: 1, so_gio_tc: 1.5 });
    expect(ct.nhan_vien.map((n) => n.so_gio_cong)).toEqual([7.5, 3.75]);
    expect(result.phieu[0].values.chi_tiet).toHaveLength(6);
  });

  it('nhập số lượng tổng hợp theo từng mức giờ, giữ ghi chú và tổng giờ tăng ca', () => {
    const result = plan([{ ...row, ho_ten: '', so_luong: 10, so_gio_cong: '7,5', so_gio_tc: '1,5', ghi_chu: 'Ca 1' }, { ...row, ho_ten: '', so_luong: 2, cham_cong: 'CHIEU' }]);
    expect(result.errors).toEqual([]);
    expect(result.phieu[0].values.chi_tiet[0]).toMatchObject({ sl_cong_ngay: 10, sl_cong_nua: 2, sl_tang_ca: 10, sub: { TANG_CA: [{ sl_cong: 10, so_gio: 1.5, ghi_chu: 'Ca 1' }] } });
  });

  it('chặn ngày sai, phạm vi, số âm, giờ quá 24 và số lượng không hợp lệ; giữ số dòng Excel', () => {
    for (const bad of [{ ngay: '31/02/2026' }, { chi_nhanh: 'FP2' }, { so_gio_cong: -1 }, { so_gio_tc: 25 }, { so_gio_cong: 'sai' }, { so_luong: 2 }, { ho_ten: '', so_luong: 1.5 }, { ho_ten: '', so_luong: '' }, { cham_cong: 'sai' }, { loai_chuyen: 'sai' }]) {
      const result = plan([{ ...row, ...bad, __row: 15 }, { ...row, ngay: '04/11/2026' }]);
      expect(result.phieu).toEqual([]);
      expect(result.errors[0]).toMatchObject({ row: 15, values: { __row: 15 } });
    }
  });

  it('chặn phiếu đã tồn tại, không ghi đè kể cả khi chỉ nhập chuyền khác', () => {
    const result = planBaoCaoNhanCongImport([row], branches, [{ id: '9', ngay: '2026-11-03', id_chi_nhanh: '1' }]);
    expect(result.phieu).toEqual([]);
    expect(result.errors[0].msg).toContain('Đã có báo cáo');
  });

  it('chặn cùng người vượt một công hoặc trùng buổi, cho phép sáng và chiều ở hai chuyền', () => {
    expect(plan([row, { ...row, loai_chuyen: 'TIA_DANH_GIA' }]).errors.length).toBeGreaterThan(0);
    expect(plan([{ ...row, cham_cong: 'SANG' }, { ...row, cham_cong: 'SANG', loai_chuyen: 'TIA_DANH_GIA' }]).errors.length).toBeGreaterThan(0);
    expect(plan([{ ...row, cham_cong: 'SANG' }, { ...row, cham_cong: 'CHIEU', loai_chuyen: 'TIA_DANH_GIA' }]).errors).toEqual([]);
  });

  it('chặn trộn tổng hợp và tên theo cả hai thứ tự, ghi chú phiếu mâu thuẫn', () => {
    const aggregate = { ...row, ho_ten: '', so_luong: 2 };
    expect(plan([row, aggregate]).phieu).toEqual([]);
    expect(plan([aggregate, row]).errors[0].msg).toContain('Không trộn');
    expect(plan([{ ...row, ghi_chu_phieu: 'A' }, { ...row, ho_ten: 'B', ghi_chu_phieu: 'B' }]).errors[0].msg).toContain('không thống nhất');
  });

  it('người nghỉ không sinh công hoặc tăng ca; chặn giờ nghỉ khác 0', () => {
    const nghi = { ...row, cham_cong: 'NGHI' };
    expect(plan([nghi]).phieu[0].values.chi_tiet[0]).toMatchObject({ sl_cong_ngay: 0, sl_cong_nua: 0, sl_tang_ca: 0 });
    expect(plan([{ ...nghi, so_gio_tc: 1 }]).phieu).toEqual([]);
    expect(plan([{ ...nghi, ho_ten: '', so_luong: 1 }]).phieu).toEqual([]);
  });
});
