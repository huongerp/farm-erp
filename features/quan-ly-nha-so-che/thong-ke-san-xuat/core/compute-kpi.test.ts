import { describe, it, expect } from 'vitest';
import {
  computeBaoCaoSoCheKpis,
  buildBaoCaoSoCheKpiThuongPresetSources,
  enrichBaoCaoSoCheKpiThuongRows,
} from '../../bao-cao-so-che/core/bcsc-kpi';
import { BCSC_KPI_THUONG_PRESETS } from '../../bao-cao-so-che/core/kpi-thuong-presets';
import { sumPhamCapDisplayTotals } from '../../bao-cao-so-che/core/pham-cap-derived';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import type { FarmBaoCaoSoChe } from '../../bao-cao-so-che/core/types';
import type { FarmDuBaoSlDongThung } from '../../du-bao-sl-dong-thung/core/types';
import { mergeThongKeSanXuatRows, computeThongKeSanXuatSummary } from './compute';

const NGAY = '2025-05-01';
const ID_CN = 'cn-1';

function kpiRow(
  index: number,
  overrides: Partial<FarmBaoCaoSoChe['kpi_thuong'][number]> = {}
): FarmBaoCaoSoChe['kpi_thuong'][number] {
  const preset = BCSC_KPI_THUONG_PRESETS[index] ?? {
    ten_hang_muc: 'Khác',
    don_vi_tinh: '',
    muc_tieu: '0',
  };
  return {
    id: String(index + 1),
    id_bao_cao: 'bcsc-1',
    thu_tu: index + 1,
    ten_hang_muc: preset.ten_hang_muc,
    don_vi_tinh: preset.don_vi_tinh,
    muc_tieu: preset.muc_tieu,
    thuc_te: '1',
    phan_tram: 50,
    danh_gia: 'Không đạt',
    tien_thuong: 0,
    thuong_ql: 0,
    thuong_nhom_tia: 0,
    thuong_nhom_cp: 0,
    ghi_chu: null,
    ...overrides,
  };
}

function minimalBcnc(overrides: Partial<FarmBaoCaoNhanCong> = {}): FarmBaoCaoNhanCong {
  return {
    id: 'bcnc-1',
    ngay: NGAY,
    id_chi_nhanh: ID_CN,
    ten_chi_nhanh: 'Farm A',
    ghi_chu: null,
    hinh_anh_urls: [],
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    trang_thai: 'mo',
    tg_tao: '',
    tg_cap_nhat: '',
    chi_tiet: [
      {
        id: 'ct-1',
        id_bao_cao: 'bcnc-1',
        loai_chuyen: 'XAN_NAI',
        sl_cong_ngay: 8,
        sl_cong_nua: 0,
        sl_tang_ca: 0,
        so_gio_tc: 0,
        ghi_chu: null,
        thu_tu: 1,
        sub_by_loai: {
          CN_NGAY: [
            {
              id: 's1',
              id_bcnc_ct: 'ct-1',
              loai_chi_tieu: 'CN_NGAY',
              thu_tu: 1,
              sl_cong: 8,
              so_gio: 8,
              ghi_chu: null,
            },
          ],
          CN_NUA: [],
          TANG_CA: [],
        },
      },
    ],
    ...overrides,
  };
}

function minimalBcsc(overrides: Partial<FarmBaoCaoSoChe> = {}): FarmBaoCaoSoChe {
  return {
    id: 'bcsc-1',
    ngay: NGAY,
    id_chi_nhanh: ID_CN,
    ten_chi_nhanh: 'Farm A',
    don_vi_tinh: 'buồng',
    sl_buong_ton_dau_ngay: 0,
    tong_buong_thu_hoach: 0,
    tong_buong_khong_so_che: 0,
    tong_buong_so_che: 0,
    sl_buong_ton_cuoi_ngay: 0,
    danh_gia_loi_qc_pct: 0.5,
    tong_luong: 0,
    pham_cap: [
      {
        id: 'pc-1',
        id_bao_cao: 'bcsc-1',
        ten_pham_cap: 'TP',
        so_tham_chieu: 10,
        so_thung: 35,
        so_thung_quy_doi: 35,
        ghi_chu: '',
        thu_tu: 1,
      },
    ],
    kpi_thuong: [kpiRow(0), kpiRow(1), kpiRow(2)],
    ghi_chu: null,
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    trang_thai: 'mo',
    tg_tao: '',
    tg_cap_nhat: '',
    ...overrides,
  };
}

