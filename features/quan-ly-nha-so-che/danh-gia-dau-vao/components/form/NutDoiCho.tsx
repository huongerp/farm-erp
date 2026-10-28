/** Cụm nút Lên / Xuống / Xoá của một dòng dây / lô trong form phiếu (bấm nút không mở drawer dòng). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

interface Props {
  i: number;
  tong: number;
  onDoiCho: (tu: number, den: number) => void;
  onXoa: (i: number) => void;
}

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

const NutDoiCho: React.FC<Props> = ({ i, tong, onDoiCho, onXoa }) => {
  const { t } = useTranslation();
  const chan = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className="flex items-center justify-end">
      <button type="button" className={iconBtn} disabled={i === 0} onClick={chan(() => onDoiCho(i, i - 1))} aria-label={t('danhGiaDauVao.form.lenTren')}>
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        className={iconBtn}
        disabled={i === tong - 1}
        onClick={chan(() => onDoiCho(i, i + 1))}
        aria-label={t('danhGiaDauVao.form.xuongDuoi')}
      >
        <ArrowDown size={14} />
      </button>
      <button type="button" className={cn(iconBtn, 'text-rose-500')} onClick={chan(() => onXoa(i))} aria-label={t('common.delete')}>
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export default NutDoiCho;
