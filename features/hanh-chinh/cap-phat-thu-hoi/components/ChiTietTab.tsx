import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useAllPhieuChiTiet, usePhieuById } from '../hooks/use-cap-phat-thu-hoi';
import { useCapPhatThuHoiViewScope } from '../hooks/use-cap-phat-thu-hoi-view-scope';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import { getLoaiPhieuLabel } from '../core/constants';
import type { PhieuChiTietRow } from '../core/types';
import ChiTietTabToolbar from './ChiTietTabToolbar';
import PhieuDetail from './PhieuDetail';
import GenericTable from '../../../../components/shared/GenericTable';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDate } from '../../../../lib/utils';

const ChiTietTab: React.FC = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const { viewAll } = useCapPhatThuHoiViewScope();
  const { data: rows = [], isLoading } = useAllPhieuChiTiet();

  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const { data: viewingPhieu } = usePhieuById(viewingPhieuId);

  const handleBack = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', viewAll ? 'history' : 'mine');
      return next;
    });
  }, [setSearchParams, viewAll]);

  const {
    searchTerm,
    filters,
    columns,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    resetState,
  } = useChiTietTabStore();

  useEffect(() => () => resetState(), [resetState]);

  const sortedRows = useMemo(() => {
    if (!sort.column) return rows;
    const key = sort.column as keyof PhieuChiTietRow;
    return [...rows].sort((a, b) => {
      const va = (a[key] ?? '') as string;
      const vb = (b[key] ?? '') as string;
      const cmp = va.localeCompare(vb);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const filteredRows = useMemo(() => {
    let result = sortedRows;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.ma_phieu ?? '').toLowerCase().includes(q) ||
          (r.ma_tai_san ?? '').toLowerCase().includes(q) ||
          (r.ten_tai_san ?? '').toLowerCase().includes(q) ||
          (r.ten_noi_luu_truoc ?? '').toLowerCase().includes(q) ||
          (r.ten_noi_luu_sau ?? '').toLowerCase().includes(q)
      );
    }

    const loaiList = filters.loaiPhieu ?? [];
    if (loaiList.length > 0) {
      result = result.filter((r) => loaiList.includes(r.loai_phieu));
    }

    return result;
  }, [sortedRows, searchTerm, filters.loaiPhieu]);

  const maxPage = Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const renderCell = useCallback(
    (colId: string, item: PhieuChiTietRow) => {
      switch (colId) {
        case 'ma_phieu':
          return (
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_phieu ?? '—'}
            </span>
          );
        case 'loai_phieu':
          return <span className="text-sm">{getLoaiPhieuLabel(item.loai_phieu, t)}</span>;
        case 'ngay_thuc_hien':
          return <span className="text-sm text-muted-foreground">{formatDate(item.ngay_thuc_hien)}</span>;
        case 'ma_tai_san':
          return <span className="text-sm font-mono">{item.ma_tai_san ?? '—'}</span>;
        case 'ten_tai_san':
          return <span className="text-sm line-clamp-2">{item.ten_tai_san ?? '—'}</span>;
        case 'ten_noi_luu_truoc':
          return <span className="text-sm">{item.ten_noi_luu_truoc ?? '—'}</span>;
        case 'ten_noi_luu_sau':
          return <span className="text-sm">{item.ten_noi_luu_sau ?? '—'}</span>;
        case 'ten_nguoi_giu_truoc':
          return <span className="text-sm">{item.ten_nguoi_giu_truoc ?? '—'}</span>;
        case 'ten_nguoi_giu_sau':
          return <span className="text-sm">{item.ten_nguoi_giu_sau ?? '—'}</span>;
        case 'ghi_chu':
          return <span className="text-xs text-muted-foreground line-clamp-2 max-w-[160px]">{item.ghi_chu ?? '—'}</span>;
        case 'actions':
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip content={t('common.view')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingPhieuId(item.id_phieu);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.view')}
                >
                  <FileText size={16} />
                </button>
              </Tooltip>
            </div>
          );
        default:
          return <span className="text-sm">{String((item as unknown as Record<string, unknown>)[colId] ?? '—')}</span>;
      }
    },
    [t]
  );

  const renderMobileCard = useCallback(
    (item: PhieuChiTietRow) => (
      <div
        className="p-3 rounded-lg border border-border cursor-pointer"
        onClick={() => setViewingPhieuId(item.id_phieu)}
        onKeyDown={(e) => e.key === 'Enter' && setViewingPhieuId(item.id_phieu)}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="font-mono text-sm font-medium text-foreground">{item.ma_phieu ?? '—'}</span>
          <span className="text-xs text-muted-foreground">{formatDate(item.ngay_thuc_hien)}</span>
        </div>
        <p className="text-sm text-foreground mt-0.5">{item.ma_tai_san} – {item.ten_tai_san ?? '—'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getLoaiPhieuLabel(item.loai_phieu, t)} · {item.ten_noi_luu_truoc ?? '—'} → {item.ten_noi_luu_sau ?? '—'}
        </p>
      </div>
    ),
    [t]
  );

  const handleRowClick = useCallback((item: PhieuChiTietRow) => setViewingPhieuId(item.id_phieu), []);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChiTietTabToolbar data={[]} onBack={handleBack} />
        <ListPageSkeleton />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChiTietTabToolbar data={[]} onBack={handleBack} />
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <EmptyState
            title={t('capPhatThuHoi.chiTiet.emptyTitle')}
            description={t('capPhatThuHoi.chiTiet.emptyHint')}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChiTietTabToolbar data={sortedRows} onBack={handleBack} />
        <GenericTable<PhieuChiTietRow>
          data={filteredRows}
          columns={columns}
          isLoading={false}
          selectedIds={new Set()}
          onToggleSelection={() => {}}
          onToggleAll={() => {}}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          onRowClick={handleRowClick}
          keyExtractor={(item) => item.id}
          loadingText={t('capPhatThuHoi.loading')}
          emptyTitle={t('capPhatThuHoi.chiTiet.emptyTitle')}
          emptyDescription={t('capPhatThuHoi.chiTiet.emptyHint')}
        />
      </div>

      <AnimatePresence>
        {viewingPhieu && (
          <PhieuDetail
            data={viewingPhieu}
            onClose={() => setViewingPhieuId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChiTietTab;
