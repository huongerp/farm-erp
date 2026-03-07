import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Building2, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useAllTaiLieu,
  useDoiThuList,
  useThemTaiLieuAny,
  useCapNhatTaiLieuAny,
  useXoaTaiLieuAny,
} from '../hooks/use-phan-tich-doi-thu';
import type { DoiThu, DoiThuTaiLieu } from '../core/types';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import Select from '../../../../components/ui/Select';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, BTN_ADD } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';

const LOAI_OPTIONS: { value: DoiThuTaiLieu['loai']; labelKey: string }[] = [
  { value: 'bao_gia', labelKey: 'phanTichDoiThu.detail.baoGia' },
  { value: 'anh_nang_luc', labelKey: 'phanTichDoiThu.detail.anhNangLuc' },
  { value: 'anh_quang_cao', labelKey: 'phanTichDoiThu.detail.anhQuangCao' },
  { value: 'link_bai_bao', labelKey: 'phanTichDoiThu.detail.linkBaiBao' },
];

function getLoaiLabel(loai: DoiThuTaiLieu['loai'], t: (k: string) => string): string {
  const key: Record<DoiThuTaiLieu['loai'], string> = {
    bao_gia: 'phanTichDoiThu.detail.baoGia',
    anh_nang_luc: 'phanTichDoiThu.detail.anhNangLuc',
    anh_quang_cao: 'phanTichDoiThu.detail.anhQuangCao',
    link_bai_bao: 'phanTichDoiThu.detail.linkBaiBao',
  };
  return t(key[loai]);
}

const DEFAULT_PAGE_SIZE = 10;

interface Props {
  onViewDoiThu?: (doithu: DoiThu) => void;
}

