import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { usePhieuKhoList, usePhieuKhoById, useDeletePhieuKho, useDeletePhieuKhoMany } from '../hooks/use-phieu-kho';
import { usePhieuKhoViewScope } from '../hooks/use-phieu-kho-view-scope';
import { filterPhieuKhoListByViewScope } from '../utils/phieu-kho-view-scope-filter';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { LOAI_TAB_TO_DB } from '../core/types';
import type { PhieuKhoFilters } from '../store/usePhieuKhoStore';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { DoiTac } from '../../danh-sach-doi-tac/core/types';
import PhieuKhoToolbar from './PhieuKhoToolbar';
import PhieuKhoList from './PhieuKhoList';
import PhieuKhoForm from './PhieuKhoForm';
import PhieuKhoDetail from './PhieuKhoDetail';
import DanhSachKhoForm from '../../danh-sach-kho/components/danh-sach-kho-form';
import DanhSachHangHoaForm from '../../danh-sach-hang-hoa/components/DanhSachHangHoaForm';
import DoiTacForm from '../../danh-sach-doi-tac/components/DoiTacForm';
import { useNhomDoiTacList, useTagList, useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  mapPhieuKhoListRow,
  getExportColumnsPhieuKhoList,
  exportFileNamePhieuKhoTab,
} from '../utils/export-phieu-kho-danh-sach';

interface Props {
  loai: LoaiPhieuKhoTab;
}

function strFilterArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

