import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ClipboardList,
  Edit,
  MessageSquare,
  ListTree,
  Send,
  User,
  Users,
  Trash2,
  RefreshCw,
  Printer,
  ImageDown,
  Type,
  Tag,
  ListOrdered,
  FileText,
  CheckCircle,
  Link2,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
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
import { useUIStore } from '../../../../store/useStore';
import type { CongViec, TraoDoiEntry } from '../core/types';
import type { CongViecTrangThai } from '../core/types';
import { getTrangThaiLabel, getUuTienLabel, getTrangThaiOptions } from '../core/constants';
import { BinhLuanFormValues, binhLuanSchema } from '../core/schema';
import { copyCongViecImage } from '../utils/cong-viec-share-image';
import {
  useBinhLuanByCongViecId,
  useCreateBinhLuan,
  useCongViecList,
  useUpdateCongViec,
} from '../hooks/use-cong-viec';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';

const TAB_IDS = { info: 'info', traoDoi: 'traoDoi' } as const;

/** URL trang in công việc (mở tab mới), dùng HashRouter */
const getCongViecPreviewUrl = (id: number | string) =>
  `/hanh-chinh/cong-viec/preview/${encodeURIComponent(String(id))}`;

/**
 * Giá trị long text trong detail: giữ nguyên ngắt dòng người dùng nhập,
 * ngắt từ dài (link/không dấu cách) và cuộn khi nội dung quá dài.
 */
