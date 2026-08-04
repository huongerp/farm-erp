import type { TFunction } from 'i18next';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { getTrangThaiLabel, getUuTienLabel } from './constants';
import type { CongViec } from './types';

/**
 * Badge trạng thái + ưu tiên công việc — trước đây copy byte-for-byte giữa
 * cong-viec-table.tsx và cong-viec-hierarchy-table.tsx (kể cả hardcode
 * bg-slate-100 text-slate-700 không có dark:). Gom về đây, dùng chung bảng màu.
 */
export function renderTrangThaiBadge(trangThai: CongViec['trang_thai'], t: TFunction) {
  const label = getTrangThaiLabel(trangThai, t);
  const cls =
    trangThai === 'hoan_thanh'
      ? getStatusBadgeClass('success')
      : trangThai === 'dang_thuc_hien'
        ? getStatusBadgeClass('info')
        : trangThai === 'cho_bao_cao'
          ? getStatusBadgeClass('pending')
          : trangThai === 'huy'
            ? getStatusBadgeClass('neutral')
            : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

export function renderUuTienBadge(uuTien: CongViec['uu_tien'], t: TFunction) {
  const label = getUuTienLabel(uuTien, t);
  const cls =
    uuTien === 'cao'
      ? getStatusBadgeClass('rejected')
      : uuTien === 'trung_binh'
        ? getStatusBadgeClass('pending')
        : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
