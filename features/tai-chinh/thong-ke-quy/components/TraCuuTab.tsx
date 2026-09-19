import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import GenericTable from '../../../../components/shared/GenericTable';
import LazyExportDialog from '../../../../components/shared/LazyExportDialog';
import ImportExportButtons from '../../thu-chi-quy/components/ImportExportButtons';
import { formatDate, formatNumberVN } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useThuChiQuyViewScope } from '../../thu-chi-quy/hooks/use-thu-chi-quy-view-scope';
import { useThuChiQuyPage } from '../../thu-chi-quy/hooks/use-thu-chi-quy';
import { getThuChiQuyAll } from '../../thu-chi-quy/services/thu-chi-quy-service';
import { resolveAllowedChiNhanhIds } from '../../thu-chi-quy/utils/quy-view-scope';
import type { ThuChiQuyListServerQuery } from '../../thu-chi-quy/services/thu-chi-quy-list-query';
import type { ThuChiQuyRow } from '../../thu-chi-quy/core/types';
import { useTraCuuQuyStore } from '../store/useTraCuuQuyStore';
import ThongKeToolbar, { DEFAULT_THONG_KE_FILTER, resolveDateRange, type ThongKeToolbarValue } from './ThongKeToolbar';

const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

/**
 * Tra cứu sổ quỹ: đọc liên tục theo ngày tăng dần kèm tồn quỹ lũy kế, đúng cách
 * đọc sổ giấy. Tồn quỹ do view tính trên toàn sổ nên vẫn đúng khi chỉ xem một kỳ.
 */
