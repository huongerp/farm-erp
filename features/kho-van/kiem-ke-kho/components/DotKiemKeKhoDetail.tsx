import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, List, CheckCircle, Printer, Power, RefreshCw, FileText, X, Calendar, User, Warehouse, BarChart3 } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_KIEM_KE_KHO } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTableSearchBox from '../../../../components/shared/sub-table/SubTableSearchBox';
import { locChiTietKiemKe, timDongChuaKiemTiepTheo } from '../../../../lib/kiem-ke-chi-tiet';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { formatDate, formatDateTimeShort, cn } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { getTrangThaiDotLabel, TRANG_THAI_DOT_SEMANTIC, KET_QUA_SEMANTIC } from '../core/constants';
import { coTheSuaDot, coTheSuaChiTiet, coTheChuyenTrangThaiDot } from '../core/quyen-sua-dot';
import { useKiemKeCapCao } from '../hooks/use-kiem-ke-cap-cao';
import type { DotKiemKeKho, ChiTietKiemKeKho, ChiTietKiemKeKhoUpdate, KetQuaKiemKeKho } from '../core/types';
import {
  useUpdateChiTietKetQua,
  useCreateChiTietKiemKe,
  useDeleteChiTietKiemKe,
  useDieuChinhTonTheoKetQua,
  useDieuChinhTonTheoDot,
  useUpdateDotKiemKeKho,
} from '../hooks/use-kiem-ke-kho';
import NhapKetQuaKiemKeDialog from './NhapKetQuaKiemKeDialog';
import ThemDongKiemKeDialog from './ThemDongKiemKeDialog';
import ChiTietKiemKeSubTable from './ChiTietKiemKeSubTable';

const getPhieuKiemKeKhoPreviewUrl = (id: string) => `/mua-hang/kiem-ke-kho/preview/${encodeURIComponent(id)}`;

interface ChiTietStats {
  khop: number;
  thieu: number;
  thua: number;
  chuaKiem: number;
  total: number;
}

const KET_QUA_CHIPS: { key: KetQuaKiemKeKho; value: (s: ChiTietStats) => number }[] = [
  { key: 'khop', value: (s) => s.khop },
  { key: 'thieu', value: (s) => s.thieu },
  { key: 'thua', value: (s) => s.thua },
  { key: 'chua_kiem', value: (s) => s.chuaKiem },
];

interface Props {
  data: DotKiemKeKho;
  chiTiet: ChiTietKiemKeKho[];
  chiTietLoading: boolean;
  onClose: () => void;
  onEdit?: (item: DotKiemKeKho) => void;
  onTaoDanhSach?: (id: string) => void;
  onHoanThanh?: (id: string) => void;
  onStatusChange?: (item: DotKiemKeKho) => void;
  taoDanhSachLoading?: boolean;
  hoanThanhLoading?: boolean;
  /** Quyền module — thêm dòng / nhập kết quả / điều chỉnh tồn / ghi chú đợt. */
  canUpdate?: boolean;
  /** Quyền module — xoá dòng. */
  canDelete?: boolean;
}

