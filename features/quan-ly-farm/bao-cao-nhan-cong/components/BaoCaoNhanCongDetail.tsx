import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BaoCaoNhanCongChuyenTable from './BaoCaoNhanCongChuyenTable';
import { useTranslation } from 'react-i18next';
import { Copy, Lock, Printer, Unlock, Users, Images, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
} from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useCopyBaoCaoNhanCongToNextDay, useUpdateBaoCaoNhanCongTrangThai } from '../hooks/use-bao-cao-nhan-cong';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';
import { getBaoCaoNhanCongPreviewUrl } from '../core/preview-url';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: FarmBaoCaoNhanCong;
  existingList: FarmBaoCaoNhanCong[];
  onClose: () => void;
  onEdit?: (item: FarmBaoCaoNhanCong) => void;
  onDelete?: (id: string) => void;
  /** Sau khi copy sang ngày kế tiếp thành công: mở form sửa phiếu mới. */
  onAfterCopyToNextDay?: (newItem: FarmBaoCaoNhanCong) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Sao chép sang ngày kế (đã tính khóa / quyền). */
  canCopyNextDay?: boolean;
  /** Đổi trạng thái khóa — chỉ quản trị. */
  canToggleTrangThai?: boolean;
}

const BaoCaoNhanCongDetail: React.FC<Props> = ({
  data,
  existingList,
  onClose,
  onEdit,
  onDelete,
  onAfterCopyToNextDay,
  canUpdate = true,
  canDelete = true,
  canCopyNextDay = true,
  canToggleTrangThai = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const copyMutation = useCopyBaoCaoNhanCongToNextDay();
  const trangThaiMutation = useUpdateBaoCaoNhanCongTrangThai();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hinhAnhUrls = data.hinh_anh_urls ?? [];

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex((i) => (i !== null && i < hinhAnhUrls.length - 1 ? i + 1 : i));

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onEdit={onEdit ? () => { onEdit(data);
              onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id);
              onClose(); } : undefined}
    />
  );

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('baoCaoNhanCong.detail.printReport'),
      icon: <Printer size={16} />,
      variant: 'primary',
      onClick: () => window.open(getBaoCaoNhanCongPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
    },
  ];
  if (canCopyNextDay) {
    toolbarActions.push({
      label: t('baoCaoNhanCong.detail.copyNextDay'),
      icon: <Copy size={16} />,
      variant: 'outline',
      disabled: copyMutation.isPending || trangThaiMutation.isPending,
      onClick: () => {
        copyMutation.mutate(
          { source: data, existingList },
          {
            onSuccess: (newItem) => {
              onAfterCopyToNextDay?.(newItem);
            },
          }
        );
      },
    });
  }
  if (canToggleTrangThai) {
    const locked = data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
    toolbarActions.push({
      label: locked ? t('baoCaoNhanCong.detail.toggleUnlock') : t('baoCaoNhanCong.detail.toggleLock'),
      icon: locked ? <Unlock size={16} /> : <Lock size={16} />,
      variant: 'outline',
      disabled: trangThaiMutation.isPending || copyMutation.isPending,
      onClick: () => {
        if (locked) {
          confirm({
            title: t('baoCaoNhanCong.confirmUnlockTitle'),
            message: t('baoCaoNhanCong.confirmUnlockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.MO,
              });
            },
          });
        } else {
          confirm({
            title: t('baoCaoNhanCong.confirmLockTitle'),
            message: t('baoCaoNhanCong.confirmLockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA,
              });
            },
          });
        }
      },
    });
  }

  return (
    <>
    <GenericDrawer
      title={t('baoCaoNhanCong.detail.title')}
      subtitle={formatDateShort(data.ngay)}
      icon={<Users className="text-cyan-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_NHAN_CONG}
      footer={renderFooter}
    >
      <div className="space-y-4 pb-2">
        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}
        <DetailSection title={t('baoCaoNhanCong.detail.sectionOverview')} icon={<Users size={14} />} variant="primary">
          <DetailFieldGrid cols={3} className="gap-y-3">
            <DetailField label={t('baoCaoNhanCong.form.ngay')} value={formatDateShort(data.ngay)} />
            <DetailField label={t('baoCaoNhanCong.form.branch')} value={data.ten_chi_nhanh ?? '—'} />
            <DetailField
              label={t('baoCaoNhanCong.store.colTrangThai')}
              value={
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
                    data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                  )}
                >
                  {data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
                    ? t('baoCaoNhanCong.trangThai.khoa')
                    : t('baoCaoNhanCong.trangThai.mo')}
                </span>
              }
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongNgay')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlCongNgay(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongNua')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlCongNua(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongQuyDoi')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongTangCa')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlTangCa(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colGioTangCa')}
              value={<span className="tabular-nums">{formatNumberVN(sumSoGioTc(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongGioTangCa')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongGioTangCaTichPhieu(data))}</span>}
            />
            <DetailField label={t('baoCaoNhanCong.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            <DetailField label={t('baoCaoNhanCong.store.colTgTao')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('baoCaoNhanCong.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
            <DetailField
              label={t('baoCaoNhanCong.form.ghiChuPhieu')}
              value={
                data.ghi_chu?.trim() ? (
                  <div className="whitespace-pre-wrap text-body-sm leading-relaxed">{data.ghi_chu}</div>
                ) : (
                  ''
                )
              }
              emptyText="—"
              className="sm:col-span-2 lg:col-span-3"
            />
          </DetailFieldGrid>
        </DetailSection>

        {hinhAnhUrls.length > 0 && (
          <DetailSection title={t('baoCaoNhanCong.detail.sectionHinhAnh')} icon={<Images size={14} />} variant="primary">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {hinhAnhUrls.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => openLightbox(idx)}
                  className="group relative block rounded-lg overflow-hidden border border-border bg-muted/20 aspect-square hover:ring-2 hover:ring-primary/30 transition-shadow cursor-zoom-in"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </span>
                </button>
              ))}
            </div>
          </DetailSection>
        )}

        <DetailSection title={t('baoCaoNhanCong.form.sectionChuyen')} variant="primary">
          <BaoCaoNhanCongChuyenTable data={data} />
        </DetailSection>

      </div>
    </GenericDrawer>

    {lightboxIndex !== null && ReactDOM.createPortal(
      <AnimatePresence>
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <motion.img
            key={hinhAnhUrls[lightboxIndex]}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={hinhAnhUrls[lightboxIndex]}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {lightboxIndex < hinhAnhUrls.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Ảnh kế"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {hinhAnhUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums select-none">
              {lightboxIndex + 1} / {hinhAnhUrls.length}
            </div>
          )}
        </motion.div>
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

export default BaoCaoNhanCongDetail;
