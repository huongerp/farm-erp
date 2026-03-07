import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Truck, FileText, ArrowUpFromLine, Calendar, Power, Folder, MapPin, Phone, Mail } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { NhaCungCap } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: NhaCungCap;
  onClose: () => void;
  onEdit: (item: NhaCungCap) => void;
  onDelete: (id: string) => void;
}

const DanhSachNhaCungCapDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const tags = data.ten_tags ?? [];

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
      title={t('nhaCungCap.detail.title')}
      subtitle={data.ma_ncc}
      icon={<Truck size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Truck size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_ncc}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_ncc}</p>
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

        <DetailSection title={t('nhaCungCap.detail.basicInfo')} icon={<Truck size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('nhaCungCap.form.name')} value={data.ten_ncc} icon={<Truck size={12} />} />
            <DetailField label={t('nhaCungCap.form.code')} value={data.ma_ncc} icon={<Truck size={12} />} />
            <DetailField
              label={t('nhaCungCap.detail.group')}
              value={data.ten_nhom ?? ''}
              icon={<Folder size={12} />}
              emptyText={t('nhaCungCap.detail.noGroup')}
            />
            <DetailField
              label={t('nhaCungCap.form.address')}
              value={data.dia_chi ?? ''}
              icon={<MapPin size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('nhaCungCap.form.phone')}
              value={data.dien_thoai ?? ''}
              icon={<Phone size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('nhaCungCap.form.email')}
              value={data.email ?? ''}
              icon={<Mail size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('nhaCungCap.detail.tags')}
              value={
                tags.length === 0 ? (
                  undefined
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )
              }
              emptyText="—"
            />
            <DetailField label={t('nhaCungCap.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('nhaCungCap.detail.description')}
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

        <DetailSection title={t('nhaCungCap.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('nhaCungCap.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('nhaCungCap.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DanhSachNhaCungCapDetail;
