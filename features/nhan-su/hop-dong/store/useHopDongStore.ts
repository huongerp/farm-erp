import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HopDongFilters {
  id_ung_vien: string[];
  loai_hop_dong: string[];
  trang_thai: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_ung_vien', label: i18n.t('hopDong.table.ungVien'), visible: true, minWidth: 140, maxWidth: 240, order: 0 },
  { id: 'so_hop_dong', label: i18n.t('hopDong.table.soHopDong'), visible: true, minWidth: 120, order: 1 },
  { id: 'loai_hop_dong', label: i18n.t('hopDong.table.loaiHopDong'), visible: true, minWidth: 120, order: 2 },
  { id: 'ngay_bat_dau', label: i18n.t('hopDong.table.ngayBatDau'), visible: true, minWidth: 110, order: 3 },
  { id: 'ngay_ket_thuc', label: i18n.t('hopDong.table.ngayKetThuc'), visible: true, minWidth: 110, order: 4 },
  { id: 'ngay_vao_lam', label: i18n.t('hopDong.table.ngayVaoLam'), visible: true, minWidth: 110, order: 5 },
  { id: 'trang_thai', label: i18n.t('hopDong.table.trangThai'), visible: true, minWidth: 100, order: 6 },
  { id: 'muc_luong', label: i18n.t('hopDong.table.mucLuong'), visible: true, minWidth: 100, order: 7 },
  { id: 'tg_tao', label: i18n.t('hopDong.table.ngayTao'), visible: true, minWidth: 128, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('hopDong.table.ngayCapNhat'), visible: true, minWidth: 128, order: 9 },
];

const initialFilters: HopDongFilters = {
  id_ung_vien: [],
  loai_hop_dong: [],
  trang_thai: [],
};

export const useHopDongStore = createGenericStore<HopDongFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
