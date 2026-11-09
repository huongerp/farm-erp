import { describe, expect, it } from 'vitest';
import {
  coTheChuyen,
  coTheMoLai,
  coTheNhan,
  coTheSuaCotKiemTra,
  coTheSuaCotThucHien,
  coTheXoa,
  laBenKiemTra,
  laBenThucHien,
  trangThaiSauChuyen,
  type VaiTroCl,
} from './trang-thai';

const NT: VaiTroCl = { benThucHien: true, benKiemTra: false, capCao: false };
const KHO: VaiTroCl = { benThucHien: false, benKiemTra: true, capCao: false };
const NGOAI: VaiTroCl = { benThucHien: false, benKiemTra: false, capCao: false };
const CAP_CAO: VaiTroCl = { benThucHien: false, benKiemTra: false, capCao: true };

describe('vai trò theo chức vụ', () => {
  it('khâu làm: danh sách rỗng = ai có quyền ghi; có danh sách thì đúng chức vụ hoặc người tạo', () => {
    expect(laBenThucHien([], null, { idNhanVien: '1', chucVuId: '9' }, true)).toBe(true);
    expect(laBenThucHien(['15'], null, { idNhanVien: '1', chucVuId: '15' }, true)).toBe(true);
    expect(laBenThucHien(['15'], '1', { idNhanVien: '1', chucVuId: '9' }, true)).toBe(true);
    expect(laBenThucHien(['15'], '2', { idNhanVien: '1', chucVuId: '9' }, true)).toBe(false);
    expect(laBenThucHien([], null, { idNhanVien: '1', chucVuId: '15' }, false)).toBe(false);
  });

  it('khâu sau: chỉ đúng chức vụ; mẫu không có khâu sau thì không ai là khâu sau', () => {
    expect(laBenKiemTra(['8', '12'], { idNhanVien: '1', chucVuId: '12' })).toBe(true);
    expect(laBenKiemTra(['8', '12'], { idNhanVien: '1', chucVuId: '15' })).toBe(false);
    expect(laBenKiemTra([], { idNhanVien: '1', chucVuId: '12' })).toBe(false);
  });
});

describe('luồng Chuyển → Nhận / Trả lại', () => {
  it('khâu làm chỉ tích và chuyển khi phiếu nháp / bị trả lại', () => {
    expect(coTheSuaCotThucHien('nhap', NT)).toBe(true);
    expect(coTheSuaCotThucHien('tra_lai', NT)).toBe(true);
    expect(coTheSuaCotThucHien('cho_kiem_tra', NT)).toBe(false);
    expect(coTheChuyen('tra_lai', NT)).toBe(true);
    expect(coTheChuyen('nhap', KHO)).toBe(false);
  });

  it('khâu sau chỉ tích, nhận, trả lại khi phiếu đã chuyển sang', () => {
    expect(coTheSuaCotKiemTra('nhap', KHO)).toBe(false);
    expect(coTheSuaCotKiemTra('cho_kiem_tra', KHO)).toBe(true);
    expect(coTheNhan('cho_kiem_tra', KHO)).toBe(true);
    expect(coTheNhan('cho_kiem_tra', NT)).toBe(false);
    expect(coTheNhan('cho_kiem_tra', NGOAI)).toBe(false);
    expect(coTheSuaCotKiemTra('hoan_thanh', KHO)).toBe(false);
  });

  it('mẫu không có khâu sau: Chuyển là hoàn thành luôn', () => {
    expect(trangThaiSauChuyen([])).toBe('hoan_thanh');
    expect(trangThaiSauChuyen(['12'])).toBe('cho_kiem_tra');
  });

  it('mở lại chỉ cấp cao, xoá phiếu đã chuyển chỉ cấp cao', () => {
    expect(coTheMoLai('hoan_thanh', KHO)).toBe(false);
    expect(coTheMoLai('hoan_thanh', CAP_CAO)).toBe(true);
    expect(coTheXoa('cho_kiem_tra', NT)).toBe(false);
    expect(coTheXoa('nhap', NT)).toBe(true);
    expect(coTheXoa('hoan_thanh', CAP_CAO)).toBe(true);
  });
});
