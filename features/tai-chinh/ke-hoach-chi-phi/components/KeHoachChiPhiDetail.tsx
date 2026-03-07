import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Building2, Edit, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailField from '../../../../components/shared/DetailField';
import type { KeHoachChiPhi } from '../core/types';
import { THANG_KEYS } from '../core/types';
import { formatCurrency } from '../../../../lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: KeHoachChiPhi;
  onClose: () => void;
  onEdit: (item: KeHoachChiPhi) => void;
  onDelete: (id: string) => void;
}

const KeHoachChiPhiDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <GenericDrawer
      title={data.ten_danh_muc}
      subtitle={`${t('keHoachChiPhi.columns.nam')}: ${data.nam}`}
      icon={<FileText size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            {BTN_CLOSE()}
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => onEdit(data)} className="bg-primary text-white shadow-lg hover:bg-primary/90">
              <Edit size={16} className="mr-2" /> {BTN_EDIT()}
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(data.id)}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
            >
              <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
            </Button>
          </div>
        </div>
      }
    >
      <DetailSection title={t('keHoachChiPhi.form.basicInfo')} icon={<FileText size={14} />}>
        <DetailFieldGrid>
          <DetailField label={t('keHoachChiPhi.form.nam')} value={String(data.nam)} icon={<Calendar size={12} />} />
          <DetailField label={t('keHoachChiPhi.form.phongBan')} value={data.ten_phong_ban || '–'} icon={<Building2 size={12} />} />
          <DetailField label={t('keHoachChiPhi.columns.khoanMuc')} value={data.ten_danh_muc} />
          <DetailField label={t('keHoachChiPhi.columns.moTa')} value={data.mo_ta || '–'} />
          <DetailField label={t('keHoachChiPhi.columns.tongCong')} value={formatCurrency(data.tong_nam)} />
          {data.tong_sl != null && (
            <DetailField label={t('keHoachChiPhi.columns.tongSl')} value={String(data.tong_sl)} />
          )}
        </DetailFieldGrid>
        {data.ghi_chu && (
          <DetailFieldGrid cols={1} className="mt-4">
            <DetailField label={t('keHoachChiPhi.form.ghiChu')} value={data.ghi_chu} />
          </DetailFieldGrid>
        )}
      </DetailSection>

      <DetailSection title={t('keHoachChiPhi.form.detailSection')} icon={<FileText size={14} />} className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THANG_KEYS.map((key, i) => {
            const sl = (data as any)[`thang_${i + 1}_so_luong`] as number | undefined;
            const dg = (data as any)[`thang_${i + 1}_don_gia`] as number | undefined;
            const tien = data[key] ?? 0;
            return (
              <div key={key} className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground pb-1 border-b border-border/60">
                  {t('keHoachChiPhi.monthShort', { n: i + 1 })}
                </div>
                <div className="text-xs flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{t('keHoachChiPhi.tien')}:</span>
                  <span className="tabular-nums text-right truncate">{formatCurrency(tien)}</span>
                </div>
                <div className="text-xs flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{t('keHoachChiPhi.soLuong')}:</span>
                  <span className="tabular-nums text-right">{sl != null ? sl : '–'}</span>
                </div>
                <div className="text-xs flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{t('keHoachChiPhi.donGia')}:</span>
                  <span className="tabular-nums text-right truncate">{dg != null && dg > 0 ? formatCurrency(dg) : '–'}</span>
                </div>
              </div>
            );
          })}
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground pb-1 border-b border-border/60">
              {t('keHoachChiPhi.columns.tongCong')}
            </div>
            <div className="text-xs flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">{t('keHoachChiPhi.tien')}:</span>
              <span className="tabular-nums font-medium text-right">{formatCurrency(data.tong_nam)}</span>
            </div>
            {data.tong_sl != null && (
              <div className="text-xs flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">{t('keHoachChiPhi.soLuong')}:</span>
                <span className="tabular-nums font-medium text-right">{data.tong_sl}</span>
              </div>
            )}
          </div>
        </div>
      </DetailSection>
    </GenericDrawer>
  );
};

export default KeHoachChiPhiDetail;
