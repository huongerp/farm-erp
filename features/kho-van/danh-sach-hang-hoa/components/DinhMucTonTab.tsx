import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Package, Warehouse, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '../../../../lib/utils';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import GenericDrawer, { DRAWER_WIDTH_FORM, DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import { useDinhMucList, useCreateDinhMucTonKho, useUpdateDinhMucTonKho, useDeleteDinhMucTonKho } from '../../ton-kho/hooks/use-ton-kho';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import type { HangHoaRefLite } from '../services/hang-hoa-service';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import type { DinhMucTonKhoRow } from '../../phieu-kho/services/ton-kho-service';
import type { Kho } from '../../danh-sach-kho/core/types';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useDinhMucTonStore } from '../store/useDinhMucTonStore';
import { formatNumberVN } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { dinhMucTonSchema, type DinhMucTonFormValues } from '../core/schema';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface DinhMucTonTabProps {
  onBack: () => void;
}

const DinhMucTonTab: React.FC<DinhMucTonTabProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDinhMucTonStore);
  const searchTerm = useDinhMucTonStore((s) => s.searchTerm);
  const filters = useDinhMucTonStore((s) => s.filters);
  const setFilter = useDinhMucTonStore((s) => s.setFilter);
  const columns = useDinhMucTonStore((s) => s.columns);
  const toggleColumn = useDinhMucTonStore((s) => s.toggleColumn);
  const reorderColumns = useDinhMucTonStore((s) => s.reorderColumns);
  const resetColumns = useDinhMucTonStore((s) => s.resetColumns);
  const pagination = useDinhMucTonStore((s) => s.pagination);
  const setPage = useDinhMucTonStore((s) => s.setPage);
  const setPageSize = useDinhMucTonStore((s) => s.setPageSize);
  const resetState = useDinhMucTonStore((s) => s.resetState);
  const selectedIds = useDinhMucTonStore((s) => s.selectedIds);
  const toggleSelection = useDinhMucTonStore((s) => s.toggleSelection);
  const toggleAllSelection = useDinhMucTonStore((s) => s.toggleAllSelection);
  const clearSelection = useDinhMucTonStore((s) => s.clearSelection);

  const { data: list = [], isLoading } = useDinhMucList();
  const { data: khoList = [] } = useQuery<Kho[]>({
    queryKey: ['kho'],
    queryFn: getKhoList,
    staleTime: 1000 * 60 * 30,
  });
  const { data: hangHoaList = [] } = useHangHoaRefQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<DinhMucTonKhoRow | null>(null);
  const [viewingRow, setViewingRow] = useState<DinhMucTonKhoRow | null>(null);

  const khoMap = useMemo(() => {
    const m: Record<string, Kho> = {};
    khoList.forEach((k) => { m[k.id] = k; });
    return m;
  }, [khoList]);
  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  const listAfterSearch = useMemo(() => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter((row) => {
      const tenKho = khoMap[row.kho_id]?.ten_kho?.toLowerCase() ?? '';
      const maKho = khoMap[row.kho_id]?.ma_kho?.toLowerCase() ?? '';
      const tenHang = hangHoaMap[row.hang_hoa_id]?.ten_hang_hoa?.toLowerCase() ?? '';
      const maHang = hangHoaMap[row.hang_hoa_id]?.ma_hang_hoa?.toLowerCase() ?? '';
      return tenKho.includes(term) || maKho.includes(term) || tenHang.includes(term) || maHang.includes(term);
    });
  }, [list, searchTerm, khoMap, hangHoaMap]);

  const filteredList = useMemo(() => {
    if ((filters.warehouseIds?.length ?? 0) === 0) return listAfterSearch;
    const set = new Set(filters.warehouseIds);
    return listAfterSearch.filter((row) => set.has(row.kho_id));
  }, [listAfterSearch, filters.warehouseIds]);

  const warehouseOptions = useMemo(
    () =>
      khoList.map((k) => ({
        label: k.ten_kho,
        value: k.id,
        count: list.filter((r) => r.kho_id === k.id).length,
      })),
    [khoList, list]
  );

  const activeFilterCount = (filters.warehouseIds?.length ?? 0) + (searchInput.trim() ? 1 : 0);
  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('warehouseIds', []);
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );
  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [filteredList, pagination.page, pagination.pageSize]);

  const filterGroups = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('hangHoa.dinhMuc.filterKho'),
        icon: MapPin,
        options: warehouseOptions,
        value: filters.warehouseIds ?? [],
        onChange: (val: string[]) => setFilter('warehouseIds', val),
      },
    ],
    [filters.warehouseIds, setFilter, t, warehouseOptions]
  );

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => setPage(1), [filteredList.length, setPage]);
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);
  useEffect(() => resetState, [resetState]);

  const createMutation = useCreateDinhMucTonKho();
  const updateMutation = useUpdateDinhMucTonKho();
  const deleteMutation = useDeleteDinhMucTonKho();

  const handleAdd = () => {
    setEditingRow(null);
    setShowForm(true);
  };

  const handleView = (row: DinhMucTonKhoRow) => {
    setViewingRow(row);
  };

  const handleEdit = (row: DinhMucTonKhoRow) => {
    setViewingRow(null);
    setEditingRow(row);
    setShowForm(true);
  };

  const handleDelete = (row: DinhMucTonKhoRow) => {
    confirm({
      title: t('hangHoa.dinhMuc.delete'),
      message: `${t('hangHoa.dinhMuc.kho')}: ${khoMap[row.kho_id]?.ten_kho ?? row.kho_id} · ${t('hangHoa.dinhMuc.hangHoa')}: ${hangHoaMap[row.hang_hoa_id]?.ten_hang_hoa ?? row.hang_hoa_id}`,
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(row.id, {
          onSuccess: () => toast.success(t('hangHoa.dinhMuc.toastDeleteSuccess')),
          onError: (err: Error) => toast.error(err.message),
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    confirm({
      title: t('hangHoa.dinhMuc.delete'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        try {
          for (const id of ids) {
            await deleteMutation.mutateAsync(id);
          }
          clearSelection();
          toast.success(t('hangHoa.dinhMuc.toastDeleteSuccess'));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : String(err));
        }
      },
    });
  };

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('hangHoa.loading')}
        tableColumns={4}
        tableRowCount={8}
        tableColumnWithSubline={0}
        cardCount={0}
      />
    );
  }

  const renderCell = (row: DinhMucTonKhoRow, col: ColumnConfig) => {
    switch (col.id) {
      case 'kho':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-medium">{khoMap[row.kho_id]?.ten_kho ?? row.kho_id}</span>
            {khoMap[row.kho_id]?.ma_kho && (
              <span className="ml-2 text-xs text-muted-foreground font-mono">{khoMap[row.kho_id].ma_kho}</span>
            )}
          </td>
        );
      case 'hang_hoa':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-medium">{hangHoaMap[row.hang_hoa_id]?.ten_hang_hoa ?? row.hang_hoa_id}</span>
            {hangHoaMap[row.hang_hoa_id]?.ma_hang_hoa && (
              <span className="ml-2 text-xs text-muted-foreground font-mono">{hangHoaMap[row.hang_hoa_id].ma_hang_hoa}</span>
            )}
          </td>
        );
      case 'ton_toi_thieu':
        return (
          <td key={col.id} className="px-4 py-3 text-right tabular-nums" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.ton_toi_thieu)}
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
    }
  };

  const allIdsOnPage = paginatedData.map((r) => r.id);
  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedIds.has(r.id));

  const renderFilters = (
    <FilterChipMultiSelect
      options={warehouseOptions}
      value={filters.warehouseIds ?? []}
      onChange={(v) => setFilter('warehouseIds', v)}
      placeholder={t('hangHoa.dinhMuc.filterKho')}
      icon={MapPin}
      className="w-full sm:w-[200px]"
    />
  );

  const renderActions = (
    <Button size="sm" onClick={handleAdd} className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('hangHoa.dinhMuc.add')}</span>
    </Button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <GenericToolbar
          selectedCount={selectedIds.size}
          onDeleteMany={selectedIds.size > 0 ? handleDeleteMany : undefined}
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          onClearSelection={clearSelection}
          showBack
          onBack={onBack}
          searchPlaceholder={t('hangHoa.dinhMuc.searchPlaceholder')}
          actions={renderActions}
          onAdd={handleAdd}
          filters={renderFilters}
          filterGroups={filterGroups}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          columns={columns}
          onToggleColumn={toggleColumn}
          onReorderColumns={reorderColumns}
          onResetColumns={resetColumns}
        />
        <div className="flex-1 min-h-0 flex flex-col bg-card overflow-hidden">
          {isLoading ? (
            <ListPageSkeleton
              loadingText={t('hangHoa.loading')}
              tableColumns={visibleColumns.length + 2}
              tableRowCount={8}
              tableColumnWithSubline={0}
              cardCount={0}
            />
          ) : filteredList.length === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <EmptyState
                icon={<Package size={40} className="text-muted-foreground opacity-20" />}
                title={t('hangHoa.dinhMuc.empty')}
                action={
                  <Button size="sm" onClick={handleAdd} className="bg-primary text-white">
                    {t('hangHoa.dinhMuc.add')}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 w-10" style={{ minWidth: 40 }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleAllSelection(allIdsOnPage)}
                          className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                          aria-label={t('common.selectAll')}
                        />
                      </th>
                      {visibleColumns.map((col) => {
                        const isNumeric = col.id === 'ton_toi_thieu';
                        return (
                          <th
                            key={col.id}
                            className={cn(
                              'px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap',
                              isNumeric && 'text-right'
                            )}
                            style={getColumnCellStyle(col)}
                          >
                            {col.label}
                          </th>
                        );
                      })}
                      <th className="px-4 py-3 font-semibold text-muted-foreground text-xs text-right w-24">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
                    {paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className={cn('group hover:bg-muted/50 transition-colors', 'cursor-pointer')}
                        onClick={() => handleView(row)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleView(row)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelection(row.id)}
                            className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            aria-label={t('common.select')}
                          />
                        </td>
                        {visibleColumns.map((col) => renderCell(row, col))}
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(row)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                              title={t('hangHoa.dinhMuc.edit')}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                              title={t('hangHoa.dinhMuc.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="shrink-0 border-t border-border bg-muted/30">
                <TablePaginationFooter
                  totalRecords={filteredList.length}
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  selectedCount={selectedIds.size}
                  recordsLabel={t('hangHoa.footerRecords')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {viewingRow && (
        <DinhMucTonDetailDrawer
          row={viewingRow}
          khoMap={khoMap}
          hangHoaMap={hangHoaMap}
          onClose={() => setViewingRow(null)}
          onEdit={() => {
            setViewingRow(null);
            setEditingRow(viewingRow);
            setShowForm(true);
          }}
          onDelete={() => {
            handleDelete(viewingRow);
            setViewingRow(null);
          }}
        />
      )}
      {showForm && (
        <DinhMucTonFormDrawer
          khoList={khoList}
          hangHoaList={hangHoaList}
          editingRow={editingRow}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => { setShowForm(false); setEditingRow(null); }}
          onCreate={(payload) => {
            createMutation.mutate(payload, {
              onSuccess: () => {
                toast.success(t('hangHoa.dinhMuc.toastCreateSuccess'));
                setShowForm(false);
              },
              onError: (err: Error) => toast.error(err.message),
            });
          }}
          onUpdate={(id, ton_toi_thieu) => {
            updateMutation.mutate({ id, ton_toi_thieu }, {
              onSuccess: () => {
                toast.success(t('hangHoa.dinhMuc.toastUpdateSuccess'));
                setShowForm(false);
                setEditingRow(null);
              },
              onError: (err: Error) => toast.error(err.message),
            });
          }}
        />
      )}
    </div>
  );
};

/** Drawer chi tiết định mức tồn (xem read-only + nút Sửa/Xóa). */
interface DinhMucTonDetailDrawerProps {
  row: DinhMucTonKhoRow;
  khoMap: Record<string, Kho>;
  hangHoaMap: Record<string, HangHoaRefLite>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DinhMucTonDetailDrawer: React.FC<DinhMucTonDetailDrawerProps> = ({
  row,
  khoMap,
  hangHoaMap,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const k = khoMap[row.kho_id];
  const h = hangHoaMap[row.hang_hoa_id];

  return (
    <GenericDrawer
      title={t('hangHoa.dinhMuc.detailTitle')}
      icon={<Warehouse size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      }
    >
      <DetailSection title={t('hangHoa.detail.dinhMucSection')} icon={<Warehouse size={14} />} variant="primary">
        <div className="space-y-4">
          <DetailField
            label={t('hangHoa.dinhMuc.kho')}
            value={k ? `${k.ten_kho}${k.ma_kho ? ` (${k.ma_kho})` : ''}` : row.kho_id}
            icon={<MapPin size={12} />}
          />
          <DetailField
            label={t('hangHoa.dinhMuc.hangHoa')}
            value={h ? `${h.ten_hang_hoa}${h.ma_hang_hoa ? ` (${h.ma_hang_hoa})` : ''}` : row.hang_hoa_id}
            icon={<Package size={12} />}
          />
          <DetailField
            label={t('hangHoa.dinhMuc.tonToiThieu')}
            value={formatNumberVN(row.ton_toi_thieu)}
          />
        </div>
      </DetailSection>
    </GenericDrawer>
  );
};

interface DinhMucTonFormDrawerProps {
  khoList: Kho[];
  hangHoaList: HangHoaRefLite[];
  editingRow: DinhMucTonKhoRow | null;
  isSaving?: boolean;
  onClose: () => void;
  onCreate: (payload: { kho_id: string; hang_hoa_id: string; ton_toi_thieu: number }) => void;
  onUpdate: (id: string, ton_toi_thieu: number) => void;
}

const DinhMucTonFormDrawer: React.FC<DinhMucTonFormDrawerProps> = ({
  khoList,
  hangHoaList,
  editingRow,
  isSaving = false,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const isEdit = !!editingRow;

  const defaultValues: DinhMucTonFormValues = {
    kho_id: editingRow?.kho_id ?? '',
    hang_hoa_id: editingRow?.hang_hoa_id ?? '',
    ton_toi_thieu: editingRow?.ton_toi_thieu ?? 0,
  };

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<DinhMucTonFormValues>({
    resolver: zodResolver(dinhMucTonSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (editingRow) {
      reset({ kho_id: editingRow.kho_id, hang_hoa_id: editingRow.hang_hoa_id, ton_toi_thieu: editingRow.ton_toi_thieu });
    } else {
      reset({ kho_id: '', hang_hoa_id: '', ton_toi_thieu: 0 });
    }
  }, [editingRow, reset]);

  const khoOptions = useMemo(
    () => khoList.map((k) => ({ value: k.id, label: k.ten_kho, subLabel: k.ma_kho })),
    [khoList]
  );
  const hangHoaOptions = useMemo(
    () => hangHoaList.map((h) => ({ value: h.id, label: h.ten_hang_hoa, subLabel: h.ma_hang_hoa })),
    [hangHoaList]
  );

  const onSubmit: SubmitHandler<DinhMucTonFormValues> = (data) => {
    const num = Number(data.ton_toi_thieu);
    if (isEdit && editingRow) {
      onUpdate(editingRow.id, num);
    } else {
      onCreate({ kho_id: data.kho_id, hang_hoa_id: data.hang_hoa_id, ton_toi_thieu: num });
    }
  };

  const khoMap = useMemo(() => {
    const m: Record<string, Kho> = {};
    khoList.forEach((k) => { m[k.id] = k; });
    return m;
  }, [khoList]);
  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  return (
    <GenericDrawer
      title={isEdit ? t('hangHoa.dinhMuc.formEditTitle') : t('hangHoa.dinhMuc.formTitle')}
      icon={<Warehouse size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="dinh-muc-ton-form"
          onCancel={onClose}
          isLoading={isSaving}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('hangHoa.dinhMuc.add')}
        />
      }
    >
      <form id="dinh-muc-ton-form" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('hangHoa.detail.dinhMucSection')} icon={<Warehouse size={14} />} variant="primary">
          <div className="space-y-4">
            {!isEdit ? (
              <>
                <Controller
                  name="kho_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('hangHoa.dinhMuc.kho')}
                      icon={<MapPin size={12} />}
                      options={khoOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? '')}
                      placeholder={t('hangHoa.dinhMuc.selectKho')}
                      searchable
                      dropdownInPortal
                      required
                      error={errors.kho_id?.message}
                    />
                  )}
                />
                <Controller
                  name="hang_hoa_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('hangHoa.dinhMuc.hangHoa')}
                      icon={<Package size={12} />}
                      options={hangHoaOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? '')}
                      placeholder={t('hangHoa.dinhMuc.selectHangHoa')}
                      searchable
                      dropdownInPortal
                      required
                      error={errors.hang_hoa_id?.message}
                    />
                  )}
                />
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label={t('hangHoa.dinhMuc.kho')}
                  value={khoMap[editingRow!.kho_id] ? `${khoMap[editingRow!.kho_id].ten_kho} (${khoMap[editingRow!.kho_id].ma_kho})` : editingRow!.kho_id}
                  icon={<MapPin size={12} />}
                />
                <DetailField
                  label={t('hangHoa.dinhMuc.hangHoa')}
                  value={hangHoaMap[editingRow!.hang_hoa_id] ? `${hangHoaMap[editingRow!.hang_hoa_id].ten_hang_hoa} (${hangHoaMap[editingRow!.hang_hoa_id].ma_hang_hoa})` : editingRow!.hang_hoa_id}
                  icon={<Package size={12} />}
                />
              </div>
            )}
            <Input
              type="number"
              label={t('hangHoa.dinhMuc.tonToiThieu')}
              min={0}
              step="any"
              required
              {...register('ton_toi_thieu')}
              error={errors.ton_toi_thieu?.message}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DinhMucTonTab;
