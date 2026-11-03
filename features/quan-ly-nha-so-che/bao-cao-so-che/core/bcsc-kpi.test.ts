import { describe, it, expect } from 'vitest';
import { extractLaborSnapshotFromBcnc, resolveBcscPresetKpiDerivedFields } from './bcsc-kpi';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';

function minimalBcnc(overrides: Partial<FarmBaoCaoNhanCong> = {}): FarmBaoCaoNhanCong {
  return {
    id: 'bcnc-1',
    ngay: '2025-05-01',
    id_chi_nhanh: 'cn-1',
    ten_chi_nhanh: 'Farm A',
    ghi_chu: null,
    hinh_anh_urls: [],
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    trang_thai: 'mo',
    tg_tao: '',
    tg_cap_nhat: '',
    chi_tiet: [],
    ...overrides,
  };
}

describe('extractLaborSnapshotFromBcnc — tongGioCnNgay', () => {
  it('dùng Σ(sl×giờ) từ sub CN ngày + CN nửa (5 chuyền SX), không nhân cố định 8/4', () => {
    const bcnc = minimalBcnc({
      chi_tiet: [
        {
          id: 'ct-1',
          id_bao_cao: 'bcnc-1',
          loai_chuyen: 'XAN_NAI',
          sl_cong_ngay: 3,
          sl_cong_nua: 2,
          sl_tang_ca: 0,
          so_gio_tc: 0,
          ghi_chu: null,
          thu_tu: 1,
          sub_by_loai: {
            CN_NGAY: [{ id: 's1', id_bcnc_ct: 'ct-1', loai_chi_tieu: 'CN_NGAY', thu_tu: 1, sl_cong: 3, so_gio: 7.5, ghi_chu: null }],
            CN_NUA: [{ id: 's2', id_bcnc_ct: 'ct-1', loai_chi_tieu: 'CN_NUA', thu_tu: 1, sl_cong: 2, so_gio: 3.5, ghi_chu: null }],
            TANG_CA: [],
          },
        },
      ],
    });

    const snap = extractLaborSnapshotFromBcnc(bcnc);
    expect(snap.tongGioCnNgay).toBe(29.5);
    expect(snap.tongGioCnNgay).not.toBe(3 * 8 + 2 * 4);
  });

  it('không có sub → tongGioCnNgay = 0 dù sl_cong_ngay > 0 (khớp cột Tổng giờ BCNC)', () => {
    const bcnc = minimalBcnc({
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
    });

    const snap = extractLaborSnapshotFromBcnc(bcnc);
    expect(snap.tongGioCnNgay).toBe(0);
  });
});

describe('extractLaborSnapshotFromBcnc — congQdTongNgay', () => {
  it('cộng cả dòng V (định biên không SX), còn congQdRowIV chỉ 5 chuyền SX', () => {
    const ct = (id: string, loai_chuyen: FarmBaoCaoNhanCong['chi_tiet'][number]['loai_chuyen'], sl_cong_ngay: number, sl_cong_nua: number, thu_tu: number) => ({
      id, id_bao_cao: 'bcnc-1', loai_chuyen, sl_cong_ngay, sl_cong_nua, sl_tang_ca: 0, so_gio_tc: 0, ghi_chu: null, thu_tu,
    });
    const bcnc = minimalBcnc({
      chi_tiet: [
        ct('ct-1', 'XAN_NAI', 3, 0, 1),
        ct('ct-2', 'TIA_DANH_GIA', 6, 2, 2),
        ct('ct-6', 'CONG_DINH_BIEN_KHONG_SAN_XUAT', 6, 0, 6),
        // Ngoại lệ không vào cả công QĐ tổng ngày, kể cả đầu vào còn số tổng nhập sót.
        ct('ct-7', 'NGOAI_LE', 30, 8, 7),
      ],
    });

    const snap = extractLaborSnapshotFromBcnc(bcnc);
    expect(snap.congQdRowIV).toBe(10);
    expect(snap.congQdTongNgay).toBe(16);
  });
});

describe('resolveBcscPresetKpiDerivedFields — Tỷ lệ thu hồi (mục tiêu = số thùng dự báo)', () => {
  const src = (thucTe: number | null, duBao: number | null) => ({
    thucTeValue: thucTe,
    mucTieuValue: duBao,
    isHigherBetter: true,
  });

  it('510 thùng nhập kho so với 417 thùng dự báo → +22,30%, Đạt (bỏ qua mục tiêu đã lưu)', () => {
    const r = resolveBcscPresetKpiDerivedFields(src(510, 417), '90');
    expect(r.mucTieuStr).toBe('417');
    expect(r.thucTeStr).toBe('510');
    expect(r.phanTram).toBeCloseTo(22.3022, 4);
    expect(r.danhGia).toBe('Đạt');
  });

  it('nhập kho ít hơn dự báo → % âm, Không đạt', () => {
    const r = resolveBcscPresetKpiDerivedFields(src(400, 417), null);
    expect(r.phanTram).toBeCloseTo(-4.0767, 4);
    expect(r.danhGia).toBe('Không đạt');
  });

  it('chưa có phiếu dự báo → mục tiêu, %, đánh giá trống; thực tế vẫn hiện', () => {
    const r = resolveBcscPresetKpiDerivedFields(src(510, null), '90');
    expect(r).toEqual({ thucTeStr: '510', mucTieuStr: null, phanTram: null, danhGia: null });
  });
});
