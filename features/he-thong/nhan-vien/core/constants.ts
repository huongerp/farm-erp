
import { Gender } from "./types";
import type { TrangThaiNV } from '../../../../lib/constants';
import { TRANG_THAI_NV } from '../../../../lib/constants';
import type { BadgeConfig } from "../../../../components/ui/EnumBadge";
import i18n from '../../../../lib/i18n';

export const STATUS_OPTIONS: { label: string; value: TrangThaiNV }[] = [
  { get label() { return i18n.t('employee.statusActiveShort'); }, value: TRANG_THAI_NV.DANG_LAM_VIEC },
  { get label() { return i18n.t('employee.statusInactiveShort'); }, value: TRANG_THAI_NV.NGHI_VIEC },
  { get label() { return i18n.t('employee.statusProbation'); }, value: TRANG_THAI_NV.THU_VIEC },
  { get label() { return i18n.t('employee.statusLeave'); }, value: TRANG_THAI_NV.NGHI_PHEP },
];

export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { get label() { return i18n.t('employee.genderMale'); }, value: 'Nam' },
  { get label() { return i18n.t('employee.genderFemale'); }, value: 'Nữ' },
  { get label() { return i18n.t('employee.genderOther'); }, value: 'Khác' },
];

export const MARITAL_STATUS_OPTIONS = [
  { get label() { return i18n.t('employee.maritalSingle'); }, value: 'Độc thân' },
  { get label() { return i18n.t('employee.maritalMarried'); }, value: 'Đã kết hôn' },
  { get label() { return i18n.t('employee.maritalDivorced'); }, value: 'Ly hôn' },
  { get label() { return i18n.t('employee.maritalWidowed'); }, value: 'Góa' },
];

export const EDUCATION_LEVEL_OPTIONS = [
  { get label() { return i18n.t('employee.eduHighSchool'); }, value: 'THPT' },
  { get label() { return i18n.t('employee.eduCollege'); }, value: 'Trung cấp' },
  { get label() { return i18n.t('employee.eduAssociate'); }, value: 'Cao đẳng' },
  { get label() { return i18n.t('employee.eduBachelor'); }, value: 'Đại học' },
  { get label() { return i18n.t('employee.eduMaster'); }, value: 'Thạc sĩ' },
  { get label() { return i18n.t('employee.eduDoctor'); }, value: 'Tiến sĩ' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { get label() { return i18n.t('employee.contractProbation'); }, value: 'Thử việc' },
  { get label() { return i18n.t('employee.contractFixed'); }, value: 'Có thời hạn' },
  { get label() { return i18n.t('employee.contractIndefinite'); }, value: 'Không thời hạn' },
  { get label() { return i18n.t('employee.contractSeasonal'); }, value: 'Thời vụ' },
];

export const RELATIONSHIP_OPTIONS = [
  { get label() { return i18n.t('employee.relFather'); }, value: 'Cha' },
  { get label() { return i18n.t('employee.relMother'); }, value: 'Mẹ' },
  { get label() { return i18n.t('employee.relWife'); }, value: 'Vợ' },
  { get label() { return i18n.t('employee.relHusband'); }, value: 'Chồng' },
  { get label() { return i18n.t('employee.relSibling'); }, value: 'Anh/Chị/Em' },
  { get label() { return i18n.t('employee.relOther'); }, value: 'Khác' },
];

export const STATUS_BADGE_CONFIG: BadgeConfig<TrangThaiNV> = {
  [TRANG_THAI_NV.DANG_LAM_VIEC]: { get label() { return i18n.t('employee.statusActive'); }, color: 'emerald' },
  [TRANG_THAI_NV.THU_VIEC]:      { get label() { return i18n.t('employee.statusProbation'); }, color: 'blue' },
  [TRANG_THAI_NV.NGHI_PHEP]:     { get label() { return i18n.t('employee.statusLeave'); }, color: 'amber' },
  [TRANG_THAI_NV.NGHI_VIEC]:     { get label() { return i18n.t('employee.statusResigned'); }, color: 'slate' },
};

export const GENDER_BADGE_CONFIG: BadgeConfig<Gender> = {
  'Nam':   { get label() { return i18n.t('employee.genderMale'); }, color: 'indigo' },
  'Nữ':   { get label() { return i18n.t('employee.genderFemale'); }, color: 'pink' },
  'Khác': { get label() { return i18n.t('employee.genderOther'); }, color: 'slate' },
};

export const MARITAL_BADGE_CONFIG: BadgeConfig = {
  'Độc thân':    { get label() { return i18n.t('employee.maritalSingle'); }, color: 'sky' },
  'Đã kết hôn':  { get label() { return i18n.t('employee.maritalMarried'); }, color: 'emerald' },
  'Ly hôn':      { get label() { return i18n.t('employee.maritalDivorced'); }, color: 'amber' },
  'Góa':         { get label() { return i18n.t('employee.maritalWidowed'); }, color: 'slate' },
};

export const CONTRACT_BADGE_CONFIG: BadgeConfig = {
  'Thử việc':         { get label() { return i18n.t('employee.contractProbation'); }, color: 'blue' },
  'Có thời hạn':      { get label() { return i18n.t('employee.contractFixed'); }, color: 'violet' },
  'Không thời hạn':   { get label() { return i18n.t('employee.contractIndefinite'); }, color: 'emerald' },
  'Thời vụ':          { get label() { return i18n.t('employee.contractSeasonal'); }, color: 'amber' },
};

export const EDUCATION_BADGE_CONFIG: BadgeConfig = {
  'THPT':       { get label() { return i18n.t('employee.eduHighSchool'); }, color: 'slate' },
  'Trung cấp':  { get label() { return i18n.t('employee.eduCollege'); }, color: 'sky' },
  'Cao đẳng':   { get label() { return i18n.t('employee.eduAssociate'); }, color: 'blue' },
  'Đại học':    { get label() { return i18n.t('employee.eduBachelor'); }, color: 'indigo' },
  'Thạc sĩ':   { get label() { return i18n.t('employee.eduMaster'); }, color: 'violet' },
  'Tiến sĩ':   { get label() { return i18n.t('employee.eduDoctor'); }, color: 'amber' },
};
