import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Folder, ArrowUpFromLine, Calendar, Power } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
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
          onClick={() => onDelete(data.id)}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
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
