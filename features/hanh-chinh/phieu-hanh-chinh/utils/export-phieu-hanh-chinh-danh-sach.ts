/**
 * Export danh sách phiếu hành chính (tab Phiếu) — cùng pattern với Chi phí tài sản / ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { AdminFormRequest } from '../core/types';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateTime, formatYmdToDisplay } from '../../../../lib/utils';
import { getAdminFormShiftLabel, getAdminFormStatusLabel } from '../core/constants';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { soNgayCuaPhieu } from '../core/khoang-nghi';
import { moTaKhoangNhieuNgay } from './hien-thi-khoang';

/** Cố ý không có `tg_cap_nhat`: rowToRequest điền "bây giờ" khi DB null → file sẽ ghi sai giờ cập nhật. */
export const PHIEU_HANH_CHINH_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'den_ngay',
  'thoi_gian',
  'so_ngay',
  'loai_phieu',
  'ly_do',
  'trang_thai',
  'ghi_chu',
  'id_nguoi_tao',
  'ten_nguoi_tao',
  'ten_phong_ban',
  'tg_tao',
] as const;

export function mapPhieuHanhChinhListRow(p: AdminFormRequest, t: TFunction): Record<string, unknown> {
  return {
    id: p.id,
    ngay: formatYmdToDisplay(p.ngay),
    den_ngay: formatYmdToDisplay(p.den_ngay),
    // Giống ô "Thời gian" của bảng: khoảng nhiều ngày, hoặc ca trong 1 ngày.
    thoi_gian: moTaKhoangNhieuNgay(p, t) ?? getAdminFormShiftLabel(p.ca, t),
    // Để dạng số cho Excel cộng được.
    so_ngay: soNgayCuaPhieu(p),
    loai_phieu: getAdminFormTypeLabel(p.loai_phieu, t),
    ly_do: (p.ly_do ?? '').trim(),
    trang_thai: getAdminFormStatusLabel(p.trang_thai, t),
    ghi_chu: (p.ghi_chu ?? '').trim(),
    id_nguoi_tao: p.nguoi_tao_id ?? '',
    ten_nguoi_tao: (p.ten_nguoi_tao ?? '').trim(),
    ten_phong_ban: (p.ten_phong_ban ?? '').trim(),
    tg_tao: p.tg_tao ? formatDateTime(p.tg_tao) : '',
  };
}

export function getExportColumnsPhieuHanhChinhList(t: TFunction): ExportColumn[] {
  return PHIEU_HANH_CHINH_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`adminForm.export.list.${key}`),
  }));
}

export function exportFileNamePhieuHanhChinhDanhSach(): string {
  return 'HC_Phieu_hanh_chinh';
}

export const LIST_EXPORT_SHEET_NAME = 'Phieu_hanh_chinh';
