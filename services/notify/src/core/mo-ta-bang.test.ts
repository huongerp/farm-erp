import { describe, it, expect } from 'vitest';
import { MO_TA_BANG, dungLink, type MoTaBang } from './mo-ta-bang.ts';

describe('dungLink — link điều hướng khi bấm thông báo', () => {
  it('module có trang preview thì trỏ thẳng vào bản ghi', () => {
    expect(dungLink(MO_TA_BANG['fp_mh_don_dat_hang']!, 42)).toBe('/mua-hang/don-dat-hang/preview/42');
  });

  it('phiếu hành chính mở bằng query param', () => {
    expect(dungLink(MO_TA_BANG['fp_hr_phieu_hanh_chinh']!, 42)).toBe(
      '/hanh-chinh/phieu-hanh-chinh?phieu=42'
    );
  });

  it('module chưa khai gì thì vẫn về trang danh sách như trước', () => {
    expect(dungLink(MO_TA_BANG['fp_hc_cong_viec']!, 42)).toBe('/hanh-chinh/cong-viec');
  });

  it('trang preview thắng query param khi lỡ khai cả hai', () => {
    const ca: MoTaBang = {
      bang: 'x', moduleId: 'm', duongDan: '/x', tenChungTu: 'X',
      coTrangPreview: true, thamSoPhieu: 'phieu',
    };
    expect(dungLink(ca, 7)).toBe('/x/preview/7');
  });

  it('không mục nào khai cả hai kiểu mở bản ghi', () => {
    // Khai cả hai không gãy (preview thắng) nhưng là dấu hiệu cấu hình nhầm.
    const caHai = Object.values(MO_TA_BANG).filter((m) => m.coTrangPreview && m.thamSoPhieu);
    expect(caHai).toEqual([]);
  });
});
