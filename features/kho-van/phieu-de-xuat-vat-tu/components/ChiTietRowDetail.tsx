import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Warehouse, User, UserCheck, Package, TrendingUp } from 'lucide-react';
import type { PhieuDeXuatVatTuChiTietRow } from '../core/types';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { cn } from '../../../../lib/utils';
import { getTienDoMhBadgeClass, getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../core/constants';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: PhieuDeXuatVatTuChiTietRow;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Mở popup chuyển tiến độ cho đúng dòng này */
  onChuyenTienDo?: () => void;
}

const ChiTietRowDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onChuyenTienDo }) => {
  const { t } = useTranslation();

  const detailToolbarActions: DetailToolbarAction[] = useMemo(
    () =>
      onChuyenTienDo
        ? [
            {
              label: t('phieuDeXuatVatTu.chiTietTab.tienDoAction'),
              icon: <TrendingUp size={16} />,
              onClick: onChuyenTienDo,
              variant: 'secondary' as const,
            },
          ]
        : [],
    [t, onChuyenTienDo]
  );

  const statusLabel = data.trang_thai_phieu
    ? t(`phieuDeXuatVatTu.status.${trangThaiToI18nKey(data.trang_thai_phieu)}`, { defaultValue: data.trang_thai_phieu })
    : '—';
  const statusBadgeClass = getTrangThaiPhieuBadgeClass(data.trang_thai_phieu);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit();
              onClose(); } : undefined}
      onDelete={onDelete ? () => onDelete() : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('phieuDeXuatVatTu.chiTietTab.detailTitle')}
      subtitle={`${data.so_phieu ?? ''} · ${data.ma_hang ?? data.ten_hang ?? data.id}`}
      icon={<Package size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Package size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ma_hang ?? data.ten_hang ?? `#${data.id}`}
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {data.so_phieu ?? '—'} · {Number(data.so_luong).toLocaleString()} {data.don_vi_tinh ?? ''}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusBadgeClass,
                )}
              >
                {statusLabel}
              </span>
              {data.ten_tien_do_mh ? (
                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', getTienDoMhBadgeClass(data.ten_tien_do_mh))}>
                  {data.ten_tien_do_mh}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {detailToolbarActions.length > 0 && (
          <DetailToolbar
            actions={detailToolbarActions}
            className="bg-card rounded-xl border border-border"
          />
        )}

        <DetailSection
          title={t('phieuDeXuatVatTu.chiTietTab.sectionPhieu')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField label={t('phieuDeXuatVatTu.form.code')} value={data.so_phieu ?? '—'} icon={<FileText size={12} />} />
            <DetailField label={t('phieuDeXuatVatTu.form.date')} value={data.ngay ?? '—'} icon={<Calendar size={12} />} />
            <DetailField
              label={t('phieuDeXuatVatTu.form.requiredDate')}
              value={data.ngay_can ?? '—'}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.place')}
              value={data.ten_noi_de_xuat ?? '—'}
              icon={<Warehouse size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.requester')}
              value={data.ten_nguoi_de_xuat ?? '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.store.statusCol')}
              value={data.trang_thai_phieu ?? '—'}
              icon={<FileText size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={t('phieuDeXuatVatTu.chiTietTab.sectionHangHoa')}
          icon={<Package size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('phieuDeXuatVatTu.form.itemCode')}
              value={data.ma_hang ?? '—'}
              icon={<Package size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.itemName')}
              value={data.ten_hang ?? '—'}
              icon={<Package size={12} />}
              className="col-span-1 sm:col-span-2"
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.quantity')}
              value={Number(data.so_luong).toLocaleString()}
              icon={<Package size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.unit')}
              value={data.don_vi_tinh ?? '—'}
              icon={<Package size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.tienDoMh')}
              value={
                data.ten_tien_do_mh ? (
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', getTienDoMhBadgeClass(data.ten_tien_do_mh))}>
                    {data.ten_tien_do_mh}
                  </span>
                ) : (
                  '—'
                )
              }
              icon={<Package size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.store.nguoiDuyetCol')}
              value={data.ten_nguoi_duyet ?? '—'}
              icon={<UserCheck size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.specs')}
              value={data.thong_so ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={t('phieuDeXuatVatTu.chiTietTab.traoDoiGhiChuSection')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('phieuDeXuatVatTu.chiTietTab.traoDoiLabel')}
              value={data.trao_doi ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.note')}
              value={data.ghi_chu ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default ChiTietRowDetail;
