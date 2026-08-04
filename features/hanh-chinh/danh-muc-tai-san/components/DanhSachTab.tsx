import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useTaiSanList, useDeleteTaiSan, useUpdateTaiSanStatus, useUpdateTaiSan, useAllowedTaiSanIds } from '../hooks/use-danh-muc-tai-san';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel, exportToPDF } from '../../../../lib/utils';
import { taiSanToExportRow, TAI_SAN_EXPORT_FILENAME } from '../utils/export-danh-sach-tai-san';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import DanhSachTaiSanToolbar from './DanhSachTaiSanToolbar';
import TaiSanTable from './TaiSanTable';
import TaiSanDetail from './TaiSanDetail';
import TaiSanForm from './TaiSanForm';
import TaoPhieuForm from '../../cap-phat-thu-hoi/components/TaoPhieuForm';
import { useDeletePhieu } from '../../cap-phat-thu-hoi/hooks/use-cap-phat-thu-hoi';
import TaoPhieuBaoTriForm from '../../bao-tri-sua-chua/components/TaoPhieuBaoTriForm';
import { useDeletePhieuBaoTri } from '../../bao-tri-sua-chua/hooks/use-bao-tri-sua-chua';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useDanhSachTaiSanStore } from '../store/useDanhSachTaiSanStore';
import Combobox from '../../../../components/ui/Combobox';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import type { TaiSan } from '../core/types';

interface StatusComboboxForConfirmProps {
  initialValue: string;
  options: { value: string; label: string; subLabel?: string }[];
  selectionRef: React.MutableRefObject<string>;
  placeholder?: string;
}
const StatusComboboxForConfirm: React.FC<StatusComboboxForConfirmProps> = ({
  initialValue,
  options,
  selectionRef,
  placeholder,
}) => {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    selectionRef.current = value;
  }, [value, selectionRef]);
  return (
    <Combobox
      value={value}
      onChange={(v) => setValue(v != null ? String(v) : '')}
      options={options}
      placeholder={placeholder}
      searchable={false}
      renderOption={(option) => <span className="truncate">{option.label}</span>}
    />
  );
};

interface ImageInputForConfirmProps {
  initialValue: string;
  selectionRef: React.MutableRefObject<string>;
  label?: string;
  placeholder?: string;
  hint?: string;
}
const ImageInputForConfirm: React.FC<ImageInputForConfirmProps> = ({
  initialValue,
  selectionRef,
  label,
  placeholder,
  hint,
}) => {
  const [value, setValue] = useState<string | null>(initialValue || null);
  useEffect(() => {
    selectionRef.current = value ?? '';
  }, [value, selectionRef]);
  return (
    <SingleImageInput
      label={label}
      value={value}
      onChange={(v) => setValue(v)}
      placeholder={placeholder}
      hint={hint}
      shape="rounded"
      aspectRatio="1/1"
      maxSizeMB={3}
    />
  );
};
import type { TaiSanFormValues } from '../core/schema';
import type { DanhSachTaiSanFilters } from '../store/useDanhSachTaiSanStore';
import type { PhieuCapPhatThuHoi } from '../../cap-phat-thu-hoi/core/types';
import type { PhieuBaoTriSuaChua } from '../../bao-tri-sua-chua/core/types';

