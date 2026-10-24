import { createContext, useContext } from 'react';

/**
 * GenericDrawer cấp cho footer: chạy `action` ngay nếu form chưa sửa, còn form có thay đổi
 * chưa lưu thì hỏi "Bỏ thay đổi?" trước. Nút Huỷ ở footer đi qua đây để không đóng mất dữ liệu
 * (trước đây chỉ Esc / nền mờ / nút X mới hỏi).
 */
export const DrawerDirtyGuardContext = createContext<((action: () => void) => void) | null>(null);

export const useDrawerDirtyGuard = () => useContext(DrawerDirtyGuardContext);
