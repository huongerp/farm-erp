import { describe, expect, it } from 'vitest';
import {
  docThamSoInDanhSach,
  taoAoaDanhSachXlsx,
  taoDongDanhSachIn,
  taoUrlInDanhSach,
  tenFileDanhSach,
} from './danh-sach-in';
import type { DangKyNhanHang } from './types';

function phieu(p: Partial<DangKyNhanHang> & { id: string }): DangKyNhanHang {
  return {
    id_chi_nhanh: '12',
    ten_chi_nhanh: 'NSC fp3',
    ngay_dang_ky: '2026-10-11',
    khach_hang: 'HQ1',
    loai_hang_hoa: 'HQ1 10CP - 12CP',
    so_luong_dang_ky: null,
    so_xe: null,
    so_cont: null,
    ten_tai_xe: null,
    sdt_tai_xe: null,
    gio_dang_ky_tu: null,
    gio_dang_ky_den: null,
    tg_vao_thuc_te: null,
    tg_ra_thuc_te: null,
    id_nguoi_check_in: null,
    id_nguoi_check_out: null,
    ten_nguoi_check_in: null,
    ten_nguoi_check_out: null,
    trang_thai: 'cho_vao',
    ghi_chu: null,
    hinh_anh_urls: [],
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    tg_tao: '',
    tg_cap_nhat: '',
    tong_so_luong: 0,
    ...p,
  };
}

const nhanTT = (tt: string) => `TT:${tt}`;

describe('taoDongDanhSachIn', () => {
  it('bỏ phiếu huỷ, xếp theo giờ đăng ký, chưa có giờ xuống cuối, đánh lại STT', () => {
    const dong = taoDongDanhSachIn(
      [
        phieu({ id: '1', so_xe: 'A', gio_dang_ky_tu: null }),
        phieu({ id: '2', so_xe: 'B', gio_dang_ky_tu: '16:00' }),
        phieu({ id: '3', so_xe: 'C', gio_dang_ky_tu: '08:30', trang_thai: 'huy' }),
        phieu({ id: '4', so_xe: 'D', gio_dang_ky_tu: '07:00', trang_thai: 'da_ra' }),
        phieu({ id: '5', so_xe: 'E', gio_dang_ky_tu: null }),
      ],
      nhanTT
    );
    expect(dong.map((d) => [d.stt, d.soXe])).toEqual([
      [1, 'D'],
      [2, 'B'],
      [3, 'A'],
      [4, 'E'],
    ]);
  });

  it('map cột: số xe lấy số cont khi thiếu, kho = chi nhánh, thông tin thêm = ghi chú', () => {
    const [d] = taoDongDanhSachIn(
      [phieu({ id: '1', so_cont: 'PCIU 6082984', ten_tai_xe: 'Thuận', ghi_chu: 'Xe lạnh', so_luong_dang_ky: 1200 })],
      nhanTT
    );
    expect(d).toMatchObject({
      soXe: 'PCIU 6082984',
      taiXe: 'Thuận',
      trangThai: 'TT:cho_vao',
      kho: 'NSC fp3',
      thongTin: 'Xe lạnh',
      khachHang: 'HQ1',
      soLuong: 1200,
      loaiHang: 'HQ1 10CP - 12CP',
    });
  });
});

describe('tham số URL', () => {
  it('tạo và đọc lại ngày + chi nhánh', () => {
    const url = taoUrlInDanhSach('2026-10-11', ['12', '3']);
    expect(docThamSoInDanhSach(new URL(url, 'http://x').searchParams)).toEqual({
      ngay: '2026-10-11',
      idChiNhanh: ['12', '3'],
    });
  });

  it('ngày sai / thiếu → null, id chi nhánh không phải số bị bỏ', () => {
    expect(docThamSoInDanhSach(new URLSearchParams('ngay=11/10/2026&cn=1,abc,,2'))).toEqual({
      ngay: null,
      idChiNhanh: ['1', '2'],
    });
    expect(docThamSoInDanhSach(new URLSearchParams('')).ngay).toBeNull();
  });
});

describe('XLSX', () => {
  it('tiêu đề, số lượng xe, header đúng thứ tự cột, số lượng trống thì để ô rỗng', () => {
    const dong = taoDongDanhSachIn([phieu({ id: '1', so_xe: '56H-16643' })], nhanTT);
    const nhan = (k: string, v?: Record<string, unknown>) => (v ? `${k}|${JSON.stringify(v)}` : k);
    const aoa = taoAoaDanhSachXlsx('2026-10-11', dong, nhan);
    expect(aoa[0]).toEqual(['tieuDe|{"ngay":"11/10/2026"}']);
    expect(aoa[1]).toEqual(['soLuongXe|{"n":1}']);
    expect(aoa[3]).toEqual([
      'col.stt',
      'col.soXe',
      'col.taiXe',
      'col.trangThai',
      'col.kho',
      'col.thongTin',
      'col.khachHang',
      'col.soLuong',
      'col.loaiHang',
    ]);
    expect(aoa[4]).toEqual([1, '56H-16643', '', 'TT:cho_vao', 'NSC fp3', '', 'HQ1', '', 'HQ1 10CP - 12CP']);
    expect(tenFileDanhSach('2026-10-11')).toBe('danh-sach-xe-11-10-2026');
  });
});
