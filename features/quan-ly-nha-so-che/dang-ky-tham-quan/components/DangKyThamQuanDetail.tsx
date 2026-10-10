import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import {
  Ban,
  Building2,
  Calendar,
  Car,
  Clock,
  FileText,
  Images,
  LogIn,
  LogOut,
  Printer,
  RotateCcw,
  Target,
  Timer,
  Undo2,
  User,
  Users,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import {
  coTheCheckIn,
  coTheCheckOut,
  coTheHoanTacCheckIn,
  coTheHoanTacCheckOut,
  coTheHuy,
  coTheKhoiPhuc,
  coTheSuaPhieu,
  coTheThemAnh,
  coTheXoaPhieu,
} from '../../dang-ky-nhan-hang/core/trang-thai';
import { formatThoiLuong, soPhutDangOTrongFarm, soPhutTrongFarm } from '../../dang-ky-nhan-hang/core/thoi-gian';
import HinhAnhGallery from '../../dang-ky-nhan-hang/components/HinhAnhGallery';
import type { DangKyThamQuan } from '../core/types';
import { taoUrlPreview } from '../core/mau-in';
import { useChuyenTrangThaiDangKyThamQuan } from '../hooks/use-dang-ky-tham-quan';
import { useDangKyThamQuanCapCao } from '../hooks/use-dang-ky-tham-quan-view-scope';
import { khoangThoiGian, mucDichCuaPhieu } from '../utils/hien-thi';
import TrangThaiBadge from './TrangThaiBadge';
import CheckInOutDialog from './CheckInOutDialog';
import HinhAnhDialog from './HinhAnhDialog';

interface Props {
  data: DangKyThamQuan;
  onClose: () => void;
  onEdit?: (item: DangKyThamQuan) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DangKyThamQuanDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const capCao = useDangKyThamQuanCapCao();
  const chuyen = useChuyenTrangThaiDangKyThamQuan();
  const [dialog, setDialog] = useState<null | 'checkIn' | 'checkOut' | 'anh'>(null);

  const tt = data.trang_thai;
  const canEditPhieu = canUpdate && coTheSuaPhieu(tt, capCao);
  const canDeletePhieu = canDelete && coTheXoaPhieu(tt, capCao);

  const hoi = useCallback(
    (key: 'huy' | 'khoiPhuc' | 'hoanTacCheckIn' | 'hoanTacCheckOut', variant: 'warning' | 'danger' = 'warning') =>
      confirm({
        title: t(`dangKyThamQuan.confirm.${key}Title`),
        message: t(`dangKyThamQuan.confirm.${key}Message`),
        variant,
        confirmText: t(`dangKyThamQuan.toolbar.${key}`),
        onConfirm: async () => {
          await chuyen.mutateAsync({ action: key, id: data.id });
        },
      }),
    [confirm, t, chuyen, data.id]
  );

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    // In: ai xem được phiếu cũng in được.
    const a: DetailToolbarAction[] = [
      {
        label: t('dangKyThamQuan.toolbar.in'),
        icon: <Printer />,
        onClick: () => window.open(taoUrlPreview(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'outline',
      },
    ];
    if (!canUpdate) return a;
    if (coTheCheckIn(tt)) a.push({ label: t('dangKyThamQuan.toolbar.checkIn'), icon: <LogIn />, onClick: () => setDialog('checkIn'), variant: 'primary' });
    if (coTheCheckOut(tt)) a.push({ label: t('dangKyThamQuan.toolbar.checkOut'), icon: <LogOut />, onClick: () => setDialog('checkOut'), variant: 'success' });
    if (coTheThemAnh(tt)) a.push({ label: t('dangKyThamQuan.toolbar.hinhAnh'), icon: <Images />, onClick: () => setDialog('anh'), variant: 'secondary' });
    if (coTheHuy(tt)) a.push({ label: t('dangKyThamQuan.toolbar.huy'), icon: <Ban />, onClick: () => hoi('huy', 'danger'), variant: 'danger' });
    if (coTheKhoiPhuc(tt)) a.push({ label: t('dangKyThamQuan.toolbar.khoiPhuc'), icon: <RotateCcw />, onClick: () => hoi('khoiPhuc'), variant: 'warning' });
    if (coTheHoanTacCheckIn(tt, capCao)) a.push({ label: t('dangKyThamQuan.toolbar.hoanTacCheckIn'), icon: <Undo2 />, onClick: () => hoi('hoanTacCheckIn'), variant: 'warning' });
    if (coTheHoanTacCheckOut(tt, capCao)) a.push({ label: t('dangKyThamQuan.toolbar.hoanTacCheckOut'), icon: <Undo2 />, onClick: () => hoi('hoanTacCheckOut'), variant: 'warning' });
    return a;
  }, [canUpdate, tt, capCao, t, hoi, data.id]);

  const phut = tt === 'da_vao' ? soPhutDangOTrongFarm(data.tg_vao_thuc_te) : soPhutTrongFarm(data.tg_vao_thuc_te, data.tg_ra_thuc_te);
  const daiDien = data.nguoi_dai_dien || data.khach[0]?.ho_ten || '—';

  return (
    <>
      <GenericDrawer
        title={t('dangKyThamQuan.detail.title')}
        subtitle={daiDien}
        icon={<Users className="text-primary" size={22} />}
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
              <Users size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{daiDien}</h2>
              <p className="text-body-sm text-muted-foreground mt-0.5 line-clamp-1">
                {data.khach.length} {t('dangKyThamQuan.khach.nguoi')}
                {data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <TrangThaiBadge value={tt} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border tabular-nums">
                  {khoangThoiGian(data)}
                </span>
              </div>
            </div>
          </div>

          {toolbarActions.length > 0 && <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />}

          <DetailSection title={t('dangKyThamQuan.detail.thongTin')} icon={<FileText size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('dangKyThamQuan.col.chiNhanh')} value={data.ten_chi_nhanh ?? ''} emptyText="—" icon={<Building2 size={12} />} />
              <DetailField label={t('dangKyThamQuan.col.ngayDangKy')} value={formatYmdToDisplay(data.ngay_dang_ky)} icon={<Calendar size={12} />} />
              <DetailField label={t('dangKyThamQuan.col.thoiGian')} value={khoangThoiGian(data)} icon={<Clock size={12} />} />
              <DetailField label={t('dangKyThamQuan.col.mucDich')} value={mucDichCuaPhieu(data)} emptyText="—" icon={<Target size={12} />} />
              <DetailField
                label={t('dangKyThamQuan.col.phuongTien')}
                value={data.phuong_tien ? t(`dangKyThamQuan.phuongTien.${data.phuong_tien}`) : ''}
                emptyText="—"
                icon={<Car size={12} />}
              />
              <DetailField label={t('dangKyThamQuan.col.nguoiTiepDon')} value={data.ten_nguoi_tiep_don ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField
                label={t('dangKyThamQuan.col.ghiChu')}
                value={data.ghi_chu ?? ''}
                emptyText="—"
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={`${t('dangKyThamQuan.khach.title')} (${data.khach.length})`} icon={<Users size={14} />} variant="secondary">
            {data.khach.length === 0 ? (
              <p className="text-sm text-muted-foreground/70 italic m-0">{t('dangKyThamQuan.khach.empty')}</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-1.5 px-1 w-8">#</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.hoTen')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.gioiTinh')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.quocTich')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.sdt')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.nguoiGioiThieu')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.khuVuc')}</th>
                      <th className="py-1.5 px-1">{t('dangKyThamQuan.khach.donVi')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.khach.map((k) => (
                      <tr key={k.stt} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 px-1 tabular-nums text-muted-foreground">{k.stt}</td>
                        <td className="py-1.5 px-1 font-medium">{k.ho_ten}</td>
                        <td className="py-1.5 px-1">{k.gioi_tinh ? t(`dangKyThamQuan.gioiTinh.${k.gioi_tinh}`) : '—'}</td>
                        <td className="py-1.5 px-1">{k.quoc_tich || '—'}</td>
                        <td className="py-1.5 px-1 tabular-nums">{k.so_dien_thoai || '—'}</td>
                        <td className="py-1.5 px-1">{k.nguoi_gioi_thieu || '—'}</td>
                        <td className="py-1.5 px-1">{k.khu_vuc_tham_quan || '—'}</td>
                        <td className="py-1.5 px-1">{k.don_vi_lam_viec || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>

          <DetailSection title={t('dangKyThamQuan.detail.thucTe')} icon={<Timer size={14} />} variant="secondary">
            <DetailFieldGrid>
              <DetailField label={t('dangKyThamQuan.col.gioVao')} value={data.tg_vao_thuc_te ? formatDateTimeShort(data.tg_vao_thuc_te) : ''} emptyText="—" icon={<LogIn size={12} />} />
              <DetailField label={t('dangKyThamQuan.col.gioRa')} value={data.tg_ra_thuc_te ? formatDateTimeShort(data.tg_ra_thuc_te) : ''} emptyText="—" icon={<LogOut size={12} />} />
              <DetailField
                label={t(tt === 'da_vao' ? 'dangKyThamQuan.detail.dangOFarm' : 'dangKyThamQuan.detail.thoiLuong')}
                value={phut != null ? formatThoiLuong(phut) : ''}
                emptyText="—"
                icon={<Timer size={12} />}
              />
              <DetailField label={t('dangKyThamQuan.detail.nguoiCheckIn')} value={data.ten_nguoi_check_in ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyThamQuan.detail.nguoiCheckOut')} value={data.ten_nguoi_check_out ?? ''} emptyText="—" icon={<User size={12} />} />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={`${t('dangKyThamQuan.anh.title')} (${data.hinh_anh_urls.length})`} icon={<Images size={14} />} variant="secondary">
            {data.hinh_anh_urls.length > 0 ? (
              <HinhAnhGallery urls={data.hinh_anh_urls} />
            ) : (
              <p className="text-sm text-muted-foreground/70 italic m-0">{t('dangKyThamQuan.anh.empty')}</p>
            )}
          </DetailSection>

          <DetailSection title={t('dangKyThamQuan.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
            <DetailFieldGrid>
              <DetailField label={t('dangKyThamQuan.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('dangKyThamQuan.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
              <DetailField label={t('dangKyThamQuan.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {(dialog === 'checkIn' || dialog === 'checkOut') && (
          <CheckInOutDialog mode={dialog} data={data} onClose={() => setDialog(null)} />
        )}
        {dialog === 'anh' && <HinhAnhDialog data={data} onClose={() => setDialog(null)} />}
      </AnimatePresence>
    </>
  );
};

export default DangKyThamQuanDetail;
