import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Edit, MessageSquare, ListTree, Send, User, Trash2, RefreshCw } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { getDrawerWidthClass } from '../../../../lib/dialog-sizes';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import TabGroup from '../../../../components/ui/TabGroup';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Tooltip from '../../../../components/ui/Tooltip';
import Textarea from '../../../../components/ui/Textarea';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import { formatDateTimeShort, cn } from '../../../../lib/utils';
import type { CongViec, TraoDoiEntry } from '../core/types';
import type { CongViecTrangThai } from '../core/types';
import { getTrangThaiLabel, getUuTienLabel, getTrangThaiOptions } from '../core/constants';
import { BinhLuanFormValues, binhLuanSchema } from '../core/schema';
import {
  useBinhLuanByCongViecId,
  useCreateBinhLuan,
  useCongViecList,
  useUpdateCongViec,
} from '../hooks/use-cong-viec';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';

const TAB_IDS = { info: 'info', traoDoi: 'traoDoi' } as const;

interface Props {
  data: CongViec;
  onClose: () => void;
  onEdit: (item: CongViec) => void;
  onDelete?: (id: number | string) => void;
  onAddChild?: (parentId: number | string) => void;
  onDeleteChild?: (id: number | string) => void;
  /** Bấm vào dòng con → mở drawer detail công việc đó (tham khảo module khác) */
  onViewChild?: (item: CongViec) => void;
  stackLevel?: number;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const CongViecDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onAddChild, onDeleteChild, onViewChild, stackLevel = 0, canCreate = true, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<(typeof TAB_IDS)[keyof typeof TAB_IDS]>(TAB_IDS.info);
  const [showTrangThaiModal, setShowTrangThaiModal] = useState(false);
  const [modalTrangThai, setModalTrangThai] = useState<CongViecTrangThai>(data.trang_thai);
  const [modalKetQua, setModalKetQua] = useState(data.ket_qua ?? '');
  const [modalLinkKetQua, setModalLinkKetQua] = useState(data.link_ket_qua ?? '');
  const [modalGhiChu, setModalGhiChu] = useState(data.mo_ta ?? '');

