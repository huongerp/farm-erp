import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { tachTraoDoi } from '../../../lib/trao-doi-log';
import { hienThiThoiDiemTraoDoi } from './hien-thi';

interface Props {
  traoDoi: string | null | undefined;
  /** Cấp cao: hiện icon bút. */
  coTheSua: boolean;
  /** Mở popup (sửa khi `coTheSua`, ngược lại chỉ xem). */
  onMo: () => void;
}

/** Tin dài hơn ngần này / nhiều dòng hơn line-clamp → có link xem đủ. */
const DAI_TOI_DA = 100;

/**
 * Ô "Trao đổi" trong bảng dòng hàng: chỉ hiện tin mới nhất (tối đa 2 dòng) để dòng hàng không
 * cao vọt khi log dài; toàn bộ lịch sử xem trong popup.
 */
const TraoDoiCell: React.FC<Props> = ({ traoDoi, coTheSua, onMo }) => {
  const { t } = useTranslation();
  const muc = tachTraoDoi(traoDoi);
  const cuoi = muc[muc.length - 1];
  const thoiDiem = cuoi?.thoiDiem ? hienThiThoiDiemTraoDoi(cuoi.thoiDiem) : '';
  const biCat = !!cuoi && (cuoi.noiDung.length > DAI_TOI_DA || cuoi.noiDung.split('\n').length > 2);
  const mo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMo();
  };

  return (
    <div className="flex items-start gap-1 min-w-0">
      <div className="flex-1 min-w-0">
        {cuoi ? (
          <p className="m-0 text-xs text-muted-foreground whitespace-pre-line break-words line-clamp-2">
            {thoiDiem && <span className="tabular-nums text-foreground/70">{thoiDiem}</span>}
            {thoiDiem && cuoi.noiDung ? ' · ' : ''}
            {cuoi.noiDung}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {(muc.length > 1 || biCat) && (
          <button type="button" onClick={mo} className="text-caption text-primary hover:underline touch-manipulation">
            {muc.length > 1 ? t('common.traoDoi.xemCa', { n: muc.length }) : t('common.traoDoi.xemDu')}
          </button>
        )}
      </div>
      {coTheSua && (
        <button
          type="button"
          onClick={mo}
          title={t('common.traoDoi.sua')}
          aria-label={t('common.traoDoi.sua')}
          className="shrink-0 -mt-0.5 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 touch-manipulation"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
};

export default TraoDoiCell;