const DotKiemKeKhoDetail: React.FC<Props> = ({
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
  canUpdate = false,
  canDelete = false,
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const [nhapKetQuaRow, setNhapKetQuaRow] = useState<ChiTietKiemKeKho | null>(null);
  const [ghiChuOpen, setGhiChuOpen] = useState(false);
  const [ghiChuValue, setGhiChuValue] = useState(data.ghi_chu ?? '');
  const [showThemDong, setShowThemDong] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [ketQuaFilter, setKetQuaFilter] = useState<KetQuaKiemKeKho | null>(null);

  // Mở hộp ghi chú (hoặc ghi chú đổi khi đang mở) → nạp lại giá trị; chỉnh state ngay khi render thay vì effect.
  const [prevGhiChuSync, setPrevGhiChuSync] = useState({ open: ghiChuOpen, ghiChu: data.ghi_chu });
  if (prevGhiChuSync.open !== ghiChuOpen || prevGhiChuSync.ghiChu !== data.ghi_chu) {
    setPrevGhiChuSync({ open: ghiChuOpen, ghiChu: data.ghi_chu });
    if (ghiChuOpen) setGhiChuValue(data.ghi_chu ?? '');
  }

  const updateDotMutation = useUpdateDotKiemKeKho(() => setGhiChuOpen(false));
  const updateKetQuaMutation = useUpdateChiTietKetQua(data.id, () => setNhapKetQuaRow(null));
  const createChiTietMutation = useCreateChiTietKiemKe(data.id, () => setShowThemDong(false));
  const deleteChiTietMutation = useDeleteChiTietKiemKe(data.id);
  const dieuChinhRowMutation = useDieuChinhTonTheoKetQua(data.id);
  const dieuChinhDotMutation = useDieuChinhTonTheoDot(data.id);
  const confirm = useConfirmStore((s) => s.confirm);

  const isDangKiemKe = data.trang_thai === 'dang_kiem_ke';
  // Đợt đã chốt sổ chỉ cấp cao mới sửa được — cùng luật với service.
  const capCao = useKiemKeCapCao();
  const canEditLines = canUpdate && coTheSuaChiTiet(data.trang_thai, capCao);
  const canChangeStatus = coTheChuyenTrangThaiDot(data.trang_thai, capCao);

  const visibleChiTiet = useMemo(
    () => locChiTietKiemKe(chiTiet, { q: searchQ, ketQua: ketQuaFilter }),
    [chiTiet, searchQ, ketQuaFilter]
  );
  // "Lưu & dòng tiếp" đi theo đúng thứ tự + bộ lọc đang hiển thị.
  const nextRow = useMemo(
    () => (nhapKetQuaRow ? timDongChuaKiemTiepTheo(visibleChiTiet, nhapKetQuaRow.id) : null),
    [visibleChiTiet, nhapKetQuaRow]
  );

  const handleNhapKetQuaSave = useCallback(
    (payload: ChiTietKiemKeKhoUpdate, next: boolean) => {
      if (!nhapKetQuaRow || !currentUserId) return;
      const nextTarget = next ? nextRow : null;
      updateKetQuaMutation.mutate(
        {
          id_chi_tiet: nhapKetQuaRow.id,
          data: payload,
          id_nguoi_kiem: currentUserId,
        },
        // Hook đã đóng dialog ở onSuccess của nó; mở lại ngay với dòng kế tiếp.
        { onSuccess: () => { if (nextTarget) setNhapKetQuaRow(nextTarget); } }
      );
    },
    [nhapKetQuaRow, currentUserId, updateKetQuaMutation, nextRow]
  );

  const stats = useMemo(() => {
    const khop = chiTiet.filter((c) => c.ket_qua === 'khop').length;
    const thieu = chiTiet.filter((c) => c.ket_qua === 'thieu').length;
    const thua = chiTiet.filter((c) => c.ket_qua === 'thua').length;
    const chuaKiem = chiTiet.filter((c) => c.ket_qua === 'chua_kiem').length;
    return { khop, thieu, thua, chuaKiem, total: chiTiet.length };
  }, [chiTiet]);

  const pendingDieuChinhCount = useMemo(
    () =>
      chiTiet.filter(
        (c) =>
          c.so_luong_thuc_te != null &&
          c.so_luong_thuc_te !== c.so_luong_so &&
          !c.id_phieu_kho_dieu_chinh
      ).length,
    [chiTiet]
  );

  const handleDieuChinhDotClick = useCallback(() => {
    confirm({
      title: t('kiemKeKho.confirm.dieuChinhDotTitle'),
      message: t('kiemKeKho.confirm.dieuChinhDotMessage', { count: pendingDieuChinhCount }),
      variant: 'warning',
        onConfirm: () => {
          void dieuChinhDotMutation.mutateAsync();
        },
    });
  }, [confirm, t, pendingDieuChinhCount, dieuChinhDotMutation]);

  const handleDieuChinhRow = useCallback(
    (id: string) => {
      confirm({
        title: t('kiemKeKho.confirm.dieuChinhRowTitle'),
        message: t('kiemKeKho.confirm.dieuChinhRowMessage'),
        variant: 'warning',
        onConfirm: () => {
          void dieuChinhRowMutation.mutateAsync(id);
        },
      });
    },
    [confirm, t, dieuChinhRowMutation]
  );

  const handleSaveGhiChu = useCallback(() => {
    updateDotMutation.mutate(
      { id: data.id, data: { ghi_chu: ghiChuValue.trim() || undefined } },
      { onSuccess: () => setGhiChuOpen(false) }
    );
  }, [data.id, ghiChuValue, updateDotMutation]);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [
      {
        label: t('kiemKeKho.printPhieu'),
        icon: <Printer size={16} />,
        onClick: () => window.open(getPhieuKiemKeKhoPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
    ];
    if (canUpdate && isDangKiemKe && pendingDieuChinhCount > 0) {
      actions.push({
        label: t('kiemKeKho.dieuChinhTonDot'),
        icon: <RefreshCw size={16} />,
        onClick: handleDieuChinhDotClick,
        variant: 'secondary',
        disabled: dieuChinhDotMutation.isPending,
      });
    }
    if (canUpdate && coTheSuaDot(data.trang_thai, capCao)) {
      actions.push({
        label: t('kiemKeKho.detail.fillNote'),
        icon: <FileText size={16} />,
        onClick: () => setGhiChuOpen(true),
        variant: 'secondary',
      });
    }
    if (canEditLines && onTaoDanhSach) {
      actions.push({
        label: t('kiemKeKho.taoDanhSach'),
        icon: <List size={16} />,
        onClick: () => onTaoDanhSach(data.id),
        variant: 'success',
        disabled: taoDanhSachLoading,
      });
    }
    if (isDangKiemKe && onHoanThanh) {
      actions.push({
        label: t('kiemKeKho.hoanThanh'),
        icon: <CheckCircle size={16} />,
        onClick: () => onHoanThanh(data.id),
        variant: 'success',
        disabled: hoanThanhLoading,
      });
    }
    if (onStatusChange && canChangeStatus) {
      actions.push({
        label: t('kiemKeKho.changeStatus'),
        icon: <Power size={16} />,
        onClick: () => onStatusChange(data),
        variant: 'info',
      });
    }
    return actions;
  }, [
    data,
    canEditLines,
    canUpdate,
    capCao,
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

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canEditLines}
      onEdit={onEdit ? () => onEdit(data) : undefined}
    />
  );

  return (
    <GenericDrawer
      title={data.ma_dot}
      subtitle={data.ten_dot}
      icon={<ClipboardCheck size={20} className="text-primary" />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_KIEM_KE_KHO}
      footer={renderFooter}
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
                  getStatusBadgeClass(TRANG_THAI_DOT_SEMANTIC[data.trang_thai])
                )}
              >
                {getTrangThaiDotLabel(data.trang_thai, t)}
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

        <DetailSection title={t('kiemKeKho.form.infoSection')} icon={<ClipboardCheck size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('kiemKeKho.store.maDotCol')} value={data.ma_dot} icon={<FileText size={12} />} />
            <DetailField label={t('kiemKeKho.store.tenDotCol')} value={data.ten_dot} icon={<FileText size={12} />} />
            <DetailField
              label={t('kiemKeKho.store.trangThaiCol')}
              value={getTrangThaiDotLabel(data.trang_thai, t)}
              icon={<CheckCircle size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.ngayBatDauCol')}
              value={formatDate(data.ngay_bat_dau)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.ngayKetThucCol')}
              value={formatDate(data.ngay_ket_thuc)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.soKhoCol')}
              value={String(data.id_kho?.length ?? 0)}
              icon={<Warehouse size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.nguoiTaoCol')}
              value={data.ten_nguoi_tao || data.ma_nguoi_tao || '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.nguoiPhuTrachCol')}
              value={data.ten_nguoi_phu_trach || data.ma_nguoi_phu_trach || '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.ghiChuCol')}
              value={data.ghi_chu ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2 lg:col-span-3"
            />
          </DetailFieldGrid>
        </DetailSection>

        {chiTiet.length > 0 && (
          <DetailSection title={t('kiemKeKho.detail.progress')} icon={<BarChart3 size={14} />} variant="secondary">
            <div className="flex flex-wrap gap-2">
              {/* Chip bấm được = lọc bảng bên dưới; số đếm luôn tính trên toàn bộ dòng. */}
              <button
                type="button"
                onClick={() => setKetQuaFilter(null)}
                aria-pressed={ketQuaFilter == null}
                className={cn(
                  'inline-flex items-center min-h-[36px] sm:min-h-0 px-3 py-1 rounded-full text-xs font-medium border tabular-nums transition-all bg-primary/10 text-primary border-primary/20',
                  ketQuaFilter == null && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-card'
                )}
              >
                {t('kiemKeKho.detail.tongDong')}: {stats.total}
              </button>
              {KET_QUA_CHIPS.map(({ key, value }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setKetQuaFilter((cur) => (cur === key ? null : key))}
                  aria-pressed={ketQuaFilter === key}
                  className={cn(
                    'inline-flex items-center min-h-[36px] sm:min-h-0 px-3 py-1 rounded-full text-xs font-medium border tabular-nums transition-all',
                    getStatusBadgeClass(KET_QUA_SEMANTIC[key]),
                    ketQuaFilter === key ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-card' : 'hover:opacity-80'
                  )}
                >
                  {t(`kiemKeKho.ketQua.${key}`)}: {value(stats)}
                </button>
              ))}
            </div>
          </DetailSection>
        )}

        <GenericSubTableSection
          title={t('kiemKeKho.chiTietSection')}
          icon={<List size={14} className="text-primary" />}
          count={chiTiet.length}
          addLabel={canEditLines ? t('kiemKeKho.table.themDong') : undefined}
          onAdd={canEditLines ? () => setShowThemDong(true) : undefined}
          loading={chiTietLoading}
          loadingText={t('kiemKeKho.loading')}
          emptyTitle={t('kiemKeKho.chiTietEmpty')}
          emptyDescription={t('kiemKeKho.chiTietEmptyHint')}
          contentMode="raw"
        >
          {chiTiet.length > 0 && (
            <div className="space-y-2.5">
              <SubTableSearchBox
                value={searchQ}
                onChange={setSearchQ}
                shown={visibleChiTiet.length}
                total={chiTiet.length}
              />
              <ChiTietKiemKeSubTable
                data={visibleChiTiet}
                trangThaiDot={data.trang_thai}
                capCao={capCao}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onNhapKetQua={(item) => setNhapKetQuaRow(item)}
                onDieuChinh={handleDieuChinhRow}
                emptyContent={
                  <div className="py-8 px-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">{t('shared.subTable.noMatch')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQ('');
                        setKetQuaFilter(null);
                      }}
                    >
                      {t('common.clearFilter')}
                    </Button>
                  </div>
                }
                onDelete={(item) => {
                  confirm({
                    title: t('kiemKeKho.table.xoaDong'),
                    message: item.id_phieu_kho_dieu_chinh
                      ? t('kiemKeKho.detail.deleteAdjustedLineConfirm')
                      : t('kiemKeKho.detail.deleteLineConfirm'),
                    variant: 'danger',
                    confirmText: t('common.delete'),
                    onConfirm: () => deleteChiTietMutation.mutateAsync(item.id),
                  });
                }}
                dieuChinhLoading={dieuChinhRowMutation.isPending}
                nhapKetQuaLoading={updateKetQuaMutation.isPending}
                deleteLoading={deleteChiTietMutation.isPending}
              />
            </div>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('kiemKeKho.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField
              label={t('kiemKeKho.store.createdAtCol')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('kiemKeKho.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>

      <NhapKetQuaKiemKeDialog
        open={nhapKetQuaRow != null}
        row={nhapKetQuaRow}
        onClose={() => setNhapKetQuaRow(null)}
        onSave={handleNhapKetQuaSave}
        hasNext={nextRow != null}
        isLoading={updateKetQuaMutation.isPending}
      />

      <ThemDongKiemKeDialog
        open={showThemDong}
        onClose={() => setShowThemDong(false)}
        onConfirm={(id_kho_list, id_hang_hoa) => {
          const queue = [...id_kho_list];
          const next = () => {
            const khoId = queue.shift();
            if (!khoId) { setShowThemDong(false); return; }
            createChiTietMutation.mutate(
              { id_kho: khoId, id_hang_hoa },
              { onSuccess: () => { if (queue.length > 0) next(); else setShowThemDong(false); } }
            );
          };
          next();
        }}
        isLoading={createChiTietMutation.isPending}
        idKhoOfDot={data.id_kho ?? []}
        chiTiet={chiTiet}
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
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('kiemKeKho.detail.ghiChuDialogTitle')}
                  </h3>
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
                    placeholder={t('kiemKeKho.form.ghiChuPlaceholder')}
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

export default DotKiemKeKhoDetail;
