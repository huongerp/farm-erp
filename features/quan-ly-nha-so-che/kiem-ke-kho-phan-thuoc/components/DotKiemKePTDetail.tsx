import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  List,
  CheckCircle,
  Printer,
  Power,
  RefreshCw,
  FileText,
  Calendar,
  User,
  Warehouse,
  BarChart3,
  Package,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_KIEM_KE_KHO } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { formatDate, formatDateTimeShort, cn } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import {
  getTrangThaiDotLabelPT,
  TRANG_THAI_DOT_SEMANTIC_PT,
  KET_QUA_SEMANTIC_PT,
} from '../core/constants';
import { getPhieuKiemKePTPreviewUrl } from '../core/preview-url';
import { countPendingDieuChinhPT, getChiTietKiemKePTStats } from '../core/ket-qua';
import { coTheSuaChiTietPT, coTheChuyenTrangThaiDotPT } from '../core/quyen-sua-dot';
import { useKiemKeCapCaoPT } from '../hooks/use-kiem-ke-cap-cao';
import {
  useUpdateChiTietKetQuaPT,
  useCreateChiTietKiemKePT,
  useDeleteChiTietKiemKePT,
  useDieuChinhTonTheoKetQuaPT,
  useDieuChinhTonTheoDotPT,
} from '../hooks/use-kiem-ke-pt';
import NhapKetQuaKiemKePTDialog from './NhapKetQuaKiemKePTDialog';
import ThemDongKiemKePTDialog from './ThemDongKiemKePTDialog';
import ChiTietKiemKePTSubTable from './ChiTietKiemKePTSubTable';
import type { DotKiemKePT, ChiTietKiemKePT, ChiTietKiemKePTUpdate, KetQuaKiemKePT } from '../core/types';

const KET_QUA_CHIPS: KetQuaKiemKePT[] = ['khop', 'thieu', 'thua', 'chua_kiem'];

interface Props {
  data: DotKiemKePT;
  chiTiet: ChiTietKiemKePT[];
  chiTietLoading: boolean;
  onClose: () => void;
  onEdit?: (item: DotKiemKePT) => void;
  onTaoDanhSach?: (id: string) => void;
  onHoanThanh?: (id: string) => void;
  onStatusChange?: (item: DotKiemKePT) => void;
  taoDanhSachLoading?: boolean;
  hoanThanhLoading?: boolean;
}

