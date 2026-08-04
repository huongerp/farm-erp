import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { TienDoMuaHang } from '../core/types';
import { TRANG_THAI_MAU_DEFAULT } from '../core/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: TienDoMuaHang;
  onClose: () => void;
  onEdit?: (item: TienDoMuaHang) => void;
  onDelete?: (id: string) => void;
}

const TienDoMuaHangDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit(data);
              onClose(); } : undefined}
      onDelete={onDelete ? () => onDelete(data.id) : undefined}
    />
  );

  return (
    <GenericDrawer
      title={data.ten}
      icon={<Package size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: data.mau || TRANG_THAI_MAU_DEFAULT }}
          >
            <Package size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma}</p>
            <div className="mt-1.5">
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

        <DetailSection title={t('thietLapDeXuatVatTu.tienDoMuaHang.form.basicInfo')} icon={<Package size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ma')} value={data.ma} />
            <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ten')} value={data.ten} />
            <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.thuTu')} value={String(data.thu_tu)} />
            <div className="flex items-center gap-3">
              <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.store.mauCol')} value={data.mau || TRANG_THAI_MAU_DEFAULT} />
              <span
                className="w-10 h-10 rounded-lg border-2 border-border shrink-0 shadow-sm"
                style={{ backgroundColor: data.mau || TRANG_THAI_MAU_DEFAULT }}
                title={data.mau || TRANG_THAI_MAU_DEFAULT}
                aria-hidden
              />
            </div>
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('thietLapDeXuatVatTu.tienDoMuaHang.form.status')}
              value={data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.activeStatus') : t('common.inactiveStatus')}
            />
            <DetailField label={t('thietLapDeXuatVatTu.tienDoMuaHang.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default TienDoMuaHangDetail;