const TabTaiLieuTongHop: React.FC<Props> = ({ onViewDoiThu }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: taiLieu = [], isLoading } = useAllTaiLieu();
  const { data: doiThuList = [] } = useDoiThuList();
  const themAnyMutation = useThemTaiLieuAny();
  const capNhatAnyMutation = useCapNhatTaiLieuAny();
  const xoaAnyMutation = useXoaTaiLieuAny();

  const [filterDoiThuIds, setFilterDoiThuIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DoiThuTaiLieu | null>(null);
  const [formDoiThuId, setFormDoiThuId] = useState('');
  const [formTenFile, setFormTenFile] = useState('');
  const [formLoai, setFormLoai] = useState<DoiThuTaiLieu['loai']>('bao_gia');

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
        count: taiLieu.filter((tl) => tl.doi_thu_id === d.id).length,
      })),
    [doiThuList, taiLieu]
  );

  const filtered = useMemo(() => {
    let r = taiLieu;
    if (filterDoiThuIds.length > 0) r = r.filter((tl) => filterDoiThuIds.includes(tl.doi_thu_id));
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      r = r.filter((tl) => tl.ten_file.toLowerCase().includes(term));
    }
    return r;
  }, [taiLieu, filterDoiThuIds, searchTerm]);

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

  const handleRowClick = (tl: DoiThuTaiLieu) => {
    const doiThu = doiThuById[tl.doi_thu_id];
    if (doiThu) onViewDoiThu?.(doiThu);
  };

  const activeFilterCount = (searchTerm ? 1 : 0) + (filterDoiThuIds.length > 0 ? 1 : 0);
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterDoiThuIds([]);
    setPage(1);
  };

  const openAdd = () => {
    setEditingDoc(null);
    setFormDoiThuId(doiThuList[0]?.id ?? '');
    setFormTenFile('');
    setFormLoai('bao_gia');
    setShowAddDrawer(true);
  };

  const openEdit = (doc: DoiThuTaiLieu, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDoc(doc);
    setFormDoiThuId(doc.doi_thu_id);
    setFormTenFile(doc.ten_file);
    setFormLoai(doc.loai);
    setShowAddDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowAddDrawer(false);
    setEditingDoc(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const ten = formTenFile.trim();
    if (!ten) return;
    if (editingDoc) {
      capNhatAnyMutation.mutate(
        { id: editingDoc.id, data: { ten_file: ten, loai: formLoai }, doiThuId: editingDoc.doi_thu_id },
        { onSuccess: handleCloseDrawer }
      );
    } else {
      if (!formDoiThuId) return;
      themAnyMutation.mutate(
        { doiThuId: formDoiThuId, payload: { ten_file: ten, loai: formLoai } },
        { onSuccess: handleCloseDrawer }
      );
    }
  };

  const handleDelete = (doc: DoiThuTaiLieu, e: React.MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: t('phanTichDoiThu.taiLieu.deleteTitle'),
      message: t('phanTichDoiThu.taiLieu.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => xoaAnyMutation.mutate({ id: doc.id, doiThuId: doc.doi_thu_id }),
    });
  };

  const loaiSelectOptions = LOAI_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const competitorSelectOptions = doiThuList.map((d) => ({ value: d.id, label: d.ten_doi_thu }));

  const renderFilters = (
    <FilterChipMultiSelect
      options={filterChipOptions}
      value={filterDoiThuIds}
      onChange={(v) => {
        setFilterDoiThuIds(v);
        setPage(1);
      }}
      placeholder={t('phanTichDoiThu.taiLieuTongHop.filterDoiThu')}
      icon={Building2}
      className="w-full sm:w-[180px]"
      hideZeroCount={false}
    />
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'doi_thu',
        label: t('phanTichDoiThu.taiLieuTongHop.filterDoiThu'),
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
          loadingText={t('phanTichDoiThu.taiLieuTongHop.title')}
          tableColumns={5}
          tableRowCount={8}
          tableColumnWithSubline={0}
          cardCount={0}
        />
      </div>
    );
  }

  if (taiLieu.length === 0 && !showAddDrawer) {
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
            searchPlaceholder={t('phanTichDoiThu.taiLieuTongHop.searchPlaceholder')}
            filters={null}
            activeFilterCount={0}
            onClearAllFilters={() => {}}
          />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <EmptyState
            icon={FileText}
            title={t('phanTichDoiThu.taiLieuTongHop.title')}
            description={t('phanTichDoiThu.taiLieuTongHop.empty')}
          />
        </div>
        {showAddDrawer && doiThuList.length > 0 && (
          <GenericDrawer
            title={editingDoc ? t('phanTichDoiThu.taiLieu.editTitle') : t('phanTichDoiThu.taiLieu.addTitle')}
            icon={<FileText size={18} />}
            onClose={handleCloseDrawer}
            stackLevel={1}
            footer={
              <FormDrawerFooter
                formId="tai-lieu-tonghop-form"
                onCancel={handleCloseDrawer}
                isLoading={themAnyMutation.isPending || capNhatAnyMutation.isPending}
                isEdit={!!editingDoc}
                saveLabel={t('common.save')}
                createLabel={t('common.add')}
              />
            }
            maxWidthClass={DRAWER_WIDTH_FORM}
          >
            <form id="tai-lieu-tonghop-form" onSubmit={handleSubmitForm} className="space-y-4">
              {!editingDoc && (
                <Select
                  label={t('phanTichDoiThu.taiLieuTongHop.colDoiThu')}
                  options={competitorSelectOptions}
                  value={formDoiThuId}
                  onChange={(e) => setFormDoiThuId(e.target.value)}
                  required
                />
              )}
              <Input
                label={t('phanTichDoiThu.taiLieu.tenFile')}
                value={formTenFile}
                onChange={(e) => setFormTenFile(e.target.value)}
                placeholder={t('phanTichDoiThu.taiLieu.tenFilePlaceholder')}
                required
              />
              <Select
                label={t('phanTichDoiThu.taiLieu.loai')}
                options={loaiSelectOptions}
                value={formLoai}
                onChange={(e) => setFormLoai(e.target.value as DoiThuTaiLieu['loai'])}
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
          searchPlaceholder={t('phanTichDoiThu.taiLieuTongHop.searchPlaceholder')}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-1">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar rounded-lg border border-border bg-card">
          <table className="w-full text-sm text-left border-collapse min-w-[560px]">
            <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-[200px]">
                  {t('phanTichDoiThu.taiLieuTongHop.colDoiThu')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap">
                  {t('phanTichDoiThu.taiLieu.tenFile')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-[140px]">
                  {t('phanTichDoiThu.taiLieu.loai')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-20">
                  {t('phanTichDoiThu.taiLieu.linkCol')}
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap w-24 text-center sticky right-0 bg-muted/95 border-l border-border">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
              {paginatedData.map((tl) => (
                <tr
                  key={tl.id}
                  className={cn(
                    'group hover:bg-muted/50 transition-colors',
                    onViewDoiThu && 'cursor-pointer'
                  )}
                  onClick={() => onViewDoiThu && handleRowClick(tl)}
                  onKeyDown={(e) => onViewDoiThu && e.key === 'Enter' && handleRowClick(tl)}
                  role={onViewDoiThu ? 'button' : undefined}
                  tabIndex={onViewDoiThu ? 0 : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={14} className="text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">
                        {nameById[tl.doi_thu_id] ?? tl.doi_thu_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{tl.ten_file}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {getLoaiLabel(tl.loai, t)}
                  </td>
                  <td className="px-4 py-3">
                    {tl.duong_dan_file ? (
                      <a
                        href={tl.duong_dan_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center sticky right-0 bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => openEdit(tl, e)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                        title={t('common.edit')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(tl, e)}
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
          title={editingDoc ? t('phanTichDoiThu.taiLieu.editTitle') : t('phanTichDoiThu.taiLieu.addTitle')}
          icon={<FileText size={18} />}
          onClose={handleCloseDrawer}
          stackLevel={1}
          footer={
            <FormDrawerFooter
              formId="tai-lieu-tonghop-form"
              onCancel={handleCloseDrawer}
              isLoading={themAnyMutation.isPending || capNhatAnyMutation.isPending}
              isEdit={!!editingDoc}
              saveLabel={t('common.save')}
              createLabel={t('common.add')}
            />
          }
          maxWidthClass={DRAWER_WIDTH_FORM}
        >
          <form id="tai-lieu-tonghop-form" onSubmit={handleSubmitForm} className="space-y-4">
            {!editingDoc && (
              <Select
                label={t('phanTichDoiThu.taiLieuTongHop.colDoiThu')}
                options={competitorSelectOptions}
                value={formDoiThuId}
                onChange={(e) => setFormDoiThuId(e.target.value)}
                required
              />
            )}
            <Input
              label={t('phanTichDoiThu.taiLieu.tenFile')}
              value={formTenFile}
              onChange={(e) => setFormTenFile(e.target.value)}
              placeholder={t('phanTichDoiThu.taiLieu.tenFilePlaceholder')}
              required
            />
            <Select
              label={t('phanTichDoiThu.taiLieu.loai')}
              options={loaiSelectOptions}
              value={formLoai}
              onChange={(e) => setFormLoai(e.target.value as DoiThuTaiLieu['loai'])}
            />
          </form>
        </GenericDrawer>
      )}
    </div>
  );
};

export default TabTaiLieuTongHop;
