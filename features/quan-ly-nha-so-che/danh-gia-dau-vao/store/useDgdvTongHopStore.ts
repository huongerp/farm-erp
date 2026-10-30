/**
 * Store bảng của tab «Tổng hợp ngày» (dòng = ngày × chi nhánh) và «Tổng hợp tuần» (dòng = tuần × chi nhánh):
 * cột (ẩn / kéo bề rộng — chỉ cột được lưu), phân trang, chip lọc tại chỗ. Kỳ giữ ở state của tab (`useKyDgdv`).
 */
import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DgdvTongNgayFilters {
  id_chi_nhanh: string[];
  /** `LOC_TRANG_THAI_NGAY` (core/tong-hop) */
  trang_thai: string[];
  /** `LOC_KSC` */
  ksc: string[];
  /** khoá `khoaTen` của tổ trưởng */
  to_truong: string[];
}

export interface DgdvTongTuanFilters {
  id_chi_nhanh: string[];
  ksc: string[];
  to_truong: string[];
}

const COT_NGAY: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('danhGiaDauVao.store.colNgay'), visible: true, minWidth: 104, maxWidth: 130, order: 0 },
  { id: 'tuan', label: i18n.t('danhGiaDauVao.store.colNamTuan'), visible: true, minWidth: 150, maxWidth: 210, order: 1 },
  { id: 'id_chi_nhanh', label: i18n.t('danhGiaDauVao.store.colBranch'), visible: true, minWidth: 140, maxWidth: 240, order: 2 },
  { id: 'so_chuyen', label: i18n.t('danhGiaDauVao.thang.colSoChuyen'), visible: true, minWidth: 84, maxWidth: 110, order: 3 },
  { id: 'tong_thu', label: i18n.t('danhGiaDauVao.store.colTongThu'), visible: true, minWidth: 100, maxWidth: 140, order: 4 },
  { id: 'ksc', label: i18n.t('danhGiaDauVao.store.colKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 5 },
  { id: 'ti_le_ksc', label: i18n.t('danhGiaDauVao.store.colTiLeKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 6 },
  { id: 'so_che', label: i18n.t('danhGiaDauVao.store.colSoChe'), visible: true, minWidth: 96, maxWidth: 140, order: 7 },
  { id: 'ti_le_so_che', label: i18n.t('danhGiaDauVao.store.colTiLeSoChe'), visible: true, minWidth: 104, maxWidth: 150, order: 8 },
  { id: 'trang_thai', label: i18n.t('danhGiaDauVao.store.colTrangThai'), visible: true, minWidth: 116, maxWidth: 170, order: 9 },
];

const COT_TUAN: ColumnConfig[] = [
  { id: 'tuan', label: i18n.t('danhGiaDauVao.store.colNamTuan'), visible: true, minWidth: 150, maxWidth: 210, order: 0 },
  { id: 'id_chi_nhanh', label: i18n.t('danhGiaDauVao.store.colBranch'), visible: true, minWidth: 140, maxWidth: 240, order: 1 },
  { id: 'so_ngay', label: i18n.t('danhGiaDauVao.thang.colSoNgay'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'so_chuyen', label: i18n.t('danhGiaDauVao.thang.colSoChuyen'), visible: true, minWidth: 84, maxWidth: 110, order: 3 },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `n${i}`,
    label: i18n.t(`danhGiaDauVao.thu.${i}`),
    visible: true,
    minWidth: 72,
    maxWidth: 100,
    order: 4 + i,
  })),
  { id: 'tong_thu', label: i18n.t('danhGiaDauVao.tuan.colTongTuan'), visible: true, minWidth: 100, maxWidth: 140, order: 11 },
  { id: 'ksc', label: i18n.t('danhGiaDauVao.store.colKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 12 },
  { id: 'ti_le_ksc', label: i18n.t('danhGiaDauVao.store.colTiLeKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 13 },
  { id: 'so_che', label: i18n.t('danhGiaDauVao.store.colSoChe'), visible: true, minWidth: 96, maxWidth: 140, order: 14 },
  { id: 'ti_le_so_che', label: i18n.t('danhGiaDauVao.store.colTiLeSoChe'), visible: true, minWidth: 104, maxWidth: 150, order: 15 },
];

export const useDgdvTongNgayStore = createGenericStore<DgdvTongNgayFilters>(
  { id_chi_nhanh: [], trang_thai: [], ksc: [], to_truong: [] },
  COT_NGAY,
  'table-danh-gia-dau-vao-tong-ngay'
);

export const useDgdvTongTuanStore = createGenericStore<DgdvTongTuanFilters>(
  { id_chi_nhanh: [], ksc: [], to_truong: [] },
  COT_TUAN,
  'table-danh-gia-dau-vao-tong-tuan'
);
