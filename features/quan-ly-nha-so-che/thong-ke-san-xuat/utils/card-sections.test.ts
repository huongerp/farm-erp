import { describe, it, expect } from 'vitest';
import type { ThongKeSanXuatRow } from '../core/types';
import { buildKeyMetrics, buildRowSections } from './card-sections';

const rowTrong = {
  key: 'a',
  ngay: '2025-05-01',
  id_chi_nhanh: 'cn',
  ten_chi_nhanh: 'Farm A',
  bcnc: null,
  bcsc: null,
  dbdt: null,
  bcncSnapshot: null,
  kpiSnapshot: null,
  dbdtKpi: null,
} as unknown as ThongKeSanXuatRow;

const metric = (row: ThongKeSanXuatRow, section: string, id: string) =>
  buildRowSections(row)
    .find((s) => s.id === section)!
    .metrics.find((x) => x.id === id)!;

describe('buildRowSections', () => {
  it('hàng chưa có báo cáo nào: mọi chỉ số là "—", 3 nhóm đủ chỗ', () => {
    const sections = buildRowSections(rowTrong);
    expect(sections.map((s) => s.metrics.length)).toEqual([7, 8, 7]);
    for (const s of sections) {
      for (const x of s.metrics) expect(x.value).toBe('—');
    }
  });

  it('đổi cân nặng BQ buồng từ kg sang gram', () => {
    const row = { ...rowTrong, dbdtKpi: { can_nang_binh_quan_buong: 12.5 } } as unknown as ThongKeSanXuatRow;
    expect(metric(row, 'dongThung', 'canBqBuong').value).toBe('12.500');
  });

  it('tông màu: K định biên, giờ tăng ca, tiền thưởng', () => {
    const row = {
      ...rowTrong,
      bcncSnapshot: { cnDinhBien: 2, kDinhBien: 2.5, tongGioTangCaTich: 4, tongCongQuyDoi: 10 },
      kpiSnapshot: { rows: [], tongTienThuong: -50000 },
    } as unknown as ThongKeSanXuatRow;
    expect(metric(row, 'nhanCong', 'kDinhBien').tone).toBe('warning');
    expect(metric(row, 'nhanCong', 'cnDinhBien').tone).toBe('warning');
    expect(metric(row, 'nhanCong', 'gioTangCa').tone).toBe('orange');
    expect(metric(row, 'soChe', 'tienThuong').tone).toBe('negative');
    expect(metric(row, 'soChe', 'tienThuong').value).toBe('-50.000');
  });

  it('có BCNC nhưng không tăng ca: giờ tăng ca là "0", không phải "—"', () => {
    const row = {
      ...rowTrong,
      bcncSnapshot: { cnDinhBien: 0, kDinhBien: null, tongGioTangCaTich: 0, tongCongQuyDoi: 0 },
    } as unknown as ThongKeSanXuatRow;
    expect(metric(row, 'nhanCong', 'gioTangCa').value).toBe('0');
    expect(metric(row, 'nhanCong', 'kDinhBien').value).toBe('—');
  });
});

describe('buildKeyMetrics', () => {
  it('lấy công quy đổi, buồng sơ chế, thùng thực tế', () => {
    const row = {
      ...rowTrong,
      bcncSnapshot: { tongCongQuyDoi: 12.5 },
      bcsc: { tong_buong_so_che: 300 },
      dbdtKpi: { tong_so_thung_thuc_te: 40 },
    } as unknown as ThongKeSanXuatRow;
    expect(buildKeyMetrics(row).map((x) => [x.id, x.value])).toEqual([
      ['congQD', '12,5'],
      ['buongSoChe', '300'],
      ['thungTT', '40'],
    ]);
  });
});
