import React from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, ArrowUpFromLine, Calendar, Power } from 'lucide-react';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { formatDateShort } from '../../../../lib/utils';
import type { NhomDoiTac } from '../core/types';

interface Props {
  data: NhomDoiTac;
  onClose: () => void;
  onEdit: (item: NhomDoiTac) => void;
  onDelete: (id: string) => void;
}

const NhomDetailDrawer: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 'Đang hoạt động';

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={() => { onEdit(data); onClose(); }}
      onDelete={() => onDelete(data.id)}
    />
  );

  return (
    <GenericDrawer
      title={data.ten_nhom}
      subtitle={data.ma_nhom}
      icon={<Folder size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Folder size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_nhom}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_nhom}</p>
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

        <DetailSection title={t('doiTac.detail.basicInfo')} icon={<Folder size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('doiTac.danhMuc.form.thuTu')} value={String(data.thu_tu ?? 0)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('doiTac.danhMuc.form.loai')}
              value={
                data.loai === 'nha_cung_cap'
                  ? t('doiTac.tabs.nhaCungCap')
                  : data.loai === 'khach_hang'
                    ? t('doiTac.tabs.khachHang')
                    : '—'
              }
              icon={<Folder size={12} />}
              emptyText="—"
            />
            <DetailField label={t('doiTac.danhMuc.form.maNhom')} value={data.ma_nhom} icon={<Folder size={12} />} />
            <DetailField label={t('doiTac.danhMuc.form.tenNhom')} value={data.ten_nhom} icon={<Folder size={12} />} />
            <DetailField
              label={t('doiTac.danhMuc.form.trangThai')}
              value={isActive ? t('common.activeStatus') : t('common.inactiveStatus')}
              icon={<Power size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {data.tg_tao != null || data.tg_cap_nhat != null ? (
          <DetailSection title={t('doiTac.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
            <DetailFieldGrid>
              {data.tg_tao != null && (
                <DetailField label={t('doiTac.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
              )}
              {data.tg_cap_nhat != null && (
                <DetailField label={t('doiTac.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
              )}
            </DetailFieldGrid>
          </DetailSection>
        ) : null}
      </div>
    </GenericDrawer>
  );
};

export default NhomDetailDrawer;
