import { describe, expect, it } from 'vitest';
import { dongChotTuThuongThang, dongThuongTuChot, tongThuongThang, type DongChotDb } from './chot-thuong-thang';
import type { DongThuongThang } from './thuong-vuot-thung';

const dong = (over: Partial<DongThuongThang> = {}): DongThuongThang => ({
  khoa: 'nv:7',
  ho_ten: 'Nguyễn Thị Hoa',
  id_nhan_vien: '7',
  vi_tri: 'Tỉa',
  chuyen: ['TIA_DANH_GIA'] as DongThuongThang['chuyen'],
  soNgay: 2,
  gioCong: 15.333333,
  thungVuotQuyDoi: 4.126,
  tienTruocKi: 4126.4,
  ki: 0.95,
  tien: 3920,
  ngay: [{ ngay: '2026-11-03', loai_chuyen: 'TIA_DANH_GIA', soNhom: 2, gioCong: 7.666666, thungVuotQuyDoi: 2.063, tien: 2063.2 }],
  ...over,
});

describe('chốt thưởng tháng — ảnh chụp', () => {
  it('payload làm tròn giờ/thùng 2 số lẻ, tiền trước Ki về đồng, giữ tiền đã tính', () => {
    const [p] = dongChotTuThuongThang([dong()]);
    expect(p).toMatchObject({ khoa_nv: 'nv:7', id_nhan_vien: '7', gio_cong: 15.33, thung_vuot: 4.13, tien_truoc_ki: 4126, ki: 0.95, tien: 3920 });
    expect(p.chi_tiet_ngay[0]).toMatchObject({ gioCong: 7.67, thungVuotQuyDoi: 2.06, tien: 2063.2 });
  });

  it('đọc lại ảnh chụp từ DB (numeric dạng chuỗi) ra cùng số tiền, theo thu_tu', () => {
    const rows: DongChotDb[] = [
      { khoa_nv: 'ten:lan', id_nhan_vien: null, ho_ten: 'Lan', vi_tri: null, chuyen: ['TIA_DANH_GIA', 'XYZ'], so_ngay: 1, gio_cong: '7.50', thung_vuot: '0', tien_truoc_ki: '0', ki: '1.00', tien: '0', chi_tiet_ngay: null, thu_tu: 2 },
      { ...dongChotTuThuongThang([dong()])[0], id_nhan_vien: 7, ki: '0.95', tien: '3920', thu_tu: 1 },
    ];
    const ds = dongThuongTuChot(rows);
    expect(ds.map((d) => d.khoa)).toEqual(['nv:7', 'ten:lan']);
    expect(ds[0]).toMatchObject({ id_nhan_vien: '7', ki: 0.95, tien: 3920, gioCong: 15.33 });
    expect(ds[0].ngay).toHaveLength(1);
    expect(ds[1]).toMatchObject({ id_nhan_vien: null, chuyen: ['TIA_DANH_GIA'], ki: 1, gioCong: 7.5, ngay: [] });
  });

  it('tổng tháng cộng đúng các cột', () => {
    expect(tongThuongThang([dong(), dong({ khoa: 'nv:8', gioCong: 8, thungVuotQuyDoi: 1, tienTruocKi: 1000, tien: 1000 })])).toEqual({
      gio: 23.333333,
      thung: 5.126,
      truocKi: 5126.4,
      tien: 4920,
    });
  });
});
