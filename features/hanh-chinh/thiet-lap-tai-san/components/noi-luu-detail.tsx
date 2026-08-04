import React, { useMemo } from 'react';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import { formatDateTimeShort } from '../../../../lib/utils';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import TaiSanListSection from '../../danh-muc-tai-san/components/TaiSanListSection';
import type { AssetStorageLocation } from '../core/types';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: AssetStorageLocation;
  onClose: () => void;
  onEdit?: (item: AssetStorageLocation) => void;
  onDelete?: (id: string) => void;
}

const NoiLuuDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { data: taiSanList = [] } = useTaiSanList();
  const assetsAtLocation = useMemo(
    () => taiSanList.filter((ts) => ts.id_noi_luu === data.id),
    [taiSanList, data.id]
  );
  const viewAllHref = `/hanh-chinh/danh-muc-tai-san?id_noi_luu=${encodeURIComponent(data.id)}`;
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
      title={data.ten_noi_luu}
      icon={<MapPin size={20} />}
      subtitle={data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <MapPin size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_noi_luu}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma_noi_luu} · {data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
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
          title={t('thietLapTaiSan.noiLuu.form.basicInfo')}
          icon={<MapPin size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('thietLapTaiSan.noiLuu.store.branchCol')}
              value={data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
            />
            <DetailField label={t('thietLapTaiSan.noiLuu.store.maCol')} value={data.ma_noi_luu} />
            <DetailField label={t('thietLapTaiSan.noiLuu.store.tenCol')} value={data.ten_noi_luu} />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thietLapTaiSan.noiLuu.store.noteCol')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('thietLapTaiSan.noiLuu.store.statusCol')}
              value={isActive ? t('common.active') : t('common.inactive')}
            />
            <DetailField
              label={t('thietLapTaiSan.noiLuu.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>

        <TaiSanListSection
          title={t('danhSachTaiSan.detail.assetsAtLocation')}
          assets={assetsAtLocation}
          viewAllHref={viewAllHref}
          viewAllLabel={t('danhSachTaiSan.detail.viewAllInAssetList')}
        />
      </div>
    </GenericDrawer>
  );
};

export default NoiLuuDetail;