function minimalDbdt(overrides: Partial<FarmDuBaoSlDongThung> = {}): FarmDuBaoSlDongThung {
  return {
    id: 'dbdt-1',
    ngay: NGAY,
    id_chi_nhanh: ID_CN,
    ten_chi_nhanh: 'Farm A',
    so_buong_can_mau: 1,
    tong_can_nang_mau: 10,
    tong_buong_nhap_ke_hoach: 0,
    ty_le_thu_hoi_ke_hoach: 0.85,
    quy_cach_dong_thung_ke_hoach: 10,
    tong_buong_nhap_thuc_te: 0,
    sl_buong_ton_dau_ngay: 0,
    sl_buong_ton_cuoi_ngay: 0,
    so_buong_ksc: 0,
    ty_le_thu_hoi_thuc_te: 0.88,
    quy_cach_dong_thung_thuc_te: 10,
    can_nang_binh_quan_buong: null,
    tong_khoi_luong_ke_hoach: 0,
    tong_so_thung_ke_hoach: 0,
    tong_khoi_luong_thuc_te: 0,
    tong_so_thung_thuc_te: 0,
    ghi_chu: null,
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    trang_thai: 'mo',
    tg_tao: '',
    tg_cap_nhat: '',
    ...overrides,
  };
}

function expectedEnrichedRows(
  bcsc: FarmBaoCaoSoChe,
  bcnc: FarmBaoCaoNhanCong | null,
  dbdt: FarmDuBaoSlDongThung | null
) {
  const phamCapTotals = sumPhamCapDisplayTotals(bcsc.pham_cap ?? []);
  const tongThungQD = phamCapTotals.so_thung_quy_doi;
  const tongKg = phamCapTotals.tong_kg;
  const kpis = computeBaoCaoSoCheKpis(tongThungQD, bcnc, tongKg, bcsc.tong_luong);
  const presetSources = buildBaoCaoSoCheKpiThuongPresetSources(
    kpis,
    Number.isFinite(Number(bcsc.danh_gia_loi_qc_pct)) ? Number(bcsc.danh_gia_loi_qc_pct) : null,
    dbdt
  );
  return enrichBaoCaoSoCheKpiThuongRows(bcsc.kpi_thuong ?? [], presetSources);
}

describe('mergeThongKeSanXuatRows — KPI enrich', () => {
  it('dùng thực tế tính live thay vì giá trị stale trong DB khi BCNC thay đổi', () => {
    const bcnc = minimalBcnc();
    const bcsc = minimalBcsc();
    const dbdt = minimalDbdt();

    const [row] = mergeThongKeSanXuatRows([bcnc], [bcsc], [dbdt]);
    const expected = expectedEnrichedRows(bcsc, bcnc, dbdt);

    expect(row.kpiSnapshot?.rows[0].thuc_te).toBe(expected[0].thuc_te);
    expect(row.kpiSnapshot?.rows[1].thuc_te).toBe(expected[1].thuc_te);
    expect(row.kpiSnapshot?.rows[2].thuc_te).toBe(expected[2].thuc_te);
    expect(row.kpiSnapshot?.rows[0].thuc_te).not.toBe('1');
    // Tỷ lệ thu hồi: thực tế = số thùng quy đổi phẩm cấp (35); dự báo 0 thùng → không so
    expect(row.kpiSnapshot?.rows[2].thuc_te).toBe('35');
    expect(row.kpiSnapshot?.rows[2].muc_tieu).toBe('0');
    expect(row.kpiSnapshot?.rows[2].phan_tram).toBeNull();
    expect(row.kpiSnapshot?.rows[2].danh_gia).toBeNull();
    expect(row.kpiSnapshot?.rows[1].thuc_te).toBe('0.5');
  });

  it('tính lại phan_tram và đánh giá từ thực tế đã enrich', () => {
    const bcnc = minimalBcnc();
    const bcsc = minimalBcsc();
    const dbdt = minimalDbdt({
      so_buong_can_mau: 10,
      tong_can_nang_mau: 100,
      tong_buong_nhap_thuc_te: 100,
      ty_le_thu_hoi_thuc_te: 0.9,
      quy_cach_dong_thung_thuc_te: 10,
      tong_so_thung_thuc_te: 90,
    });

    const [row] = mergeThongKeSanXuatRows([bcnc], [bcsc], [dbdt]);
    const kpi3 = row.kpiSnapshot?.rows[2];

    // 35 thùng nhập kho so với 90 thùng dự báo → lệch (35 − 90) / 90
    expect(kpi3?.muc_tieu).toBe('90');
    expect(kpi3?.thuc_te).toBe('35');
    expect(kpi3?.don_vi_tinh).toBe('thùng');
    expect(kpi3?.phan_tram).toBeCloseTo(((35 - 90) / 90) * 100, 4);
    expect(kpi3?.danh_gia).toBe('Không đạt');
    expect(row.kpiSnapshot?.tatCaKpiDat).toBe(
      (row.kpiSnapshot?.rows ?? []).every(
        (r, i) => i >= 3 || r.danh_gia === 'Đạt' || r.danh_gia === 'Tốt'
      ) && (row.kpiSnapshot?.tongKpi ?? 0) > 0
    );
  });
});

