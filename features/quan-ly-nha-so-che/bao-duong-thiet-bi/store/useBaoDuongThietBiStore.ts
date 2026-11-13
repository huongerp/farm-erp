import { create } from 'zustand';
import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Cột tab "Lịch bảo dưỡng" — sắp theo hạn cố định, không cho đổi cột sắp xếp. */
export const LICH_COLUMNS: ColumnConfig[] = [
  { id: 'thiet_bi', label: i18n.t('baoDuongThietBi.col.thietBi'), visible: true, minWidth: 220, order: 0 },
  { id: 'noi_dung', label: i18n.t('baoDuongThietBi.col.viec'), visible: true, minWidth: 220, order: 1 },
  { id: 'chu_ky_ngay', label: i18n.t('baoDuongThietBi.col.chuKy'), visible: true, minWidth: 100, order: 2 },
  { id: 'lan_gan_nhat', label: i18n.t('baoDuongThietBi.col.lanGanNhat'), visible: true, minWidth: 132, order: 3 },
  { id: 'han_ke_tiep', label: i18n.t('baoDuongThietBi.col.hanKeTiep'), visible: true, minWidth: 132, order: 4 },
  { id: 'tinh_trang', label: i18n.t('baoDuongThietBi.col.tinhTrang'), visible: true, minWidth: 150, order: 5 },
  { id: 'actions', label: '', visible: true, order: 6 },
];

/** Cột tab "Thiết bị". */
export const THIET_BI_COLUMNS: ColumnConfig[] = [
  { id: 'ten', label: i18n.t('baoDuongThietBi.col.tenThietBi'), visible: true, minWidth: 220, order: 0 },
  { id: 'ma_ts', label: i18n.t('baoDuongThietBi.col.maTs'), visible: true, minWidth: 140, order: 1 },
  { id: 'so_luong', label: i18n.t('baoDuongThietBi.col.soLuong'), visible: true, minWidth: 90, order: 2 },
  { id: 'khu_vuc', label: i18n.t('baoDuongThietBi.col.khuVuc'), visible: true, minWidth: 130, order: 3 },
  { id: 'tai_san', label: i18n.t('baoDuongThietBi.col.taiSan'), visible: true, minWidth: 200, order: 4 },
  { id: 'dang_dung', label: i18n.t('baoDuongThietBi.col.dangDung'), visible: true, minWidth: 110, order: 5 },
  { id: 'thu_tu', label: i18n.t('baoDuongThietBi.col.thuTu'), visible: true, minWidth: 80, order: 6 },
  { id: 'actions', label: '', visible: true, order: 7 },
];

// Danh sách ít dòng, lọc ở client — không cần bộ lọc server.
type BaoDuongFilters = Record<string, never>;

const initialFilters: BaoDuongFilters = {};

export const useLichStore = createGenericStore<BaoDuongFilters>(
  initialFilters,
  LICH_COLUMNS,
  'table-bao-duong-lich'
);

export const useThietBiStore = createGenericStore<BaoDuongFilters>(
  initialFilters,
  THIET_BI_COLUMNS,
  'table-bao-duong-thiet-bi'
);

interface FarmState {
  /** Farm (id chi nhánh) đang xem — null = chưa chọn; hợp lệ hoá qua chonFarmMacDinh (useBaoDuongFarm). */
  farmId: string | null;
  setFarmId: (id: string | null) => void;
}

/** Farm đang xem — dùng chung thẻ số, tab Lịch, tab Thiết bị, form thêm thiết bị. */
export const useBaoDuongFarmStore = create<FarmState>((set) => ({
  farmId: null,
  setFarmId: (farmId) => set({ farmId }),
}));
