import React from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, MapPin, FileText, ArrowUpFromLine, Calendar, Power, Building2 } from 'lucide-react';
import { Kho } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: Kho;
  onClose: () => void;
  onEdit?: (item: Kho) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (item: Kho) => void;
}

const DanhSachKhoDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit(data);
              onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id);
              onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('kho.detail.title')}
      subtitle={data.ma_kho}
      icon={<Warehouse size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Warehouse size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_kho}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_kho}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('kho.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('kho.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('kho.detail.basicInfo')} icon={<Warehouse size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('kho.form.name')} value={data.ten_kho} icon={<Warehouse size={12} />} />
            <DetailField label={t('kho.form.code')} value={data.ma_kho} icon={<Warehouse size={12} />} />
            <DetailField
              label={t('kho.detail.branch')}
              value={data.ten_chi_nhanh ?? ''}
              icon={<Building2 size={12} />}
              emptyText={t('kho.detail.noBranch')}
            />
            <DetailField
              label={t('kho.form.address')}
              value={data.dia_chi ?? ''}
              icon={<MapPin size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('kho.detail.description')}
              value={data.mo_ta ?? ''}
              icon={<FileText size={12} />}
              emptyText="—"
            />
            <DetailField label={t('kho.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('common.status')}
              value={isActive ? t('kho.active') : t('kho.inactive')}
              icon={<Power size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('kho.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('kho.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('kho.detail.updated')} value={formatDate(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DanhSachKhoDetail;