describe('mergeThongKeSanXuatRows — tách 4 nhóm thưởng', () => {
  // Số liệu thật BCSC 02/11/2026 NSC fp2: Tiền thưởng / QL / nhóm tỉa / nhóm CP
  const bcscFp2 = () =>
    minimalBcsc({
      kpi_thuong: [
        kpiRow(0, { tien_thuong: 34607, thuong_ql: 34500, thuong_nhom_tia: 20000, thuong_nhom_cp: 15000 }),
        kpiRow(1, { tien_thuong: 0, thuong_ql: 10000, thuong_nhom_tia: 0, thuong_nhom_cp: 35000 }),
        kpiRow(2, { tien_thuong: 12140, thuong_ql: 5000, thuong_nhom_tia: 30000, thuong_nhom_cp: 0 }),
      ],
    });

  it('snapshot cộng riêng từng nhóm, net = cả 4 nhóm', () => {
    const [row] = mergeThongKeSanXuatRows([minimalBcnc()], [bcscFp2()], [minimalDbdt()]);
    const k = row.kpiSnapshot!;
    expect(k.tongTienThuong).toBe(46747);
    expect(k.tongThuongQl).toBe(49500);
    expect(k.tongThuongNhomTia).toBe(50000);
    expect(k.tongThuongNhomCp).toBe(50000);
    expect(k.tongThuongNet).toBe(196247);
  });

  it('tiền thưởng KPI âm (phạt) trừ vào net', () => {
    const bcsc = minimalBcsc({
      kpi_thuong: [kpiRow(0, { tien_thuong: -20000, thuong_ql: 5000, thuong_nhom_tia: 0, thuong_nhom_cp: 0 })],
    });
    const [row] = mergeThongKeSanXuatRows([minimalBcnc()], [bcsc], [minimalDbdt()]);
    expect(row.kpiSnapshot!.tongTienThuong).toBe(-20000);
    expect(row.kpiSnapshot!.tongThuongNet).toBe(-15000);
  });

  it('chỉ có thưởng nhóm (tien_thuong = 0) vẫn được tính vào tổng', () => {
    const bcsc = minimalBcsc({
      kpi_thuong: [kpiRow(3, { danh_gia: null, tien_thuong: 0, thuong_ql: 0, thuong_nhom_tia: 0, thuong_nhom_cp: 7000 })],
    });
    const [row] = mergeThongKeSanXuatRows([minimalBcnc()], [bcsc], [minimalDbdt()]);
    expect(row.kpiSnapshot!.tongThuongNhomCp).toBe(7000);
    expect(row.kpiSnapshot!.tongThuongNet).toBe(7000);
  });

  it('summary cộng từng nhóm qua các ngày', () => {
    const rows = mergeThongKeSanXuatRows(
      [minimalBcnc(), minimalBcnc({ id: 'bcnc-2', ngay: '2025-05-02' })],
      [bcscFp2(), { ...bcscFp2(), id: 'bcsc-2', ngay: '2025-05-02' }],
      []
    );
    const s = computeThongKeSanXuatSummary(rows);
    expect(s.tongTienThuong).toBe(93494);
    expect(s.tongThuongQl).toBe(99000);
    expect(s.tongThuongNhomTia).toBe(100000);
    expect(s.tongThuongNhomCp).toBe(100000);
    expect(s.tongThuongNet).toBe(392494);
  });
});