const DotKiemKePTDetail: React.FC<Props> = ({
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
  const confirm = useConfirmStore((s) => s.confirm);
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');
  const [nhapKetQuaRow, setNhapKetQuaRow] = useState<ChiTietKiemKePT | null>(null);
  const [showThemDong, setShowThemDong] = useState(false);

  const updateKetQuaMutation = useUpdateChiTietKetQuaPT(() => setNhapKetQuaRow(null));
  const createChiTietMutation = useCreateChiTietKiemKePT(data.id, () => setShowThemDong(false));
  const deleteChiTietMutation = useDeleteChiTietKiemKePT();
  const dieuChinhRowMutation = useDieuChinhTonTheoKetQuaPT();
  const dieuChinhDotMutation = useDieuChinhTonTheoDotPT(data.id);

  const isDangKiemKe = data.trang_thai === 'dang_kiem_ke';
  // Đợt đã chốt sổ chỉ cấp cao mới sửa được — cùng luật với service.
  const capCao = useKiemKeCapCaoPT();
  const canEditLines = coTheSuaChiTietPT(data.trang_thai, capCao);
  const canChangeStatus = coTheChuyenTrangThaiDotPT(data.trang_thai, capCao);

  const stats = useMemo(() => getChiTietKiemKePTStats(chiTiet), [chiTiet]);
  const pendingDieuChinhCount = useMemo(
    () => countPendingDieuChinhPT(chiTiet, data.trang_thai),
    [chiTiet, data.trang_thai]
  );

  const handleNhapKetQuaSave = useCallback(
    (payload: ChiTietKiemKePTUpdate) => {
      if (!nhapKetQuaRow || !currentUserId) return;
      updateKetQuaMutation.mutate({
        id_chi_tiet: nhapKetQuaRow.id,
        data: payload,
        id_nguoi_kiem: currentUserId,
      });
    },
    [nhapKetQuaRow, currentUserId, updateKetQuaMutation]
  );

  const handleDieuChinhDotClick = useCallback(() => {
    confirm({
      title: t('kiemKeKhoPT.confirm.dieuChinhDotTitle'),
      message: t('kiemKeKhoPT.confirm.dieuChinhDotMessage', { count: pendingDieuChinhCount }),
      variant: 'warning',
      onConfirm: () => {
        void dieuChinhDotMutation.mutateAsync();
      },
    });
  }, [confirm, t, pendingDieuChinhCount, dieuChinhDotMutation]);

  const handleDieuChinhRow = useCallback(
    (id: string) => {
      confirm({
        title: t('kiemKeKhoPT.confirm.dieuChinhRowTitle'),
        message: t('kiemKeKhoPT.confirm.dieuChinhRowMessage'),
        variant: 'warning',
        onConfirm: () => {
          void dieuChinhRowMutation.mutateAsync(id);
        },
      });
    },
    [confirm, t, dieuChinhRowMutation]
  );

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [
      {
        label: t('kiemKeKhoPT.printPhieu'),
        icon: <Printer size={16} />,
        onClick: () => window.open(getPhieuKiemKePTPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
    ];
    if (isDangKiemKe && pendingDieuChinhCount > 0) {
      actions.push({
        label: t('kiemKeKhoPT.dieuChinhTonDot'),
        icon: <RefreshCw size={16} />,
        onClick: handleDieuChinhDotClick,
        variant: 'secondary',
        disabled: dieuChinhDotMutation.isPending,
      });
    }
    if (canEditLines && onTaoDanhSach) {
      actions.push({
        label: t('kiemKeKhoPT.taoDanhSach'),
        icon: <List size={16} />,
        onClick: () => onTaoDanhSach(data.id),
        variant: 'success',
        disabled: taoDanhSachLoading,
      });
    }
    if (isDangKiemKe && onHoanThanh) {
      actions.push({
        label: t('kiemKeKhoPT.hoanThanh'),
        icon: <CheckCircle size={16} />,
        onClick: () => onHoanThanh(data.id),
        variant: 'success',
        disabled: hoanThanhLoading,
      });
    }
    if (onStatusChange && canChangeStatus) {
      actions.push({
        label: t('kiemKeKhoPT.changeStatus'),
        icon: <Power size={16} />,
        onClick: () => onStatusChange(data),
        variant: 'info',
      });
    }
    return actions;
  }, [
    data,
    canEditLines,
    canChangeStatus,
    isDangKiemKe,
    pendingDieuChinhCount,
    handleDieuChinhDotClick,
    onTaoDanhSach,
    onHoanThanh,
    onStatusChange,
    taoDanhSachLoading,
    hoanThanhLoading,
    dieuChinhDotMutation,
    t,
  ]);

  return (
    <GenericDrawer
      title={t('kiemKeKhoPT.detail.title')}
      subtitle={data.ma_dot}
      icon={<ClipboardCheck size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_KIEM_KE_KHO}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          canUpdate={canEditLines}
          onEdit={onEdit ? () => onEdit(data) : undefined}
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <ClipboardCheck size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ma_dot}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5 line-clamp-1">{data.ten_dot}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                  getStatusBadgeClass(TRANG_THAI_DOT_SEMANTIC_PT[data.trang_thai])
                )}
              >
                {getTrangThaiDotLabelPT(data.trang_thai, t)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border tabular-nums">
                {formatDate(data.ngay_bat_dau)} – {formatDate(data.ngay_ket_thuc)}
              </span>
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('kiemKeKhoPT.detail.basicInfo')} icon={<ClipboardCheck size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('kiemKeKhoPT.store.maDotCol')} value={data.ma_dot} icon={<FileText size={12} />} />
            <DetailField label={t('kiemKeKhoPT.store.tenDotCol')} value={data.ten_dot} icon={<FileText size={12} />} />
            <DetailField
              label={t('kiemKeKhoPT.store.trangThaiCol')}
              value={getTrangThaiDotLabelPT(data.trang_thai, t)}
              icon={<CheckCircle size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.ngayBatDauCol')}
              value={formatDate(data.ngay_bat_dau)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.ngayKetThucCol')}
              value={formatDate(data.ngay_ket_thuc)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.soKhoCol')}
              value={String(data.id_kho?.length ?? 0)}
              icon={<Warehouse size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.nguoiTaoCol')}
              value={data.ten_nguoi_tao || data.ma_nguoi_tao || '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.nguoiPhuTrachCol')}
              value={data.ten_nguoi_phu_trach || data.ma_nguoi_phu_trach || '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.ghiChuCol')}
              value={data.ghi_chu ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2 lg:col-span-3"
            />
          </DetailFieldGrid>
        </DetailSection>

        {chiTiet.length > 0 && (
          <DetailSection title={t('kiemKeKhoPT.detail.progress')} icon={<BarChart3 size={14} />} variant="secondary">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20 tabular-nums">
                {t('kiemKeKhoPT.stats.total')}: {stats.total}
              </span>
              {KET_QUA_CHIPS.map((key) => (
                <span
                  key={key}
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border tabular-nums',
                    getStatusBadgeClass(KET_QUA_SEMANTIC_PT[key])
                  )}
                >
                  {t(`kiemKeKhoPT.ketQua.${key}`)}:{' '}
                  {key === 'khop' ? stats.khop : key === 'thieu' ? stats.thieu : key === 'thua' ? stats.thua : stats.chuaKiem}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        <GenericSubTableSection
          title={t('kiemKeKhoPT.detail.lines')}
          icon={<Package size={14} className="text-primary" />}
          count={chiTiet.length}
          addLabel={canEditLines ? t('kiemKeKhoPT.detail.addLine') : undefined}
          onAdd={canEditLines ? () => setShowThemDong(true) : undefined}
          loading={chiTietLoading}
          loadingText={t('kiemKeKhoPT.loading')}
          emptyTitle={t('kiemKeKhoPT.chiTietEmpty')}
          emptyDescription={t('kiemKeKhoPT.chiTietEmptyHint')}
          maxTableHeight="360px"
          tableClassName="min-w-max"
        >
          {chiTiet.length > 0 && (
            <ChiTietKiemKePTSubTable
              data={chiTiet}
              showActions={canEditLines}
              isDangKiemKe={isDangKiemKe}
              onNhapKetQua={(item) => setNhapKetQuaRow(item)}
              onDieuChinh={handleDieuChinhRow}
              onDelete={(item) => {
                confirm({
                  title: t('kiemKeKhoPT.table.xoaDong'),
                  message: t('kiemKeKhoPT.detail.deleteLineConfirm'),
                  variant: 'danger',
                  confirmText: t('common.delete'),
                  onConfirm: () => deleteChiTietMutation.mutateAsync(item.id),
                });
              }}
              dieuChinhLoading={dieuChinhRowMutation.isPending}
              nhapKetQuaLoading={updateKetQuaMutation.isPending}
              deleteLoading={deleteChiTietMutation.isPending}
            />
          )}
        </GenericSubTableSection>

        <DetailSection title={t('kiemKeKhoPT.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField
              label={t('kiemKeKhoPT.store.createdAtCol')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKhoPT.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>

      <NhapKetQuaKiemKePTDialog
        open={nhapKetQuaRow != null}
        row={nhapKetQuaRow}
        onClose={() => setNhapKetQuaRow(null)}
        onSave={handleNhapKetQuaSave}
        isLoading={updateKetQuaMutation.isPending}
      />

      <ThemDongKiemKePTDialog
        open={showThemDong}
        onClose={() => setShowThemDong(false)}
        onConfirm={(id_kho_list, id_hang_hoa) =>
          createChiTietMutation.mutate({ id_kho_list, id_hang_hoa })
        }
        isLoading={createChiTietMutation.isPending}
        idKhoOfDot={data.id_kho ?? []}
        chiTiet={chiTiet}
      />
    </GenericDrawer>
  );
};

export default DotKiemKePTDetail;
