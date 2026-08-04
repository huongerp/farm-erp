import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, List, Printer, FileText, RefreshCw, X } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { formatCurrency, cn } from '../../../../lib/utils';
import { getTrangThaiKyLabel, TRANG_THAI_KY_OPTIONS } from '../core/constants';
import { useUpdateKyKhauHaoGhiChu, useUpdateKyKhauHaoTrangThai } from '../hooks/use-khau-hao-tai-san';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import Select from '../../../../components/ui/Select';
import type { KyKhauHao, ChiTietKhauHao } from '../core/types';
import type { TrangThaiKyKhauHao } from '../core/types';

interface Props {
  data: KyKhauHao;
  chiTiet: ChiTietKhauHao[];
  chiTietLoading: boolean;
  onClose: () => void;
  onEdit?: (item: KyKhauHao) => void;
  onTinhToan?: (idKy: string) => void;
  onChotKy?: (idKy: string) => void;
  tinhToanLoading?: boolean;
  chotKyLoading?: boolean;
}

const KyKhauHaoDetail: React.FC<Props> = ({
  data,
  chiTiet,
  chiTietLoading,
  onClose,
  onEdit,
  onTinhToan,
  onChotKy,
  tinhToanLoading,
  chotKyLoading,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const [ghiChuOpen, setGhiChuOpen] = useState(false);
  const [ghiChuValue, setGhiChuValue] = useState(data.ghi_chu ?? '');

  const updateGhiChu = useUpdateKyKhauHaoGhiChu(() => setGhiChuOpen(false));
  const updateTrangThai = useUpdateKyKhauHaoTrangThai();

  useEffect(() => {
    if (ghiChuOpen) setGhiChuValue(data.ghi_chu ?? '');
  }, [ghiChuOpen, data.ghi_chu]);

  const handleSaveGhiChu = useCallback(() => {
    updateGhiChu.mutate(
      { id: data.id, ghi_chu: ghiChuValue.trim() || null },
      { onSuccess: () => setGhiChuOpen(false) }
    );
  }, [data.id, ghiChuValue, updateGhiChu]);

  const handleChuyenTrangThai = useCallback(() => {
    if (data.trang_thai !== 'chot') return;
    let selectedTrangThai: TrangThaiKyKhauHao = 'draft';
    const optionsForChot = TRANG_THAI_KY_OPTIONS.filter((o) => o.value === 'draft').map((o) => ({
      value: o.value,
      label: t(o.labelKey),
    }));
    confirm({
      title: t('khauHaoTaiSan.detail.trangThaiDialogTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm text-muted-foreground">
            {t('khauHaoTaiSan.detail.changeStatusMessage')}
          </p>
          <Select
            label={t('khauHaoTaiSan.detail.newStatus')}
            defaultValue="draft"
            options={optionsForChot}
            onChange={(e) => {
              selectedTrangThai = e.target.value as TrangThaiKyKhauHao;
            }}
            className="w-full"
          />
        </div>
      ),
      variant: 'default',
      confirmText: CONFIRM_YES(),
      onConfirm: () =>
        updateTrangThai.mutate({ id: data.id, trang_thai: selectedTrangThai }),
    });
  }, [data.id, data.trang_thai, confirm, t, updateTrangThai]);

  const isDraft = data.trang_thai === 'draft';
  const hasChiTiet = chiTiet.length > 0;

  const getBaoCaoPreviewUrl = (idKy: string) =>
    `/bao-cao-khau-hao/${encodeURIComponent(idKy)}`;

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [
      {
        label: t('khauHaoTaiSan.detail.printReport'),
        icon: <Printer size={16} />,
        onClick: () => window.open(getBaoCaoPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
      {
        label: t('khauHaoTaiSan.detail.fillNote'),
        icon: <FileText size={16} />,
        onClick: () => setGhiChuOpen(true),
        variant: 'outline',
      },
    ];
    if (data.trang_thai === 'chot') {
      actions.push({
        label: t('khauHaoTaiSan.detail.changeStatus'),
        icon: <RefreshCw size={16} />,
        onClick: handleChuyenTrangThai,
        variant: 'outline',
        disabled: updateTrangThai.isPending,
      });
    }
    if (isDraft && onTinhToan) {
      actions.push({
        label: t('khauHaoTaiSan.detail.tinhToan'),
        icon: <Calculator size={16} />,
        onClick: () => onTinhToan(data.id),
        variant: 'primary',
        disabled: tinhToanLoading,
      });
    }
    if (isDraft && hasChiTiet && onChotKy) {
      actions.push({
        label: t('khauHaoTaiSan.detail.chotKy'),
        icon: <List size={16} />,
        onClick: () => onChotKy(data.id),
        variant: 'success',
        disabled: chotKyLoading,
      });
    }
    return actions;
  }, [
    data.id,
    data.trang_thai,
    isDraft,
    hasChiTiet,
    onTinhToan,
    onChotKy,
    tinhToanLoading,
    chotKyLoading,
    handleChuyenTrangThai,
    updateTrangThai.isPending,
    t,
  ]);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={isDraft}
      onEdit={onEdit ? () => onEdit(data) : undefined}
    />
  );

  return (
    <GenericDrawer
      title={`${t('khauHaoTaiSan.detail.title')} ${data.thang}/${data.nam}`}
      subtitle={getTrangThaiKyLabel(data.trang_thai, t)}
      icon={<Calculator size={20} className="text-primary" />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={renderFooter}
    >
      {toolbarActions.length > 0 && (
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border mb-4" />
      )}
      <DetailSection title={t('khauHaoTaiSan.detail.title')} icon={<Calculator size={14} />} variant="primary">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label={t('khauHaoTaiSan.store.thangCol')} value={String(data.thang)} />
          <DetailField label={t('khauHaoTaiSan.store.namCol')} value={String(data.nam)} />
          <DetailField
            label={t('khauHaoTaiSan.store.trangThaiCol')}
            value={getTrangThaiKyLabel(data.trang_thai, t)}
          />
          <DetailField
            label={t('khauHaoTaiSan.store.tongNguyenGiaCol')}
            value={data.tong_nguyen_gia != null ? formatCurrency(data.tong_nguyen_gia) : '—'}
          />
          <DetailField
            label={t('khauHaoTaiSan.store.tongKhauHaoKyCol')}
            value={data.tong_khau_hao_ky != null ? formatCurrency(data.tong_khau_hao_ky) : '—'}
          />
          {data.ghi_chu ? (
            <div className="col-span-1 sm:col-span-2">
              <DetailField label={t('khauHaoTaiSan.form.ghiChu')} value={data.ghi_chu} />
            </div>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title={t('khauHaoTaiSan.detail.chiTietSection')} icon={<List size={14} />} variant="primary">
        {chiTietLoading && (
          <p className="text-sm text-muted-foreground py-4">{t('common.loading')}</p>
        )}
        {!chiTietLoading && chiTiet.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">{t('khauHaoTaiSan.detail.emptyChiTiet')}</p>
        )}
        {!chiTietLoading && chiTiet.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                      {t('khauHaoTaiSan.detail.maTaiSanCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                      {t('khauHaoTaiSan.detail.tenTaiSanCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                      {t('khauHaoTaiSan.detail.nhomCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                      {t('khauHaoTaiSan.detail.nguyenGiaCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                      {t('khauHaoTaiSan.detail.giaTriDauKyCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                      {t('khauHaoTaiSan.detail.khauHaoKyCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                      {t('khauHaoTaiSan.detail.khauHaoLuyKeCol')}
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                      {t('khauHaoTaiSan.detail.giaTriCuoiKyCol')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chiTiet.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{row.ma_tai_san || '—'}</td>
                      <td className="px-3 py-2">{row.ten_tai_san || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.ten_nhom || '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.nguyen_gia)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.gia_tri_con_lai_dau_ky)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.khau_hao_ky)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.khau_hao_luy_ke)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.gia_tri_con_lai_cuoi_ky)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DetailSection>

      <AnimatePresence>
        {ghiChuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !updateGhiChu.isPending && setGhiChuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'w-full min-w-[min(100%,28rem)] max-w-lg bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col'
                )}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">{t('khauHaoTaiSan.detail.ghiChuDialogTitle')}</h3>
                  <button
                    type="button"
                    onClick={() => !updateGhiChu.isPending && setGhiChuOpen(false)}
                    disabled={updateGhiChu.isPending}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5">
                  <Textarea
                    label=""
                    value={ghiChuValue}
                    onChange={(e) => setGhiChuValue(e.target.value)}
                    placeholder={t('khauHaoTaiSan.detail.ghiChuPlaceholder')}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
                  <Button variant="outline" onClick={() => setGhiChuOpen(false)} disabled={updateGhiChu.isPending}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSaveGhiChu} isLoading={updateGhiChu.isPending}>
                    {t('khauHaoTaiSan.form.save')}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </GenericDrawer>
  );
};

export default KyKhauHaoDetail;
