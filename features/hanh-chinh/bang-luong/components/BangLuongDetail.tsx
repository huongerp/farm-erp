import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, User, Building2, Calendar, Edit, Trash2, FileText } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatCurrency } from '../../../../lib/utils';
import type { BangLuongRecord } from '../core/types';

/** App dùng HashRouter: route nằm sau #, nên URL mở tab phải có hash */
const getPayslipPreviewUrl = (id: string) =>
  `/phieu-luong/${encodeURIComponent(id)}`;

interface Props {
  data: BangLuongRecord;
  onClose: () => void;
  onEdit?: (item: BangLuongRecord) => void;
  onDelete?: (id: string) => void;
}

const BangLuongDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const periodStr = `${data.nam}-${String(data.thang).padStart(2, '0')}`;

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('bangLuong.detail.exportPayslip'),
      icon: <FileText />,
      onClick: () => window.open(getPayslipPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
      variant: 'primary',
    },
  ];

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex gap-3">
        {onEdit && (
          <Button
            onClick={() => { onEdit(data); onClose(); }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => { onDelete(data.id); onClose(); }}
            className="text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
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
            <DetailField
              label={t('bangLuong.detail.ngayCong')}
              value={`${data.ngay_cong} / ${data.ngay_cong_chuan}`}
              icon={<Calendar size={12} />}
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

        <DetailSection
          title={t('bangLuong.detail.tongLuong')}
          icon={<Banknote size={14} />}
          variant="primary"
        >
          <p className="text-lg font-bold text-primary">
            {formatCurrency(data.tong_luong)}
          </p>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default BangLuongDetail;
