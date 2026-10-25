import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, User, Building2, Calendar, Printer } from 'lucide-react';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { formatCurrency, cn } from '../../../../lib/utils';
import { formatKyThangNam } from '../utils/ky-hien-thi';
import type { BangLuongRecord } from '../core/types';

/** Trang in phiếu lương (mở tab mới). */
const getPayslipPreviewUrl = (id: string) =>
  `/phieu-luong/${encodeURIComponent(id)}`;

interface Props {
  data: BangLuongRecord;
  onClose: () => void;
  onEdit?: (item: BangLuongRecord) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const BangLuongDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const periodStr = formatKyThangNam(data.nam, data.thang);

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('bangLuong.detail.exportPayslip'),
      icon: <Printer />,
      onClick: () => window.open(getPayslipPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
      variant: 'primary',
    },
  ];

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onEdit={onEdit ? () => { onEdit(data); onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id); onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('bangLuong.detail.title')}
      subtitle={`${data.ten_nhan_vien || data.ma_nhan_vien || ''} · ${periodStr}`}
      icon={<Banknote size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Banknote size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_nhan_vien || data.ma_nhan_vien || '—'}
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5 truncate">
              {[periodStr, data.ten_phong_ban].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(data.tong_luong)}</span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  data.kpi_dat
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                )}
              >
                {data.kpi_dat ? t('bangLuong.detail.kpiDat') : t('bangLuong.detail.kpiKhongDat')}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('bangLuong.detail.employee')}
          icon={<User size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('bangLuong.store.employeeCol')}
              value={data.ten_nhan_vien ? `${data.ten_nhan_vien}${data.ma_nhan_vien ? ` (${data.ma_nhan_vien})` : ''}` : data.ma_nhan_vien}
              icon={<User size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('bangLuong.detail.period')}
              value={periodStr}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('bangLuong.detail.department')}
              value={data.ten_phong_ban}
              icon={<Building2 size={12} />}
              emptyText="—"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={t('bangLuong.detail.luongCoBan')}
          icon={<Banknote size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('bangLuong.detail.ngayCong')}
              value={`${data.ngay_cong} / ${data.ngay_cong_chuan}`}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('bangLuong.detail.luongCoBan')}
              value={formatCurrency(data.luong_co_ban_tinh)}
              icon={<Banknote size={12} />}
            />
            <DetailField
              label={t('bangLuong.detail.luongKpi')}
              value={formatCurrency(data.luong_kpi_tinh)}
              icon={<Banknote size={12} />}
            />
            <DetailField
              label={data.kpi_dat ? t('bangLuong.detail.kpiDat') : t('bangLuong.detail.kpiKhongDat')}
              value={`${data.diem_kpi.toFixed(1)} ${data.kpi_dat ? '' : `(${(data.ty_le_kpi_khong_dat * 100).toFixed(0)}%)`}`}
              icon={<Banknote size={12} />}
            />
            <DetailField
              label={t('bangLuong.detail.luongTrachNhiem')}
              value={formatCurrency(data.luong_trach_nhiem_tinh)}
              icon={<Banknote size={12} />}
            />
            <DetailField
              label={t('bangLuong.detail.phuCap')}
              value={formatCurrency(data.phu_cap_tinh)}
              icon={<Banknote size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {data.cong_tru_khac.length > 0 && (
          <DetailSection
            title={t('bangLuong.detail.congTruKhac')}
            icon={<Banknote size={14} />}
            variant="primary"
          >
            <div className="space-y-2">
              {data.cong_tru_khac.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30 text-sm"
                >
                  <span className={item.loai === 'cong' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {item.loai === 'cong' ? t('bangLuong.detail.cong') : t('bangLuong.detail.tru')}: {formatCurrency(item.so_tien)}
                  </span>
                  {item.ly_do && <span className="text-muted-foreground text-xs">{item.ly_do}</span>}
                </div>
              ))}
              <div className="pt-2 border-t border-border font-medium">
                {t('bangLuong.store.congTruNetCol')}: {data.cong_tru_net >= 0 ? '+' : ''}{formatCurrency(data.cong_tru_net)}
              </div>
            </div>
          </DetailSection>
        )}

      </div>
    </GenericDrawer>
  );
};

export default BangLuongDetail;
