import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText, Calendar, Wallet, User, ArrowRightLeft, Printer } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { formatCurrency, formatDate, cn } from '../../../../lib/utils';
import type { ThuChi } from '../../core/types';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

const PREVIEW_BASE = '/tai-chinh/thu-chi/preview';

export interface ThuChiDetailProps {
  data: ThuChi;
  onClose: () => void;
  onEdit: (item: ThuChi) => void;
  onDelete: (id: string) => void;
}

const ThuChiDetail: React.FC<ThuChiDetailProps> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const printUrl = `${PREVIEW_BASE}/${encodeURIComponent(data.id)}`;

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      {
        label: t('thuChi.detail.toolbar.print'),
        icon: <Printer size={16} />,
        onClick: () => window.open(printUrl, '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
    ],
    [printUrl, t]
  );

  const loaiLabel = data.loai === 'thu' ? t('thuChi.loaiThu') : data.loai === 'chi' ? t('thuChi.loaiChi') : t('thuChi.loaiChuyenQuy');
  const statusLabel =
    data.trang_thai === 'hoan_thanh'
      ? t('thuChi.status.hoanThanh')
      : data.trang_thai === 'cho_duyet'
        ? t('thuChi.status.choDuyet')
        : t('thuChi.status.huy');

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button onClick={() => { onEdit(data); onClose(); }} className="bg-primary text-white shadow-lg hover:bg-primary/90">
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => { onDelete(data.id); onClose(); }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('thuChi.detail.title')}
      subtitle={data.ma_giao_dich}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate font-mono">{data.ma_giao_dich}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{formatDate(data.ngay_giao_dich)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums',
                  data.loai === 'thu'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : data.loai === 'chi'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                )}
              >
                {loaiLabel}: {formatCurrency(data.so_tien)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  data.trang_thai === 'hoan_thanh' ? 'bg-primary/10 text-primary border border-primary/20' : data.trang_thai === 'cho_duyet' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <DetailSection title={t('thuChi.form.maGiaoDich')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('thuChi.columns.maGiaoDich')} value={data.ma_giao_dich} icon={<FileText size={12} />} />
            <DetailField label={t('thuChi.columns.ngayGiaoDich')} value={formatDate(data.ngay_giao_dich)} icon={<Calendar size={12} />} />
            <DetailField label={t('thuChi.columns.loai')} value={loaiLabel} />
            <DetailField label={t('thuChi.columns.taiKhoan')} value={data.ten_tai_khoan || '—'} icon={<Wallet size={12} />} />
            {data.loai !== 'chuyen_quy' && data.ten_danh_muc != null && (
              <DetailField label={t('thuChi.columns.danhMuc')} value={data.ten_danh_muc} />
            )}
            {data.loai === 'chuyen_quy' && (
              <>
                <DetailField label={t('thuChi.columns.taiKhoanDich')} value={data.ten_tai_khoan_dich || '—'} icon={<ArrowRightLeft size={12} />} />
                {data.phi_giao_dich != null && data.phi_giao_dich > 0 && (
                  <DetailField label={t('thuChi.form.phiGiaoDich')} value={formatCurrency(data.phi_giao_dich)} />
                )}
              </>
            )}
            <DetailField label={t('thuChi.columns.soTien')} value={formatCurrency(data.so_tien)} />
            <DetailField label={t('thuChi.columns.nguoiThucHien')} value={data.ten_nhan_vien || '—'} icon={<User size={12} />} />
            <DetailField label={t('thuChi.columns.trangThai')} value={statusLabel} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('thuChi.form.noiDung')} icon={<FileText size={14} />}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{data.noi_dung || '—'}</p>
        </DetailSection>

        {data.id_de_xuat_chi_phi && (
          <DetailSection title={t('thuChi.detail.deXuatChiPhi')} icon={<FileText size={14} />}>
            <DetailField label={t('thuChi.columns.lienKetDeXuat')} value={data.so_phieu_de_xuat || data.id_de_xuat_chi_phi} />
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
  );
};

export default ThuChiDetail;
