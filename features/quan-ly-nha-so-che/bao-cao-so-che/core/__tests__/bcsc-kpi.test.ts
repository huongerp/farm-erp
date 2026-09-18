import { describe, it, expect } from 'vitest';
import { extractLaborSnapshotFromBcnc } from '../bcsc-kpi';
import type { FarmBaoCaoNhanCong } from '../../../bao-cao-nhan-cong/core/types';

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
