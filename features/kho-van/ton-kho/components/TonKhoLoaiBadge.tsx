import { useTranslation } from 'react-i18next';
import type { LoaiPhieuKhoTab } from '../../phieu-kho/core/types';
import { cn } from '../../../../lib/utils';

/** Chuẩn hóa loại phiếu từ DB (nhập/xuất/chuyển) hoặc tab key cũ → tab UI. */
export function tonKhoLoaiToTab(loai: string): LoaiPhieuKhoTab {
  if (loai === 'nhập' || loai === 'nhap') return 'nhap';
  if (loai === 'xuất' || loai === 'xuat') return 'xuat';
  if (loai === 'chuyển' || loai === 'chuyen') return 'chuyen';
  return 'chuyen';
}

export function TonKhoLoaiBadge({ loai }: { loai: string }) {
  const { t } = useTranslation();
  const tab = tonKhoLoaiToTab(loai);
  const label =
    tab === 'nhap'
      ? t('tonKho.history.typeNhap')
      : tab === 'xuat'
        ? t('tonKho.history.typeXuat')
        : t('tonKho.history.typeChuyen');
  const cls =
    tab === 'nhap'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : tab === 'xuat'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}
