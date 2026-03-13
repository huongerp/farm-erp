import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, List, CheckCircle, Edit, Printer, Power, PenLine, PackagePlus, RefreshCw, FileText, X } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CLOSE, BTN_EDIT } from '../../../../lib/button-labels';
import { formatDate, cn } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel, getKetQuaLabel } from '../core/constants';
import type { DotKiemKe, ChiTietKiemKe, ChiTietKiemKeUpdate } from '../core/types';
import { useUpdateChiTietKetQua, useThemChiTietPhatHien, useCapNhatSoTheoKetQua, useUpdateDotKiemKe } from '../hooks/use-kiem-ke-tai-san';
import type { ThemChiTietPhatHienPayload } from '../services/kiem-ke-tai-san-service';
import NhapKetQuaKiemKeDialog from './NhapKetQuaKiemKeDialog';
import ThemTaiSanThucTeDialog from './ThemTaiSanThucTeDialog';

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
    if (isDraft && onTaoDanhSach) {
      actions.push({
        label: t('kiemKeTaiSan.taoDanhSach'),
        icon: <List size={16} />,
        onClick: () => onTaoDanhSach(data.id),
        variant: 'success',
        disabled: taoDanhSachLoading,
      });
    }
    if (isDangKiemKe) {
      actions.push({
        label: t('kiemKeTaiSan.themTaiSanThucTe'),
        icon: <PackagePlus size={16} />,
        onClick: () => setThemTaiSanThucTeOpen(true),
        variant: 'secondary',
        disabled: themPhatHienMutation.isPending,
      });
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
  }, [data, chiTiet, isDraft, isDangKiemKe, onTaoDanhSach, onHoanThanh, onStatusChange, taoDanhSachLoading, hoanThanhLoading, themPhatHienMutation.isPending, t]);

  const renderFooter = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3 flex-wrap">
        {isDraft && onEdit && (
          <Button
            onClick={() => onEdit(data)}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
      </div>
    </div>
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

      <DetailSection title={t('kiemKeTaiSan.chiTietSection')} icon={<List size={14} />} variant="primary">
        {isDraft && chiTiet.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {t('kiemKeTaiSan.taoDanhSachHint')}
          </p>
        )}
        {(isDangKiemKe || data.trang_thai === 'Hoàn thành') && chiTiet.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {t('kiemKeTaiSan.stats.total')}: {stats.total}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700">
                {t('kiemKeTaiSan.ketQua.khop')}: {stats.khop}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700">
                {t('kiemKeTaiSan.stats.chenh')}: {stats.chenh}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {t('kiemKeTaiSan.ketQua.chua_kiem')}: {stats.chuaKiem}
              </span>
            </div>
            {chiTietLoading ? (
              <p className="text-sm text-muted-foreground py-4">{t('kiemKeTaiSan.loading')}</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('kiemKeTaiSan.store.taiSanCol')}
                        </th>
                        <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('kiemKeTaiSan.store.noiLuuSoCol')}
                        </th>
                        <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('kiemKeTaiSan.store.nguoiGiuSoCol')}
                        </th>
                        <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('kiemKeTaiSan.store.ketQuaCol')}
                        </th>
                        {isDangKiemKe && (
                          <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-[120px]">
                            {t('common.actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {chiTiet.map((c) => (
                        <tr key={c.id}>
                          <td className="px-3 py-2">
                            <span className="font-medium">{c.ten_tai_san || c.ma_tai_san || '—'}</span>
                            {c.ma_tai_san && (
                              <span className="text-xs text-muted-foreground block">{c.ma_tai_san}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-foreground">{c.ten_noi_luu_so || '—'}</td>
                          <td className="px-3 py-2 text-foreground">{c.ten_nguoi_giu_so || '—'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                c.ket_qua === 'Khớp'
                                  ? 'bg-emerald-500/10 text-emerald-700'
                                  : c.ket_qua === 'Chưa kiểm'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-amber-500/10 text-amber-700'
                              }`}
                            >
                              {getKetQuaLabel(c.ket_qua)}
                            </span>
                          </td>
                          {isDangKiemKe && (
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="shrink-0 border-border"
                                  onClick={() => setNhapKetQuaRow(c)}
                                  disabled={updateKetQuaMutation.isPending}
                                  title={t('kiemKeTaiSan.table.nhapKetQua')}
                                >
                                  <PenLine size={16} />
                                </Button>
                                {(c.ket_qua === 'Chênh nơi lưu' ||
                                  c.ket_qua === 'Chênh người giữ' ||
                                  c.ket_qua === 'Chênh trạng thái') &&
                                  (c.id_noi_luu_thuc_te != null ||
                                    c.id_nguoi_giu_thuc_te != null ||
                                    c.id_trang_thai_thuc_te != null) && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 border-border"
                                    onClick={() => capNhatSoMutation.mutate(c.id)}
                                    disabled={capNhatSoMutation.isPending}
                                    title={t('kiemKeTaiSan.capNhatSoTheoKetQua')}
                                  >
                                    <RefreshCw size={16} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
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
