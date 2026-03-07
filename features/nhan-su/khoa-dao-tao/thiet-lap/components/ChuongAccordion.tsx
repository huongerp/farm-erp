import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChuongKhoaHoc } from '../core/types';
import BaiHocList from './BaiHocList';
import BaiTestList from './BaiTestList';

const MOBILE_BREAKPOINT = 768;

interface Props {
  idKhoaHoc: string;
  chuong: ChuongKhoaHoc;
}

const ChuongAccordion: React.FC<Props> = ({ idKhoaHoc, chuong }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT) setOpen(true);
  }, []);

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 active:bg-muted/50 transition-colors"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {t('thietLapKhoa.baiHoc.title')}
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {t('thietLapKhoa.baiTest.title')}
          </span>
        </span>
      </button>
      {open && (
        <div className={cn('px-3 pb-3 space-y-4 bg-muted/10')}>
          <BaiHocList idChuong={chuong.id} />
          <BaiTestList idChuong={chuong.id} />
        </div>
      )}
    </div>
  );
};

export default ChuongAccordion;
