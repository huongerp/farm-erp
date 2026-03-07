import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KhoaDaoTaoFilters {
  trang_thai: string[];
  id_loai_khoa_hoc: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('khoaDaoTao.table.ma'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten', label: i18n.t('khoaDaoTao.table.ten'), visible: true, minWidth: 160, maxWidth: 280, order: 1 },
  { id: 'ten_loai_khoa_hoc', label: i18n.t('khoaDaoTao.table.loaiKhoaHoc'), visible: true, minWidth: 120, maxWidth: 200, order: 2 },
  { id: 'so_chuong', label: i18n.t('khoaDaoTao.table.soChuong'), visible: true, minWidth: 80, order: 3 },
  { id: 'so_bai_hoc', label: i18n.t('khoaDaoTao.table.soBaiHoc'), visible: true, minWidth: 90, order: 4 },
  { id: 'so_bai_test', label: i18n.t('khoaDaoTao.table.soBaiTest'), visible: true, minWidth: 90, order: 5 },
  { id: 'phan_quyen', label: i18n.t('khoaDaoTao.table.phanQuyen'), visible: true, minWidth: 120, order: 6 },
  { id: 'thoi_luong', label: i18n.t('khoaDaoTao.table.thoiLuong'), visible: true, minWidth: 90, order: 7 },
  { id: 'ngay_bat_dau', label: i18n.t('khoaDaoTao.table.ngayBatDau'), visible: true, minWidth: 110, order: 8 },
  { id: 'ngay_ket_thuc', label: i18n.t('khoaDaoTao.table.ngayKetThuc'), visible: true, minWidth: 110, order: 9 },
  { id: 'trang_thai', label: i18n.t('khoaDaoTao.table.trangThai'), visible: true, minWidth: 110, order: 10 },
  { id: 'giang_vien', label: i18n.t('khoaDaoTao.table.giangVien'), visible: true, minWidth: 120, maxWidth: 180, order: 11 },
  { id: 'tg_tao', label: i18n.t('khoaDaoTao.table.ngayTao'), visible: true, minWidth: 128, order: 12 },
  { id: 'tg_cap_nhat', label: i18n.t('khoaDaoTao.table.ngayCapNhat'), visible: true, minWidth: 128, order: 13 },
];

const initialFilters: KhoaDaoTaoFilters = {
  trang_thai: [],
  id_loai_khoa_hoc: [],
};

export const useKhoaDaoTaoStore = createGenericStore<KhoaDaoTaoFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
