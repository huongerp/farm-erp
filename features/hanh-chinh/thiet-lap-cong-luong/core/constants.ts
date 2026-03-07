import type { TFunction } from 'i18next';
import type { PointGroupType } from './types';

export const POINT_GROUP_TYPES: PointGroupType[] = ['cong', 'tru'];

export const getPointGroupTypeLabel = (loai: PointGroupType, t: TFunction) => {
  return loai === 'cong' ? t('payrollIp.pointGroups.types.cong') : t('payrollIp.pointGroups.types.tru');
};

export const getPointGroupTypeOptions = (t: TFunction) =>
  POINT_GROUP_TYPES.map((type) => ({ value: type, label: getPointGroupTypeLabel(type, t) }));

export const ADMIN_FORM_TYPES = [
  'late_early',
  'business_trip',
  'missed_checkin',
  'overtime',
  'leave_unpaid',
  'leave_paid',
] as const;

export type AdminFormType = typeof ADMIN_FORM_TYPES[number];

export const getAdminFormTypeLabel = (type: AdminFormType, t: TFunction) => {
  switch (type) {
    case 'late_early':
      return t('payrollIp.groups.types.lateEarly');
    case 'business_trip':
      return t('payrollIp.groups.types.businessTrip');
    case 'missed_checkin':
      return t('payrollIp.groups.types.missedCheckin');
    case 'overtime':
      return t('payrollIp.groups.types.overtime');
    case 'leave_unpaid':
      return t('payrollIp.groups.types.leaveUnpaid');
    case 'leave_paid':
      return t('payrollIp.groups.types.leavePaid');
    default:
      return type;
  }
};

export const getAdminFormTypeOptions = (t: TFunction) =>
  ADMIN_FORM_TYPES.map((type) => ({
    value: type,
    label: getAdminFormTypeLabel(type, t),
  }));
