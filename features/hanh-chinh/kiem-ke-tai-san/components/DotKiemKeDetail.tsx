import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, List, CheckCircle, Printer, Power, PackagePlus, Plus, FileText, X } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { formatDate, cn } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { getTrangThaiDotLabel } from '../core/constants';
import type { DotKiemKe, ChiTietKiemKe, ChiTietKiemKeUpdate } from '../core/types';
import { useUpdateChiTietKetQua, useDeleteChiTietKiemKe, useThemChiTietPhatHien, useCapNhatSoTheoKetQua, useUpdateDotKiemKe } from '../hooks/use-kiem-ke-tai-san';
import type { ThemChiTietPhatHienPayload } from '../services/kiem-ke-tai-san-service';
import NhapKetQuaKiemKeDialog from './NhapKetQuaKiemKeDialog';
import ThemTaiSanThucTeDialog from './ThemTaiSanThucTeDialog';
import ChiTietKiemKeTaiSanTable from './ChiTietKiemKeTaiSanTable';

/** URL trang preview phiếu kiểm kê (mở tab mới). App dùng HashRouter nên route nằm sau # */
const getPhieuKiemKePreviewUrl = (id: string) =>
  `/phieu-kiem-ke/${encodeURIComponent(id)}`;

interface Props {
  data: DotKiemKe;
  chiTiet: ChiTietKiemKe[];
  chiTietLoading: boolean;
  onClose: () => void;
  onEdit?: (item: DotKiemKe) => void;
  onTaoDanhSach?: (id: string) => void;
  onHoanThanh?: (id: string) => void;
  onStatusChange?: (item: DotKiemKe) => void;
  taoDanhSachLoading?: boolean;
  hoanThanhLoading?: boolean;
}

