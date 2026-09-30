import type { TFunction } from 'i18next';

export const ADMIN_FORM_SHIFTS = ['morning', 'afternoon', 'full'] as const;
export type AdminFormShift = typeof ADMIN_FORM_SHIFTS[number];

export const ADMIN_FORM_STATUSES = [
  'pending',
  'manager_approved',
  'approved',
  'rejected',
  'cancelled',
] as const;
export type AdminFormStatus = typeof ADMIN_FORM_STATUSES[number];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const getAdminFormShiftLabel = (shift: AdminFormShift, t: TFunction) => {
  switch (shift) {
    case 'morning':
      return t('adminForm.shift.morning');
    case 'afternoon':
      return t('adminForm.shift.afternoon');
    case 'full':
      return t('adminForm.shift.full');
    default:
      return shift;
  }
};

export const getAdminFormStatusLabel = (status: AdminFormStatus, t: TFunction) => {
  switch (status) {
    case 'pending':
      return t('adminForm.status.pending');
    case 'manager_approved':
      return t('adminForm.status.managerApproved');
    case 'approved':
      return t('adminForm.status.approved');
    case 'rejected':
      return t('adminForm.status.rejected');
    case 'cancelled':
      return t('adminForm.status.cancelled');
    default:
      return status;
  }
};

export const getApprovalStatusLabel = (status: ApprovalStatus, t: TFunction) => {
  switch (status) {
    case 'pending':
      return t('adminForm.approval.pending');
    case 'approved':
      return t('adminForm.approval.approved');
    case 'rejected':
      return t('adminForm.approval.rejected');
    default:
      return status;
  }
};
