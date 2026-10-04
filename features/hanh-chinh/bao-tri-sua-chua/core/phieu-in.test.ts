import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import { duLieuPhieuIn, taiSanIn } from './phieu-in';
import type { PhieuBaoTriSuaChua } from './types';

const t = ((k: string) => k) as unknown as TFunction;
const dinhDang = { tien: (n: number) => `${n} đ`, ngayGio: (iso: string) => `[${iso}]` };

const phieu = (over: Partial<PhieuBaoTriSuaChua> = {}): PhieuBaoTriSuaChua => ({
  id: '7',
  ma_phieu: 'CPTS-0007',
  ngay: '2026-10-03',
  id_tai_san: '1',
  ma_tai_san: 'TS-001',
  ten_tai_san: 'Máy bơm',
  id_chi_nhanh: '2',
  ten_chi_nhanh: 'Chi nhánh Chư Prông',
  id_hang_muc: '5',
  ten_hang_muc: 'Sửa chữa',
  mo_ta: '  Thay phớt  ',
  so_tien: 1_250_000,
  id_nha_cung_cap: '9',
  ten_nha_cung_cap: 'Cơ khí Minh Phát',
  trang_thai: 'da_duyet',
  nguoi_duyet: 'Trần B',
  id_nguoi_tao: '3',
  ten_nguoi_tao: 'Nguyễn A',
  tg_tao: '2026-10-03T08:00:00Z',
  tg_cap_nhat: '',
  ...over,
});

describe('duLieuPhieuIn', () => {
  it('ghép đủ trường, ngày dd/mm/yyyy, tiền kèm chữ', () => {
    const d = duLieuPhieuIn(phieu(), t, dinhDang);
    expect(d).toMatchObject({
      soPhieu: 'CPTS-0007',
      ngay: '03/10/2026',
      ngayLap: '[2026-10-03T08:00:00Z]',
      chiNhanh: 'Chi nhánh Chư Prông',
      taiSan: 'TS-001 – Máy bơm',
      hangMuc: 'Sửa chữa',
      moTa: 'Thay phớt',
      soTien: '1250000 đ',
      soTienChu: 'Một triệu hai trăm năm mươi nghìn đồng',
      nhaCungCap: 'Cơ khí Minh Phát',
      trangThai: 'da_duyet',
      nguoiDeNghi: 'Nguyễn A',
      nguoiDuyet: 'Trần B',
    });
  });

  it('phiếu cũ thiếu chi nhánh / tên hạng mục / người duyệt → chuỗi rỗng hoặc id', () => {
    const d = duLieuPhieuIn(
      phieu({ ten_chi_nhanh: null, ten_nha_cung_cap: null, ten_hang_muc: undefined, id_hang_muc: 'sua_chua', nguoi_duyet: null, tg_tao: '' }),
      t,
      dinhDang
    );
    expect(d.chiNhanh).toBe('');
    expect(d.nhaCungCap).toBe('');
    expect(d.hangMuc).toBe('sua_chua');
    expect(d.nguoiDuyet).toBe('');
    expect(d.ngayLap).toBe('');
  });
});

describe('taiSanIn', () => {
  it('bỏ phần trống', () => {
    expect(taiSanIn({ ma_tai_san: 'TS-1', ten_tai_san: undefined })).toBe('TS-1');
    expect(taiSanIn({ ma_tai_san: '', ten_tai_san: 'Xe' })).toBe('Xe');
  });
});
