import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Mail, Edit, Trash2 } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort } from '../../../../lib/utils';
import { wrapVariablesForDisplay } from '../core/template-variables';
import type { MauPhanHoi } from '../core/types';

interface Props {
  data: MauPhanHoi;
  onClose: () => void;
  onEdit: (item: MauPhanHoi) => void;
  onDelete?: (id: string) => void;
}

const MauPhanHoiDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;

  const safeHtml = useMemo(() => {
    if (!data.noi_dung_mau?.trim()) return '';
    const withVars = wrapVariablesForDisplay(data.noi_dung_mau);
    return DOMPurify.sanitize(withVars, { ADD_ATTR: ['data-var'] });
  }, [data.noi_dung_mau]);

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
        {onDelete && (
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
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={data.ten_loai}
      icon={<Mail size={20} />}
      subtitle={data.ma}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Mail size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_loai}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection
          title={t('thietLapTuyenDung.mauPhanHoi.form.basicInfo')}
          icon={<Mail size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 gap-4">
            <DetailField label={t('thietLapTuyenDung.mauPhanHoi.store.maCol')} value={data.ma} />
            <DetailField label={t('thietLapTuyenDung.mauPhanHoi.store.tenLoaiCol')} value={data.ten_loai} />
            <DetailField label={t('thietLapTuyenDung.mauPhanHoi.store.tieuDeCol')} value={data.tieu_de} />
            {data.noi_dung_mau ? (
              <div>
                <p className="text-body-sm text-muted-foreground mb-1">{t('thietLapTuyenDung.mauPhanHoi.form.noiDungMau')}</p>
                <div
                  className="text-sm text-foreground bg-muted/50 p-3 rounded-lg border border-border max-h-64 overflow-y-auto template-detail-content"
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              </div>
            ) : null}
            <DetailField
              label={t('thietLapTuyenDung.mauPhanHoi.store.statusCol')}
              value={isActive ? t('common.active') : t('common.inactive')}
            />
            <DetailField
              label={t('thietLapTuyenDung.mauPhanHoi.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default MauPhanHoiDetail;
