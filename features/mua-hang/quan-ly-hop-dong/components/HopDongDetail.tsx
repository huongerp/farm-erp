import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Edit, Trash2, RefreshCw, X, Wallet, Images, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import type { HopDong } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import {
  useUpdateHopDongTrangThai,
  useInsertHopDongChiTiet,
  useUpdateHopDongChiTiet,
  useDeleteHopDongChiTiet,
} from '../hooks/use-hop-dong';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import HopDongChiTietModal from './HopDongChiTietModal';
import type { HopDongChiTietLineValues } from '../core/schema';
import type { HopDongChiTiet } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';

interface Props {
  data: HopDong;
  chiNhanhList: Branch[];
  onClose: () => void;
  onEdit?: (item: HopDong) => void;
  onDelete?: (id: string) => void;
  canUpdateChiTiet?: boolean;
}

const HopDongDetail: React.FC<Props> = ({
  data,
  chiNhanhList,
  onClose,
  onEdit,
  onDelete,
  canUpdateChiTiet = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);

  const cnMap = useMemo(() => {
    const m: Record<string, string> = {};
    chiNhanhList.forEach((b) => {
      m[b.id] = b.ten_chi_nhanh;
    });
    return m;
  }, [chiNhanhList]);

  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [statusDraft, setStatusDraft] = useState(data.trang_thai);
  const [ghiChuDraft, setGhiChuDraft] = useState(data.ghi_chu ?? '');

  const [ctModalOpen, setCtModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<HopDongChiTiet | null>(null);

  const hinhAnhUrls = data.hinh_anh_urls ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex((i) => (i !== null && i < hinhAnhUrls.length - 1 ? i + 1 : i));

  const statusMutation = useUpdateHopDongTrangThai(() => setShowStatusPopup(false));
  const insertCt = useInsertHopDongChiTiet();
  const updateCt = useUpdateHopDongChiTiet();
  const deleteCt = useDeleteHopDongChiTiet();

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_HOP_DONG.map((s) => ({
        value: s,
        label: s === 'Đang thực hiện' ? t('hopDong.trangThai.dangThucHien') : t('hopDong.trangThai.daThanhLy'),
      })),
    [t]
  );

  const openStatusPopup = useCallback(() => {
    setStatusDraft(data.trang_thai);
    setGhiChuDraft(data.ghi_chu ?? '');
    setShowStatusPopup(true);
  }, [data.trang_thai, data.ghi_chu]);

  const submitStatus = () => {
    statusMutation.mutate({
      id: data.id,
      trang_thai: statusDraft,
      ghi_chu: ghiChuDraft.trim() || null,
    });
  };

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () =>
      canUpdateChiTiet
        ? [
            {
              label: t('hopDong.detail.changeStatus'),
              icon: <RefreshCw size={16} />,
              onClick: openStatusPopup,
              variant: 'info',
            },
          ]
        : [],
    [canUpdateChiTiet, t, openStatusPopup]
  );

  const openAddCt = () => {
    setEditingLine(null);
    setCtModalOpen(true);
  };

  const openEditCt = (line: HopDongChiTiet) => {
    setEditingLine(line);
    setCtModalOpen(true);
  };

  const onSaveCt = (values: HopDongChiTietLineValues) => {
    if (editingLine?.id) {
      updateCt.mutate({ idCt: editingLine.id, idHopDong: data.id, row: values }, { onSuccess: () => setCtModalOpen(false) });
    } else {
      insertCt.mutate(
        { idHopDong: data.id, row: values, idNguoiTao: user?.id ?? null },
        { onSuccess: () => setCtModalOpen(false) }
      );
    }
  };

  const onDeleteCt = (idCt: string) => {
    confirm({
      title: t('hopDong.chiTiet.deleteTitle'),
      message: t('hopDong.chiTiet.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteCt.mutate({ idCt, idHopDong: data.id }),
    });
  };

  const ctPending = insertCt.isPending || updateCt.isPending;

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  const lines = data.chi_tiet ?? [];

  return (
    <>
      <GenericDrawer
        title={t('hopDong.detail.title')}
        subtitle={data.ma_hop_dong}
        icon={<FileText size={20} />}
        onClose={onClose}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
        footer={renderFooter}
      >
        <div className="space-y-6">
          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection title={t('hopDong.detail.basic')} icon={<FileText size={14} />}>
            <DetailFieldGrid cols={2}>
              <DetailField label={t('hopDong.form.maHopDong')} value={data.ma_hop_dong} />
              <DetailField
                label={t('hopDong.form.ngay')}
                value={data.ngay ? formatDateShort(data.ngay) : '—'}
              />
              <DetailField label={t('hopDong.form.ncc')} value={data.ten_nha_cung_cap ?? '—'} />
              <DetailField
                label={t('hopDong.form.trangThai')}
                value={
                  data.trang_thai === 'Đã thanh lý' ? t('hopDong.trangThai.daThanhLy') : t('hopDong.trangThai.dangThucHien')
                }
              />
              <DetailField label={t('hopDong.form.tenHopDong')} value={data.ten_hop_dong ?? '—'} className="sm:col-span-2" />
              <DetailField label={t('hopDong.form.noiDung')} value={data.noi_dung ?? '—'} className="sm:col-span-2" />
              <DetailField
                label={t('hopDong.form.soLuongCay')}
                value={formatNumberVN(data.so_luong_cay != null ? Number(data.so_luong_cay) : null)}
              />
              <DetailField
                label={t('hopDong.form.donGia')}
                value={formatNumberVN(data.don_gia != null ? Number(data.don_gia) : null)}
              />
              <DetailField
                label={t('hopDong.form.thanhTien')}
                value={formatNumberVN(data.thanh_tien != null ? Number(data.thanh_tien) : null)}
              />
              <DetailField
                label={t('hopDong.store.soDotCol')}
                value={data.so_dot_thanh_toan != null ? formatNumberVN(Number(data.so_dot_thanh_toan), { maxFractionDigits: 0 }) : '—'}
              />
              <DetailField
                label={t('hopDong.store.tongDaThanhToanCol')}
                value={formatNumberVN(data.tong_da_thanh_toan != null ? Number(data.tong_da_thanh_toan) : null)}
              />
              <DetailField
                label={t('hopDong.store.tongCayDaGiaoCol')}
                value={formatNumberVN(data.tong_cay_da_giao != null ? Number(data.tong_cay_da_giao) : null)}
              />
              <DetailField
                label={t('hopDong.store.tienConLaiCol')}
                value={
                  data.tien_con_lai != null ? (
                    <span className={cn(data.tien_con_lai < 0 && 'text-rose-600')}>
                      {formatNumberVN(Number(data.tien_con_lai))}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailField
                label={t('hopDong.store.cayConLaiCol')}
                value={
                  data.cay_con_lai != null ? (
                    <span className={cn(Number(data.cay_con_lai) < 0 && 'text-rose-600')}>
                      {formatNumberVN(Number(data.cay_con_lai))}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailField label={t('hopDong.form.ghiChu')} value={data.ghi_chu ?? '—'} className="sm:col-span-2" />
              <DetailField label={t('hopDong.form.nguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            </DetailFieldGrid>
          </DetailSection>

          {hinhAnhUrls.length > 0 && (
            <DetailSection title={t('hopDong.detail.hinhAnh')} icon={<Images size={14} className="text-primary" />}>
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

          <GenericSubTableSection
            title={t('hopDong.detail.chiTiet')}
            icon={<Wallet size={14} className="text-primary" />}
            count={lines.length}
            addLabel={canUpdateChiTiet ? t('hopDong.chiTiet.add') : undefined}
            onAdd={canUpdateChiTiet ? openAddCt : undefined}
            emptyTitle={t('hopDong.chiTiet.emptyTitle')}
            emptyDescription={t('hopDong.chiTiet.emptyHint')}
            maxTableHeight="360px"
          >
            <colgroup>
              <col style={{ width: '104px', minWidth: '104px' }} />
              <col style={{ width: '128px', minWidth: '120px' }} />
              <col style={{ width: '120px', minWidth: '116px' }} />
              <col style={{ width: '104px', minWidth: '100px' }} />
              <col style={{ width: '152px', minWidth: '140px' }} />
              <col style={{ minWidth: '180px' }} />
              {canUpdateChiTiet && <col style={{ width: '88px', minWidth: '88px' }} />}
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[104px]">
                  {t('hopDong.form.ctNgay')}
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[120px]">
                  {t('hopDong.form.ctTenDot')}
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[116px]">
                  {t('hopDong.form.ctSoTien')}
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[100px]">
                  {t('hopDong.form.ctSoCay')}
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[140px]">
                  {t('hopDong.form.ctChiNhanh')}
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground min-w-[180px]">
                  {t('hopDong.form.ctGhiChu')}
                </th>
                {canUpdateChiTiet && (
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-[88px] shrink-0 sticky right-0 bg-muted/40">
                    {t('hopDong.chiTiet.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={canUpdateChiTiet ? 7 : 6} className="py-6 text-center text-muted-foreground text-sm">
                    —
                  </td>
                </tr>
              ) : (
                lines.map((ct) => (
                  <tr key={ct.id} className="border-b border-border/60">
                    <td className="py-2.5 px-3 text-sm whitespace-nowrap">
                      {ct.ngay ? formatDateShort(ct.ngay) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-sm min-w-[120px]">{ct.ten_dot ?? '—'}</td>
                    <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap">
                      {formatNumberVN(ct.so_tien != null ? Number(ct.so_tien) : null)}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap">
                      {formatNumberVN(ct.so_cay_thuc_nhan != null ? Number(ct.so_cay_thuc_nhan) : null)}
                    </td>
                    <td className="py-2.5 px-3 text-sm min-w-[140px]">
                      {ct.id_chi_nhanh ? (cnMap[ct.id_chi_nhanh] ?? ct.id_chi_nhanh) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-muted-foreground min-w-[180px] max-w-[280px] truncate" title={ct.ghi_chu ?? undefined}>
                      {ct.ghi_chu ?? '—'}
                    </td>
                    {canUpdateChiTiet && (
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[88px] shrink-0 sticky right-0 bg-card">
                        <button
                          type="button"
                          onClick={() => openEditCt(ct)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md mr-0.5"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCt(ct.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </GenericSubTableSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {showStatusPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowStatusPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{t('hopDong.detail.statusDialogTitle')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowStatusPopup(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{data.ma_hop_dong}</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <Combobox
                  label={t('hopDong.form.trangThai')}
                  options={trangThaiOptions}
                  value={statusDraft}
                  onChange={(v) => setStatusDraft(v as typeof statusDraft)}
                  required
                />
                <Textarea
                  label={t('hopDong.detail.statusDialogGhiChu')}
                  placeholder={t('hopDong.detail.statusDialogGhiChuPlaceholder')}
                  value={ghiChuDraft}
                  onChange={(e) => setGhiChuDraft(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="px-6 pb-6 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowStatusPopup(false)}
                  className="border border-border text-muted-foreground"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={submitStatus}
                  disabled={statusMutation.isPending}
                  className="bg-primary text-white"
                >
                  {t('hopDong.detail.statusDialogSave')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HopDongChiTietModal
        open={ctModalOpen}
        onClose={() => {
          setCtModalOpen(false);
          setEditingLine(null);
        }}
        initial={editingLine}
        chiNhanhList={chiNhanhList}
        onSubmit={onSaveCt}
        isLoading={ctPending}
      />

      {lightboxIndex !== null && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            key="hop-dong-lightbox-backdrop"
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
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label={t('hopDong.detail.prevImage')}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {lightboxIndex < hinhAnhUrls.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label={t('hopDong.detail.nextImage')}
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

export default HopDongDetail;