  useEffect(() => {
    if (showTrangThaiModal) {
      setModalTrangThai(data.trang_thai);
      setModalKetQua(data.ket_qua ?? '');
      setModalLinkKetQua(data.link_ket_qua ?? '');
      setModalGhiChu(data.mo_ta ?? '');
    }
  }, [showTrangThaiModal, data.id, data.trang_thai, data.ket_qua, data.link_ket_qua, data.mo_ta]);

  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: traoDoiList = [] } = useBinhLuanByCongViecId(data.id);
  const { data: allCongViec = [] } = useCongViecList();
  const children = allCongViec.filter((c) => c.id_cha === data.id);
  const updateMutation = useUpdateCongViec();

  const trangThaiOptions = useMemo(() => getTrangThaiOptions(t), [t]);
  const trangThaiComboboxOptions = useMemo(
    () => trangThaiOptions.map((o) => ({ label: o.label, value: o.value })),
    [trangThaiOptions]
  );

  const handleOpenTrangThaiModal = () => setShowTrangThaiModal(true);
  const handleCloseTrangThaiModal = () => setShowTrangThaiModal(false);
  const handleSubmitTrangThaiModal = async () => {
    await updateMutation.mutateAsync({
      id: data.id,
      data: {
        trang_thai: modalTrangThai,
        ket_qua: modalKetQua.trim() || null,
        link_ket_qua: modalLinkKetQua.trim() || null,
        mo_ta: modalGhiChu.trim() || '',
      },
    });
    handleCloseTrangThaiModal();
  };

  const employeeNameMap = useMemo(() => {
    const m = new Map<string, string>();
    employees.forEach((e) => {
      const key = String(e.id);
      const label = e.ho_ten ? `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}` : e.ma_nhan_vien || key;
      m.set(key, label);
    });
    return m;
  }, [employees]);

  const getEmployeeName = (id: number | string | null | undefined): string => {
    if (id == null) return '—';
    const key = String(id);
    return employeeNameMap.get(key) ?? key;
  };

  const createBinhLuan = useCreateBinhLuan(data.id);

  const {
    register: regBinhLuan,
    handleSubmit: handleBinhLuanSubmit,
    formState: { errors: errBinhLuan, isDirty },
    reset: resetBinhLuan,
  } = useForm<BinhLuanFormValues>({
    resolver: zodResolver(binhLuanSchema),
    defaultValues: { noi_dung: '' },
  });

  const onBinhLuanSubmit: SubmitHandler<BinhLuanFormValues> = (values) => {
    createBinhLuan.mutate(values.noi_dung, { onSuccess: () => resetBinhLuan() });
  };

  const tabs = [
    { id: TAB_IDS.info, label: t('congViec.detail.tabInfo'), icon: ClipboardList },
    {
      id: TAB_IDS.traoDoi,
      label: traoDoiList.length > 0 ? t('congViec.detail.tabTraoDoiWithCount', { count: traoDoiList.length }) : t('congViec.detail.tabTraoDoi'),
      icon: MessageSquare,
    },
  ];
  const detailActions: DetailToolbarAction[] = [
    ...(canUpdate
      ? [
          {
            label: t('congViec.detail.actionTrangThai'),
            icon: <RefreshCw size={16} />,
            onClick: handleOpenTrangThaiModal,
            variant: 'info' as const,
          },
        ]
      : []),
    ...(canCreate && onAddChild
      ? [
          {
            label: t('congViec.detail.addCon'),
            icon: <ListTree size={16} />,
            onClick: () => onAddChild(data.id),
            variant: 'primary' as const,
          },
        ]
      : []),
  ];

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onEdit={() => { onEdit(data); onClose(); }}
      onDelete={onDelete ? () => onDelete(data.id) : undefined}
    />
  );

  const subtitle = [getEmployeeName(data.trach_nhiem), getTrangThaiLabel(data.trang_thai, t)].filter(Boolean).join(' · ');

  const drawerWidthClass = stackLevel > 0 ? getDrawerWidthClass(stackLevel) : DRAWER_WIDTH_DETAIL;

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={data.tieu_de}
      icon={<ClipboardList size={20} />}
      subtitle={subtitle || undefined}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={drawerWidthClass}
      stackLevel={stackLevel}
    >
      <div className="space-y-5">
        {/* Header summary card - chuẩn module Nhân viên */}
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.tieu_de}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground text-xs font-medium border border-border">
                {getTrangThaiLabel(data.trang_thai, t)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                {getUuTienLabel(data.uu_tien, t)}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar
          actions={detailActions}
          className="bg-card rounded-xl border border-border mb-4"
        />

        <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as (typeof TAB_IDS)[keyof typeof TAB_IDS])} />

        {activeTab === TAB_IDS.info && (
          <DetailSection title={t('congViec.form.basicInfo')} icon={<ClipboardList size={14} />}>
            <DetailFieldGrid>
              <DetailField label={t('congViec.form.tieuDe')} value={data.tieu_de} />
              <DetailField label={t('congViec.form.nguoiGiao')} value={getEmployeeName(data.id_nguoi_giao)} icon={<User size={12} />} />
              <DetailField label={t('congViec.form.trachNhiem')} value={getEmployeeName(data.trach_nhiem)} icon={<User size={12} />} />
              <DetailField
                label={t('congViec.form.nguoiHoTro')}
                value={
                  data.nguoi_ho_tro?.length
                    ? data.nguoi_ho_tro.map((id) => getEmployeeName(id)).join(', ')
                    : '—'
                }
                icon={<User size={12} />}
              />
              <DetailField label={t('congViec.form.uuTien')} value={getUuTienLabel(data.uu_tien, t)} />
              <DetailField label={t('congViec.form.trangThai')} value={getTrangThaiLabel(data.trang_thai, t)} />
              <DetailField label={t('congViec.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
            </DetailFieldGrid>
            <DetailFieldGrid cols={1} className="mt-4">
              <DetailField label={t('congViec.form.moTa')} value={data.mo_ta || '—'} />
              <DetailField label={t('congViec.detail.ketQua')} value={data.ket_qua || '—'} />
              <DetailField
                label={t('congViec.detail.linkKetQua')}
                value={
                  data.link_ket_qua ? (
                    <a href={data.link_ket_qua} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                      {data.link_ket_qua}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </DetailFieldGrid>
          </DetailSection>
        )}

      {activeTab === TAB_IDS.traoDoi && (
        <div className="space-y-4">
          <form onSubmit={handleBinhLuanSubmit(onBinhLuanSubmit)} className="flex gap-2">
            <Textarea
              label={t('congViec.binhLuan.noiDung')}
              placeholder={t('congViec.binhLuan.placeholder')}
              required
              className="min-h-[80px] flex-1"
              {...regBinhLuan('noi_dung')}
              error={errBinhLuan.noi_dung?.message}
            />
            <Button type="submit" size="sm" className="shrink-0 gap-1" loading={createBinhLuan.isPending}>
              <Send size={14} />
              {t('congViec.binhLuan.send')}
            </Button>
          </form>
          <ul className="space-y-3">
            {traoDoiList.length === 0 && (
              <li className="text-sm text-muted-foreground py-4">{t('congViec.binhLuan.empty')}</li>
            )}
            {traoDoiList.map((c: TraoDoiEntry) => (
              <li key={c.id} className="p-3 rounded-lg border border-border bg-card text-sm">
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    {c.ten_nguoi_gui || c.nguoi_gui_id}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTimeShort(c.tg_gui)}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{c.noi_dung}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

        {/* Section Công việc con – generic bảng con */}
        <GenericSubTableSection
          title={t('congViec.detail.conList')}
          icon={<ListTree size={14} className="text-primary" />}
          count={children.length}
          addLabel={t('congViec.detail.addCon')}
          onAdd={canCreate && onAddChild ? () => onAddChild(data.id) : undefined}
          emptyTitle={t('congViec.detail.conEmpty')}
          emptyDescription={t('congViec.detail.conEmptyHint')}
          maxTableHeight="320px"
        >
          {children.length > 0 && (
            <>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t('congViec.store.tieuDeCol')}</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t('congViec.store.trangThaiCol')}</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground w-28">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {children.map((c) => (
                  <tr
                    key={c.id}
                    role={onViewChild ? 'button' : undefined}
                    tabIndex={onViewChild ? 0 : undefined}
                    onClick={onViewChild ? () => onViewChild(c) : undefined}
                    onKeyDown={onViewChild ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onViewChild(c)) : undefined}
                    className={cn(
                      'border-b border-border/60 hover:bg-muted/30 transition-colors',
                      onViewChild && 'cursor-pointer'
                    )}
                  >
                    <td className="py-2 px-3 line-clamp-1 text-foreground">{c.tieu_de}</td>
                    <td className="py-2 px-3">{getTrangThaiLabel(c.trang_thai, t)}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-center gap-1">
                        {canUpdate && (
                          <Tooltip content={t('common.edit')} placement="left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(c);
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                              aria-label={t('common.edit')}
                            >
                              <Edit size={16} />
                            </button>
                          </Tooltip>
                        )}
                        {canDelete && onDeleteChild && (
                          <Tooltip content={t('common.delete')} placement="left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChild(c.id);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                              aria-label={t('common.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>
      </div>

      {/* Modal đổi trạng thái: Combobox + báo cáo, link, ghi chú */}
      {showTrangThaiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={handleCloseTrangThaiModal}>
          <div
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Combobox
              label={t('congViec.form.trangThai')}
              options={trangThaiComboboxOptions}
              value={modalTrangThai}
              onChange={(v) => setModalTrangThai(v as CongViecTrangThai)}
              placeholder={t('congViec.form.trangThaiPlaceholder')}
            />
            <Textarea
              label={t('congViec.detail.ketQua')}
              placeholder={t('congViec.detail.ketQuaPlaceholder')}
              value={modalKetQua}
              onChange={(e) => setModalKetQua(e.target.value)}
              rows={3}
              className="resize-y min-h-[80px]"
            />
            <Input
              label={t('congViec.detail.linkKetQua')}
              placeholder={t('congViec.detail.linkKetQuaPlaceholder')}
              value={modalLinkKetQua}
              onChange={(e) => setModalLinkKetQua(e.target.value)}
              type="url"
            />
            <Textarea
              label={t('congViec.detail.ghiChu')}
              placeholder={t('congViec.detail.ghiChuPlaceholder')}
              value={modalGhiChu}
              onChange={(e) => setModalGhiChu(e.target.value)}
              rows={2}
              className="resize-y min-h-[60px]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseTrangThaiModal}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmitTrangThaiModal}
                loading={updateMutation.isPending}
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </GenericDrawer>
  );
};

export default CongViecDetail;
