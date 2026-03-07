/**
 * Nhãn nút chuẩn – dùng thống nhất toàn app (ngắn gọn, dễ dùng).
 * Sử dụng i18n t() để hỗ trợ đa ngôn ngữ.
 */
import i18n from './i18n';

const t = (key: string) => i18n.t(key);

export const BTN_CANCEL = () => t('common.cancel');
export const BTN_CLOSE = () => t('common.close');
export const BTN_SAVE = () => t('common.save');
export const BTN_CREATE = () => t('common.create');
export const BTN_EDIT = () => t('common.edit');
export const BTN_DELETE = () => t('common.delete');
export const BTN_ADD = () => t('common.add');

/** Confirm dialog */
export const CONFIRM_DELETE = () => t('common.delete');
export const CONFIRM_DELETE_ALL = () => t('common.deleteAll');
export const CONFIRM_YES = () => t('common.confirm');

/**
 * Quy định footer drawer detail (áp dụng cho mọi module):
 * - Bên trái: nút Đóng (BTN_CLOSE).
 * - Bên phải: Sửa trước, Xóa sau (BTN_EDIT rồi BTN_DELETE).
 * Thứ tự: hành động chính (Sửa) trước, hành động nguy hiểm (Xóa) sau.
 */
export const DETAIL_FOOTER_ORDER = 'close_left_edit_then_delete_right' as const;
