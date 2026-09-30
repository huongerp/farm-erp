import { describe, expect, it } from 'vitest';
import { tinhThongKeDangKyNhanHang } from './thong-ke';
import type { DangKyNhanHang, TongHangHoaPhieu } from './types';

const VN = (hhmm: string, ngay = '2026-09-30') => {
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = ngay.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 7, m)).toISOString();
};

function phieu(p: Partial<DangKyNhanHang> & { id: string }): DangKyNhanHang {
  return {
    id_chi_nhanh: '12',
    ten_chi_nhanh: 'NSC fp3',
    ngay_dang_ky: '2026-09-30',
    khach_hang: 'TQ',
    loai_hang_hoa: 'TQ4',
    so_xe: null,
    so_cont: null,
    ten_tai_xe: null,
    sdt_tai_xe: null,
    gio_dang_ky_tu: '13:00',
    gio_dang_ky_den: '17:00',
    tg_vao_thuc_te: null,
    tg_ra_thuc_te: null,
    id_nguoi_check_in: null,
    id_nguoi_check_out: null,
    ten_nguoi_check_in: null,
    ten_nguoi_check_out: null,
    trang_thai: 'cho_vao',
    ghi_chu: null,
    hinh_anh_urls: [],
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    tg_tao: '',
    tg_cap_nhat: '',
    tong_so_luong: 0,
    ...p,
  };
}

const tong = (id_phieu: string, id_hang_hoa: string, sl: number): TongHangHoaPhieu => ({
  id_phieu,
  id_hang_hoa,
  ma_hang_hoa: `MA${id_hang_hoa}`,
  ten_hang_hoa: `HH${id_hang_hoa}`,
  dvt: 'Thùng',
  so_dong: sl,
  tong_so_luong: sl,
});

describe('thống kê đăng ký nhận hàng', () => {
  const list = [
    // vào đúng giờ, ra 15:00 → 120'
    phieu({ id: '1', trang_thai: 'da_ra', tg_vao_thuc_te: VN('13:00'), tg_ra_thuc_te: VN('15:00') }),
    // vào trễ 40', ra quá giờ 30' → 230'
    phieu({ id: '2', trang_thai: 'da_ra', tg_vao_thuc_te: VN('13:40'), tg_ra_thuc_te: VN('17:30'), khach_hang: 'VN' }),
    // chỉ đăng ký xe, đang trong farm
    phieu({ id: '3', trang_thai: 'da_vao', tg_vao_thuc_te: VN('13:05') }),
    phieu({ id: '4', trang_thai: 'huy' }),
    phieu({ id: '5', trang_thai: 'cho_vao', ngay_dang_ky: '2026-09-29' }),
  ];
  const tongHh = [tong('1', 'a', 100), tong('1', 'b', 20), tong('2', 'a', 50), tong('4', 'a', 999)];
  const tk = tinhThongKeDangKyNhanHang(list, tongHh, { bayGio: new Date(VN('15:30')).getTime() });

  it('KPI: đếm trạng thái, thời lượng, số lượng (bỏ phiếu huỷ)', () => {
    expect(tk.kpi).toMatchObject({
      tongPhieu: 5,
      choVao: 1,
      dangTrongFarm: 1,
      daRa: 2,
      huy: 1,
      tongSoLuong: 170,
      soPhieuCoHang: 2,
      tbPhutTrongFarm: 175,
      minPhutTrongFarm: 120,
      maxPhutTrongFarm: 230,
      soXeVaoTre: 1,
      soXeRaQuaGio: 1,
    });
  });

  it('nhóm theo hàng hoá / khách hàng / ngày', () => {
    expect(tk.theoHangHoa.map((h) => [h.id_hang_hoa, h.soLuong, h.soXe])).toEqual([
      ['a', 150, 2],
      ['b', 20, 1],
    ]);
    expect(tk.theoKhachHang.find((k) => k.key === 'TQ')).toMatchObject({ soXe: 3, soLuong: 120, tbPhut: 120 });
    expect(tk.theoNgay.map((n) => n.key)).toEqual(['2026-09-29', '2026-09-30']);
  });

  it('danh sách xe lâu nhất, trễ/quá giờ, chưa ra', () => {
    expect(tk.xeLauNhat.map((r) => r.phieu.id)).toEqual(['2', '1']);
    expect(tk.xeTreHoacQuaGio.map((r) => r.phieu.id)).toEqual(['2']);
    expect(tk.xeChuaRa.map((r) => [r.phieu.id, r.phutTrongFarm])).toEqual([['3', 145]]);
  });
});
