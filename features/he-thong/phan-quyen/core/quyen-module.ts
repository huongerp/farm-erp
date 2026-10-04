import type { ActionType } from './types';

export interface CoQuyenModule {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canAdmin: boolean;
}

/**
 * Đổi danh sách action của chức vụ trên một module (fp_var_phan_quyen.actions) thành cờ quyền.
 * `admin` / `all` bao mọi quyền — PHẢI khớp tầng DB `fn_co_quyen_module(module, actions)`
 * trong các policy (migration 013, 014), nếu lệch thì UI cho bấm mà DB từ chối hoặc ngược lại.
 */
export function tinhCoQuyen(actions: readonly ActionType[]): CoQuyenModule {
  const has = (key: ActionType) => actions.includes(key);
  const toanQuyen = has('admin') || has('all');
  return {
    canView: toanQuyen || has('view'),
    canCreate: toanQuyen || has('create'),
    canUpdate: toanQuyen || has('update'),
    canDelete: toanQuyen || has('delete'),
    canApprove: toanQuyen || has('approve'),
    canAdmin: toanQuyen,
  };
}

/** Thấy module trên menu khi có `view` (hoặc `admin` / `all`). */
export function coQuyenXem(actions: readonly ActionType[]): boolean {
  return tinhCoQuyen(actions).canView;
}
