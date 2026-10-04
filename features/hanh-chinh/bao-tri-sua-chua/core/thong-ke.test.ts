import { describe, it, expect } from 'vitest';
import { tinhThongKe } from './thong-ke';
import type { PhieuBaoTriSuaChua } from './types';

const opts = {
  tenHangMuc: (id: string) => `HM:${id}`,
  chuaCoChiNhanh: 'Chưa có chi nhánh',
  khongCoNhaCungCap: 'Không chọn NCC',
};

let seq = 0;
const phieu = (over: Partial<PhieuBaoTriSuaChua>): PhieuBaoTriSuaChua => ({
  id: String(++seq),
  ma_phieu: `CPTS-${seq}`,
  ngay: '2026-09-15',
  id_tai_san: 'TS1',
  ma_tai_san: 'TS-01',
  ten_tai_san: 'Máy bơm',
  id_hang_muc: '2',
  ten_hang_muc: 'Sửa chữa',
  mo_ta: '',
  so_tien: 0,
  trang_thai: 'cho_duyet',
  id_nguoi_tao: '1',
  tg_tao: '',
  tg_cap_nhat: '',
  ...over,
});

describe('tinhThongKe', () => {
  const ds = [
    phieu({ so_tien: 1_000_000, trang_thai: 'da_duyet', id_chi_nhanh: '2', ten_chi_nhanh: 'Farm fp2', id_nha_cung_cap: '9', ten_nha_cung_cap: 'Minh Phát' }),
    phieu({ so_tien: 500_000, trang_thai: 'cho_duyet', id_chi_nhanh: '2', ten_chi_nhanh: 'Farm fp2', ngay: '2026-10-01' }),
    phieu({ so_tien: 2_000_000, trang_thai: 'khong_duyet', id_tai_san: 'TS2', ma_tai_san: 'TS-02', ten_tai_san: 'Xe tải', id_chi_nhanh: '3', ten_chi_nhanh: 'Farm fp3', ngay: '2026-10-20' }),
    phieu({ so_tien: 300_000, trang_thai: 'da_duyet', id_hang_muc: 'bao_tri', ten_hang_muc: undefined, ngay: '2026-10-31' }),
  ];
  const kq = tinhThongKe(ds, opts);

  it('tổng quan: tổng tiền, tiền đã duyệt, số chờ duyệt, số tài sản', () => {
    expect(kq.tongQuan).toEqual({
      soPhieu: 4,
      tongTien: 3_800_000,
      tienDaDuyet: 1_300_000,
      soChoDuyet: 1,
      soTaiSan: 2,
    });
  });

  it('theo chi nhánh: có nhóm trống, sắp giảm dần theo tiền', () => {
    expect(kq.theoChiNhanh.map((n) => [n.ten, n.soPhieu, n.tongTien])).toEqual([
      ['Farm fp3', 1, 2_000_000],
      ['Farm fp2', 2, 1_500_000],
      ['Chưa có chi nhánh', 1, 300_000],
    ]);
  });

  it('theo nhà cung cấp: phiếu không chọn NCC gộp một nhóm', () => {
    expect(kq.theoNhaCungCap.map((n) => [n.ten, n.tongTien])).toEqual([
      ['Không chọn NCC', 2_800_000],
      ['Minh Phát', 1_000_000],
    ]);
  });

  it('theo hạng mục: thiếu tên lưu tắt thì tra qua tenHangMuc', () => {
    expect(kq.theoHangMuc.map((n) => n.ten)).toEqual(['Sửa chữa', 'HM:bao_tri']);
  });

  it('theo tài sản: ghép mã – tên', () => {
    expect(kq.theoTaiSan[0]).toMatchObject({ ten: 'TS-02 – Xe tải', tongTien: 2_000_000 });
  });

  it('theo tháng: cắt chuỗi ngày (ngày cuối tháng không nhảy tháng), sắp tăng dần', () => {
    expect(kq.theoThang).toEqual([
      { thang: '2026-09', nhan: '09/2026', soPhieu: 1, tongTien: 1_000_000 },
      { thang: '2026-10', nhan: '10/2026', soPhieu: 3, tongTien: 2_800_000 },
    ]);
  });

  it('danh sách rỗng', () => {
    const r = tinhThongKe([], opts);
    expect(r.tongQuan.tongTien).toBe(0);
    expect(r.theoThang).toEqual([]);
  });
});
