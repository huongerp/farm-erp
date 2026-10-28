/**
 * Card gọn cho `SubTable` trên điện thoại (`renderMobileCard`): dòng 1 = tiêu đề + số chính canh phải,
 * dòng 2 = thông tin phụ. Thay card mặc định (mỗi cột một ô nhãn/giá trị — quá dài khi nhiều dòng).
 * Chạm cả card = hành động chính (mở chi tiết); không truyền `onClick` thì chỉ hiển thị (vd. dòng tổng).
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Props {
  tieuDe: React.ReactNode;
  soChinh?: React.ReactNode;
  phu?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const TheDongMobile: React.FC<Props> = ({ tieuDe, soChinh, phu, onClick, className }) => {
  const noiDung = (
    <>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5 text-sm font-medium">{tieuDe}</div>
          {soChinh != null && <div className="shrink-0 tabular-nums text-sm font-semibold">{soChinh}</div>}
        </div>
        {phu && <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">{phu}</div>}
      </div>
      {onClick && <ChevronRight size={16} className="shrink-0 text-muted-foreground" />}
    </>
  );
  const cls = cn('w-full flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left min-h-[44px]', className);
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'active:bg-muted/60')}>
      {noiDung}
    </button>
  ) : (
    <div className={cls}>{noiDung}</div>
  );
};

export default TheDongMobile;
