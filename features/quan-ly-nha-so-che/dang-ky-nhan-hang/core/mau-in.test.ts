import { describe, expect, it } from 'vitest';
import { docLoaiIn, macDinhIn, taoSheetXlsx, taoUrlPreview, tenFileIn } from './mau-in';
import { gopTheoHangHoa } from './gop-hang-hoa';
import type { DangKyNhanHang, DangKyNhanHangCt } from './types';

describe('tham số mẫu in', () => {
  it('mặc định khổ: đăng ký A5 dọc, còn lại A4 dọc', () => {
    expect(macDinhIn('dang-ky')).toMatchObject({ kho: 'a5', huong: 'doc' });
    expect(macDinhIn('tong-hop')).toMatchObject({ kho: 'a4', huong: 'doc' });
  });

  it('URL preview ⇄ loại; loại lạ → đăng ký', () => {
    const url = taoUrlPreview('12', 'kiem-hang');
    expect(url).toBe('/quan-ly-nha-so-che/dang-ky-nhan-hang/preview/12?loai=kiem-hang');
    expect(docLoaiIn(new URL(url, 'http://x').searchParams)).toBe('kiem-hang');
    expect(docLoaiIn(new URLSearchParams('loai=xyz'))).toBe('dang-ky');
  });

  it('tên file an toàn', () => {
    expect(tenFileIn('kiem-hang', { id: '3', so_xe: '81C-180.26', ngay_dang_ky: '2026-09-30' })).toBe(
      'phieu-kiem-hang-81C-18026-20260930'
    );
    expect(tenFileIn('dang-ky', { id: '3', so_xe: null, ngay_dang_ky: '2026-09-30' })).toBe('phieu-dang-ky-phieu-3-20260930');
  });
});

const dong = (id: string, idHh: string, ma: string, sl = 60): DangKyNhanHangCt => ({
  id,
  id_phieu: '1',
  id_phieu_gscl: `g${id}`,
  so_phieu_gscl: null,
  ngay_gscl: null,
  ma_cay_hang: null,
  ket_luan_gscl: null,
  ma_tem_quet: null,
  xe_khac: [],
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

  it('gộp cây hàng theo thành phẩm, sắp theo mã', () => {
    const g = gopTheoHangHoa(rows);
    expect(g.map((n) => [n.ma_hang_hoa, n.so_luong, n.so_dong])).toEqual([
      ['TQ401', 64, 2],
      ['TQ402', 60, 1],
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
    expect(hh.dong.at(-1)).toEqual(['', '', 'preview.tong', '', 124]);
  });
});