const DotKiemKeDetail: React.FC<Props> = ({
  data,
  chiTiet,
  chiTietLoading,
  onClose,
  onEdit,
  onTaoDanhSach,
  onHoanThanh,
  onStatusChange,
  taoDanhSachLoading,
  hoanThanhLoading,
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const [nhapKetQuaRow, setNhapKetQuaRow] = useState<ChiTietKiemKe | null>(null);
  const [themTaiSanThucTeOpen, setThemTaiSanThucTeOpen] = useState(false);
  const [ghiChuOpen, setGhiChuOpen] = useState(false);
  const [ghiChuValue, setGhiChuValue] = useState(data.ghi_chu ?? '');

  useEffect(() => {
    if (ghiChuOpen) setGhiChuValue(data.ghi_chu ?? '');
  }, [ghiChuOpen, data.ghi_chu]);

  const updateDotMutation = useUpdateDotKiemKe(() => setGhiChuOpen(false));

  const handleSaveGhiChu = useCallback(() => {
    updateDotMutation.mutate(
      { id: data.id, data: { ghi_chu: ghiChuValue.trim() || undefined } },
      { onSuccess: () => setGhiChuOpen(false) }
    );
  }, [data.id, ghiChuValue, updateDotMutation]);

  const updateKetQuaMutation = useUpdateChiTietKetQua(data.id, useCallback(() => {
    setNhapKetQuaRow(null);
  }, []));
  const themPhatHienMutation = useThemChiTietPhatHien(data.id, useCallback(() => {
    setThemTaiSanThucTeOpen(false);
  }, []));
  const capNhatSoMutation = useCapNhatSoTheoKetQua(data.id);
  const deleteChiTietMutation = useDeleteChiTietKiemKe(data.id);
  const confirm = useConfirmStore((s) => s.confirm);

  const existingTaiSanIds = useMemo(() => new Set(chiTiet.map((c) => c.id_tai_san)), [chiTiet]);

  const isDraft = data.trang_thai === 'Nháp';
  const isDangKiemKe = data.trang_thai === 'Đang kiểm kê';

  const handleNhapKetQuaSave = useCallback(
    (payload: ChiTietKiemKeUpdate) => {
      if (!nhapKetQuaRow || !currentUserId) return;
      updateKetQuaMutation.mutate({
        id_chi_tiet: nhapKetQuaRow.id,
        data: payload,
        id_nguoi_kiem: currentUserId,
      });
    },
    [nhapKetQuaRow, currentUserId, updateKetQuaMutation]
  );

  const handleThemTaiSanThucTeConfirm = useCallback(
    (payload: ThemChiTietPhatHienPayload) => {
      if (!currentUserId) return;
      themPhatHienMutation.mutate({ payload, id_nguoi_kiem: currentUserId });
    },
    [currentUserId, themPhatHienMutation]
  );

  const stats = useMemo(() => {
    const khop = chiTiet.filter((c) => c.ket_qua === 'Khớp').length;
    const chenh = chiTiet.filter(
      (c) =>
        c.ket_qua === 'Chênh nơi lưu' ||
        c.ket_qua === 'Chênh người giữ' ||
        c.ket_qua === 'Chênh trạng thái'
    ).length;
    const chuaKiem = chiTiet.filter((c) => c.ket_qua === 'Chưa kiểm').length;
    return { khop, chenh, chuaKiem, total: chiTiet.length };
  }, [chiTiet]);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [
      {
        label: t('kiemKeTaiSan.printPhieu'),
        icon: <Printer size={16} />,
        onClick: () => window.open(getPhieuKiemKePreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
      {
        label: t('kiemKeTaiSan.detail.fillNote'),
        icon: <FileText size={16} />,
        onClick: () => setGhiChuOpen(true),
        variant: 'outline',
      },
    ];
    if ((isDraft || isDangKiemKe) && onTaoDanhSach) {
      actions.push({
        label: t('kiemKeTaiSan.taoDanhSach'),
        icon: <List size={16} />,
        onClick: () => onTaoDanhSach(data.id),
        variant: 'success',
        disabled: taoDanhSachLoading,
      });
    }
    if (isDangKiemKe) {
      if (onHoanThanh) {
        actions.push({
          label: t('kiemKeTaiSan.hoanThanh'),
          icon: <CheckCircle size={16} />,
          onClick: () => onHoanThanh(data.id),
          variant: 'success',
          disabled: hoanThanhLoading,
        });
      }
    }
    if (onStatusChange) {
      actions.push({
        label: t('kiemKeTaiSan.changeStatus'),
        icon: <Power size={16} />,
        onClick: () => onStatusChange(data),
        variant: 'info',
      });
    }
    return actions;
  }, [data, isDraft, isDangKiemKe, onTaoDanhSach, onHoanThanh, onStatusChange, taoDanhSachLoading, hoanThanhLoading, t]);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={isDraft || isDangKiemKe}
      onEdit={onEdit ? () => onEdit(data) : undefined}
    />
  );

  return (
    <GenericDrawer
      title={data.ma_dot}
      subtitle={data.ten_dot}
      icon={<ClipboardCheck size={20} className="text-primary" />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={renderFooter}
    >
      {toolbarActions.length > 0 && (
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border mb-4" />
      )}
      <DetailSection title={t('kiemKeTaiSan.form.infoSection')} icon={<ClipboardCheck size={14} />} variant="primary">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label={t('kiemKeTaiSan.store.maDotCol')} value={data.ma_dot} />
          <DetailField label={t('kiemKeTaiSan.store.tenDotCol')} value={data.ten_dot} />
          <DetailField label={t('kiemKeTaiSan.store.ngayBatDauCol')} value={formatDate(data.ngay_bat_dau)} />
          <DetailField label={t('kiemKeTaiSan.store.ngayKetThucCol')} value={formatDate(data.ngay_ket_thuc)} />
          <DetailField
            label={t('kiemKeTaiSan.store.trangThaiCol')}
            value={getTrangThaiDotLabel(data.trang_thai)}
          />
          <DetailField
            label={t('kiemKeTaiSan.store.nguoiPhuTrachCol')}
            value={data.ten_nguoi_phu_trach || data.ma_nguoi_phu_trach || '—'}
          />
          <DetailField label={t('kiemKeTaiSan.store.ghiChuCol')} value={data.ghi_chu} className="sm:col-span-2" />
        </div>
      </DetailSection>

      <DetailSection
        title={t('kiemKeTaiSan.chiTietSection')}
        icon={<List size={14} />}
        variant="primary"
        action={
          (isDraft || isDangKiemKe) ? (
            isDraft && onTaoDanhSach ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onTaoDanhSach(data.id)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3"
                disabled={taoDanhSachLoading}
              >
                <Plus size={14} className="mr-1.5" />
                {t('kiemKeTaiSan.taoDanhSach')}
              </Button>
            ) : isDangKiemKe ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setThemTaiSanThucTeOpen(true)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3"
                disabled={themPhatHienMutation.isPending}
              >
                <PackagePlus size={14} className="mr-1.5" />
                {t('kiemKeTaiSan.themTaiSanThucTe')}
              </Button>
            ) : undefined
          ) : undefined
        }
      >
        {isDraft && chiTiet.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {t('kiemKeTaiSan.taoDanhSachHint')}
          </p>
        )}
        {chiTiet.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {t('kiemKeTaiSan.stats.total')}: {stats.total}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {t('kiemKeTaiSan.ketQua.khop')}: {stats.khop}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {t('kiemKeTaiSan.stats.chenh')}: {stats.chenh}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {t('kiemKeTaiSan.ketQua.chua_kiem')}: {stats.chuaKiem}
            </span>
          </div>
        )}
        <ChiTietKiemKeTaiSanTable
          data={chiTiet}
          isLoading={chiTietLoading}
          showActions={isDraft || isDangKiemKe}
          isDangKiemKe={isDangKiemKe}
          onNhapKetQua={(item) => setNhapKetQuaRow(item)}
          onCapNhatSo={(id) => capNhatSoMutation.mutate(id)}
          onDelete={(item) => {
            confirm({
              title: t('kiemKeTaiSan.table.xoaDong'),
              message: t('kiemKeTaiSan.detail.deleteLineConfirm'),
              variant: 'danger',
              confirmText: t('common.delete'),
              onConfirm: () => deleteChiTietMutation.mutate(item.id),
            });
          }}
          capNhatSoLoading={capNhatSoMutation.isPending}
          nhapKetQuaLoading={updateKetQuaMutation.isPending}
          deleteLoading={deleteChiTietMutation.isPending}
        />
      </DetailSection>

      <NhapKetQuaKiemKeDialog
        open={nhapKetQuaRow != null}
        row={nhapKetQuaRow}
        onClose={() => setNhapKetQuaRow(null)}
        onSave={handleNhapKetQuaSave}
        isLoading={updateKetQuaMutation.isPending}
      />

      <ThemTaiSanThucTeDialog
        open={themTaiSanThucTeOpen}
        existingTaiSanIds={existingTaiSanIds}
        onClose={() => setThemTaiSanThucTeOpen(false)}
        onConfirm={handleThemTaiSanThucTeConfirm}
        isLoading={themPhatHienMutation.isPending}
      />

      <AnimatePresence>
        {ghiChuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !updateDotMutation.isPending && setGhiChuOpen(false)}
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
                  <h3 className="text-sm font-semibold text-foreground">{t('kiemKeTaiSan.detail.ghiChuDialogTitle')}</h3>
                  <button
                    type="button"
                    onClick={() => !updateDotMutation.isPending && setGhiChuOpen(false)}
                    disabled={updateDotMutation.isPending}
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
                    placeholder={t('kiemKeTaiSan.form.ghiChuPlaceholder')}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
                  <Button variant="outline" onClick={() => setGhiChuOpen(false)} disabled={updateDotMutation.isPending}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSaveGhiChu} isLoading={updateDotMutation.isPending}>
                    {t('common.save')}
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

export default DotKiemKeDetail;
