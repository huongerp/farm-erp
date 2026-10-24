import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { formatGioTbVN } from '../core/ct-sub';

/**
 * Thẻ "chuyền" cho màn hình hẹp (< md): thay bảng 16 cột `min-w-[70rem]` bằng một thẻ / chuyền.
 * Thuần trình bày — số liệu do nơi gọi tính bằng đúng các hàm của bảng desktop.
 */

export interface ChuyenCardLoaiTotals {
  nhanSu: number;
  tongGio: number;
}

export type ChuyenCardTone = 'row' | 'subtotal' | 'total';

interface Props {
  /** Nhãn TT (I, II, … IV, V) — rỗng thì không hiện. */
  tt?: string;
  title: string;
  tone?: ChuyenCardTone;
  cnNgay: ChuyenCardLoaiTotals;
  cnNua: ChuyenCardLoaiTotals;
  tangCa: ChuyenCardLoaiTotals;
  /** Công quy đổi (ngày + nửa). */
  quyDoi: number;
  /** Tổng giờ công (ngày + nửa). */
  tongGio: number;
  /** Tổng giờ tăng ca (giờ × người). */
  tongGioTc: number;
  /** Nút mở/thu gọn dòng chi tiết. */
  expanded?: boolean;
  onToggle?: () => void;
  toggleLabel?: string;
  /** Ghi chú: chuỗi (xem) hoặc ô nhập (form). Chuỗi rỗng thì ẩn. */
  ghiChu?: React.ReactNode;
  /** Nội dung mở rộng (dòng chi tiết). */
  children?: React.ReactNode;
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground leading-tight">{label}</div>
      <div className={cn('text-sm tabular-nums mt-0.5', strong ? 'font-bold text-primary' : 'font-semibold')}>{value}</div>
    </div>
  );
}

function Group({ heading, children, cols = 2 }: { heading: string; children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div>
      <div className="text-xs font-medium text-foreground/70 mb-1">{heading}</div>
      <div className={cn('grid gap-x-3 gap-y-1.5', cols === 3 ? 'grid-cols-3' : 'grid-cols-2')}>{children}</div>
    </div>
  );
}

const FRAME: Record<ChuyenCardTone, string> = {
  row: 'bg-card rounded-xl border border-border p-3',
  subtotal: 'bg-primary/5 border border-primary/20 rounded-xl p-3',
  total: 'bg-primary/5 border border-primary/20 rounded-xl p-3',
};

const BaoCaoNhanCongChuyenCard: React.FC<Props> = ({
  tt,
  title,
  tone = 'row',
  cnNgay,
  cnNua,
  tangCa,
  quyDoi,
  tongGio,
  tongGioTc,
  expanded,
  onToggle,
  toggleLabel,
  ghiChu,
  children,
}) => {
  const { t } = useTranslation();
  const hasGhiChu = typeof ghiChu === 'string' ? ghiChu.trim() !== '' : ghiChu != null && ghiChu !== false;

  return (
    <div className={cn(FRAME[tone], 'space-y-2.5')}>
      <div className="flex items-start gap-2">
        {tt ? (
          <span className="shrink-0 min-w-6 h-6 px-1 rounded-md bg-muted text-xs font-semibold text-muted-foreground inline-flex items-center justify-center tabular-nums">
            {tt}
          </span>
        ) : null}
        <div className={cn('flex-1 min-w-0 text-sm leading-snug', tone === 'row' ? 'font-semibold text-foreground' : 'font-bold text-primary')}>
          {title}
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!!expanded}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={cn(
              'shrink-0 size-8 inline-flex items-center justify-center rounded-md border transition-colors',
              expanded
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground'
            )}
          >
            <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 rounded-lg bg-primary/[0.06] px-2.5 py-2">
        <Metric label={t('baoCaoNhanCong.card.congQuyDoi')} value={formatNumberVN(quyDoi)} strong />
        <Metric label={t('baoCaoNhanCong.card.tongGioCong')} value={formatNumberVN(tongGio)} strong />
      </div>

      <Group heading={t('baoCaoNhanCong.card.congNhanCaNgay')}>
        <Metric label={t('baoCaoNhanCong.card.nhanSu')} value={formatNumberVN(cnNgay.nhanSu)} />
        <Metric label={t('baoCaoNhanCong.card.gioTrungBinh')} value={formatGioTbVN(cnNgay.nhanSu, cnNgay.tongGio)} />
      </Group>
      <Group heading={t('baoCaoNhanCong.card.congNhanNuaNgay')}>
        <Metric label={t('baoCaoNhanCong.card.nhanSu')} value={formatNumberVN(cnNua.nhanSu)} />
        <Metric label={t('baoCaoNhanCong.card.gioTrungBinh')} value={formatGioTbVN(cnNua.nhanSu, cnNua.tongGio)} />
      </Group>
      <Group heading={t('baoCaoNhanCong.card.tangCa')} cols={3}>
        <Metric label={t('baoCaoNhanCong.card.nhanSu')} value={formatNumberVN(tangCa.nhanSu)} />
        <Metric label={t('baoCaoNhanCong.card.gioTrungBinh')} value={formatGioTbVN(tangCa.nhanSu, tangCa.tongGio)} />
        <Metric label={t('baoCaoNhanCong.card.tongGioNhanSu')} value={formatNumberVN(tongGioTc)} strong />
      </Group>

      {hasGhiChu && (
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">{t('baoCaoNhanCong.card.ghiChu')}</div>
          {typeof ghiChu === 'string' ? (
            <p className="whitespace-pre-wrap text-sm leading-snug m-0 text-foreground">{ghiChu}</p>
          ) : (
            ghiChu
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export default BaoCaoNhanCongChuyenCard;
