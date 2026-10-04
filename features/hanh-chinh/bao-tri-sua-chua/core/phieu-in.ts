/**
 * Dữ liệu mẫu in phiếu bảo trì / sửa chữa — thuần, không phụ thuộc React / store.
 * HTML dựng ở utils/phieu-in-html.ts từ kết quả của `duLieuPhieuIn`.
 */
import type { TFunction } from 'i18next';
import type { PhieuBaoTriSuaChua, TrangThaiPhieu } from './types';
import { getTrangThaiLabel } from './constants';
import { ddmmyyyy } from '../../phieu-hanh-chinh/core/phieu-in';
import { soTienBangChu } from '../../../../lib/so-tien-bang-chu';

export interface DuLieuPhieuIn {
  soPhieu: string;
  ngay: string;
  ngayLap: string;
  chiNhanh: string;
  taiSan: string;
  hangMuc: string;
  moTa: string;
  /** Đã định dạng (1.250.000 đ). */
  soTien: string;
  soTienChu: string;
  nhaCungCap: string;
  trangThai: TrangThaiPhieu;
  trangThaiLabel: string;
  nguoiDeNghi: string;
  nguoiDuyet: string;
  ghiChu: string;
}

/** "TS-001 – Máy bơm" / chỉ mã / chỉ tên. */
export function taiSanIn(p: Pick<PhieuBaoTriSuaChua, 'ma_tai_san' | 'ten_tai_san'>): string {
  return [p.ma_tai_san?.trim(), p.ten_tai_san?.trim()].filter(Boolean).join(' – ');
}

export function duLieuPhieuIn(
  p: PhieuBaoTriSuaChua,
  t: TFunction,
  /** Định dạng tiền + mốc giờ — truyền từ lib/utils để giữ file này thuần. */
  dinhDang: { tien: (n: number) => string; ngayGio: (iso: string) => string }
): DuLieuPhieuIn {
  const soTien = Number(p.so_tien) || 0;
  return {
    soPhieu: p.ma_phieu,
    ngay: ddmmyyyy(p.ngay),
    ngayLap: p.tg_tao ? dinhDang.ngayGio(p.tg_tao) : '',
    chiNhanh: (p.ten_chi_nhanh ?? '').trim(),
    taiSan: taiSanIn(p),
    hangMuc: (p.ten_hang_muc ?? p.id_hang_muc ?? '').trim(),
    moTa: (p.mo_ta ?? '').trim(),
    soTien: dinhDang.tien(soTien),
    soTienChu: soTienBangChu(soTien),
    nhaCungCap: (p.ten_nha_cung_cap ?? '').trim(),
    trangThai: p.trang_thai,
    trangThaiLabel: getTrangThaiLabel(p.trang_thai, t),
    nguoiDeNghi: (p.ten_nguoi_tao ?? '').trim(),
    nguoiDuyet: (p.nguoi_duyet ?? '').trim(),
    ghiChu: (p.ghi_chu ?? '').trim(),
  };
}