const PhieuKhoTabContent: React.FC<Props> = ({ loai: loaiTab }) => {
  const loaiDb = LOAI_TAB_TO_DB[loaiTab];
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = usePhieuKhoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItem, setViewingItem] = useState<PhieuKho | null>(null);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showAddDoiTac, setShowAddDoiTac] = useState<'nha_cung_cap' | 'khach_hang' | null>(null);
  const [showExport, setShowExport] = useState(false);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: HangHoa | null) => void>(null);
  const addDoiTacResolveRef = useRef<(d: DoiTac | null) => void>(null);

  const { data: allList = [], isLoading } = usePhieuKhoList();
  const { data: khoList = [] } = useKhoList();
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const { data: doiTacListAll = [] } = useDoiTacList();
  const viewScope = usePhieuKhoViewScope();
  const nextThuTuDoiTac = useMemo(() => {
    const list = showAddDoiTac ? doiTacListAll.filter((d) => d.loai_doi_tac === showAddDoiTac) : [];
    return list.length === 0 ? 1 : Math.max(...list.map((d) => d.thu_tu ?? 0)) + 1;
  }, [doiTacListAll, showAddDoiTac]);
  const { data: viewingPhieuFull } = usePhieuKhoById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKhoById(editingItem?.id);
  const deleteMutation = useDeletePhieuKho();
  const deleteManyMutation = useDeletePhieuKhoMany();

  const viewableList = useMemo(
    () => filterPhieuKhoListByViewScope(allList, viewScope, khoList),
    [allList, khoList, viewScope]
  );

  const listByLoai = useMemo(
    () => viewableList.filter((p) => p.loai === loaiDb),
    [viewableList, loaiDb]
  );

  const dateRangeStr = useMemo(() => {
    const dp = typeof filters.datePreset === 'string' ? filters.datePreset : 'all';
    const cf = typeof filters.customDateFrom === 'string' ? filters.customDateFrom : '';
    const ce = typeof filters.customDateEnd === 'string' ? filters.customDateEnd : '';
    const range = getDateRangeFromPreset(
      dp as DateRangePresetId,
      cf ? new Date(cf) : undefined,
      ce ? new Date(ce) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const filterFn = useCallback(
    (item: PhieuKho, term: string, f: PhieuKhoFilters, range: { start: string; end: string }) => {
      const st = strFilterArray(f.status);
      const kIds = strFilterArray(f.khoIds);
      const kDen = strFilterArray(f.khoDenIds);
      const nt = strFilterArray(f.nguoiTaoIds);
      const nd = strFilterArray(f.nguoiDuyetIds);
      const dt = strFilterArray(f.doiTacIds);

      const searchLower = term.toLowerCase();
      const soPhieu = String(item.so_phieu ?? '').toLowerCase();
      const matchesSearch =
        !term ||
        soPhieu.includes(searchLower) ||
        (item.ten_kho?.toLowerCase().includes(searchLower) ?? false) ||
        (item.ten_kho_den?.toLowerCase().includes(searchLower) ?? false) ||
        (item.mo_ta?.toLowerCase().includes(searchLower) ?? false) ||
        (typeof item.ten_nguoi_tao === 'string' && item.ten_nguoi_tao.toLowerCase().includes(searchLower)) ||
        (typeof item.ten_nguoi_duyet === 'string' && item.ten_nguoi_duyet.toLowerCase().includes(searchLower)) ||
        (loaiTab === 'nhap' &&
          typeof item.ten_nha_cung_cap === 'string' &&
          item.ten_nha_cung_cap.toLowerCase().includes(searchLower)) ||
        (loaiTab === 'xuat' &&
          typeof item.ten_khach_hang === 'string' &&
          item.ten_khach_hang.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 'Chờ duyệt' ? 'Pending' : item.trang_thai === 'Đã duyệt' ? 'Approved' : 'Rejected';
      const matchesStatus = st.length === 0 || st.includes(statusKey);
      const matchesKho = kIds.length === 0 || kIds.includes(item.kho_id);
      const matchesKhoDen = kDen.length === 0 || (item.kho_den_id != null && kDen.includes(item.kho_den_id));
      const rowDate = item.ngay || '';
      const matchesDate = rowDate >= range.start && rowDate <= range.end;
      const matchesNguoiTao =
        nt.length === 0 || (item.nguoi_tao_id != null && nt.includes(String(item.nguoi_tao_id)));
      const matchesNguoiDuyet =
        nd.length === 0 || (item.id_nguoi_duyet != null && nd.includes(String(item.id_nguoi_duyet)));
      let matchesDoiTac = true;
      if (dt.length > 0) {
        if (loaiTab === 'nhap') {
          matchesDoiTac = item.id_nha_cung_cap != null && dt.includes(item.id_nha_cung_cap);
        } else if (loaiTab === 'xuat') {
          matchesDoiTac = item.id_khach_hang != null && dt.includes(item.id_khach_hang);
        } else {
          matchesDoiTac = false;
        }
      }
      return (
        matchesSearch &&
        matchesStatus &&
        matchesKho &&
        matchesKhoDen &&
        matchesDate &&
        matchesNguoiTao &&
        matchesNguoiDuyet &&
        matchesDoiTac
      );
    },
    [loaiTab]
  );

  const filteredList = useMemo(
    () => listByLoai.filter((item) => filterFn(item, searchTerm, filters, dateRangeStr)),
    [listByLoai, searchTerm, filters, dateRangeStr, filterFn]
  );

  const exportColumnsPhieuKho = useMemo(() => getExportColumnsPhieuKhoList(t), [t]);
  const exportMapPhieuKho = useCallback((item: PhieuKho) => mapPhieuKhoListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredList,
      isOpen: showExport,
      mapFn: exportMapPhieuKho,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const handleExport = useCallback(() => {
    if (filteredList.length === 0) {
      toast.warning(t('phieuKho.noExportData'));
      return;
    }
    setShowExport(true);
  }, [filteredList.length, t]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = viewableList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [viewableList, viewingItem?.id]);

  const handleEdit = (item: PhieuKho) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setShowForm(true);
  };

  const handleCopy = (item: PhieuKho) => {
    const copy: PhieuKho = {
      ...item,
      id: '',
      so_phieu: '',
      trang_thai: 'Chờ duyệt',
      trao_doi: undefined,
      id_nguoi_duyet: undefined,
      ten_nguoi_duyet: undefined,
      nguoi_tao_id: undefined,
      ten_nguoi_tao: undefined,
      ngay: new Date().toISOString().slice(0, 10),
    };
    setEditingItem(copy);
    setIsCopyMode(true);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PhieuKhoToolbar
        data={listByLoai}
        loai={loaiTab}
        khoList={khoList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuKhoList
          data={filteredList}
          loai={loaiTab}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoForm
            loai={loaiTab}
            khoList={khoList}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setIsCopyMode(false);
            }}
            onRequestAddKho={
              () =>
                new Promise<Kho | null>((resolve) => {
                  addKhoResolveRef.current = resolve;
                  setShowAddKho(true);
                })
            }
            onRequestAddHangHoa={
              () =>
                new Promise<HangHoa | null>((resolve) => {
                  addHangHoaResolveRef.current = resolve;
                  setShowAddHangHoa(true);
                })
            }
            onRequestAddNcc={
              loaiTab === 'nhap'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('nha_cung_cap');
                    })
                : undefined
            }
            onRequestAddKh={
              loaiTab === 'xuat'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('khach_hang');
                    })
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddKho && (
          <DanhSachKhoForm
            initialData={null}
            onClose={() => {
              setShowAddKho(false);
              addKhoResolveRef.current?.(null);
              addKhoResolveRef.current = null;
            }}
            onSuccessCreate={(kho) => {
              addKhoResolveRef.current?.(kho);
              setShowAddKho(false);
              addKhoResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddHangHoa && (
          <DanhSachHangHoaForm
            initialData={null}
            onClose={() => {
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current?.(null);
              addHangHoaResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addHangHoaResolveRef.current?.(item);
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddDoiTac && (
          <DoiTacForm
            initialData={null}
            loaiDoiTac={showAddDoiTac}
            nhomList={nhomList}
            tagList={tagList}
            defaultThuTu={nextThuTuDoiTac}
            onClose={() => {
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current?.(null);
              addDoiTacResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addDoiTacResolveRef.current?.(item);
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoDetail
            data={viewingPhieuFull ?? viewingItem}
            loai={loaiTab}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onCopy={canCreate ? handleCopy : undefined}
            canApprove={canApprove}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsPhieuKho}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNamePhieuKhoTab(loaiTab)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhieuKhoTabContent;