const TraCuuTab: React.FC = () => {
  const { t } = useTranslation();
  const viewScope = useThuChiQuyViewScope();
  const { data: branches = [] } = useBranches();
  const [filter, setFilter] = useState<ThongKeToolbarValue>(DEFAULT_THONG_KE_FILTER);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ThuChiQuyRow[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const {
    columns,
    resizeColumn,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
  } = useTraCuuQuyStore();

  const allowedBranches = useMemo(() => {
    if (viewScope.viewAll) return branches;
    const allowed = new Set(viewScope.allowedBranchIds.map(String));
    return branches.filter((b) => allowed.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  const chiNhanhIds = useMemo(() => {
    if (filter.chiNhanhId) return [Number(filter.chiNhanhId)];
    return resolveAllowedChiNhanhIds(viewScope);
  }, [filter.chiNhanhId, viewScope]);

  const range = useMemo(() => resolveDateRange(filter), [filter]);

  const listQuery: ThuChiQuyListServerQuery = useMemo(
    () => ({
      searchTerm: '',
      chiNhanhIds,
      loai: [],
      hangMucIds: [],
      nguonChungTu: [],
      nguoiTaoIds: [],
      trangThai: [],
      ngayFrom: range.tuNgay,
      ngayTo: range.denNgay,
    }),
    [chiNhanhIds, range.tuNgay, range.denNgay]
  );

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useThuChiQuyPage(pageIndex, listQuery, !viewScope.isLoading);

  // Sổ đọc từ cũ → mới (ngược với danh sách nhập liệu).
  const rows = useMemo(
    () =>
      [...(pageQuery.data?.data ?? [])].sort((a, b) =>
        a.ngay === b.ngay ? Number(a.id) - Number(b.id) : a.ngay < b.ngay ? -1 : 1
      ),
    [pageQuery.data]
  );
  const totalCount = pageQuery.data?.totalCount ?? 0;

  const handleOpenExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const all = await getThuChiQuyAll(listQuery);
      setExportRows(all);
      setShowExport(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportLoading(false);
    }
  }, [listQuery]);

  const renderCell = (colId: string, item: ThuChiQuyRow) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm tabular-nums">{formatDate(item.ngay)}</span>;
      case 'so_phieu':
        return <span className="font-mono text-sm">{item.so_phieu}</span>;
      case 'dien_giai':
        return <span className="text-sm line-clamp-2">{item.dien_giai}</span>;
      case 'hang_muc':
        return (
          <span className="text-sm text-muted-foreground">
            {item.ref_ten_hang_muc || item.ten_hang_muc || '—'}
          </span>
        );
      case 'thu':
        return (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {item.thu > 0 ? money(item.thu) : ''}
          </span>
        );
      case 'chi':
        return (
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {item.chi > 0 ? money(item.chi) : ''}
          </span>
        );
      case 'ton_quy':
        return (
          <span
            className={`text-sm font-bold tabular-nums ${item.ton_quy < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}
          >
            {money(item.ton_quy)}
          </span>
        );
      case 'so_chung_tu':
        return <span className="text-xs text-muted-foreground">{item.so_chung_tu || '—'}</span>;
      case 'ghi_chu':
        return <span className="text-xs text-muted-foreground line-clamp-2">{item.ghi_chu || '—'}</span>;
      case 'chi_nhanh':
        return (
          <span className="text-xs text-muted-foreground">
            {item.ref_ten_chi_nhanh || item.ten_chi_nhanh || '—'}
          </span>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: ThuChiQuyRow) => (
    <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">{item.dien_giai}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(item.ngay)} · {item.so_phieu}
          </p>
        </div>
        <span
          className={`text-sm font-semibold tabular-nums shrink-0 ${item.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {item.loai === 'thu' ? '+' : '−'}
          {money(item.so_tien)}
        </span>
      </div>
      <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-border text-xs">
        <span className="text-muted-foreground">{t('thuChiQuy.store.tonQuyCol')}</span>
        <span className="font-bold tabular-nums">{money(item.ton_quy)}</span>
      </div>
    </div>
  );

  const exportColumns = useMemo(
    () => [
      { key: 'ngay', label: t('thuChiQuy.store.ngayCol') },
      { key: 'so_phieu', label: t('thuChiQuy.store.soPhieuCol') },
      { key: 'dien_giai', label: t('thuChiQuy.store.dienGiaiCol') },
      { key: 'hang_muc', label: t('thuChiQuy.store.hangMucCol') },
      { key: 'thu', label: t('thuChiQuy.store.thuCol') },
      { key: 'chi', label: t('thuChiQuy.store.chiCol') },
      { key: 'ton_quy', label: t('thuChiQuy.store.tonQuyCol') },
      { key: 'so_chung_tu', label: t('thuChiQuy.store.soChungTuCol') },
      { key: 'ghi_chu', label: t('thuChiQuy.store.ghiChuCol') },
      { key: 'chi_nhanh', label: t('thuChiQuy.store.chiNhanhCol') },
    ],
    [t]
  );

  const exportData = useMemo(
    () =>
      [...exportRows]
        .sort((a, b) => (a.ngay === b.ngay ? Number(a.id) - Number(b.id) : a.ngay < b.ngay ? -1 : 1))
        .map((r) => ({
          ngay: formatDate(r.ngay),
          so_phieu: r.so_phieu,
          dien_giai: r.dien_giai,
          hang_muc: r.ref_ten_hang_muc || r.ten_hang_muc || '',
          thu: r.thu || '',
          chi: r.chi || '',
          ton_quy: r.ton_quy,
          so_chung_tu: r.so_chung_tu || '',
          ghi_chu: r.ghi_chu || '',
          chi_nhanh: r.ref_ten_chi_nhanh || r.ten_chi_nhanh || '',
        })),
    [exportRows]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ThongKeToolbar
        branches={allowedBranches.map((b) => ({ id: String(b.id), ten_chi_nhanh: b.ten_chi_nhanh }))}
        allowAllBranches={viewScope.viewAll}
        value={filter}
        onChange={setFilter}
        hideLoai
        actions={<ImportExportButtons onExport={handleOpenExport} exportLoading={exportLoading} />}
      />

      {!filter.chiNhanhId && (
        <p className="px-3 pt-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Info size={13} />
          {t('thongKeQuy.traCuu.chonChiNhanhHint')}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <GenericTable
          data={rows}
          columns={columns.filter((c) => (filter.chiNhanhId ? true : c.id !== 'ton_quy'))}
          onResizeColumn={resizeColumn}
          isLoading={!pageQuery.data && pageQuery.isPending}
          isFetching={!!pageQuery.data && pageQuery.isFetching}
          isError={pageQuery.isError}
          onRetry={() => pageQuery.refetch()}
          loadingText={t('common.loading')}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRecordsOverride={totalCount}
          sort={sort}
          onSort={setSort}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          keyExtractor={(item) => item.id}
          emptyTitle={t('thongKeQuy.traCuu.empty')}
          emptyDescription={t('thongKeQuy.traCuu.emptyHint')}
        />
      </div>

      <LazyExportDialog
        open={showExport}
        onClose={() => {
          setShowExport(false);
          setExportRows([]);
        }}
        columns={exportColumns}
        data={exportData}
        paginatedData={exportData.filter((_, idx) => rows.some((r) => r.id === exportRows[idx]?.id))}
        fileName={t('thongKeQuy.traCuu.exportFileName')}
        sheetName={t('thuChiQuy.export.sheetName')}
        visibleColumnKeys={columns.filter((c) => c.visible).map((c) => c.id)}
      />
    </div>
  );
};

export default TraCuuTab;
