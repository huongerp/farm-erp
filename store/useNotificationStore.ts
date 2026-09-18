import { create } from 'zustand';

/**
 * Trạng thái GIAO DIỆN của chuông thông báo.
 *
 * Dữ liệu thông báo thật nằm ở React Query (features/thong-bao/hooks) và trong
 * bảng fp_var_thong_bao; store này chỉ giữ những gì thuộc về màn hình: panel
 * đang mở hay đóng, đang lọc module nào, có đang xem riêng phần chưa đọc không.
 *
 * Trước đây store này chứa 15 thông báo mẫu hardcode và không nối với DB —
 * chuông hiển thị dữ liệu giả cho mọi người dùng.
 */
interface NotificationUiState {
  /** null = xem mọi module. */
  moduleDangLoc: string | null;
  chiChuaDoc: boolean;
  setModuleDangLoc: (moduleId: string | null) => void;
  setChiChuaDoc: (v: boolean) => void;
  datLaiBoLoc: () => void;
}

export const useNotificationStore = create<NotificationUiState>((set) => ({
  moduleDangLoc: null,
  chiChuaDoc: false,
  setModuleDangLoc: (moduleId) => set({ moduleDangLoc: moduleId }),
  setChiChuaDoc: (v) => set({ chiChuaDoc: v }),
  datLaiBoLoc: () => set({ moduleDangLoc: null, chiChuaDoc: false }),
}));
