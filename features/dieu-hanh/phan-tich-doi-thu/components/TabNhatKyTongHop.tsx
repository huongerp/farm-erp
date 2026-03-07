import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useAllNhatKy,
  useDoiThuList,
  useThemNhatKyAny,
  useCapNhatNhatKyAny,
  useXoaNhatKyAny,
} from '../hooks/use-phan-tich-doi-thu';
import type { DoiThu, DoiThuNhatKy } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import Select from '../../../../components/ui/Select';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, BTN_ADD } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';

const DEFAULT_PAGE_SIZE = 10;
const todayYYYYMMDD = () => new Date().toISOString().slice(0, 10);

interface Props {
  onViewDoiThu?: (doiThu: DoiThu) => void;
}

const TabNhatKyTongHop: React.FC<Props> = ({ onViewDoiThu }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: logs = [], isLoading } = useAllNhatKy();
  const { data: doiThuList = [] } = useDoiThuList();
  const themAnyMutation = useThemNhatKyAny();
  const capNhatAnyMutation = useCapNhatNhatKyAny();
  const xoaAnyMutation = useXoaNhatKyAny();

  const [filterDoiThuIds, setFilterDoiThuIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingLog, setEditingLog] = useState<DoiThuNhatKy | null>(null);
  const [formDoiThuId, setFormDoiThuId] = useState('');
  const [formNoiDung, setFormNoiDung] = useState('');
  const [formNguoiTao, setFormNguoiTao] = useState('User');
  const [formNgay, setFormNgay] = useState(todayYYYYMMDD);

  const doiThuById = useMemo(
    () => Object.fromEntries(doiThuList.map((d) => [d.id, d])),
    [doiThuList]
  );
  const nameById = useMemo(
    () => Object.fromEntries(doiThuList.map((d) => [d.id, d.ten_doi_thu])),
    [doiThuList]
  );

  const filterChipOptions = useMemo(
    () =>
      doiThuList.map((d) => ({
        value: d.id,
        label: d.ten_doi_thu,
        count: logs.filter((l) => l.doi_thu_id === d.id).length,
      })),
    [doiThuList, logs]
  );

  const filtered = useMemo(() => {
    let r = logs;
    if (filterDoiThuIds.length > 0) r = r.filter((l) => filterDoiThuIds.includes(l.doi_thu_id));
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      r = r.filter(
        (l) =>
          l.noi_dung.toLowerCase().includes(term) ||
          (l.nguoi_tao && l.nguoi_tao.toLowerCase().includes(term))
      );
    }
    return r;
  }, [logs, filterDoiThuIds, searchTerm]);

  const totalRecords = filtered.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const maxPage = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(page, maxPage);
  useEffect(() => {
    if (page > maxPage && maxPage > 0) setPage(maxPage);
  }, [maxPage, page]);

  const handleRowClick = (log: DoiThuNhatKy) => {
    const doiThu = doiThuById[log.doi_thu_id];
    if (doiThu) onViewDoiThu?.(doiThu);
  };

  const activeFilterCount = (searchTerm ? 1 : 0) + (filterDoiThuIds.length > 0 ? 1 : 0);
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterDoiThuIds([]);
    setPage(1);
  };

  const openAdd = () => {
    setEditingLog(null);
    setFormDoiThuId(doiThuList[0]?.id ?? '');
    setFormNoiDung('');
    setFormNguoiTao('User');
    setFormNgay(todayYYYYMMDD());
    setShowAddDrawer(true);
  };

  const openEdit = (log: DoiThuNhatKy, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLog(log);
    setFormDoiThuId(log.doi_thu_id);
    setFormNoiDung(log.noi_dung);
    setFormNguoiTao(log.nguoi_tao);
    setFormNgay(log.ngay || log.tg_tao.slice(0, 10));
    setShowAddDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowAddDrawer(false);
    setEditingLog(null);
  };

  const handleDelete = (log: DoiThuNhatKy, e: React.MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: t('phanTichDoiThu.nhatKy.deleteTitle'),
      message: t('phanTichDoiThu.nhatKy.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => xoaAnyMutation.mutate({ id: log.id, doiThuId: log.doi_thu_id }),
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formNoiDung.trim();
    if (!trimmed) return;
    if (editingLog) {
      capNhatAnyMutation.mutate(
        {
          id: editingLog.id,
          doiThuId: editingLog.doi_thu_id,
          data: {
            noi_dung: trimmed,
            nguoi_tao: formNguoiTao.trim() || 'User',
            ngay: formNgay || todayYYYYMMDD(),
          },
        },
        { onSuccess: handleCloseDrawer }
      );
    } else {
      if (!formDoiThuId) return;
      themAnyMutation.mutate(
        {
          doiThuId: formDoiThuId,
          payload: {
            noi_dung: trimmed,
            nguoi_tao: formNguoiTao.trim() || 'User',
            ngay: formNgay || todayYYYYMMDD(),
          },
        },
        {
          onSuccess: () => {
            handleCloseDrawer();
            setFormNoiDung('');
            setFormNgay(todayYYYYMMDD());
          },
        }
      );
    }
  };

  const competitorSelectOptions = doiThuList.map((d) => ({ value: d.id, label: d.ten_doi_thu }));

  const renderFilters = (
    <FilterChipMultiSelect
      options={filterChipOptions}
      value={filterDoiThuIds}
      onChange={(v) => {
        setFilterDoiThuIds(v);
        setPage(1);
      }}
      placeholder={t('phanTichDoiThu.nhatKyTongHop.filterDoiThu')}
      icon={Building2}
      className="w-full sm:w-[180px]"
      hideZeroCount={false}
    />
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'doi_thu',
        label: t('phanTichDoiThu.nhatKyTongHop.filterDoiThu'),
        icon: Building2,
        options: filterChipOptions,
        value: filterDoiThuIds,
        onChange: (val: string[]) => {
          setFilterDoiThuIds(val);
          setPage(1);
        },
      },
    ],
    [filterDoiThuIds, filterChipOptions, t]
  );

  const renderActions = (
    <Button
      onClick={openAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{BTN_ADD()}</span>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <ListPageSkeleton
          loadingText={t('phanTichDoiThu.nhatKyTongHop.title')}
          tableColumns={4}
          tableRowCount={8}
          tableColumnWithSubline={0}
          cardCount={0}
        />
      </div>
    );
  }

  if (logs.length === 0 && !showAddDrawer) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="-mx-4 -mt-1 shrink-0">
          <GenericToolbar
            selectedCount={0}
            onClearSelection={() => {}}
            searchTerm=""
            onSearchChange={() => {}}
            actions={doiThuList.length > 0 ? renderActions : undefined}
            showBack
            onBack={() => navigate('/dieu-hanh')}
            searchPlaceholder={t('phanTichDoiThu.nhatKyTongHop.searchPlaceholder')}
            filters={null}
            activeFilterCount={0}
            onClearAllFilters={() => {}}
          />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <EmptyState
            icon={BookOpen}
            title={t('phanTichDoiThu.nhatKyTongHop.title')}
            description={t('phanTichDoiThu.nhatKyTongHop.empty')}
          />
        </div>
        {showAddDrawer && doiThuList.length > 0 && (
          <GenericDrawer
            title={editingLog ? t('phanTichDoiThu.nhatKy.editTitle') : t('phanTichDoiThu.detail.themNhatKy')}
            icon={<BookOpen size={18} />}
            onClose={handleCloseDrawer}
            stackLevel={1}
            footer={
              <FormDrawerFooter
                formId="nhat-ky-tonghop-form-empty"
                onCancel={handleCloseDrawer}
                isLoading={themAnyMutation.isPending || capNhatAnyMutation.isPending}
                isEdit={!!editingLog}
                saveLabel={t('common.save')}
                createLabel={t('common.add')}
              />
            }
            maxWidthClass={DRAWER_WIDTH_FORM}
          >
            <form id="nhat-ky-tonghop-form-empty" onSubmit={handleSubmitForm} className="space-y-4">
              {!editingLog ? (
                <Select
                  label={t('phanTichDoiThu.nhatKyTongHop.colDoiThu')}
                  options={competitorSelectOptions}
                  value={formDoiThuId}
                  onChange={(e) => setFormDoiThuId(e.target.value)}
                  required
                />
              ) : (
                <Input
                  label={t('phanTichDoiThu.nhatKyTongHop.colDoiThu')}
                  value={nameById[formDoiThuId] ?? formDoiThuId}
                  readOnly
                  disabled
                  className="bg-muted/50"
                />
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">
                  {t('phanTichDoiThu.detail.ngayNhatKy')}
                </label>
                <input
                  type="date"
                  value={formNgay}
                  onChange={(e) => setFormNgay(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <Input
                label={t('phanTichDoiThu.detail.nguoiTao')}
                value={formNguoiTao}
                onChange={(e) => setFormNguoiTao(e.target.value)}
                placeholder="User"
              />
              <Textarea
                label={t('phanTichDoiThu.detail.noiDung')}
                value={formNoiDung}
                onChange={(e) => setFormNoiDung(e.target.value)}
                placeholder={t('phanTichDoiThu.detail.ghiChuNhanh')}
                rows={4}
                required
              />
            </form>
          </GenericDrawer>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="-mx-4 -mt-1 shrink-0">
        <GenericToolbar
          selectedCount={0}
          onClearSelection={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          actions={renderActions}
          filters={renderFilters}
          filterGroups={filterGroups}
          showBack
          onBack={() => navigate('/dieu-hanh')}
          searchPlaceholder={t('phanTichDoiThu.nhatKyTongHop.searchPlaceholder')}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-1">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar rounded-lg border border-border bg-card">
          <table className="w-full text-sm text-left border-collapse min-w-[560px]">
            <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-[180px]">
                  {t('phanTichDoiThu.nhatKyTongHop.colDoiThu')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-[100px]">
                  {t('phanTichDoiThu.detail.ngayNhatKy')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap">
                  {t('phanTichDoiThu.detail.noiDung')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-[120px]">
                  {t('phanTichDoiThu.detail.nguoiTao')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-24 text-center sticky right-0 bg-muted/95 border-l border-border">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
              {paginatedData.map((log: DoiThuNhatKy) => (
                <tr
                  key={log.id}
                  className={cn(
                    'group hover:bg-muted/50 transition-colors',
                    onViewDoiThu && 'cursor-pointer'
                  )}
                  onClick={() => onViewDoiThu && handleRowClick(log)}
                  onKeyDown={(e) => onViewDoiThu && e.key === 'Enter' && handleRowClick(log)}
                  role={onViewDoiThu ? 'button' : undefined}
                  tabIndex={onViewDoiThu ? 0 : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={14} className="text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">
                        {nameById[log.doi_thu_id] ?? log.doi_thu_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDateShort(log.ngay || log.tg_tao)}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-md line-clamp-2">
                    {log.noi_dung}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {log.nguoi_tao}
                  </td>
                  <td className="px-2 py-3 text-center sticky right-0 bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => openEdit(log, e)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                        title={t('common.edit')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(log, e)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                        title={t('common.delete')}
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
        <div className="shrink-0 border-t border-border bg-muted/30 mt-auto">
          <TablePaginationFooter
            totalRecords={totalRecords}
            page={safePage}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            recordsLabel={t('phanTichDoiThu.footerRecords')}
          />
        </div>
      </div>

      {showAddDrawer && (
        <GenericDrawer
          title={editingLog ? t('phanTichDoiThu.nhatKy.editTitle') : t('phanTichDoiThu.detail.themNhatKy')}
          icon={<BookOpen size={18} />}
          onClose={handleCloseDrawer}
          stackLevel={1}
          footer={
            <FormDrawerFooter
              formId="nhat-ky-tonghop-form"
              onCancel={handleCloseDrawer}
              isLoading={themAnyMutation.isPending || capNhatAnyMutation.isPending}
              isEdit={!!editingLog}
              saveLabel={t('common.save')}
              createLabel={t('common.add')}
            />
          }
          maxWidthClass={DRAWER_WIDTH_FORM}
        >
          <form id="nhat-ky-tonghop-form" onSubmit={handleSubmitForm} className="space-y-4">
            {!editingLog ? (
              <Select
                label={t('phanTichDoiThu.nhatKyTongHop.colDoiThu')}
                options={competitorSelectOptions}
                value={formDoiThuId}
                onChange={(e) => setFormDoiThuId(e.target.value)}
                required
              />
            ) : (
              <Input
                label={t('phanTichDoiThu.nhatKyTongHop.colDoiThu')}
                value={nameById[formDoiThuId] ?? formDoiThuId}
                readOnly
                disabled
                className="bg-muted/50"
              />
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                {t('phanTichDoiThu.detail.ngayNhatKy')}
              </label>
              <input
                type="date"
                value={formNgay}
                onChange={(e) => setFormNgay(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <Input
              label={t('phanTichDoiThu.detail.nguoiTao')}
              value={formNguoiTao}
              onChange={(e) => setFormNguoiTao(e.target.value)}
              placeholder="User"
            />
            <Textarea
              label={t('phanTichDoiThu.detail.noiDung')}
              value={formNoiDung}
              onChange={(e) => setFormNoiDung(e.target.value)}
              placeholder={t('phanTichDoiThu.detail.ghiChuNhanh')}
              rows={4}
              required
            />
          </form>
        </GenericDrawer>
      )}
    </div>
  );
};

export default TabNhatKyTongHop;
