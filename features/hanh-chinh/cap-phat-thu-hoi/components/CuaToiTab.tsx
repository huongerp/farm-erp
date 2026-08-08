import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePhieuList, usePhieuById, useDeletePhieu } from '../hooks/use-cap-phat-thu-hoi';
import { useCpthListImportExport } from '../hooks/use-cpth-list-import-export';
import { getPhieuById } from '../services/cap-phat-thu-hoi-service';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuCapPhatThuHoi } from '../core/types';

const CuaToiTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const currentUserId = user?.id ?? '';
  const { searchTerm, filters, sort, resetState, clearSelection } = useCapPhatThuHoiStore();
  const { data: list = [], isLoading } = usePhieuList({
    filter: 'mine',
    id_nguoi: currentUserId,
  });
  const deleteMutation = useDeletePhieu();
  const [detailItem, setDetailItem] = useState<PhieuCapPhatThuHoi | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuCapPhatThuHoi | null>(null);
  /** Id phiếu đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail; từ list thì về list */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return list.filter((p) => {
      if (q) {
        const matchSearch =
          p.ma_phieu.toLowerCase().includes(q) ||
          (p.ten_nguoi_thuc_hien && p.ten_nguoi_thuc_hien.toLowerCase().includes(q)) ||
          (p.ten_nguoi_giu_sau && p.ten_nguoi_giu_sau.toLowerCase().includes(q)) ||
          (p.ten_nguoi_giu_truoc && p.ten_nguoi_giu_truoc.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      if (filters.loai_phieu.length > 0 && !filters.loai_phieu.includes(p.loai_phieu)) return false;
      if (filters.dateFrom && p.ngay_thuc_hien < filters.dateFrom) return false;
      if (filters.dateTo && p.ngay_thuc_hien > filters.dateTo) return false;
      if (filters.id_nguoi_thuc_hien.length > 0 && !filters.id_nguoi_thuc_hien.includes(p.id_nguoi_thuc_hien)) return false;
      return true;
    });
  }, [list, filters, searchTerm]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof PhieuCapPhatThuHoi] ?? '';
      const bVal = b[sort.column as keyof PhieuCapPhatThuHoi] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

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
  } = useCpthListImportExport(sortedList);

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
          items={list}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          onImport={canCreate ? () => setShowImport(true) : undefined}
          onExport={handleExport}
          showAdd={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <PhieuTable
            data={sortedList}
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
              const fresh = sortedList.find((p) => p.id === itemToRestore.id) ?? itemToRestore;
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
