import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import {
  Ban,
  Building2,
  Calendar,
  Clock,
  FileText,
  Images,
  LogIn,
  LogOut,
  Phone,
  RotateCcw,
  ScanLine,
  Timer,
  Truck,
  Undo2,
  User,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { cn, formatDateTimeShort, formatYmdToDisplay, getTimezone } from '../../../../lib/utils';
import type { DangKyNhanHang } from '../core/types';
import {
  coTheCheckIn,
  coTheCheckOut,
  coTheHoanTacCheckIn,
  coTheHoanTacCheckOut,
  coTheHuy,
  coTheKhoiPhuc,
  coTheSuaHangHoa,
  coTheSuaPhieu,
  coTheThemAnh,
  coTheXoaPhieu,
} from '../core/trang-thai';
import {
  NGUONG_TRE_PHUT,
  formatThoiLuong,
  soPhutDangOTrongFarm,
  soPhutRaQuaGio,
  soPhutTrongFarm,
  soPhutVaoTre,
} from '../core/thoi-gian';
import {
  useChuyenTrangThaiDangKyNhanHang,
  useDangKyNhanHangChiTiet,
  useHoanTacDongCuoi,
} from '../hooks/use-dang-ky-nhan-hang';
import { useDangKyNhanHangCapCao } from '../hooks/use-dang-ky-nhan-hang-view-scope';
import { useQuetHangHoa } from '../hooks/use-quet-hang-hoa';
import TrangThaiBadge from './TrangThaiBadge';
import HinhAnhGallery from './HinhAnhGallery';
import HangHoaXuatSection from './HangHoaXuatSection';
import CheckInOutDialog from './CheckInOutDialog';
import HinhAnhDialog from './HinhAnhDialog';
import ThemHangHoaDialog from './ThemHangHoaDialog';

const QrScannerDialog = lazy(() => import('./QrScannerDialog'));

interface Props {
  data: DangKyNhanHang;
  onClose: () => void;
  onEdit?: (item: DangKyNhanHang) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

/** Badge lệch giờ: trễ/quá giờ (đỏ) hoặc đúng/sớm (xanh). */
const LechGio: React.FC<{ phut: number | null; kieu: 'vao' | 'ra' }> = ({ phut, kieu }) => {
  const { t } = useTranslation();
  if (phut == null) return null;
  const xau = phut > NGUONG_TRE_PHUT;
  const label = xau
    ? t(kieu === 'vao' ? 'dangKyNhanHang.detail.vaoTre' : 'dangKyNhanHang.detail.raQuaGio', { tg: formatThoiLuong(phut) })
    : phut < 0
      ? t(kieu === 'vao' ? 'dangKyNhanHang.detail.vaoSom' : 'dangKyNhanHang.detail.raSom', { tg: formatThoiLuong(-phut) })
      : t('dangKyNhanHang.detail.dungGio');
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        xau
          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      )}
    >
      {label}
    </span>
  );
};

const DangKyNhanHangDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const confirm = useConfirmStore((s) => s.confirm);
  const capCao = useDangKyNhanHangCapCao();
  const chuyen = useChuyenTrangThaiDangKyNhanHang();
  const hoanTacDong = useHoanTacDongCuoi();
  const { data: chiTiet = [], isLoading: chiTietLoading } = useDangKyNhanHangChiTiet(data.id);

  const [dialog, setDialog] = useState<null | 'checkIn' | 'checkOut' | 'anh' | 'themHang' | 'quet'>(null);

  const { ghiNhan, lamMoiSauQuet } = useQuetHangHoa(data.id);

  const tt = data.trang_thai;
  const canEditHang = canUpdate && coTheSuaHangHoa(tt, capCao);
  const canEditPhieu = canUpdate && coTheSuaPhieu(tt, capCao);
  const canDeletePhieu = canDelete && coTheXoaPhieu(tt, capCao);

  const hoi = useCallback(
    (key: string, action: 'hoanTacCheckIn' | 'hoanTacCheckOut' | 'huy' | 'khoiPhuc', variant: 'warning' | 'danger' = 'warning') =>
      confirm({
        title: t(`dangKyNhanHang.confirm.${key}Title`),
        message: t(`dangKyNhanHang.confirm.${key}Message`),
        variant,
        confirmText: t(`dangKyNhanHang.toolbar.${key}`),
        onConfirm: async () => {
          await chuyen.mutateAsync({ action, id: data.id });
        },
      }),
    [confirm, t, chuyen, data.id]
  );

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const a: DetailToolbarAction[] = [];
    if (!canUpdate) return a;
    if (coTheCheckIn(tt)) {
      a.push({ label: t('dangKyNhanHang.toolbar.checkIn'), icon: <LogIn />, onClick: () => setDialog('checkIn'), variant: 'primary' });
    }
    if (coTheCheckOut(tt)) {
      a.push({ label: t('dangKyNhanHang.toolbar.checkOut'), icon: <LogOut />, onClick: () => setDialog('checkOut'), variant: 'success' });
    }
    if (canEditHang) {
      a.push({ label: t('dangKyNhanHang.toolbar.quetQr'), icon: <ScanLine />, onClick: () => setDialog('quet'), variant: 'info' });
    }
    if (coTheThemAnh(tt)) {
      a.push({ label: t('dangKyNhanHang.toolbar.hinhAnh'), icon: <Images />, onClick: () => setDialog('anh'), variant: 'secondary' });
    }
    if (coTheHuy(tt)) {
      a.push({ label: t('dangKyNhanHang.toolbar.huy'), icon: <Ban />, onClick: () => hoi('huy', 'huy', 'danger'), variant: 'danger' });
    }
    if (coTheKhoiPhuc(tt)) {
      a.push({ label: t('dangKyNhanHang.toolbar.khoiPhuc'), icon: <RotateCcw />, onClick: () => hoi('khoiPhuc', 'khoiPhuc'), variant: 'warning' });
    }
    if (coTheHoanTacCheckIn(tt, capCao)) {
      a.push({ label: t('dangKyNhanHang.toolbar.hoanTacCheckIn'), icon: <Undo2 />, onClick: () => hoi('hoanTacCheckIn', 'hoanTacCheckIn'), variant: 'warning' });
    }
    if (coTheHoanTacCheckOut(tt, capCao)) {
      a.push({ label: t('dangKyNhanHang.toolbar.hoanTacCheckOut'), icon: <Undo2 />, onClick: () => hoi('hoanTacCheckOut', 'hoanTacCheckOut'), variant: 'warning' });
    }
    return a;
  }, [canUpdate, tt, capCao, canEditHang, t, hoi]);

  const phutTrong =
    tt === 'da_vao' ? soPhutDangOTrongFarm(data.tg_vao_thuc_te) : soPhutTrongFarm(data.tg_vao_thuc_te, data.tg_ra_thuc_te);
  const phutTre = soPhutVaoTre(data.ngay_dang_ky, data.gio_dang_ky_tu, data.tg_vao_thuc_te, tz);
  const phutQua = soPhutRaQuaGio(data.ngay_dang_ky, data.gio_dang_ky_tu, data.gio_dang_ky_den, data.tg_ra_thuc_te, tz);
  const xe = [data.so_xe, data.so_cont].filter(Boolean).join(' · ') || '—';
  const gioDk =
    data.gio_dang_ky_tu || data.gio_dang_ky_den ? `${data.gio_dang_ky_tu ?? '…'} – ${data.gio_dang_ky_den ?? '…'}` : '';

  return (
    <>
      <GenericDrawer
        title={t('dangKyNhanHang.detail.title')}
        subtitle={xe}
        icon={<Truck className="text-primary" size={22} />}
        onClose={onClose}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
        footer={
          <DetailDrawerFooter
            onClose={onClose}
            canUpdate={canEditPhieu}
            canDelete={canDeletePhieu}
            onEdit={onEdit && canEditPhieu ? () => onEdit(data) : undefined}
            onDelete={onDelete && canDeletePhieu ? () => onDelete(data.id) : undefined}
          />
        }
      >
        <div className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
              <Truck size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate font-mono">{xe}</h2>
              <p className="text-body-sm text-muted-foreground mt-0.5 line-clamp-1">
                {[data.khach_hang, data.loai_hang_hoa].filter(Boolean).join(' · ') || '—'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <TrangThaiBadge value={tt} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border tabular-nums">
                  {formatYmdToDisplay(data.ngay_dang_ky)}
                  {gioDk ? ` · ${gioDk}` : ''}
                </span>
              </div>
            </div>
          </div>

          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection title={t('dangKyNhanHang.detail.thongTinDangKy')} icon={<FileText size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('dangKyNhanHang.col.khachHang')} value={data.khach_hang ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyNhanHang.col.loaiHang')} value={data.loai_hang_hoa ?? ''} emptyText="—" icon={<FileText size={12} />} />
              <DetailField label={t('dangKyNhanHang.col.chiNhanh')} value={data.ten_chi_nhanh ?? ''} emptyText="—" icon={<Building2 size={12} />} />
              <DetailField label={t('dangKyNhanHang.form.soXe')} value={data.so_xe ?? ''} emptyText="—" icon={<Truck size={12} />} />
              <DetailField label={t('dangKyNhanHang.form.soCont')} value={data.so_cont ?? ''} emptyText="—" icon={<Truck size={12} />} />
              <DetailField label={t('dangKyNhanHang.col.taiXe')} value={data.ten_tai_xe ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyNhanHang.form.sdtTaiXe')} value={data.sdt_tai_xe ?? ''} emptyText="—" icon={<Phone size={12} />} />
              <DetailField label={t('dangKyNhanHang.col.ngay')} value={formatYmdToDisplay(data.ngay_dang_ky)} icon={<Calendar size={12} />} />
              <DetailField label={t('dangKyNhanHang.col.gioDangKy')} value={gioDk} emptyText="—" icon={<Clock size={12} />} />
              <DetailField
                label={t('dangKyNhanHang.col.ghiChu')}
                value={data.ghi_chu ?? ''}
                emptyText="—"
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('dangKyNhanHang.detail.thoiGian')} icon={<Timer size={14} />} variant="secondary">
            <DetailFieldGrid>
              <DetailField
                label={t('dangKyNhanHang.col.gioVao')}
                value={data.tg_vao_thuc_te ? formatDateTimeShort(data.tg_vao_thuc_te) : ''}
                emptyText="—"
                icon={<LogIn size={12} />}
              />
              <DetailField
                label={t('dangKyNhanHang.col.gioRa')}
                value={data.tg_ra_thuc_te ? formatDateTimeShort(data.tg_ra_thuc_te) : ''}
                emptyText="—"
                icon={<LogOut size={12} />}
              />
              <DetailField
                label={t(tt === 'da_vao' ? 'dangKyNhanHang.detail.daOTrongFarm' : 'dangKyNhanHang.col.thoiLuong')}
                value={phutTrong != null ? formatThoiLuong(phutTrong) : ''}
                emptyText="—"
                icon={<Timer size={12} />}
              />
              <DetailField label={t('dangKyNhanHang.detail.nguoiCheckIn')} value={data.ten_nguoi_check_in ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyNhanHang.detail.nguoiCheckOut')} value={data.ten_nguoi_check_out ?? ''} emptyText="—" icon={<User size={12} />} />
            </DetailFieldGrid>
            {(phutTre != null || phutQua != null) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <LechGio phut={phutTre} kieu="vao" />
                <LechGio phut={phutQua} kieu="ra" />
              </div>
            )}
          </DetailSection>

          <DetailSection
            title={`${t('dangKyNhanHang.anh.title')} (${data.hinh_anh_urls.length})`}
            icon={<Images size={14} />}
            variant="secondary"
          >
            {data.hinh_anh_urls.length > 0 ? (
              <HinhAnhGallery urls={data.hinh_anh_urls} />
            ) : (
              <p className="text-sm text-muted-foreground/70 italic m-0">{t('dangKyNhanHang.anh.empty')}</p>
            )}
          </DetailSection>

          <HangHoaXuatSection
            idPhieu={data.id}
            rows={chiTiet}
            loading={chiTietLoading}
            canEdit={canEditHang}
            onAdd={() => setDialog('themHang')}
            onScan={() => setDialog('quet')}
          />

          <DetailSection title={t('dangKyNhanHang.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
            <DetailFieldGrid>
              <DetailField label={t('dangKyNhanHang.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyNhanHang.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
              <DetailField label={t('dangKyNhanHang.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {(dialog === 'checkIn' || dialog === 'checkOut') && (
          <CheckInOutDialog mode={dialog} data={data} onClose={() => setDialog(null)} />
        )}
        {dialog === 'anh' && <HinhAnhDialog data={data} onClose={() => setDialog(null)} />}
        {dialog === 'themHang' && <ThemHangHoaDialog idPhieu={data.id} onClose={() => setDialog(null)} />}
        {dialog === 'quet' && (
          <Suspense fallback={null}>
            <QrScannerDialog
              mode="lien-tuc"
              title={t('dangKyNhanHang.qr.titleLienTuc')}
              onDetected={ghiNhan}
              onUndoLast={() => hoanTacDong.mutateAsync(data.id)}
              undoPending={hoanTacDong.isPending}
              onClose={() => {
                setDialog(null);
                void lamMoiSauQuet();
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default DangKyNhanHangDetail;
