import { describe, expect, it } from 'vitest';
import {
  caiDatThuongVuotMacDinh,
  caiDatTuDb,
  chuanHoaHeSoNhom,
  ganHeSoNhom,
  heSoHieuLuc,
  khoaNguoi,
  thuongVuotNhom,
  tinhThuongVuotChuyen,
  tongHopThuongThang,
  viTriKhongThuongVuot,
  type CaiDatThuongVuot,
} from './thuong-vuot-thung';
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt, FarmBaoCaoNhanCongNv, LoaiChuyen } from './types';

const nv = (ho_ten: string, so_nhom: number | null, patch: Partial<FarmBaoCaoNhanCongNv> = {}): FarmBaoCaoNhanCongNv => ({
  id: ho_ten,
  id_bcnc_ct: 'ct',
  id_nhan_vien: null,
  ho_ten,
  vi_tri: null,
  so_nhom,
  cham_cong: 'CA_NGAY',
  so_gio_cong: 7.5,
  so_gio_tc: 0,
  ghi_chu: null,
  thu_tu: 0,
  ...patch,
});

const caiDat = (patch: Partial<CaiDatThuongVuot> = {}): CaiDatThuongVuot => ({ ...caiDatThuongVuotMacDinh(), ...patch });
const KHONG_LOAI = new Set<string>();

describe('thuongVuotNhom', () => {
  const co = { mucTieu: 3, nguongPct: 90, heSoChuyen: 1, heSoNhom: 1, donGia: 1000 };

  it('ví dụ chốt: 5 người × 7,5h, 130 thùng, hệ số 1,2 × 1,1 → 37.950đ', () => {
    const kq = thuongVuotNhom({ ...co, soThung: 130, gioCong: 37.5, heSoChuyen: 1.2, heSoNhom: 1.1 });
    expect(kq?.nguongThung).toBeCloseTo(101.25);
    expect(kq?.thungVuot).toBeCloseTo(28.75);
    expect(kq?.tien).toBeCloseTo(37_950);
  });

  it('dưới / đúng ngưỡng 90% → 0 (không trừ âm)', () => {
    expect(thuongVuotNhom({ ...co, soThung: 90, gioCong: 37.5 })?.tien).toBe(0);
    expect(thuongVuotNhom({ ...co, soThung: 101.25, gioCong: 37.5 })?.tien).toBe(0);
  });

  it('chưa nhập số thùng hoặc không có giờ → null', () => {
    expect(thuongVuotNhom({ ...co, soThung: null, gioCong: 37.5 })).toBeNull();
    expect(thuongVuotNhom({ ...co, soThung: 50, gioCong: 0 })).toBeNull();
  });
});

describe('hệ số', () => {
  it('nhóm sửa trên phiếu → mặc định Cài đặt → 1', () => {
    const cd = caiDat({ heSoChuyen: { TIA_DANH_GIA: 1.2 }, heSoNhom: { TIA_DANH_GIA: { '1': 1.1 } } });
    expect(heSoHieuLuc(cd, 'TIA_DANH_GIA', 1)).toEqual({ heSoChuyen: 1.2, heSoNhom: 1.1, nhomTuPhieu: false });
    expect(heSoHieuLuc(cd, 'TIA_DANH_GIA', 1, { '1': 1.3 })).toEqual({ heSoChuyen: 1.2, heSoNhom: 1.3, nhomTuPhieu: true });
    expect(heSoHieuLuc(cd, 'XAN_NAI', 2)).toEqual({ heSoChuyen: 1, heSoNhom: 1, nhomTuPhieu: false });
  });

  it('ô hệ số nhóm: «1,25» nhận, trống / sai bỏ khoá; jsonb lạ bị lọc', () => {
    expect(ganHeSoNhom({}, 2, '1,25')).toEqual({ '2': 1.25 });
    expect(ganHeSoNhom({ '2': 1.25 }, 2, '')).toEqual({});
    expect(ganHeSoNhom({ '2': 1.25 }, 2, 'abc')).toEqual({});
    expect(chuanHoaHeSoNhom({ '1': 1.2, '0': 2, x: 1, '3': -1, '4': '0,9' })).toEqual({ '1': 1.2, '4': 0.9 });
  });

  it('caiDatTuDb: dòng so_nhom NULL = hệ số chuyền, bỏ chuyền lạ; thiếu cài đặt = 1.000đ / 90%', () => {
    const cd = caiDatTuDb(null, [
      { loai_chuyen: 'TIA_DANH_GIA', so_nhom: null, he_so: '1.200' },
      { loai_chuyen: 'TIA_DANH_GIA', so_nhom: 2, he_so: 1.1 },
      { loai_chuyen: 'NGOAI_LE', so_nhom: null, he_so: 5 },
    ]);
    expect(cd).toEqual({ donGia: 1000, nguongPct: 90, heSoChuyen: { TIA_DANH_GIA: 1.2 }, heSoNhom: { TIA_DANH_GIA: { '2': 1.1 } } });
    expect(caiDatTuDb({ don_gia_vuot: '1500.00', nguong_ns_pct: '95' }, []).donGia).toBe(1500);
  });
});

