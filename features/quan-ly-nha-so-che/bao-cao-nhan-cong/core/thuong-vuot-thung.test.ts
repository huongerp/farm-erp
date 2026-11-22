import { describe, expect, it } from 'vitest';
import {
  caiDatThuongVuotMacDinh,
  caiDatTuDb,
  chuanHoaHeSoNhom,
  ganHeSoNhom,
  heSoHieuLuc,
  gioTinhThuong,
  khoaNguoi,
  kpiSoCheTuDong,
  quyVuotNgay,
  thuongVuotCuaPhieu,
  tongHopThuongThang,
  viTriKhongThuongVuot,
  type CaiDatThuongVuot,
  type KpiSoCheNgay,
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

describe('quỹ ngày từ KPI Báo cáo sơ chế', () => {
  const kpi = (patch: Partial<KpiSoCheNgay> = {}): KpiSoCheNgay => ({ thuHoiThucTe: 211, thuHoiMucTieu: 196, nsThucTe: 2.8, nsMucTieu: 3, ...patch });

  it('vượt 15 thùng, NS 93% ≥ 90% → quỹ 15.000đ', () => {
    expect(quyVuotNgay(kpi(), caiDat())).toMatchObject({ thungVuot: 15, datNs: true, quy: 15_000 });
  });

  it('NS sơ chế dưới ngưỡng (58,6%) → quỹ 0 dù có vượt', () => {
    expect(quyVuotNgay(kpi({ nsThucTe: 1.7583 }), caiDat())).toMatchObject({ thungVuot: 15, datNs: false, quy: 0 });
  });

  it('thu hồi thấp hơn mục tiêu → 0 (không âm); chưa có NS → không đạt', () => {
    expect(quyVuotNgay(kpi({ thuHoiThucTe: 180 }), caiDat())).toMatchObject({ thungVuot: 0, quy: 0 });
    expect(quyVuotNgay(kpi({ nsThucTe: null }), caiDat())).toMatchObject({ nsTyLe: null, datNs: false, quy: 0 });
  });

  it('chưa có báo cáo / thiếu số thu hồi / mục tiêu 0 → null', () => {
    expect(quyVuotNgay(null, caiDat())).toBeNull();
    expect(quyVuotNgay(kpi({ thuHoiThucTe: null }), caiDat())).toBeNull();
    expect(quyVuotNgay(kpi({ thuHoiMucTieu: 0 }), caiDat())).toBeNull();
  });

  it('kpiSoCheTuDong khớp theo tên hạng mục (không theo thứ tự), đọc số có dấu phẩy', () => {
    const k = kpiSoCheTuDong([
      { ten_hang_muc: ' tỷ lệ  thu hồi ', muc_tieu: '196', thuc_te: '211' },
      { ten_hang_muc: 'Năng suất sơ chế', muc_tieu: '3', thuc_te: '1,7583' },
      { ten_hang_muc: 'Tỷ lệ nải chuỗi lỗi', muc_tieu: '5', thuc_te: '0.93' },
    ]);
    expect(k).toEqual({ thuHoiThucTe: 211, thuHoiMucTieu: 196, nsThucTe: 1.7583, nsMucTieu: 3 });
    expect(kpiSoCheTuDong([])).toBeNull();
  });
});

describe('giờ tính thưởng (công + TC, bỏ người xuống sớm)', () => {
  it('nhóm có tăng ca: người không TC bị loại; người TC tính công + TC', () => {
    const r = gioTinhThuong([nv('A', 1, { so_gio_tc: 2 }), nv('B', 1), nv('C', 1, { cham_cong: 'NGHI', so_gio_cong: 0 })]);
    expect(r.map((p) => [p.gio, p.xuongSom])).toEqual([[9.5, false], [0, true], [0, false]]);
  });

  it('nhóm không ai tăng ca: tính đủ giờ công', () => {
    const r = gioTinhThuong([nv('A', 1), nv('B', 1, { cham_cong: 'SANG', so_gio_cong: 3.75 })]);
    expect(r.map((p) => [p.gio, p.xuongSom])).toEqual([[7.5, false], [3.75, false]]);
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

describe('thuongVuotCuaPhieu', () => {
  const KPI_DAT: KpiSoCheNgay = { thuHoiThucTe: 211, thuHoiMucTieu: 196, nsThucTe: 3, nsMucTieu: 3 }; // quỹ 15.000
  const ct = (loai: LoaiChuyen, nhan_vien: FarmBaoCaoNhanCongNv[], he_so_nhom: Record<string, number> = {}) => ({ loai_chuyen: loai, nhan_vien, he_so_nhom });

  it('chia quỹ về nhóm theo giờ × hệ số, trong nhóm theo giờ; người buổi sáng nhận nửa', () => {
    const r = thuongVuotCuaPhieu(
      {
        chi_tiet: [
          ct('TIA_DANH_GIA', [nv('A', 1), nv('B', 1, { cham_cong: 'SANG', so_gio_cong: 3.75 })]), // 11,25h × 1
          ct('XAN_NAI', [nv('C', 1)], { '1': 2 }), // 7,5h × 2 = 15
        ],
      },
      KPI_DAT,
      caiDat(),
      KHONG_LOAI
    );
    const [tia, xan] = r.chuyen;
    expect(r.quy?.quy).toBe(15_000);
    expect(tia.nhom[0].tien).toBeCloseTo((15_000 * 11.25) / 26.25);
    expect(xan.nhom[0].tien).toBeCloseTo((15_000 * 15) / 26.25);
    expect(tia.nhom[0].nguoi.map((p) => Math.round(p.tien))).toEqual([4286, 2143]);
  });

  it('nhóm có TC: người xuống sớm 0 giờ, 0 tiền; nhóm trưởng có TC không làm nhóm thành «có TC»', () => {
    const loai = viTriKhongThuongVuot([{ ten: 'NT TỈA', khong_thuong_vuot: true }]);
    const r = thuongVuotCuaPhieu(
      {
        chi_tiet: [
          ct('TIA_DANH_GIA', [nv('A', 1, { so_gio_tc: 2 }), nv('B', 1)]),
          ct('XAN_NAI', [nv('NT', 1, { vi_tri: 'nt tỉa', so_gio_tc: 2 }), nv('C', 1)]),
        ],
      },
      KPI_DAT,
      caiDat(),
      loai
    );
    const [tia, xan] = r.chuyen;
    expect(tia.nhom[0]).toMatchObject({ gioCong: 9.5, soXuongSom: 1 });
    expect(tia.nhom[0].nguoi.map((p) => [p.nv.ho_ten, p.xuongSom, p.gioCong])).toEqual([['A', false, 9.5], ['B', true, 0]]);
    expect(tia.nhom[0].nguoi[1].tien).toBe(0);
    expect(xan.nhom[0].nguoi.map((p) => [p.nv.ho_ten, p.gioCong])).toEqual([['C', 7.5]]);
    expect(tia.nhom[0].tien + xan.nhom[0].tien).toBeCloseTo(15_000);
  });

  it('NS không đạt → mọi người 0đ nhưng vẫn liệt kê; chưa có KPI → quỹ null', () => {
    const p = { chi_tiet: [ct('TIA_DANH_GIA', [nv('A', 1)])] };
    const khongDat = thuongVuotCuaPhieu(p, { ...KPI_DAT, nsThucTe: 1.7583 }, caiDat(), KHONG_LOAI);
    expect(khongDat.chuyen[0].nhom[0].nguoi[0].tien).toBe(0);
    expect(thuongVuotCuaPhieu(p, null, caiDat(), KHONG_LOAI).quy).toBeNull();
  });

  it('người chưa chia nhóm bị bỏ; dòng V / Ngoài lô không tính; idx là vị trí trong chi_tiet', () => {
    const r = thuongVuotCuaPhieu(
      { chi_tiet: [ct('CONG_DINH_BIEN_KHONG_SAN_XUAT', [nv('V', 1)]), ct('TIA_DANH_GIA', [nv('A', 1), nv('X', null)])] },
      KPI_DAT,
      caiDat(),
      KHONG_LOAI
    );
    expect(r.chuyen).toHaveLength(1);
    expect(r.chuyen[0].idx).toBe(1);
    expect(r.chuyen[0].nhom[0].nguoi.map((p) => p.nv.ho_ten)).toEqual(['A']);
    expect(r.chuyen[0].nhom[0].tien).toBeCloseTo(15_000);
  });
});

describe('tongHopThuongThang', () => {
  const ct = (loai: LoaiChuyen, nhan_vien: FarmBaoCaoNhanCongNv[]): FarmBaoCaoNhanCongCt => ({
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
    he_so_nhom: {},
  });
  const phieu = (ngay: string, chi_tiet: FarmBaoCaoNhanCongCt[]): Pick<FarmBaoCaoNhanCong, 'ngay' | 'chi_tiet'> => ({ ngay, chi_tiet });
  const kpi = (vuot: number, nsThucTe = 3): KpiSoCheNgay => ({ thuHoiThucTe: 100 + vuot, thuHoiMucTieu: 100, nsThucTe, nsMucTieu: 3 });

  it('gộp một người qua nhiều ngày / chuyền theo id danh mục, nhân Ki rồi làm tròn', () => {
    const a = (p: Partial<FarmBaoCaoNhanCongNv> = {}) => nv('Lan', 1, { id_nhan_vien: '7', ...p });
    const ds = tongHopThuongThang(
      [
        phieu('2026-11-02', [ct('TIA_DANH_GIA', [a()])]), // vượt 10 → 10.000
        phieu('2026-11-01', [ct('XAN_NAI', [a({ ho_ten: 'lan ' })])]), // vượt 5 → 5.000
        phieu('2026-11-03', [ct('TIA_DANH_GIA', [a()])]), // NS không đạt → 0
      ],
      new Map([
        ['2026-11-02', kpi(10)],
        ['2026-11-01', kpi(5)],
        ['2026-11-03', kpi(20, 2)],
      ]),
      caiDat(),
      KHONG_LOAI,
      { 'nv:7': 0.95 }
    );
    expect(ds).toHaveLength(1);
    expect(ds[0]).toMatchObject({ khoa: 'nv:7', ho_ten: 'Lan', soNgay: 3, gioCong: 22.5, ki: 0.95, tien: 14_250, chuyen: ['XAN_NAI', 'TIA_DANH_GIA'] });
    expect(ds[0].tienTruocKi).toBeCloseTo(15_000);
    expect(ds[0].ngay.map((d) => d.ngay)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
  });

  it('ngày chưa có Báo cáo sơ chế vẫn liệt kê người với 0đ; chưa gắn danh mục thì gộp theo tên', () => {
    const ds = tongHopThuongThang([phieu('2026-11-01', [ct('TIA_DANH_GIA', [nv('Hoa  Thị', 2)])])], new Map(), caiDat(), KHONG_LOAI);
    expect(ds).toMatchObject([{ khoa: 'ten:hoa thị', ho_ten: 'Hoa Thị', tien: 0, ki: 1 }]);
    expect(khoaNguoi({ id_nhan_vien: null, ho_ten: ' Hoa  Thị ' })).toBe('ten:hoa thị');
  });
});
