// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { tinhKhauHaoKy } from '../khau-hao-tai-san-supabase.service';
import type { AssetGroup } from '../../../thiet-lap-tai-san/core/types';

function makeGroup(overrides: Partial<AssetGroup> = {}): AssetGroup {
  return {
    id: 'g1',
    ma: 'MAY',
    ten: 'Máy móc thiết bị',
    thu_tu: 1,
    trang_thai: 'Đang hoạt động',
    phuong_phap_khau_hao: 'duong_thang',
    ty_le_khau_hao: null,
    so_nam_su_dung: 5,
    tg_tao: '',
    tg_cap_nhat: '',
    ...overrides,
  };
}

describe('tinhKhauHaoKy — đường thẳng (so_nam_su_dung)', () => {
  it('khấu hao 1 kỳ (tháng) = nguyên_giá / số năm / 12', () => {
    const group = makeGroup({ so_nam_su_dung: 5 });
    // nguyên giá 120.000.000, 5 năm → 24.000.000/năm → 2.000.000/tháng
    const r = tinhKhauHaoKy(120_000_000, 120_000_000, 0, group);
    expect(r.khau_hao_ky).toBe(2_000_000);
    expect(r.khau_hao_luy_ke).toBe(2_000_000);
    expect(r.gia_tri_con_lai_cuoi_ky).toBe(118_000_000);
  });
});

describe('tinhKhauHaoKy — số dư giảm dần (ty_le_khau_hao trên giá trị còn lại)', () => {
  it('khấu hao kỳ tính trên giá trị còn lại đầu kỳ, không phải nguyên giá', () => {
    const group = makeGroup({ phuong_phap_khau_hao: 'so_du_giam_dan', ty_le_khau_hao: 24, so_nam_su_dung: null });
    // giá trị còn lại đầu kỳ 50.000.000, 24%/năm → 12.000.000/năm → 1.000.000/tháng
    const r = tinhKhauHaoKy(120_000_000, 50_000_000, 70_000_000, group);
    expect(r.khau_hao_ky).toBe(1_000_000);
    expect(r.gia_tri_con_lai_cuoi_ky).toBe(49_000_000);
  });
});

describe('tinhKhauHaoKy — giá trị còn lại không âm khi kỳ cuối vượt số dư', () => {
  it('gia_tri_con_lai_cuoi_ky bị chặn ở 0, không xuống âm', () => {
    const group = makeGroup({ so_nam_su_dung: 5 });
    // Giá trị còn lại đầu kỳ chỉ còn 1.000.000, nhưng khấu hao/tháng tính theo
    // nguyên giá 120tr vẫn ra 2.000.000 — vượt số dư còn lại.
    const r = tinhKhauHaoKy(120_000_000, 1_000_000, 119_000_000, group);
    expect(r.gia_tri_con_lai_cuoi_ky).toBe(0);
  });

  it('BUG đã ghi nhận: khau_hao_luy_ke KHÔNG bị chặn trần theo nguyên_giá — ' +
     'tiếp tục cộng dồn vượt nguyên giá dù giá trị còn lại đã về 0', () => {
    const group = makeGroup({ so_nam_su_dung: 5 });
    // Tài sản đã khấu hao hết (còn lại 0), nhưng nếu kỳ chốt tiếp theo vẫn
    // chạy (không có guard "đã hết khấu hao thì dừng"), khấu hao luỹ kế sẽ
    // vượt quá nguyên giá — vi phạm đẳng thức
    // nguyên_giá = khấu_hao_luỹ_kế + giá_trị_còn_lại.
    const nguyenGia = 120_000_000;
    const r = tinhKhauHaoKy(nguyenGia, 0, nguyenGia, group);
    expect(r.khau_hao_luy_ke).toBeGreaterThan(nguyenGia);
    expect(r.khau_hao_luy_ke - r.gia_tri_con_lai_cuoi_ky).not.toBe(nguyenGia);
  });
});

describe('tinhKhauHaoKy — không có tỷ lệ/số năm hợp lệ', () => {
  it('khấu hao = 0 khi nhóm tài sản chưa cấu hình tỷ lệ hoặc số năm', () => {
    const group = makeGroup({ so_nam_su_dung: null, ty_le_khau_hao: null });
    const r = tinhKhauHaoKy(120_000_000, 120_000_000, 0, group);
    expect(r.khau_hao_ky).toBe(0);
    expect(r.gia_tri_con_lai_cuoi_ky).toBe(120_000_000);
  });
});