import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { ChiTietPhieuKhoPTFlat, PhieuKhoPT } from '../core/types';
import { anhXaChiSoSapXep, locCotTheoXemGia } from './loc-cot-gia';
import {
  getExportColumnsChiTietPhieuKhoPT,
  getExportColumnsPhieuKhoPTList,
  mapChiTietPhieuKhoPTFlatRow,
  mapPhieuKhoPTListRow,
} from './export-phieu-kho-pt-danh-sach';

const t = ((k: string) => k) as unknown as TFunction;
const keys = (cols: { key: string }[]) => cols.map((c) => c.key);

describe('phiếu kho phân thuốc — ẩn giá nhập', () => {
  it('lọc cột: bỏ tong_tien/don_gia/thanh_tien khi không xem được giá, giữ nguyên khi xem được', () => {
    const cols = [{ id: 'so_phieu' }, { id: 'tong_tien' }, { id: 'don_gia' }, { id: 'thanh_tien' }, { id: 'so_luong' }];
    expect(locCotTheoXemGia(cols, false).map((c) => c.id)).toEqual(['so_phieu', 'so_luong']);
    expect(locCotTheoXemGia(cols, true)).toBe(cols);
  });

  it('kéo thả cột khi đã lọc: đổi chỉ số rút gọn sang chỉ số đầy đủ', () => {
    const all = [
      { id: 'a', order: 0 },
      { id: 'tong_tien', order: 1 },
      { id: 'b', order: 2 },
      { id: 'c', order: 3 },
    ];
    const loc = locCotTheoXemGia(all, false); // a, b, c
    expect(anhXaChiSoSapXep(all, loc, 2, 1)).toEqual([3, 2]);
    expect(anhXaChiSoSapXep(all, loc, 0, 9)).toBeNull();
  });

  it('xuất danh sách: không còn cột/khoá tong_tien khi không xem được giá', () => {
    expect(keys(getExportColumnsPhieuKhoPTList(t, false))).not.toContain('tong_tien');
    expect(keys(getExportColumnsPhieuKhoPTList(t, true))).toContain('tong_tien');
    const p = { id: '1', tong_tien: 500 } as PhieuKhoPT;
    expect('tong_tien' in mapPhieuKhoPTListRow(p, false)).toBe(false);
    expect(mapPhieuKhoPTListRow(p, true).tong_tien).toBe(500);
  });

  it('xuất chi tiết: bỏ don_gia/thanh_tien nhưng giữ số lượng', () => {
    const khongGia = keys(getExportColumnsChiTietPhieuKhoPT(t, false));
    expect(khongGia).not.toContain('don_gia');
    expect(khongGia).not.toContain('thanh_tien');
    expect(khongGia).toContain('so_luong');
    const row = { id: '1', so_luong: 3, don_gia: 10, thanh_tien: 30 } as ChiTietPhieuKhoPTFlat;
    const out = mapChiTietPhieuKhoPTFlatRow(row, false);
    expect('don_gia' in out || 'thanh_tien' in out).toBe(false);
    expect(out.so_luong).toBe(3);
    expect(mapChiTietPhieuKhoPTFlatRow(row, true).thanh_tien).toBe(30);
  });
});
