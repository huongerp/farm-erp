import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';
import { getLanguage } from '../../../../lib/utils';
import type { ThietBi } from '../core/types';
import type { LichBaoDuongRow, ThietBiRow } from '../core/list-types';
import { useBaoDuongTheoFarm, useDeleteThietBi, useTaiSanRef } from '../hooks/use-bao-duong-thiet-bi';
import { THIET_BI_COLUMNS, useThietBiStore } from '../store/useBaoDuongThietBiStore';
import ThietBiToolbar from './ThietBiToolbar';
import ThietBiList from './ThietBiList';
import ThietBiDrawer from './ThietBiDrawer';
import ThietBiFormDrawer from './ThietBiFormDrawer';
import SaoChepFarmDialog from './SaoChepFarmDialog';

interface Props {
  /** Farm đang xem — chỉ hiện thiết bị của farm này */
  farmId: string | null;
  onGhiNhan: (row: LichBaoDuongRow) => void;
}

/** Tab "Thiết bị": danh sách + drawer chi tiết (việc + lịch sử) + form thêm/sửa + sao chép từ farm khác. */
const ThietBiTab: React.FC<Props> = ({ farmId, onGhiNhan }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const { thietBiQuery, thietBi, tatCaThietBi } = useBaoDuongTheoFarm(farmId);
  const { data: taiSanList = [] } = useTaiSanRef();
  const deleteMutation = useDeleteThietBi();

  const [chiTietId, setChiTietId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formTb, setFormTb] = useState<ThietBi | null>(null);
  const [saoChepOpen, setSaoChepOpen] = useState(false);

  const {
    searchTerm,
    sort,
    setSort,
    resetState,
    selectedIds,
    pagination,
    setPage,
    setPageSize,
    columns,
    resizeColumn,
    toggleSelection,
    toggleAllSelection,
  } = useThietBiStore();

  useEffect(() => () => resetState(), [resetState]);

  const taiSanById = useMemo(() => new Map(taiSanList.map((x) => [x.id, x])), [taiSanList]);
  const rows = useMemo<ThietBiRow[]>(
    () =>
      thietBi.map((tb) => {
        const ts = tb.id_tai_san ? taiSanById.get(tb.id_tai_san) : null;
        return { ...tb, tai_san_ma: ts?.ma_tai_san ?? null, tai_san_ten: ts?.ten_tai_san ?? null };
      }),
    [thietBi, taiSanById]
  );

  const khopTimKiem = useMemo(
    () =>
      createListSearchMatcher<ThietBiRow>({
        columns: THIET_BI_COLUMNS,
        getCellText: (colId, item) => {
          switch (colId) {
            case 'tai_san':
              return [item.tai_san_ma, item.tai_san_ten].filter(Boolean).join(' ');
            case 'dang_dung':
              return item.dang_dung ? t('baoDuongThietBi.thietBi.dangDung') : t('baoDuongThietBi.thietBi.ngungDung');
            default:
              return '';
          }
        },
      }),
    [t]
  );

  const filtered = useMemo(
    () => rows.filter((item) => khopTimKiem(item, searchTerm)),
    [rows, searchTerm, khopTimKiem]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort.column && sort.direction) {
      const col = sort.column;
      const giaTri = (item: ThietBiRow): string | number => {
        if (col === 'tai_san') return item.tai_san_ma ?? '';
        if (col === 'dang_dung') return item.dang_dung ? 1 : 0;
        const v = (item as unknown as Record<string, unknown>)[col];
        return v == null ? '' : (v as string | number);
      };
      arr.sort((a, b) => {
        const av = giaTri(a);
        const bv = giaTri(b);
        const cmp =
          typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), getLanguage());
        return sort.direction === 'desc' ? -cmp : cmp;
      });
    }
    return arr;
  }, [filtered, sort]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const pageData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return sorted.slice(start, start + pagination.pageSize);
  }, [sorted, pagination.page, pagination.pageSize]);

  const openAdd = () => {
    setFormTb(null);
    setFormOpen(true);
  };

  const openEdit = (tb: ThietBi) => {
    setFormTb(tb);
    setFormOpen(true);
  };

  const openView = (item: ThietBiRow) => setChiTietId(item.id);

  const closeForm = () => {
    setFormOpen(false);
    setFormTb(null);
  };

  const handleDelete = (tb: ThietBi) => {
    confirm({
      title: t('baoDuongThietBi.thietBi.xoaTitle'),
      message: t('baoDuongThietBi.thietBi.xoaMessage', { ten: tb.ten }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(tb.id);
        setChiTietId(null);
      },
    });
  };

  // Sửa từ drawer chi tiết: đóng drawer, mở form (sau lưu list tự cập nhật).
  const editTuDrawer = (tb: ThietBi) => {
    setChiTietId(null);
    openEdit(tb);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ThietBiToolbar
        selectedCount={selectedIds.size}
        onAdd={openAdd}
        canUpdate={canUpdate}
        onSaoChep={canCreate && farmId ? () => setSaoChepOpen(true) : undefined}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <ThietBiList
          data={pageData}
          columns={columns}
          isLoading={thietBiQuery.isPending && rows.length === 0}
          isFetching={thietBiQuery.isFetching}
          isError={thietBiQuery.isError}
          onRetry={() => thietBiQuery.refetch()}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRecordsOverride={total}
          sort={sort}
          onSort={setSort}
          onResizeColumn={resizeColumn}
          onView={openView}
          onEdit={canUpdate ? openEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      </div>

      <AnimatePresence>
        {chiTietId && (
          <ThietBiDrawer
            id={chiTietId}
            onClose={() => setChiTietId(null)}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={editTuDrawer}
            onDelete={handleDelete}
            onGhiNhan={onGhiNhan}
          />
        )}
        {formOpen && <ThietBiFormDrawer initialData={formTb} onClose={closeForm} />}
        {saoChepOpen && farmId && (
          <SaoChepFarmDialog farmDich={farmId} tatCaThietBi={tatCaThietBi} onClose={() => setSaoChepOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThietBiTab;
