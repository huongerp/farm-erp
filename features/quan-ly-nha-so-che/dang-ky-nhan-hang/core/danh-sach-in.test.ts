import { describe, expect, it } from 'vitest';
import {
  cotDanhSachIn,
  docThamSoInDanhSach,
  taoAoaDanhSachXlsx,
  taoDongDanhSachIn,
  taoUrlInDanhSach,
  tenFileDanhSach,
  tieuDeDanhSach,
  type LocInDanhSach,
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
  it('giữ thứ tự server (kể cả phiếu huỷ như danh sách), đánh STT', () => {
    const dong = taoDongDanhSachIn(
      [
        phieu({ id: '1', so_xe: 'A', gio_dang_ky_tu: '16:00' }),
        phieu({ id: '2', so_xe: 'B', trang_thai: 'huy' }),
        phieu({ id: '3', so_xe: 'C', gio_dang_ky_tu: '07:00' }),
      ],
      nhanTT
    );
    expect(dong.map((d) => [d.stt, d.soXe, d.trangThai])).toEqual([
      [1, 'A', 'TT:cho_vao'],
      [2, 'B', 'TT:huy'],
      [3, 'C', 'TT:cho_vao'],
    ]);
  });

  it('map cột: số xe lấy số cont khi thiếu, kho = chi nhánh, thông tin thêm = ghi chú', () => {
    const [d] = taoDongDanhSachIn(
      [phieu({ id: '1', so_cont: 'PCIU 6082984', ten_tai_xe: 'Thuận', ghi_chu: 'Xe lạnh', so_luong_dang_ky: 1200 })],
      nhanTT
    );
    expect(d).toMatchObject({
      ngay: '11/10/2026',
      soXe: 'PCIU 6082984',
      taiXe: 'Thuận',
      kho: 'NSC fp3',
      thongTin: 'Xe lạnh',
      khachHang: 'HQ1',
      soLuong: 1200,
      loaiHang: 'HQ1 10CP - 12CP',
    });
  });
});

describe('tham số URL', () => {
  const loc: LocInDanhSach = {
    tu: '2026-10-01',
    den: '2026-10-11',
    q: 'HQ1',
    trangThai: ['cho_vao', 'da_vao'],
    idChiNhanh: ['12', '3'],
    sortColumn: 'gio_dang_ky_tu',
    sortDirection: 'asc',
  };

  it('tạo rồi đọc lại đúng bộ lọc', () => {
    expect(docThamSoInDanhSach(new URL(taoUrlInDanhSach(loc), 'http://x').searchParams)).toEqual(loc);
  });

  it('không lọc gì → URL trống tham số, đọc ra bộ lọc rỗng', () => {
    const rong: LocInDanhSach = { tu: '', den: '', q: '', trangThai: [], idChiNhanh: [], sortColumn: null, sortDirection: null };
    const url = taoUrlInDanhSach(rong);
    expect(url).toBe('/quan-ly-nha-so-che/dang-ky-nhan-hang/in-danh-sach');
    expect(docThamSoInDanhSach(new URL(url, 'http://x').searchParams)).toEqual(rong);
  });

  it('giá trị lạ bị bỏ: ngày sai, trạng thái lạ, id không phải số, cột sort không cho phép', () => {
    const sp = new URLSearchParams('tu=11/10/2026&den=2026-10-11&tt=cho_vao,xyz&cn=1,abc,,2&sort=mat_khau&dir=asc');
    expect(docThamSoInDanhSach(sp)).toEqual({
      tu: '',
      den: '2026-10-11',
      q: '',
      trangThai: ['cho_vao'],
      idChiNhanh: ['1', '2'],
      sortColumn: null,
      sortDirection: null,
    });
  });
});

describe('tiêu đề, tên file, cột', () => {
  it('tiêu đề theo khoảng ngày', () => {
    expect(tieuDeDanhSach('2026-10-11', '2026-10-11')).toEqual({ key: 'ngay', vars: { ngay: '11/10/2026' } });
    expect(tieuDeDanhSach('2026-10-01', '2026-10-11')).toEqual({
      key: 'khoang',
      vars: { tu: '01/10/2026', den: '11/10/2026' },
    });
    expect(tieuDeDanhSach('2026-10-01', '')).toEqual({ key: 'tu', vars: { tu: '01/10/2026' } });
    expect(tieuDeDanhSach('', '2026-10-11')).toEqual({ key: 'den', vars: { den: '11/10/2026' } });
    expect(tieuDeDanhSach('', '')).toEqual({ key: 'tatCa', vars: {} });
    expect(tenFileDanhSach('2026-10-11', '2026-10-11')).toBe('danh-sach-xe-11-10-2026');
    expect(tenFileDanhSach('2026-10-01', '2026-10-11')).toBe('danh-sach-xe-01-10-2026_11-10-2026');
    expect(tenFileDanhSach('', '')).toBe('danh-sach-xe');
  });

  it('chỉ thêm cột Ngày khi danh sách trải nhiều ngày', () => {
    const motNgay = taoDongDanhSachIn([phieu({ id: '1' }), phieu({ id: '2' })], nhanTT);
    expect(cotDanhSachIn(motNgay)).not.toContain('ngay');
    const haiNgay = taoDongDanhSachIn([phieu({ id: '1' }), phieu({ id: '2', ngay_dang_ky: '2026-10-12' })], nhanTT);
    expect(cotDanhSachIn(haiNgay).slice(0, 3)).toEqual(['stt', 'ngay', 'soXe']);
  });
});

describe('XLSX', () => {
  it('tiêu đề, số lượng xe, header đúng thứ tự cột, số lượng trống thì để ô rỗng', () => {
    const dong = taoDongDanhSachIn([phieu({ id: '1', so_xe: '56H-16643' })], nhanTT);
    const nhan = (k: string, v?: Record<string, unknown>) => (v ? `${k}|${JSON.stringify(v)}` : k);
    const aoa = taoAoaDanhSachXlsx('TIEU DE', dong, nhan);
    expect(aoa[0]).toEqual(['TIEU DE']);
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
  });
});