const LongTextValue: React.FC<{ value?: string | null }> = ({ value }) => {
  const text = value?.trim();
  if (!text) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="block whitespace-pre-line break-words max-h-64 overflow-y-auto">{text}</span>
  );
};

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
  const [showInModal, setShowInModal] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
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
  const parent = data.id_cha != null ? allCongViec.find((c) => c.id === data.id_cha) : undefined;
  const updateMutation = useUpdateCongViec();
  const companyName = useUIStore((s) => s.companyInfo.companyName);

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

  const handlePrint = () => {
    setShowInModal(false);
    window.open(getCongViecPreviewUrl(data.id), '_blank', 'noopener,noreferrer');
  };

  /**
   * Không await gì trước copyCongViecImage: iOS chỉ cho ghi clipboard ngay trong
   * cử chỉ người dùng (util nhận Promise<Blob> nên việc dựng ảnh vẫn chạy async).
   */
  const handleCopyImage = () => {
    if (copyingImage) return;
    setCopyingImage(true);
    const toastId = toast.loading(t('congViec.detail.copyImageLoading'));
    copyCongViecImage(
      {
        tieuDe: data.tieu_de,
        moTa: data.mo_ta,
        ketQua: data.ket_qua,
        linkKetQua: data.link_ket_qua,
        metaLine: [getTrangThaiLabel(data.trang_thai, t), getUuTienLabel(data.uu_tien, t), getEmployeeName(data.trach_nhiem)]
          .filter((x) => x && x !== '—')
          .join(' · '),
        companyName,
        labels: {
          heading: t('congViec.detail.shareHeading'),
          moTa: t('congViec.form.moTa'),
          ketQua: t('congViec.detail.ketQua'),
          linkKetQua: t('congViec.detail.linkKetQua'),
          empty: t('congViec.detail.moTaEmpty'),
        },
      },
      `cong-viec-${data.id}.png`
    )
      .then((result) => {
        const msg =
          result === 'clipboard'
            ? t('congViec.detail.copyImageSuccess')
            : result === 'share'
              ? t('congViec.detail.copyImageShared')
              : t('congViec.detail.copyImageDownloaded');
        toast.success(msg, { id: toastId });
        setShowInModal(false);
      })
      .catch(() => toast.error(t('congViec.detail.copyImageError'), { id: toastId }))
      .finally(() => setCopyingImage(false));
  };

  const createBinhLuan = useCreateBinhLuan(data.id);

  const {
    register: regBinhLuan,
    handleSubmit: handleBinhLuanSubmit,
    formState: { errors: errBinhLuan, isDirty },
    reset: resetBinhLuan,
    control: controlBinhLuan,
  } = useForm<BinhLuanFormValues>({
    resolver: zodResolver(binhLuanSchema),
    defaultValues: { noi_dung: '' },
  });
  const binhLuanValue = useWatch({ control: controlBinhLuan, name: 'noi_dung' });

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
    {
      label: t('congViec.detail.actionIn'),
      icon: <Printer size={16} />,
      onClick: () => setShowInModal(true),
      variant: 'primary' as const,
    },
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
    <>
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
          <>
            <DetailSection title={t('congViec.form.basicInfo')} icon={<ClipboardList size={14} />} variant="primary">
              <DetailFieldGrid>
                <DetailField label={t('congViec.form.tieuDe')} value={data.tieu_de} icon={<Type size={12} />} />
                <DetailField
                  label={t('congViec.detail.congViecCha')}
                  value={parent?.tieu_de ?? '—'}
                  icon={<ListTree size={12} />}
                />
                <DetailField label={t('congViec.form.nguoiGiao')} value={getEmployeeName(data.id_nguoi_giao)} icon={<User size={12} />} />
                <DetailField label={t('congViec.form.trachNhiem')} value={getEmployeeName(data.trach_nhiem)} icon={<User size={12} />} />
                <DetailField
                  label={t('congViec.form.nguoiHoTro')}
                  value={
                    data.nguoi_ho_tro?.length
                      ? data.nguoi_ho_tro.map((id) => getEmployeeName(id)).join(', ')
                      : '—'
                  }
                  icon={<Users size={12} />}
                />
                <DetailField label={t('congViec.form.uuTien')} value={getUuTienLabel(data.uu_tien, t)} icon={<ListOrdered size={12} />} />
                <DetailField label={t('congViec.form.trangThai')} value={getTrangThaiLabel(data.trang_thai, t)} icon={<Tag size={12} />} />
              </DetailFieldGrid>
              <DetailFieldGrid cols={1} className="mt-4">
                <DetailField
                  label={t('congViec.form.moTa')}
                  value={<LongTextValue value={data.mo_ta} />}
                  icon={<FileText size={12} />}
                />
              </DetailFieldGrid>
            </DetailSection>

            <DetailSection title={t('congViec.detail.reportInfo')} icon={<CheckCircle size={14} />}>
              <DetailFieldGrid cols={1}>
                <DetailField
                  label={t('congViec.detail.ketQua')}
                  value={<LongTextValue value={data.ket_qua} />}
                  icon={<CheckCircle size={12} />}
                />
                <DetailField
                  label={t('congViec.detail.linkKetQua')}
                  icon={<Link2 size={12} />}
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

            <DetailSection title={t('congViec.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
              <DetailFieldGrid>
                <DetailField label={t('congViec.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
                <DetailField label={t('congViec.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Clock size={12} />} />
              </DetailFieldGrid>
            </DetailSection>
          </>
        )}

      {activeTab === TAB_IDS.traoDoi && (
        <div className="space-y-4">
          <form onSubmit={handleBinhLuanSubmit(onBinhLuanSubmit)} className="flex items-end gap-2">
            <Textarea
              label={t('congViec.binhLuan.noiDung')}
              placeholder={t('congViec.binhLuan.placeholder')}
              required
              rows={4}
              autoResize
              resizeDep={binhLuanValue}
              className="flex-1"
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
                <tr className="border-b border-border bg-muted">
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
    </GenericDrawer>

      {/* Popup In / Copy ảnh – chuẩn popup detail (xem PhieuKhoDetail) */}
      <AnimatePresence>
        {showInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{t('congViec.detail.printDialogTitle')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{data.tieu_de}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInModal(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/60 text-left transition-colors"
                >
                  <span className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Printer size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{t('congViec.detail.printOption')}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{t('congViec.detail.printOptionHint')}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={copyingImage}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background text-left transition-colors',
                    copyingImage ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/60'
                  )}
                >
                  <span className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
                    <ImageDown size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{t('congViec.detail.copyImageOption')}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{t('congViec.detail.copyImageOptionHint')}</span>
                  </span>
                </button>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
                <Button variant="ghost" onClick={() => setShowInModal(false)} className="text-muted-foreground hover:text-foreground">
                  {t('common.close')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal đổi trạng thái: Combobox + báo cáo, link, ghi chú */}
      <AnimatePresence>
        {showTrangThaiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseTrangThaiModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{t('congViec.detail.statusChangeTitle')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{data.tieu_de}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTrangThaiModal}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <Combobox
                  label={t('congViec.form.trangThai')}
                  options={trangThaiComboboxOptions}
                  value={modalTrangThai}
                  onChange={(v) => setModalTrangThai(v as CongViecTrangThai)}
                  placeholder={t('congViec.form.trangThaiPlaceholder')}
                  icon={<Tag size={16} className="text-muted-foreground" />}
                />
                <Textarea
                  label={t('congViec.detail.ketQua')}
                  placeholder={t('congViec.detail.ketQuaPlaceholder')}
                  value={modalKetQua}
                  onChange={(e) => setModalKetQua(e.target.value)}
                  rows={5}
                  autoResize
                  resizeDep={modalKetQua}
                />
                <Input
                  label={t('congViec.detail.linkKetQua')}
                  placeholder={t('congViec.detail.linkKetQuaPlaceholder')}
                  value={modalLinkKetQua}
                  onChange={(e) => setModalLinkKetQua(e.target.value)}
                  type="url"
                  icon={<Link2 size={14} />}
                />
                <Textarea
                  label={t('congViec.detail.ghiChu')}
                  placeholder={t('congViec.detail.ghiChuPlaceholder')}
                  value={modalGhiChu}
                  onChange={(e) => setModalGhiChu(e.target.value)}
                  rows={4}
                  autoResize
                  resizeDep={modalGhiChu}
                />
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseTrangThaiModal}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmitTrangThaiModal} loading={updateMutation.isPending}>
                  {t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CongViecDetail;
