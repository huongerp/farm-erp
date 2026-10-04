import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage } from '../../../lib/utils';
import { createListSearchMatcher } from '../../../lib/list-search-matcher';
import i18n from '../../../lib/i18n';
import KetNoiGoogleToolbar from './components/KetNoiGoogleToolbar';
import KetNoiGoogleTable from './components/KetNoiGoogleTable';
import KetNoiGoogleDrawer from './components/KetNoiGoogleDrawer';
import { useDatBatLich, useKetNoiGoogle, useNgatKetNoiGoogle, useXoaLichDongBo } from './hooks/use-ket-noi-google';
import { DEFAULT_COLUMNS, useKetNoiGoogleStore, type KetNoiGoogleFilters } from './store/useKetNoiGoogleStore';
import { tinhTrangKetNoi } from './core/trang-thai';
import type { KetNoiGoogle, LichDongBoQt } from './core/types';

/** Ô tìm kiếm quét mọi cột (kể cả nhãn tình trạng đang hiển thị), bỏ dấu tiếng Việt. */
const khopTimKiem = createListSearchMatcher<KetNoiGoogle>({
  columns: DEFAULT_COLUMNS,
  getCellText: (colId, item) =>
    colId === 'tinh_trang' ? i18n.t(`ketNoiGoogle.status.${tinhTrangKetNoi(item)}`) : String((item as unknown as Record<string, unknown>)[colId] ?? ''),
});

/**
 * Hệ thống > Kết nối Google — quản trị xem ai đã kết nối email Google nào, lịch đồng bộ nào lỗi;
 * tạm dừng/bật lại lịch (quyền sửa), xoá lịch + ngắt kết nối (quyền xoá). Quyền kiểm cả ở DB
 * (RPC rpc_qt_*, migration 016).
 */
const KetNoiGooglePage: React.FC = () => {
  const { t } = useTranslation();
  const { canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState } = useKetNoiGoogleStore();
  const [dangXemId, setDangXemId] = useState<string | null>(null);

  const { data: ds = [], isLoading, isError, refetch } = useKetNoiGoogle();
  const datBat = useDatBatLich();
  const xoaLich = useXoaLichDongBo();
  const ngat = useNgatKetNoiGoogle();

  useEffect(() => () => resetState(), [resetState]);

  // Lấy bản mới nhất từ danh sách: tải lại sau thao tác thì drawer tự cập nhật; bị ngắt thì tự đóng.
  const dangXem = useMemo(() => (dangXemId ? (ds.find((x) => x.id === dangXemId) ?? null) : null), [ds, dangXemId]);

  const filterFn = useCallback(
    (item: KetNoiGoogle, term: string, f: KetNoiGoogleFilters) =>
      khopTimKiem(item, term) && (f.tinhTrang.length === 0 || f.tinhTrang.includes(tinhTrangKetNoi(item))),
    [],
  );
  const daLoc = useListWithFilter(ds, searchTerm, filters, filterFn);

  const daSap = useMemo(() => {
    if (!sort.column || !sort.direction) return daLoc;
    const col = sort.column;
    const giaTri = (x: KetNoiGoogle) => (col === 'tinh_trang' ? tinhTrangKetNoi(x) : (x as unknown as Record<string, unknown>)[col] ?? '');
    return [...daLoc].sort((a, b) => {
      const va = giaTri(a);
      const vb = giaTri(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
  }, [daLoc, sort]);

  const handleToggleLich = (l: LichDongBoQt) => {
    if (l.bat) {
      confirm({
        title: t('ketNoiGoogle.pauseTitle'),
        message: t('ketNoiGoogle.pauseMessage', { tab: l.sheet_title }),
        variant: 'warning',
        confirmText: t('ketNoiGoogle.pause'),
        onConfirm: () => datBat.mutateAsync({ id: l.id, bat: false }),
      });
    } else {
      datBat.mutate({ id: l.id, bat: true });
    }
  };

  const handleXoaLich = (l: LichDongBoQt) =>
    confirm({
      title: t('ketNoiGoogle.deleteScheduleTitle'),
      message: t('ketNoiGoogle.deleteScheduleMessage', { tab: l.sheet_title }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => xoaLich.mutateAsync(l.id),
    });

  const handleNgat = (k: KetNoiGoogle) =>
    confirm({
      title: t('ketNoiGoogle.disconnectTitle'),
      message: t('ketNoiGoogle.disconnectMessage', { name: k.ho_va_ten ?? k.google_email, email: k.google_email, n: k.so_lich }),
      variant: 'danger',
      confirmText: t('ketNoiGoogle.disconnect'),
      onConfirm: () => ngat.mutateAsync(k.nhan_vien_id),
    });

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <KetNoiGoogleToolbar items={ds} />
        <div className="flex-1 min-h-0">
          <KetNoiGoogleTable data={daSap} isLoading={isLoading} isError={isError} onRetry={() => void refetch()} onView={(k) => setDangXemId(k.id)} />
        </div>
      </div>

      <AnimatePresence>
        {dangXem && (
          <KetNoiGoogleDrawer
            data={dangXem}
            onClose={() => setDangXemId(null)}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onToggleLich={handleToggleLich}
            onXoaLich={handleXoaLich}
            onNgatKetNoi={handleNgat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KetNoiGooglePage;
