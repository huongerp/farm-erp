import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Package, FileText, ArrowUpFromLine, Calendar, Power, Folder } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: HangHoa;
  onClose: () => void;
  onEdit: (item: HangHoa) => void;
  onDelete: (id: string) => void;
}

const DanhSachHangHoaDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDelete(data.id);
            onClose();
          }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('hangHoa.detail.title')}
      subtitle={data.ma_hang}
      icon={<Package size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            {data.hinh_anh ? (
              <img
                src={data.hinh_anh}
                alt={data.ten_hang}
                className="w-14 h-14 rounded-xl border-2 border-card shadow-md object-cover bg-card"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg">
                <Package size={24} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_hang}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_hang}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactiveStatus')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('hangHoa.form.name')} value={data.ten_hang} icon={<Package size={12} />} />
            <DetailField label={t('hangHoa.form.code')} value={data.ma_hang} icon={<Package size={12} />} />
            <DetailField
              label={t('hangHoa.detail.category')}
              value={data.ten_danh_muc ?? ''}
              icon={<Folder size={12} />}
              emptyText={t('hangHoa.detail.noCategory')}
            />
            <DetailField
              label={t('hangHoa.detail.unit')}
              value={data.don_vi_tinh ?? ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('hangHoa.detail.minStock')}
              value={data.ton_toi_thieu != null ? String(data.ton_toi_thieu) : ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField label={t('hangHoa.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('hangHoa.detail.description')}
              value={data.mo_ta ?? ''}
              icon={<FileText size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('common.status')}
              value={isActive ? t('common.activeStatus') : t('common.inactiveStatus')}
              icon={<Power size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('hangHoa.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('hangHoa.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('hangHoa.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DanhSachHangHoaDetail;
