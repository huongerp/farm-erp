import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePhieuDeXuatVatTuChiTietAll, usePhieuDeXuatVatTuById, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { getPhieuDeXuatVatTuById } from '../services/phieu-de-xuat-vat-tu-service';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import ChiTietRowDetail from './ChiTietRowDetail';
import ChiTietRowEditModal, { type ChiTietRowEditPayload } from './ChiTietRowEditModal';
import { cn } from '../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

function phieuToFormValues(phieu: PhieuDeXuatVatTu): PhieuDeXuatVatTuFormValues {
  return {
    so_phieu: phieu.so_phieu,
    ngay: phieu.ngay,
    ngay_can: phieu.ngay_can,
    id_noi_de_xuat: phieu.id_noi_de_xuat,
    id_nguoi_de_xuat: phieu.id_nguoi_de_xuat,
    id_nguoi_duyet: phieu.id_nguoi_duyet ?? undefined,
    ghi_chu: phieu.ghi_chu ?? '',
    trang_thai: phieu.trang_thai,
    chi_tiet: (phieu.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: ct.so_luong,
      thong_so: ct.thong_so ?? '',
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}

const ChiTietTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: rows = [], isLoading } = usePhieuDeXuatVatTuChiTietAll();
  const [viewingRow, setViewingRow] = useState<PhieuDeXuatVatTuChiTietRow | null>(null);
  const [editingRow, setEditingRow] = useState<PhieuDeXuatVatTuChiTietRow | null>(null);

  const { data: phieuForEdit } = usePhieuDeXuatVatTuById(editingRow?.id_phieu_de_xuat_vat_tu);
  const updateMutation = useUpdatePhieuDeXuatVatTu();

  const {
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
    resetState,
  } = useChiTietTabStore();

  useEffect(() => () => resetState(), [resetState]);

  const handleSaveEdit = useCallback(
    (payload: ChiTietRowEditPayload) => {
      if (!editingRow || !phieuForEdit) return;
      const data: PhieuDeXuatVatTuFormValues = {
        ...phieuToFormValues(phieuForEdit),
        chi_tiet: (phieuForEdit.chi_tiet ?? []).map((ct) =>
          ct.id === editingRow.id
            ? { id_hang_hoa: ct.id_hang_hoa, so_luong: payload.so_luong, thong_so: payload.thong_so, ghi_chu: payload.ghi_chu }
            : { id_hang_hoa: ct.id_hang_hoa, so_luong: ct.so_luong, thong_so: ct.thong_so ?? '', ghi_chu: ct.ghi_chu ?? '' }
        ),
      };
      updateMutation.mutate(
        { id: phieuForEdit.id, data },
        { onSuccess: () => setEditingRow(null) }
      );
    },
    [editingRow, phieuForEdit, updateMutation]
  );

  const handleDelete = useCallback(
    (row: PhieuDeXuatVatTuChiTietRow) => {
      confirm({
        title: t('phieuDeXuatVatTu.deleteTitle'),
        message: t('phieuDeXuatVatTu.chiTietTab.deleteLineConfirm'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          const phieu = await getPhieuDeXuatVatTuById(row.id_phieu_de_xuat_vat_tu);
          if (!phieu || !phieu.chi_tiet?.length) return;
          if (phieu.chi_tiet.length <= 1) {
            toast.error(t('phieuDeXuatVatTu.chiTietTab.lastLineCannotDelete'));
            return;
          }
          const data: PhieuDeXuatVatTuFormValues = {
            ...phieuToFormValues(phieu),
            chi_tiet: phieu.chi_tiet.filter((ct) => ct.id !== row.id).map((ct) => ({
              id_hang_hoa: ct.id_hang_hoa,
              so_luong: ct.so_luong,
              thong_so: ct.thong_so ?? '',
              ghi_chu: ct.ghi_chu ?? '',
            })),
          };
          updateMutation.mutate(
            { id: phieu.id, data },
            {
              onSuccess: () => {
                if (viewingRow?.id === row.id) setViewingRow(null);
              },
            }
          );
        },
      });
    },
    [confirm, t, updateMutation, viewingRow?.id]
  );

  const sortedRows = useMemo(() => {
    if (!sort.column || !sort.direction) return [...rows];
    const key = sort.column as keyof PhieuDeXuatVatTuChiTietRow;
    return [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      const aVal = va == null ? '' : String(va);
      const bVal = vb == null ? '' : String(vb);
      if (sort.direction === 'asc') return aVal.localeCompare(bVal, undefined, { numeric: true });
      return bVal.localeCompare(aVal, undefined, { numeric: true });
    });
  }, [rows, sort.column, sort.direction]);

  const renderStatusBadge = useCallback((status: string | null) => {
    if (status == null) return <span className="text-muted-foreground">—</span>;
    return (
      <span
        className={cn(
          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
          status === 'Đã duyệt' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
          status === 'Chờ duyệt' && 'bg-amber-500/10 text-amber-700 border-amber-500/20',
          status === 'Không duyệt' && 'bg-rose-500/10 text-rose-700 border-rose-500/20',
          status !== 'Đã duyệt' && status !== 'Chờ duyệt' && status !== 'Không duyệt' && 'bg-muted text-muted-foreground border-border'
        )}
      >
        {status}
      </span>
    );
  }, []);

  const renderCell = useCallback(
    (colId: string, item: PhieuDeXuatVatTuChiTietRow) => {
      switch (colId) {
        case 'so_phieu':
          return (
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.so_phieu ?? '—'}
            </span>
          );
        case 'ngay':
        case 'ngay_can':
          return <span className="text-sm text-muted-foreground">{item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—'}</span>;
        case 'ten_noi_de_xuat':
        case 'ten_nguoi_de_xuat':
        case 'ten_nguoi_duyet':
          return <span className="text-sm">{String(item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—')}</span>;
        case 'trang_thai_phieu':
          return renderStatusBadge(item.trang_thai_phieu);
        case 'ma_hang':
          return <span className="text-sm font-mono">{item.ma_hang ?? '—'}</span>;
        case 'ten_hang':
          return <span className="text-sm line-clamp-2">{item.ten_hang ?? '—'}</span>;
        case 'so_luong':
          return <span className="text-sm text-right tabular-nums">{Number(item.so_luong).toLocaleString()}</span>;
        case 'don_vi_tinh':
          return <span className="text-sm text-muted-foreground">{item.don_vi_tinh ?? '—'}</span>;
        case 'thong_so':
          return (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[140px]">{item.thong_so ?? '—'}</span>
          );
        case 'ghi_chu':
          return (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[160px]">{item.ghi_chu ?? '—'}</span>
          );
        case 'actions':
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip content={t('common.view')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRow(item);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.view')}
                >
                  <FileText size={16} />
                </button>
              </Tooltip>
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRow(item);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.edit')}
                >
                  <Edit size={16} />
                </button>
              </Tooltip>
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            </div>
          );
        default:
          return <span className="text-sm">{String(item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—')}</span>;
      }
    },
    [renderStatusBadge, t, handleDelete]
  );

  const handleRowClick = useCallback((item: PhieuDeXuatVatTuChiTietRow) => setViewingRow(item), []);

  const renderMobileCard = useCallback(
    (item: PhieuDeXuatVatTuChiTietRow, isSelected: boolean) => (
      <div
        className={cn('p-3 rounded-lg border cursor-pointer', isSelected ? 'border-primary bg-primary/5' : 'border-border')}
        onClick={() => setViewingRow(item)}
        onKeyDown={(e) => e.key === 'Enter' && setViewingRow(item)}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="font-mono text-sm font-medium">{item.so_phieu ?? '—'}</span>
          {renderStatusBadge(item.trang_thai_phieu)}
        </div>
        <p className="text-sm text-foreground mt-0.5">{item.ma_hang ?? item.ten_hang ?? '—'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {Number(item.so_luong).toLocaleString()} {item.don_vi_tinh ?? ''} · {item.ten_noi_de_xuat ?? '—'}
        </p>
      </div>
    ),
    [renderStatusBadge]
  );

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ListPageSkeleton />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <EmptyState
          title={t('phieuDeXuatVatTu.chiTietTab.emptyTitle')}
          description={t('phieuDeXuatVatTu.chiTietTab.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <GenericTable<PhieuDeXuatVatTuChiTietRow>
          data={sortedRows}
          columns={columns}
          isLoading={false}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
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
          loadingText={t('phieuDeXuatVatTu.loading')}
          emptyTitle={t('phieuDeXuatVatTu.chiTietTab.emptyTitle')}
          emptyDescription={t('phieuDeXuatVatTu.chiTietTab.emptyDescription')}
        />
      </div>

      <ChiTietRowEditModal
        open={!!editingRow}
        initialData={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={handleSaveEdit}
      />

      <AnimatePresence>
        {viewingRow && (
          <ChiTietRowDetail
            data={viewingRow}
            onClose={() => setViewingRow(null)}
            onEdit={() => {
              setEditingRow(viewingRow);
              setViewingRow(null);
            }}
            onDelete={() => handleDelete(viewingRow)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChiTietTab;
