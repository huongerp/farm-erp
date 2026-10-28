/** Class + định dạng dùng chung cho các bảng của tab Tổng hợp tuần / So sánh tháng (cùng giọng lưới ngày). */
import { formatNumberVN } from '../../../../../lib/utils';

export const TH = 'border border-border px-1.5 py-1 text-xs font-semibold text-center align-middle bg-muted';
export const TD = 'border border-border px-1.5 py-1 text-body-sm align-middle';
/** Cột đầu cố định khi cuộn ngang (tổ trưởng / lô, dây, chi nhánh, tháng). */
export const W_COT_DAU = 'w-[12rem] min-w-[12rem] max-w-[12rem]';

/** Ô số: 0 để trống cho dễ nhìn. */
export const fmtO = (n: number) => (n === 0 ? '' : formatNumberVN(n));
