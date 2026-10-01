import { describe, expect, it } from 'vitest';
import {
  chuanHoaThamSoIn,
  cssPageSize,
  docThamSoIn,
  kichThuocGiay,
  taoSheetXlsx,
  taoUrlPreview,
  tenFileIn,
} from './mau-in';
import { gopTheoHangHoa } from './gop-hang-hoa';
import type { DangKyNhanHang, DangKyNhanHangCt } from './types';

describe('tham số mẫu in', () => {
  it('khổ / hướng giấy (mm)', () => {
    expect(kichThuocGiay('a4', 'doc')).toEqual({ wMm: 210, hMm: 297 });
    expect(kichThuocGiay('a4', 'ngang')).toEqual({ wMm: 297, hMm: 210 });
    expect(kichThuocGiay('a5', 'doc')).toEqual({ wMm: 148, hMm: 210 });
    expect(kichThuocGiay('a5', 'ngang')).toEqual({ wMm: 210, hMm: 148 });
    expect(cssPageSize('a5', 'ngang')).toBe('A5 landscape');
  });

  it('giá trị lạ → mặc định; kiểm hàng / tổng hợp luôn A4 dọc', () => {
    expect(chuanHoaThamSoIn({ loai: 'xyz', kho: 'b5', huong: 'nghieng' })).toEqual({ loai: 'dang-ky', kho: 'a5', huong: 'doc' });
    expect(chuanHoaThamSoIn({ loai: 'dang-ky', kho: 'a4', huong: 'ngang' })).toEqual({ loai: 'dang-ky', kho: 'a4', huong: 'ngang' });
    expect(chuanHoaThamSoIn({ loai: 'kiem-hang', kho: 'a5', huong: 'ngang' })).toEqual({ loai: 'kiem-hang', kho: 'a4', huong: 'doc' });
  });

  it('URL preview ⇄ tham số', () => {
    const url = taoUrlPreview('12', { loai: 'dang-ky', kho: 'a4', huong: 'ngang' });
    expect(url).toBe('/quan-ly-nha-so-che/dang-ky-nhan-hang/preview/12?loai=dang-ky&kho=a4&huong=ngang');
    expect(docThamSoIn(new URL(url, 'http://x').searchParams)).toEqual({ loai: 'dang-ky', kho: 'a4', huong: 'ngang' });
    expect(taoUrlPreview('12', { loai: 'tong-hop', kho: 'a5' })).toBe(
      '/quan-ly-nha-so-che/dang-ky-nhan-hang/preview/12?loai=tong-hop'
    );
  });

  it('tên file an toàn', () => {
    expect(tenFileIn('kiem-hang', { id: '3', so_xe: '81C-180.26', ngay_dang_ky: '2026-09-30' })).toBe(
      'phieu-kiem-hang-81C-18026-20260930'
    );
    expect(tenFileIn('dang-ky', { id: '3', so_xe: null, ngay_dang_ky: '2026-09-30' })).toBe('phieu-dang-ky-phieu-3-20260930');
  });
});

const dong = (id: string, idHh: string, ma: string, sl = 1): DangKyNhanHangCt => ({
  id,
  id_phieu: '1',
  id_hang_hoa: idHh,
  ma_hang_hoa: ma,
  ten_hang_hoa: `Hàng ${ma}`,
  dvt: 'Thùng',
  so_luong: sl,
  nguon: 'quet',
  tg_quet: '',
  id_nguoi_quet: null,
  ten_nguoi_quet: null,
});

describe('gộp hàng + XLSX', () => {
  const rows = [dong('5', 'b', 'TQ402'), dong('4', 'a', 'TQ401'), dong('3', 'a', 'TQ401', 4)];

  it('gộp theo mã, sắp theo mã, giữ dòng mới nhất', () => {
    const g = gopTheoHangHoa(rows);
    expect(g.map((n) => [n.ma_hang_hoa, n.so_luong, n.so_dong, n.dongMoiNhat.id])).toEqual([
      ['TQ401', 5, 2, '4'],
      ['TQ402', 1, 1, '5'],
    ]);
  });

  it('sheet XLSX: đăng ký chỉ có thông tin; kiểm hàng thêm bảng hàng + tổng', () => {
    const phieu = {
      id: '1',
      ngay_dang_ky: '2026-09-30',
      so_xe: '81C',
      tg_vao_thuc_te: '2026-09-30T06:00:00Z',
      tg_ra_thuc_te: '2026-09-30T08:15:00Z',
    } as DangKyNhanHang;
    const nhan = (k: string) => k;
    expect(taoSheetXlsx('dang-ky', phieu, [], nhan)).toHaveLength(1);
    const [info, hh] = taoSheetXlsx('kiem-hang', phieu, gopTheoHangHoa(rows), nhan);
    expect(info.dong).toContainEqual(['col.ngay', '30/09/2026']);
    expect(info.dong).toContainEqual(['col.gioVao', '13:00 30/09/2026']);
    expect(info.dong).toContainEqual(['col.thoiLuong', '2 giờ 15 phút']);
    expect(hh.dong.at(-1)).toEqual(['', '', 'preview.tong', '', 6]);
  });
});
