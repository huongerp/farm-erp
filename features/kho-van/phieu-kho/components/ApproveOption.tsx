import React from 'react';
import { CheckCircle, Hourglass, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import {
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_KHONG_DUYET,
} from '../core/constants';

interface ApproveOptionProps {
  label: string;
  icon: React.ReactNode;
  iconWrapClass: string;
  buttonClass: string;
  onClick: () => void;
  disabled?: boolean;
  /** Đang được chọn (dùng ở duyệt hàng loạt — chọn trước rồi mới xác nhận). */
  selected?: boolean;
}

/** Ô chọn trạng thái duyệt. Dùng chung cho popup duyệt lẻ và dialog duyệt hàng loạt. */
export const ApproveOption: React.FC<ApproveOptionProps> = ({
  label,
  icon,
  iconWrapClass,
  buttonClass,
  onClick,
  disabled,
  selected,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={cn(
      'group flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'hover:shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
      buttonClass,
      selected && 'ring-2 ring-ring ring-offset-2 shadow-sm',
    )}
  >
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconWrapClass)}>
      {icon}
    </span>
    <span className="text-xs font-medium leading-tight">{label}</span>
  </button>
);

/** Icon + màu theo trạng thái đích — giữ một nguồn để duyệt lẻ và duyệt lô trông như nhau. */
export const APPROVE_OPTION_STYLE: Record<
  string,
  { icon: React.ReactNode; iconWrapClass: string; buttonClass: string }
> = {
  [TRANG_THAI_DA_DUYET]: {
    icon: <CheckCircle size={14} />,
    iconWrapClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    buttonClass:
      'border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-800 dark:text-emerald-200 hover:border-emerald-500/45 hover:bg-emerald-500/10',
  },
  [TRANG_THAI_DOI_DUYET]: {
    icon: <Hourglass size={14} />,
    iconWrapClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    buttonClass:
      'border-sky-500/25 bg-sky-500/[0.04] text-sky-800 dark:text-sky-200 hover:border-sky-500/45 hover:bg-sky-500/10',
  },
  [TRANG_THAI_KHONG_DUYET]: {
    icon: <X size={14} />,
    iconWrapClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    buttonClass:
      'border-rose-500/25 bg-rose-500/[0.04] text-rose-800 dark:text-rose-200 hover:border-rose-500/45 hover:bg-rose-500/10',
  },
};

export default ApproveOption;
