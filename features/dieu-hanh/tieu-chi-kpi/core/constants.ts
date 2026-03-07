import type { LoaiDoLuong, TanSuat } from './types';
import type { DonViTinh, CachTinhDiem } from './types';

/** i18n keys cho loại đo lường */
export const LOAI_DO_LUONG_LABEL_KEYS: Record<LoaiDoLuong, string> = {
  xuoi: 'tieuChiKpi.loai.xuoi',
  nguoc: 'tieuChiKpi.loai.nguoc',
};

/** i18n keys cho tần suất */
export const TAN_SUAT_LABEL_KEYS: Record<TanSuat, string> = {
  thang: 'tieuChiKpi.tanSuat.thang',
  quy: 'tieuChiKpi.tanSuat.quy',
  nam: 'tieuChiKpi.tanSuat.nam',
};

export const LOAI_DO_LUONG_VALUES: LoaiDoLuong[] = ['xuoi', 'nguoc'];
export const TAN_SUAT_VALUES: TanSuat[] = ['thang', 'quy', 'nam'];

/** Seed đơn vị tính mặc định */
export function getDonViTinhDefault(): DonViTinh[] {
  return [
    { id: 'dvt-pct', ma: 'PCT', ten: 'Phần trăm', ky_hieu: '%', thu_tu: 0 },
    { id: 'dvt-vnd', ma: 'VND', ten: 'Đồng', ky_hieu: 'VND', thu_tu: 1 },
    { id: 'dvt-nguoi', ma: 'NGUOI', ten: 'Người', ky_hieu: 'người', thu_tu: 2 },
    { id: 'dvt-sp', ma: 'SP', ten: 'Sản phẩm', ky_hieu: 'SP', thu_tu: 3 },
    { id: 'dvt-dh', ma: 'DH', ten: 'Đơn hàng', ky_hieu: 'đơn', thu_tu: 4 },
    { id: 'dvt-diem', ma: 'DIEM', ten: 'Điểm', ky_hieu: 'điểm', thu_tu: 5 },
    { id: 'dvt-ngay', ma: 'NGAY', ten: 'Ngày', ky_hieu: 'ngày', thu_tu: 6 },
    { id: 'dvt-lan', ma: 'LAN', ten: 'Lần', ky_hieu: 'lần', thu_tu: 7 },
  ];
}

/** Seed cách tính điểm mặc định */
export function getCachTinhDiemDefault(): CachTinhDiem[] {
  return [
    { id: 'ctd-luy-ke', ma: 'LUY_KE', ten: 'Lũy kế', mo_ta: null, thu_tu: 0 },
    { id: 'ctd-tong', ma: 'TONG', ten: 'Tổng', mo_ta: null, thu_tu: 1 },
    { id: 'ctd-tb', ma: 'TB', ten: 'Trung bình', mo_ta: null, thu_tu: 2 },
    { id: 'ctd-moi-nhat', ma: 'MOI_NHAT', ten: 'Giá trị mới nhất', mo_ta: null, thu_tu: 3 },
    { id: 'ctd-max', ma: 'MAX', ten: 'Giá trị tối đa', mo_ta: null, thu_tu: 4 },
    { id: 'ctd-min', ma: 'MIN', ten: 'Giá trị tối thiểu', mo_ta: null, thu_tu: 5 },
  ];
}

/** Ngưỡng tổng tỷ trọng theo hành động (99.99 – 100.01) */
export const TY_TRONG_SUM_MIN = 99.99;
export const TY_TRONG_SUM_MAX = 100.01;
