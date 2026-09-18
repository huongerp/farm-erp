import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tags } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { formatDateTimeShort } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { loaiHangMucToI18nKey } from '../core/constants';
import type { HangMucThuChi } from '../core/types';

interface Props {
  data: HangMucThuChi;
  onClose: () => void;
  onEdit?: (item: HangMucThuChi) => void;
  onDelete?: (id: string) => void;
}

const HangMucThuChiDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <GenericDrawer
      title={data.ten}
      icon={<Tags size={20} />}
      onClose={onClose}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          onEdit={
            onEdit
              ? () => {
                  onEdit(data);
                  onClose();
                }
              : undefined
          }
          onDelete={onDelete ? () => onDelete(data.id) : undefined}
        />
      }
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-primary/15 border border-primary/20 text-primary shrink-0">
            <Tags size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten}</h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium border border-sky-500/20">
                {t(loaiHangMucToI18nKey(data.loai))}
              </span>
              {data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  {t('common.inactiveStatus')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('thietLapQuy.hangMuc.form.basicInfo')} icon={<Tags size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thietLapQuy.hangMuc.form.ten')} value={data.ten} />
            <DetailField label={t('thietLapQuy.hangMuc.form.loai')} value={t(loaiHangMucToI18nKey(data.loai))} />
            <DetailField label={t('thietLapQuy.hangMuc.form.thuTu')} value={String(data.thu_tu)} />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thietLapQuy.hangMuc.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('thietLapQuy.hangMuc.form.status')}
              value={
                data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
                  ? t('common.activeStatus')
                  : t('common.inactiveStatus')
              }
            />
            <DetailField
              label={t('thietLapQuy.hangMuc.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default HangMucThuChiDetail;
