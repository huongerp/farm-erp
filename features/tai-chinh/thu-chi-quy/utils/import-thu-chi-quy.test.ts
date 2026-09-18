import { describe, it, expect } from 'vitest';
import { buildThuChiQuyImportPlan, gopGhiChu, parseImportDate, type HangMucRefLite } from './import-thu-chi-quy';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';

const hangMuc: HangMucRefLite[] = [
  { id: '1', ma: 'SO_DU_DAU_KY', ten: 'Số dư đầu kỳ', loai: 'thu' },
  { id: '2', ma: 'TAM_UNG', ten: 'Tạm ứng', loai: 'thu' },
  { id: '3', ma: 'VAT_TU', ten: 'Vật tư', loai: 'chi' },
  { id: '4', ma: 'CHI_KHAC', ten: 'Chi khác', loai: 'chi' },
];

const input = { hangMuc, idChiNhanh: '5', tenChiNhanh: 'Farm A' };

describe('parseImportDate', () => {
  it('nhận dd/mm/yyyy, yyyy-mm-dd và năm 2 số', () => {
    expect(parseImportDate('25/7/2026')).toBe('2026-07-25');
    expect(parseImportDate('2026-08-08')).toBe('2026-08-08');
    expect(parseImportDate('22/7/26')).toBe('2026-07-22');
  });

  it('nhận Date và serial Excel', () => {
    expect(parseImportDate(new Date(2026, 6, 25))).toBe('2026-07-25');
    expect(parseImportDate(46228)).toBe('2026-07-25');
  });

  it('rỗng / sai định dạng → null', () => {
    expect(parseImportDate('')).toBeNull();
    expect(parseImportDate(null)).toBeNull();
    expect(parseImportDate('ngày 25')).toBeNull();
    expect(parseImportDate('25/13/2026')).toBeNull();
  });
});

describe('gopGhiChu', () => {
  it('không có số lượng / đơn giá → giữ nguyên ghi chú', () => {
    expect(gopGhiChu('bốc 5 tấn phân', null, null)).toBe('bốc 5 tấn phân');
    expect(gopGhiChu('', null, null)).toBeNull();
  });

  it('có số lượng / đơn giá → ghép vào cuối ghi chú', () => {
    expect(gopGhiChu('', 4, 75000)).toBe('SL 4 × ĐG 75.000');
    expect(gopGhiChu('thay ổ bi', 4, null)).toBe('thay ổ bi (SL 4)');
  });
});

describe('buildThuChiQuyImportPlan', () => {
  it('THU > 0 → phiếu thu, CHI > 0 → phiếu chi; bỏ qua cột tồn quỹ', () => {
    const plan = buildThuChiQuyImportPlan(
      [
        {
          [IMPORT_ROW_KEY]: 2,
          ngay: '22/7/26',
          dien_giai: 'TẠM ỨNG QUỸ THÁNG 7 LẦN 1',
          hang_muc: 'Tạm ứng',
          thu: '20.000.000',
          chi: '',
          ton_quy: '21.885.000',
        },
        {
          [IMPORT_ROW_KEY]: 3,
          ngay: '25/7/2026',
          dien_giai: '1 mũi khoan sôi 60',
          hang_muc: 'Vật tư',
          thu: '',
          chi: '280.000',
          so_chung_tu: 'làm bồn châm phân lô DA1',
        },
      ],
      input
    );

    expect(plan.errors).toEqual([]);
    expect(plan.toInsert).toHaveLength(2);
    expect(plan.toInsert[0].payload).toMatchObject({
      ngay: '2026-07-22',
      loai: 'thu',
      so_tien: 20000000,
      id_hang_muc: 2,
      ten_hang_muc: 'Tạm ứng',
      id_chi_nhanh: 5,
      ten_chi_nhanh: 'Farm A',
    });
    expect(plan.toInsert[0].payload).not.toHaveProperty('ton_quy');
    expect(plan.toInsert[1].payload).toMatchObject({
      loai: 'chi',
      so_tien: 280000,
      id_hang_muc: 3,
      so_chung_tu: 'làm bồn châm phân lô DA1',
    });
  });

  it('so khớp hạng mục theo mã hoặc tên, không phân biệt hoa thường', () => {
    const plan = buildThuChiQuyImportPlan(
      [
        { [IMPORT_ROW_KEY]: 2, ngay: '1/8/2026', dien_giai: 'A', hang_muc: 'vật TƯ', chi: 1000 },
        { [IMPORT_ROW_KEY]: 3, ngay: '1/8/2026', dien_giai: 'B', hang_muc: 'CHI_KHAC', chi: 2000 },
      ],
      input
    );
    expect(plan.errors).toEqual([]);
    expect(plan.toInsert.map((r) => r.payload.id_hang_muc)).toEqual([3, 4]);
  });

  it('hạng mục không khớp → lỗi dòng, không âm thầm bỏ qua', () => {
    const plan = buildThuChiQuyImportPlan(
      [{ [IMPORT_ROW_KEY]: 7, ngay: '1/8/2026', dien_giai: 'A', hang_muc: 'Xăng dầu', chi: 1000 }],
      input
    );
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.errors[0].row).toBe(7);
  });

  it('hạng mục sai loại phiếu → lỗi', () => {
    const plan = buildThuChiQuyImportPlan(
      [{ [IMPORT_ROW_KEY]: 4, ngay: '1/8/2026', dien_giai: 'A', hang_muc: 'Vật tư', thu: 1000 }],
      input
    );
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.errors).toHaveLength(1);
  });

  it('thiếu ngày / diễn giải / số tiền, hoặc vừa thu vừa chi → lỗi đúng dòng', () => {
    const plan = buildThuChiQuyImportPlan(
      [
        { [IMPORT_ROW_KEY]: 2, ngay: '', dien_giai: 'A', chi: 1000 },
        { [IMPORT_ROW_KEY]: 3, ngay: '1/8/2026', dien_giai: '', chi: 1000 },
        { [IMPORT_ROW_KEY]: 4, ngay: '1/8/2026', dien_giai: 'A', thu: '', chi: '' },
        { [IMPORT_ROW_KEY]: 5, ngay: '1/8/2026', dien_giai: 'A', thu: 100, chi: 200 },
        { [IMPORT_ROW_KEY]: 6, ngay: '1/8/2026', dien_giai: 'A', chi: 'abc' },
      ],
      input
    );
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.errors.map((e) => e.row)).toEqual([2, 3, 4, 5, 6]);
  });

  it('số lượng / đơn giá của sổ cũ được gộp vào ghi chú', () => {
    const plan = buildThuChiQuyImportPlan(
      [
        { [IMPORT_ROW_KEY]: 2, ngay: '1/8/2026', dien_giai: 'A', chi: 1000, so_luong: '', don_gia: '' },
        {
          [IMPORT_ROW_KEY]: 3,
          ngay: '1/8/2026',
          dien_giai: 'B',
          chi: 80000,
          so_luong: 2,
          don_gia: '40.000',
          ghi_chu: 'thay lưỡi dao',
        },
      ],
      input
    );
    expect(plan.toInsert[0].payload.ghi_chu).toBeNull();
    expect(plan.toInsert[1].payload.ghi_chu).toBe('thay lưỡi dao (SL 2 × ĐG 40.000)');
  });
});
