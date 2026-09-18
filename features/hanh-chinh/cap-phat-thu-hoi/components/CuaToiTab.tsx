import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CapPhatThuHoiListServerQuery } from '../services/cap-phat-thu-hoi-list-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import ImportDialog from '../../../../components/shared/LazyImportDialog';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import CapPhatThuHoiToolbar from './CapPhatThuHoiToolbar';
import PhieuTable from './PhieuTable';
import PhieuDetail from './PhieuDetail';
import TaoPhieuForm from './TaoPhieuForm';
import { usePhieuCapPhatPage, usePhieuById, useDeletePhieu } from '../hooks/use-cap-phat-thu-hoi';
import { useCpthListImportExport } from '../hooks/use-cpth-list-import-export';
import { getPhieuById } from '../services/cap-phat-thu-hoi-service';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuCapPhatThuHoi } from '../core/types';


const CuaToiTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const currentUserId = user?.id ?? '';
  // Phân trang/sắp xếp do PhieuTable đọc thẳng từ store; ở đây chỉ cần giá trị để dựng query.
  const { searchTerm, filters, sort, pagination, resetState, clearSelection } = useCapPhatThuHoiStore();
  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tab này tải toàn bộ bảng phiếu. */
  const listServerQuery: CapPhatThuHoiListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      loaiPhieu: filters.loai_phieu ?? [],
      ngayFrom: filters.dateFrom ?? '',
      ngayTo: filters.dateTo ?? '',
      idNguoiThucHien: filters.id_nguoi_thuc_hien ?? [],
      idNguoiCuaToi: currentUserId || null,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, currentUserId]
  );

  const pageQuery = usePhieuCapPhatPage(listServerQuery, Boolean(currentUserId));
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;
  const deleteMutation = useDeletePhieu();
  const [detailItem, setDetailItem] = useState<PhieuCapPhatThuHoi | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuCapPhatThuHoi | null>(null);
  /** Id phiếu đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail; từ list thì về list */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const {
    showImport,
    setShowImport,
    showExport,
    setShowExport,
    IMPORT_COLUMNS,
    importSampleRows,
    importReferenceSheets,
    exportColumns,
    exportData,
    paginatedData,
    selectedData,
    handleExport,
    handleImportData,
    templateFileName,
    exportFileName,
  } = useCpthListImportExport(pageList);

  const handleAdd = useCallback(() => {
    setEditingPhieu(null);
    setShowForm(true);
  }, []);
  const { data: detailFull } = usePhieuById(detailItem?.id ?? null);
  const detailData = detailFull ?? detailItem;

  /** Click dòng → xem detail (fetch chi tiết) */
  const handleView = useCallback((item: PhieuCapPhatThuHoi) => {
    setDetailItem(item);
    setEditingPhieu(null);
    setShowForm(false);
  }, []);
  /** Nút Sửa (từ list hoặc từ detail) → mở form sửa; ghi nhớ nguồn để Hủy quay đúng (list vs detail) */
  const handleEdit = useCallback(async (item: PhieuCapPhatThuHoi) => {
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
    } else {
      setOpenedFormFromDetailId(null);
    }
    setDetailItem(null);
    // Row từ danh sách thiếu chi_tiet (tài sản cấp phát/thu hồi) — tải bản đầy đủ,
    // tránh form hiện trống dòng chi tiết dù đã lưu (xem getPhieuById).
    try {
      const full = await getPhieuById(item.id);
      setEditingPhieu(full ?? item);
    } catch {
      setEditingPhieu(item);
    }
    setShowForm(true);
  }, [detailItem?.id]);
  /** Finish view: sau khi lưu form sửa thành công → đóng form và mở detail bản ghi vừa sửa */
  const handleSuccessAfterEdit = useCallback((item: PhieuCapPhatThuHoi) => {
    setShowForm(false);
    setEditingPhieu(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: PhieuCapPhatThuHoi) => {
      confirm({
        title: t('capPhatThuHoi.deleteTitle'),
        message: t('capPhatThuHoi.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => {
              if (detailItem?.id === item.id) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );
  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('capPhatThuHoi.bulkDeleteTitle'),
        message: t('capPhatThuHoi.bulkDeleteMessage', { count: ids.length }),
        variant: 'danger',
        confirmText: CONFIRM_DELETE_ALL(),
        onConfirm: () => {
          deleteMutation.mutate(ids, {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem, clearSelection]
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CapPhatThuHoiToolbar
          items={pageList}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          onImport={canCreate ? () => setShowImport(true) : undefined}
          onExport={handleExport}
          showAdd={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <PhieuTable
            data={pageList}
            totalRecordsOverride={totalCount}
            isFetching={isFetching}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </div>
      </div>
      {detailData && !showForm && (
        <PhieuDetail
          data={detailData}
          onClose={() => setDetailItem(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? () => handleDelete(detailData) : undefined}
        />
      )}
      {showForm && (
        <TaoPhieuForm
          key={editingPhieu?.id ?? 'create'}
          onClose={() => {
            const wasFromDetail = openedFormFromDetailId != null;
            const itemToRestore = editingPhieu;
            setShowForm(false);
            setEditingPhieu(null);
            setOpenedFormFromDetailId(null);
            if (wasFromDetail && itemToRestore) {
              const fresh = pageList.find((p) => p.id === itemToRestore.id) ?? itemToRestore;
              setDetailItem(fresh);
            }
          }}
          initialData={editingPhieu ?? undefined}
          onSuccessAfterEdit={handleSuccessAfterEdit}
        />
      )}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        columns={IMPORT_COLUMNS}
        onImport={handleImportData}
        templateFileName={templateFileName}
        sampleRows={importSampleRows}
        referenceSheets={importReferenceSheets}
      />
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportData}
        paginatedData={paginatedData}
        selectedData={selectedData}
        fileName={exportFileName}
      />
    </>
  );
};

export default CuaToiTab;
