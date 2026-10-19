import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../lib/utils';
import type { LoaiPhieuKhoPT, TrangThaiPhieuKhoPT } from '../../core/types';

const BADGE = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border';

export function LoaiPhieuKhoPTBadge({ loai }: { loai: LoaiPhieuKhoPT }) {
  const { t } = useTranslation();
  const label =
    loai === 'nhập' ? t('phieuKhoPhanThuoc.tabs.nhap') : loai === 'xuất' ? t('phieuKhoPhanThuoc.tabs.xuat') : t('phieuKhoPhanThuoc.tabs.chuyen');
  const cls =
    loai === 'nhập'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : loai === 'xuất'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  return <span className={cn(BADGE, cls)}>{label}</span>;
}

export function TrangThaiPhieuKhoPTBadge({ trangThai }: { trangThai: TrangThaiPhieuKhoPT }) {
  const { t } = useTranslation();
  if (trangThai === 'Chờ duyệt') {
    return (
      <span className={cn(BADGE, 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20')}>
        {t('phieuKhoPhanThuoc.status.pending')}
      </span>
    );
  }
  if (trangThai === 'Đã duyệt') {
    return (
      <span className={cn(BADGE, 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20')}>
        {t('phieuKhoPhanThuoc.status.approved')}
      </span>
    );
  }
  return (
    <span className={cn(BADGE, 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20')}>
      {t('phieuKhoPhanThuoc.status.rejected')}
    </span>
  );
}
