import { describe, it, expect } from 'vitest';
import { maHangMucDuyNhat, slugMaHangMuc } from './ma-hang-muc';

describe('slugMaHangMuc', () => {
  it('bỏ dấu, viết hoa, nối bằng gạch dưới', () => {
    expect(slugMaHangMuc('Vật tư')).toBe('VAT_TU');
    expect(slugMaHangMuc('Bốc khoán')).toBe('BOC_KHOAN');
    expect(slugMaHangMuc('Số dư đầu kỳ')).toBe('SO_DU_DAU_KY');
    expect(slugMaHangMuc('Chi khác (2)')).toBe('CHI_KHAC_2');
    expect(slugMaHangMuc('Đầu tư  dài hạn')).toBe('DAU_TU_DAI_HAN');
  });

  it('tên rỗng / chỉ ký tự đặc biệt → mã mặc định', () => {
    expect(slugMaHangMuc('')).toBe('HANG_MUC');
    expect(slugMaHangMuc('---')).toBe('HANG_MUC');
  });
});

describe('maHangMucDuyNhat', () => {
  it('trả mã gốc khi chưa dùng', () => {
    expect(maHangMucDuyNhat('Vật tư', ['CHI_KHAC'])).toBe('VAT_TU');
  });

  it('thêm hậu tố khi trùng (tên hạng mục giống nhau)', () => {
    expect(maHangMucDuyNhat('Vật tư', ['VAT_TU'])).toBe('VAT_TU_2');
    expect(maHangMucDuyNhat('Vật tư', ['VAT_TU', 'VAT_TU_2'])).toBe('VAT_TU_3');
  });

  it('so khớp không phân biệt hoa thường', () => {
    expect(maHangMucDuyNhat('Vật tư', ['vat_tu'])).toBe('VAT_TU_2');
  });
});
