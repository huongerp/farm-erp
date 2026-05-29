import { describe, it, expect } from 'vitest';
import {
  computeBaoCaoSoCheKpis,
  buildBaoCaoSoCheKpiThuongPresetSources,
  enrichBaoCaoSoCheKpiThuongRows,
} from '../../../bao-cao-so-che/core/bcsc-kpi';
import { BCSC_KPI_THUONG_PRESETS } from '../../../bao-cao-so-che/core/kpi-thuong-presets';
import { computeKpiPhanTram } from '../../../shared/kpi-thuong/types';
import type { FarmBaoCaoNhanCong } from '../../../bao-cao-nhan-cong/core/types';
import type { FarmBaoCaoSoChe } from '../../../bao-cao-so-che/core/types';
import type { FarmDuBaoSlDongThung } from '../../../du-bao-sl-dong-thung/core/types';
import { mergeThongKeSanXuatRows } from '../compute';

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
        ghi_chu: null,
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
    ty_le_thu_hoi_thuc_te: 0.88,
    quy_cach_dong_thung_thuc_te: 10,
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
  const tongThungQD = (bcsc.pham_cap ?? []).reduce((s, r) => s + (Number(r.so_thung_quy_doi) || 0), 0);
  const tongKg = (bcsc.pham_cap ?? []).reduce(
    (s, r) => s + (Number(r.so_thung) || 0) * (Number(r.so_tham_chieu) || 0),
    0
  );
  const kpis = computeBaoCaoSoCheKpis(tongThungQD, bcnc, tongKg, bcsc.tong_luong);
  const presetSources = buildBaoCaoSoCheKpiThuongPresetSources(
    kpis,
    Number.isFinite(Number(bcsc.danh_gia_loi_qc_pct)) ? Number(bcsc.danh_gia_loi_qc_pct) : null,
    dbdt != null ? dbdt.ty_le_thu_hoi_thuc_te * 100 : null
  );
  const enriched = enrichBaoCaoSoCheKpiThuongRows(bcsc.kpi_thuong ?? [], presetSources);
  return enriched.map((row, index) => {
    if (index >= 3) return row;
    const pct = computeKpiPhanTram(row.muc_tieu, row.thuc_te);
    return pct != null ? { ...row, phan_tram: pct } : row;
  });
}

describe('mergeThongKeSanXuatRows — KPI enrich', () => {
  it('dùng thực tế tính live thay vì giá trị stale trong DB khi BCNC/ĐBĐT thay đổi', () => {
    const bcnc = minimalBcnc();
    const bcsc = minimalBcsc();
    const dbdt = minimalDbdt();

    const [row] = mergeThongKeSanXuatRows([bcnc], [bcsc], [dbdt]);
    const expected = expectedEnrichedRows(bcsc, bcnc, dbdt);

    expect(row.kpiSnapshot?.rows[0].thuc_te).toBe(expected[0].thuc_te);
    expect(row.kpiSnapshot?.rows[1].thuc_te).toBe(expected[1].thuc_te);
    expect(row.kpiSnapshot?.rows[2].thuc_te).toBe(expected[2].thuc_te);
    expect(row.kpiSnapshot?.rows[0].thuc_te).not.toBe('1');
    expect(row.kpiSnapshot?.rows[2].thuc_te).toBe('88');
    expect(row.kpiSnapshot?.rows[1].thuc_te).toBe('0.5');
  });

  it('tính lại phan_tram và đánh giá từ thực tế đã enrich', () => {
    const bcnc = minimalBcnc();
    const bcsc = minimalBcsc();
    const dbdt = minimalDbdt({ ty_le_thu_hoi_thuc_te: 0.9 });

    const [row] = mergeThongKeSanXuatRows([bcnc], [bcsc], [dbdt]);
    const kpi3 = row.kpiSnapshot?.rows[2];

    expect(kpi3?.thuc_te).toBe('90');
    expect(kpi3?.phan_tram).toBeCloseTo((90 / 85) * 100, 4);
    expect(kpi3?.danh_gia).toBe('Đạt');
    expect(row.kpiSnapshot?.tatCaKpiDat).toBe(
      (row.kpiSnapshot?.rows ?? []).every(
        (r, i) => i >= 3 || r.danh_gia === 'Đạt' || r.danh_gia === 'Tốt'
      ) && (row.kpiSnapshot?.tongKpi ?? 0) > 0
    );
  });
});