function taiSanToFormValues(a: TaiSan, overrideIdTrangThai?: string): TaiSanFormValues {
  return {
    ma_tai_san: a.ma_tai_san,
    ten_tai_san: a.ten_tai_san,
    id_nhom: a.id_nhom,
    id_noi_luu: a.id_noi_luu,
    id_trang_thai: overrideIdTrangThai ?? a.id_trang_thai,
    id_nhan_vien_dang_giu: a.id_nhan_vien_dang_giu ?? undefined,
    ngay_nhap: a.ngay_nhap,
    nguyen_gia: a.nguyen_gia ?? undefined,
    hinh_anh: a.hinh_anh ?? '',
    ghi_chu: a.ghi_chu ?? undefined,
  };
}

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = useDanhSachTaiSanStore((s) => s.searchTerm);
  const filters = useDanhSachTaiSanStore((s) => s.filters);
  const setFilter = useDanhSachTaiSanStore((s) => s.setFilter);
  const sort = useDanhSachTaiSanStore((s) => s.sort);
  const resetState = useDanhSachTaiSanStore((s) => s.resetState);
  const clearSelection = useDanhSachTaiSanStore((s) => s.clearSelection);
  const deleteMutation = useDeleteTaiSan();
  const statusMutation = useUpdateTaiSanStatus();
  const updateMutation = useUpdateTaiSan();
  const { data: assetStatuses = [] } = useAssetStatuses();
  const statusOptions = useMemo(
    () => assetStatuses.map((s) => ({ value: s.id, label: s.ten, subLabel: s.ma })),
    [assetStatuses]
  );
  const statusSelectionRef = useRef<string>('');
  const imageUrlRef = useRef<string>('');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiSan | null>(null);
  const [viewingItem, setViewingItem] = useState<TaiSan | null>(null);
  const [showPhieuForm, setShowPhieuForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuCapPhatThuHoi | null>(null);
  const [phieuFormDefaultTaiSanId, setPhieuFormDefaultTaiSanId] = useState<string | null>(null);
  const [showBaoTriForm, setShowBaoTriForm] = useState(false);
  const [editingPhieuBaoTri, setEditingPhieuBaoTri] = useState<PhieuBaoTriSuaChua | null>(null);

  const { data: list = [], isLoading, isError } = useTaiSanList();
  const allowedIds = useAllowedTaiSanIds();
  const baseList = useMemo(
    () => (allowedIds == null ? list : list.filter((ts) => allowedIds.has(ts.id))),
    [list, allowedIds]
  );
  const deletePhieuMutation = useDeletePhieu();
  const deletePhieuBaoTriMutation = useDeletePhieuBaoTri();

  const filterFn = useCallback(
    (item: TaiSan, term: string, f: DanhSachTaiSanFilters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch = Boolean(
        !term ||
        (item.ma_tai_san?.toLowerCase().includes(searchLower)) ||
        (item.ten_tai_san?.toLowerCase().includes(searchLower)) ||
        (item.ten_nhom?.toLowerCase().includes(searchLower)) ||
        (item.ten_noi_luu?.toLowerCase().includes(searchLower)) ||
        (item.ten_nhan_vien_dang_giu?.toLowerCase().includes(searchLower))
      );
      const matchesStatus =
        f.status.length === 0 ||
        (f.status.includes('Active') && item.trang_thai === 1) ||
        (f.status.includes('Inactive') && item.trang_thai === 0);
      const matchesNhom = f.id_nhom.length === 0 || Boolean(item.id_nhom && f.id_nhom.includes(item.id_nhom));
      const matchesNoiLuu = f.id_noi_luu.length === 0 || Boolean(item.id_noi_luu && f.id_noi_luu.includes(item.id_noi_luu));
      const matchesTrangThai = f.id_trang_thai.length === 0 || Boolean(item.id_trang_thai && f.id_trang_thai.includes(item.id_trang_thai));
      return matchesSearch && matchesStatus && matchesNhom && matchesNoiLuu && matchesTrangThai;
    },
    []
  );

  const filteredList = useListWithFilter(baseList, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof TaiSan] ?? '';
      const bVal = b[sort.column as keyof TaiSan] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ filter từ URL (khi mở từ "Xem tất cả" trong Detail Nơi lưu / Nhóm / Trạng thái)
  useEffect(() => {
    const idNoiLuu = searchParams.get('id_noi_luu');
    const idNhom = searchParams.get('id_nhom');
    const idTrangThai = searchParams.get('id_trang_thai');
    if (idNoiLuu) setFilter('id_noi_luu', [idNoiLuu]);
    if (idNhom) setFilter('id_nhom', [idNhom]);
    if (idTrangThai) setFilter('id_trang_thai', [idTrangThai]);
    if (idNoiLuu || idNhom || idTrangThai) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setFilter, setSearchParams]);

  const handleView = (item: TaiSan) => setViewingItem(item);
  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };
  const handleEdit = (item: TaiSan) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };
  const handleDelete = (id: string) => {
    confirm({
      title: t('danhSachTaiSan.deleteTitle'),
      message: t('danhSachTaiSan.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };
  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('danhSachTaiSan.bulkDeleteTitle'),
      message: t('danhSachTaiSan.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };
  const handleAddPhieu = useCallback((taiSan: TaiSan) => {
    setPhieuFormDefaultTaiSanId(taiSan.id);
    setEditingPhieu(null);
    setShowPhieuForm(true);
  }, []);
  const handleEditPhieu = useCallback((phieu: PhieuCapPhatThuHoi) => {
    setPhieuFormDefaultTaiSanId(null);
    setEditingPhieu(phieu);
    setShowPhieuForm(true);
  }, []);
  const handleDeletePhieu = useCallback(
    (phieu: PhieuCapPhatThuHoi) => {
      confirm({
        title: t('capPhatThuHoi.deleteTitle'),
        message: t('capPhatThuHoi.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => deletePhieuMutation.mutate([phieu.id]),
      });
    },
    [confirm, t, deletePhieuMutation]
  );
  const handleAddPhieuBaoTri = useCallback((taiSan: TaiSan) => {
    setPhieuFormDefaultTaiSanId(taiSan.id);
    setEditingPhieuBaoTri(null);
    setShowBaoTriForm(true);
  }, []);
  const handleEditPhieuBaoTri = useCallback((phieu: PhieuBaoTriSuaChua) => {
    setEditingPhieuBaoTri(phieu);
    setShowBaoTriForm(true);
  }, []);
  const handleDeletePhieuBaoTri = useCallback(
    (phieu: PhieuBaoTriSuaChua) => {
      confirm({
        title: t('baoTriSuaChua.deleteTitle'),
        message: t('baoTriSuaChua.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => deletePhieuBaoTriMutation.mutate([phieu.id]),
      });
    },
    [confirm, t, deletePhieuBaoTriMutation]
  );

  const handleStatusChange = useCallback(
    (item: TaiSan) => {
      statusSelectionRef.current = item.id_trang_thai;
      confirm({
        title: t('danhSachTaiSan.detail.changeStatusTitle'),
        message: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('danhSachTaiSan.detail.changeStatusMessage')}
            </p>
            <StatusComboboxForConfirm
              initialValue={item.id_trang_thai}
              options={statusOptions}
              selectionRef={statusSelectionRef}
              placeholder={t('danhSachTaiSan.detail.changeStatus')}
            />
          </div>
        ),
        variant: 'default',
        confirmText: t('common.save'),
        onConfirm: () => {
          const selectedIdTrangThai = statusSelectionRef.current;
          const data = taiSanToFormValues(item, selectedIdTrangThai);
          updateMutation.mutate(
            { id: item.id, data },
            {
              onSuccess: () => {
                const newTen = assetStatuses.find((s) => s.id === selectedIdTrangThai)?.ten;
                setViewingItem((prev) =>
                  prev?.id === item.id
                    ? { ...prev, id_trang_thai: selectedIdTrangThai, ten_trang_thai: newTen }
                    : prev
                );
              },
            }
          );
        },
      });
    },
    [confirm, t, statusOptions, assetStatuses, updateMutation]
  );

  const handleUpdateImage = useCallback(
    (item: TaiSan) => {
      imageUrlRef.current = item.hinh_anh ?? '';
      confirm({
        title: t('danhSachTaiSan.detail.updateImageTitle'),
        message: (
          <div className="min-w-[260px] sm:min-w-[320px]">
            <ImageInputForConfirm
              initialValue={item.hinh_anh ?? ''}
              selectionRef={imageUrlRef}
              label={t('danhSachTaiSan.form.hinhAnh')}
              placeholder={t('danhSachTaiSan.form.hinhAnhPlaceholder')}
              hint={t('danhSachTaiSan.form.hinhAnhHint')}
            />
          </div>
        ),
        variant: 'default',
        confirmText: t('common.save'),
        onConfirm: () => {
          const data = taiSanToFormValues(item);
          data.hinh_anh = imageUrlRef.current ?? '';
          updateMutation.mutate(
            { id: item.id, data },
            {
              onSuccess: () => {
                setViewingItem((prev) =>
                  prev?.id === item.id ? { ...prev, hinh_anh: data.hinh_anh || null } : prev
                );
              },
            }
          );
        },
      });
    },
    [confirm, t, updateMutation]
  );

  const handleUpdateGhiChu = useCallback(
    (ts: TaiSan, ghiChu: string) => {
      const payload = { ...taiSanToFormValues(ts), ghi_chu: ghiChu || undefined };
      updateMutation.mutate(
        { id: ts.id, data: payload },
        { onSuccess: (updated) => setViewingItem(updated) }
      );
    },
    [updateMutation]
  );

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('danhSachTaiSan.statusChangeTitle'),
      message: t('danhSachTaiSan.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'default',
      confirmText: t('common.confirm'),
      onConfirm: () => {
        statusMutation.mutate({ ids, status }, {
          onSuccess: () => clearSelection(),
        });
      },
    });
  };

  if (isError) {
    return (
      <p className="text-sm text-destructive p-4">
        {t('common.error') || 'Có lỗi khi tải dữ liệu.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DanhSachTaiSanToolbar
          items={baseList}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          onExportExcel={() => {
            const rows = sortedList.map(taiSanToExportRow);
            exportToExcel(rows, TAI_SAN_EXPORT_FILENAME);
          }}
          onExportPDF={() => {
            const rows = sortedList.map(taiSanToExportRow);
            exportToPDF(rows, TAI_SAN_EXPORT_FILENAME, undefined);
          }}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0">
          <TaiSanTable
            data={sortedList}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <TaiSanDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions
            canUpdate={canUpdate}
            canDelete={canDelete}
            onAddPhieu={handleAddPhieu}
            onEditPhieu={handleEditPhieu}
            onDeletePhieu={handleDeletePhieu}
            onEditPhieuBaoTri={handleEditPhieuBaoTri}
            onDeletePhieuBaoTri={handleDeletePhieuBaoTri}
            onAddPhieuBaoTri={handleAddPhieuBaoTri}
            onStatusChange={handleStatusChange}
            onUpdateImage={handleUpdateImage}
            onUpdateGhiChu={handleUpdateGhiChu}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPhieuForm && (
          <TaoPhieuForm
            key={editingPhieu?.id ?? 'create'}
            onClose={() => {
              setShowPhieuForm(false);
              setEditingPhieu(null);
              setPhieuFormDefaultTaiSanId(null);
            }}
            defaultTaiSanId={phieuFormDefaultTaiSanId ?? undefined}
            initialData={editingPhieu ?? undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBaoTriForm && (
          <TaoPhieuBaoTriForm
            key={editingPhieuBaoTri?.id ?? 'create'}
            onClose={() => {
              setShowBaoTriForm(false);
              setEditingPhieuBaoTri(null);
              setPhieuFormDefaultTaiSanId(null);
            }}
            defaultTaiSanId={phieuFormDefaultTaiSanId ?? undefined}
            initialData={editingPhieuBaoTri ?? undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <TaiSanForm
            initialData={editingItem}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
