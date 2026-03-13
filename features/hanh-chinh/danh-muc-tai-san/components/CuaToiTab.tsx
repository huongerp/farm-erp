import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Tag, Layers, MapPin } from 'lucide-react';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useTaiSanList, useDeleteTaiSan, useUpdateTaiSanStatus, useUpdateTaiSan } from '../hooks/use-danh-muc-tai-san';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DanhSachTaiSanToolbar from './DanhSachTaiSanToolbar';
import TaiSanTable from './TaiSanTable';
import TaiSanDetail from './TaiSanDetail';
import TaiSanForm from './TaiSanForm';
import TaoPhieuForm from '../../cap-phat-thu-hoi/components/TaoPhieuForm';
import { useDeletePhieu } from '../../cap-phat-thu-hoi/hooks/use-cap-phat-thu-hoi';
import TaoPhieuBaoTriForm from '../../bao-tri-sua-chua/components/TaoPhieuBaoTriForm';
import { useDeletePhieuBaoTri } from '../../bao-tri-sua-chua/hooks/use-bao-tri-sua-chua';
import { useDanhSachTaiSanStore } from '../store/useDanhSachTaiSanStore';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
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
    trang_thai: a.trang_thai,
  };
}

const CuaToiTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const currentUserId = user?.id ?? '';
  const isAdmin = user?.role === 'admin';
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useDanhSachTaiSanStore();
  const deleteMutation = useDeleteTaiSan();
  const statusMutation = useUpdateTaiSanStatus();
  const updateMutation = useUpdateTaiSan();
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active' },
      { label: t('common.inactiveStatus'), value: 'Inactive' },
    ],
    [t]
  );
  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma })),
    [groups]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const assetStatusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma })),
    [statuses]
  );
  const statusOptionsForSelect = useMemo(
    () => statuses.map((s) => ({ value: s.id, label: s.ten, subLabel: s.ma })),
    [statuses]
  );
  const statusSelectionRef = useRef<string>('');
  const imageUrlRef = useRef<string>('');
  const activeFilterCount =
    filters.status.length +
    filters.id_nhom.length +
    filters.id_noi_luu.length +
    filters.id_trang_thai.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_nhom', []);
    setFilter('id_noi_luu', []);
    setFilter('id_trang_thai', []);
  };
  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filters.status, onChange: (val: string[]) => setFilter('status', val) },
      { key: 'id_nhom', label: t('danhSachTaiSan.store.nhomCol'), icon: Layers, options: groupOptions, value: filters.id_nhom, onChange: (val: string[]) => setFilter('id_nhom', val) },
      { key: 'id_noi_luu', label: t('danhSachTaiSan.store.noiLuuCol'), icon: MapPin, options: locationOptions, value: filters.id_noi_luu, onChange: (val: string[]) => setFilter('id_noi_luu', val) },
      { key: 'id_trang_thai', label: t('danhSachTaiSan.store.trangThaiCol'), icon: Tag, options: assetStatusOptions, value: filters.id_trang_thai, onChange: (val: string[]) => setFilter('id_trang_thai', val) },
    ],
    [filters, statusOptions, groupOptions, locationOptions, assetStatusOptions, setFilter, t]
  );
  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={groupOptions}
        value={filters.id_nhom}
        onChange={(val) => setFilter('id_nhom', val)}
        placeholder={t('danhSachTaiSan.store.nhomCol')}
        icon={Layers}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={locationOptions}
        value={filters.id_noi_luu}
        onChange={(val) => setFilter('id_noi_luu', val)}
        placeholder={t('danhSachTaiSan.store.noiLuuCol')}
        icon={MapPin}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={assetStatusOptions}
        value={filters.id_trang_thai}
        onChange={(val) => setFilter('id_trang_thai', val)}
        placeholder={t('danhSachTaiSan.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiSan | null>(null);
  const [viewingItem, setViewingItem] = useState<TaiSan | null>(null);
  const [showPhieuForm, setShowPhieuForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuCapPhatThuHoi | null>(null);
  const [phieuFormDefaultTaiSanId, setPhieuFormDefaultTaiSanId] = useState<string | null>(null);
  const [showBaoTriForm, setShowBaoTriForm] = useState(false);
  const [editingPhieuBaoTri, setEditingPhieuBaoTri] = useState<PhieuBaoTriSuaChua | null>(null);

  const { data: list = [], isLoading, isError } = useTaiSanList();
  const deletePhieuMutation = useDeletePhieu();
  const deletePhieuBaoTriMutation = useDeletePhieuBaoTri();

  const myList = useMemo(
    () => list.filter((item) => item.id_nhan_vien_dang_giu === currentUserId),
    [list, currentUserId]
  );

  const filterFn = useCallback(
    (item: TaiSan, term: string, f: DanhSachTaiSanFilters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        (item.ma_tai_san?.toLowerCase().includes(searchLower)) ||
        (item.ten_tai_san?.toLowerCase().includes(searchLower)) ||
        (item.ten_nhom?.toLowerCase().includes(searchLower)) ||
        (item.ten_noi_luu?.toLowerCase().includes(searchLower));
      const matchesStatus =
        f.status.length === 0 ||
        (f.status.includes('Active') && item.trang_thai === 1) ||
        (f.status.includes('Inactive') && item.trang_thai === 0);
      const matchesNhom = f.id_nhom.length === 0 || (item.id_nhom && f.id_nhom.includes(item.id_nhom));
      const matchesNoiLuu = f.id_noi_luu.length === 0 || (item.id_noi_luu && f.id_noi_luu.includes(item.id_noi_luu));
      const matchesTrangThai = f.id_trang_thai.length === 0 || (item.id_trang_thai && f.id_trang_thai.includes(item.id_trang_thai));
      return matchesSearch && matchesStatus && matchesNhom && matchesNoiLuu && matchesTrangThai;
    },
    []
  );

  const filteredList = useListWithFilter(myList, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof TaiSan] ?? '';
      const bVal = b[sort.column as keyof TaiSan] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

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
              options={statusOptionsForSelect}
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
                const newTen = statuses.find((s) => s.id === selectedIdTrangThai)?.ten;
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
    [confirm, t, statusOptionsForSelect, statuses, updateMutation]
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
        {isAdmin ? (
          <DanhSachTaiSanToolbar
            items={myList}
            onAdd={handleAdd}
            onDeleteMany={handleDeleteMany}
            onStatusChangeMany={handleStatusChangeMany}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        ) : (
          <GenericToolbar
            selectedCount={0}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSelection={() => {}}
            filters={renderFilters}
            filterGroups={filterGroups}
            activeFilterCount={activeFilterCount}
            onClearAllFilters={handleClearAllFilters}
            searchPlaceholder={t('danhSachTaiSan.searchPlaceholder')}
            showBack
          />
        )}
        <div className="flex-1 min-h-0">
          <TaiSanTable
            data={sortedList}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={isAdmin}
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
            showActions={isAdmin}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onAddPhieu={handleAddPhieu}
            onEditPhieu={handleEditPhieu}
            onDeletePhieu={handleDeletePhieu}
            onEditPhieuBaoTri={handleEditPhieuBaoTri}
            onDeletePhieuBaoTri={handleDeletePhieuBaoTri}
            onAddPhieuBaoTri={handleAddPhieuBaoTri}
            onStatusChange={isAdmin ? handleStatusChange : undefined}
            onUpdateImage={isAdmin ? handleUpdateImage : undefined}
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

      {isAdmin && (
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
      )}
    </div>
  );
};

export default CuaToiTab;