describe('tinhThuongVuotChuyen', () => {
  it('chia theo giờ công; người buổi sáng nhận nửa; người nghỉ 0', () => {
    const [g] = tinhThuongVuotChuyen(
      {
        loai_chuyen: 'TIA_DANH_GIA',
        nhanVien: [nv('A', 1), nv('B', 1, { cham_cong: 'SANG', so_gio_cong: 3.75 }), nv('C', 1, { cham_cong: 'NGHI', so_gio_cong: 0 })],
        soThungNhom: { '1': 40.375 }, // ngưỡng 2,7 × 11,25 = 30,375 → vượt 10
        heSoNhom: {},
      },
      3,
      caiDat(),
      KHONG_LOAI
    );
    expect(g.gioCong).toBe(11.25);
    expect(g.ketQua?.thungVuot).toBeCloseTo(10);
    expect(g.nguoi.map((p) => Math.round(p.tien))).toEqual([6667, 3333, 0]);
  });

  it('nhóm trưởng (vị trí loại trừ) không nhận và giờ không vào ngưỡng; người chưa chia nhóm bị bỏ', () => {
    const loai = viTriKhongThuongVuot([{ ten: 'NT TỈA', khong_thuong_vuot: true }, { ten: 'Tỉa', khong_thuong_vuot: false }]);
    const ds = tinhThuongVuotChuyen(
      {
        loai_chuyen: 'TIA_DANH_GIA',
        nhanVien: [nv('NT', 1, { vi_tri: 'nt  tỉa' }), nv('A', 1, { vi_tri: 'Tỉa' }), nv('X', null)],
        soThungNhom: { '1': 30.25 }, // chỉ A: ngưỡng 20,25 → vượt 10
        heSoNhom: {},
      },
      3,
      caiDat(),
      loai
    );
    expect(ds).toHaveLength(1);
    expect(ds[0].nguoi.map((p) => p.nv.ho_ten)).toEqual(['A']);
    expect(ds[0].ketQua?.tien).toBeCloseTo(10_000);
  });

  it('dòng V / Ngoài lô không tính', () => {
    const r = tinhThuongVuotChuyen(
      { loai_chuyen: 'CONG_DINH_BIEN_KHONG_SAN_XUAT', nhanVien: [nv('A', 1)], soThungNhom: { '1': 100 }, heSoNhom: {} },
      3,
      caiDat(),
      KHONG_LOAI
    );
    expect(r).toEqual([]);
  });
});

describe('tongHopThuongThang', () => {
  const ct = (loai: LoaiChuyen, nhan_vien: FarmBaoCaoNhanCongNv[], so_thung_nhom: Record<string, number>): FarmBaoCaoNhanCongCt => ({
    id: loai,
    id_bao_cao: 'p',
    loai_chuyen: loai,
    sl_cong_ngay: 0,
    sl_cong_nua: 0,
    sl_tang_ca: 0,
    so_gio_tc: 0,
    ghi_chu: null,
    thu_tu: 1,
    nhan_vien,
    so_thung_nhom,
    he_so_nhom: {},
  });
  const phieu = (ngay: string, chi_tiet: FarmBaoCaoNhanCongCt[]): Pick<FarmBaoCaoNhanCong, 'ngay' | 'chi_tiet' | 'muc_tieu_ns_nhom'> => ({
    ngay,
    chi_tiet,
    muc_tieu_ns_nhom: 3,
  });

  it('gộp một người qua nhiều ngày / chuyền theo id danh mục, nhân Ki rồi làm tròn', () => {
    const a = (p: Partial<FarmBaoCaoNhanCongNv> = {}) => nv('Lan', 1, { id_nhan_vien: '7', ...p });
    const ds = tongHopThuongThang(
      [
        phieu('2026-11-02', [ct('TIA_DANH_GIA', [a()], { '1': 30.25 })]), // vượt 10 → 10.000
        phieu('2026-11-01', [ct('XAN_NAI', [a({ ho_ten: 'lan ' })], { '1': 25.25 })]), // vượt 5 → 5.000
        phieu('2026-11-03', [ct('TIA_DANH_GIA', [a()], { '1': 10 })]), // dưới ngưỡng → 0
      ],
      caiDat(),
      KHONG_LOAI,
      { 'nv:7': 0.95 }
    );
    expect(ds).toHaveLength(1);
    expect(ds[0]).toMatchObject({ khoa: 'nv:7', ho_ten: 'Lan', soNgay: 3, gioCong: 22.5, ki: 0.95, tien: 14_250, chuyen: ['XAN_NAI', 'TIA_DANH_GIA'] });
    expect(ds[0].tienTruocKi).toBeCloseTo(15_000);
    expect(ds[0].ngay.map((d) => d.ngay)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
  });

  it('phiếu chưa nhập số thùng vẫn liệt kê người với 0đ; chưa gắn danh mục thì gộp theo tên', () => {
    const ds = tongHopThuongThang([phieu('2026-11-01', [ct('TIA_DANH_GIA', [nv('Hoa  Thị', 2)], {})])], caiDat(), KHONG_LOAI);
    expect(ds).toMatchObject([{ khoa: 'ten:hoa thị', ho_ten: 'Hoa Thị', tien: 0, ki: 1 }]);
    expect(khoaNguoi({ id_nhan_vien: null, ho_ten: ' Hoa  Thị ' })).toBe('ten:hoa thị');
  });
});
