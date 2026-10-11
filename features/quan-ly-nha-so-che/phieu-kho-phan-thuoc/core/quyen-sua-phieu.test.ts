import { describe, expect, it } from 'vitest';
import {
  canKhoaLaiQuyenSua,
  canXinSuaPhieuKhoPT,
  canXuLyYeuCauSua,
  phieuMoChoSuaXoa,
  trangThaiSauKhiSua,
} from './quyen-sua-phieu';
import type { PhieuKhoPT } from './types';

type P = Pick<PhieuKhoPT, 'trang_thai' | 'trang_thai_sua' | 'id_nguoi_xin_sua'>;
const phieu = (p: Partial<P> = {}): P => ({ trang_thai: 'Đã duyệt', trang_thai_sua: null, id_nguoi_xin_sua: null, ...p });
const thuong = { capCao: false, nhanVienId: 10 };
const capCao = { capCao: true, nhanVienId: 1 };

describe('phieuMoChoSuaXoa', () => {
  it('phiếu chưa duyệt / không duyệt: mở cho mọi người', () => {
    expect(phieuMoChoSuaXoa(phieu({ trang_thai: 'Chờ duyệt' }), thuong)).toBe(true);
    expect(phieuMoChoSuaXoa(phieu({ trang_thai: 'Không duyệt' }), thuong)).toBe(true);
  });

  it('phiếu đã duyệt: cấp cao luôn sửa được, người thường bị khoá', () => {
    expect(phieuMoChoSuaXoa(phieu(), capCao)).toBe(true);
    expect(phieuMoChoSuaXoa(phieu(), thuong)).toBe(false);
  });

  it('đã cấp quyền: chỉ đúng người xin được sửa (id lưu dạng chuỗi vẫn khớp)', () => {
    const p = phieu({ trang_thai_sua: 'da_cap', id_nguoi_xin_sua: '10' as unknown as number });
    expect(phieuMoChoSuaXoa(p, thuong)).toBe(true);
    expect(phieuMoChoSuaXoa(p, { capCao: false, nhanVienId: 11 })).toBe(false);
  });

  it('đang chờ cấp: người xin vẫn bị khoá', () => {
    expect(phieuMoChoSuaXoa(phieu({ trang_thai_sua: 'cho_cap', id_nguoi_xin_sua: 10 }), thuong)).toBe(false);
  });
});

describe('xin sửa / xử lý yêu cầu', () => {
  it('nút Xin sửa: chỉ người thường có quyền sửa/xoá, phiếu đã duyệt, chưa có yêu cầu', () => {
    expect(canXinSuaPhieuKhoPT(phieu(), thuong, true)).toBe(true);
    expect(canXinSuaPhieuKhoPT(phieu(), thuong, false)).toBe(false);
    expect(canXinSuaPhieuKhoPT(phieu(), capCao, true)).toBe(false);
    expect(canXinSuaPhieuKhoPT(phieu({ trang_thai: 'Chờ duyệt' }), thuong, true)).toBe(false);
    expect(canXinSuaPhieuKhoPT(phieu({ trang_thai_sua: 'cho_cap' }), thuong, true)).toBe(false);
  });

  it('cấp / từ chối khi chờ cấp; khoá lại khi đã cấp — chỉ cấp cao', () => {
    expect(canXuLyYeuCauSua(phieu({ trang_thai_sua: 'cho_cap' }), true)).toBe(true);
    expect(canXuLyYeuCauSua(phieu({ trang_thai_sua: 'cho_cap' }), false)).toBe(false);
    expect(canXuLyYeuCauSua(phieu({ trang_thai_sua: 'da_cap' }), true)).toBe(false);
    expect(canKhoaLaiQuyenSua(phieu({ trang_thai_sua: 'da_cap' }), true)).toBe(true);
    expect(canKhoaLaiQuyenSua(phieu({ trang_thai_sua: 'cho_cap' }), true)).toBe(false);
  });
});

describe('trangThaiSauKhiSua', () => {
  it('người được cấp sửa phiếu đã duyệt → về Chờ duyệt; cấp cao giữ nguyên', () => {
    expect(trangThaiSauKhiSua('Đã duyệt', false)).toBe('Chờ duyệt');
    expect(trangThaiSauKhiSua('Đã duyệt', true)).toBe('Đã duyệt');
    expect(trangThaiSauKhiSua('Không duyệt', false)).toBe('Không duyệt');
  });
});
