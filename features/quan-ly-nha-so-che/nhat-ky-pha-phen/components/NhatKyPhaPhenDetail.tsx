import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Beaker, Building2, Calendar, FileText, Gauge, Printer, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { cn, formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhaPhen } from '../core/types';
import { formatChenhLech, formatKg } from '../utils/hien-thi';

interface Props {
  data: NhatKyPhaPhen;
  onClose: () => void;
  onEdit?: (item: NhatKyPhaPhen) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const NhatKyPhaPhenDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mau = data.chenh_lech > 0 ? 'text-rose-600 dark:text-rose-400' : data.chenh_lech < 0 ? 'text-emerald-600 dark:text-emerald-400' : '';

  return (
    <GenericDrawer
      title={t('nkpp.detail.title')}
      subtitle={`${formatYmdToDisplay(data.ngay)}${data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''}`}
      icon={<Beaker className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={onEdit && canUpdate ? () => onEdit(data) : undefined}
          onDelete={onDelete && canDelete ? () => onDelete(data.id) : undefined}
          extraActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/quan-ly-nha-so-che/nhat-ky-pha-phen/preview/${data.id}`)}
            >
              <Printer size={16} className="mr-2" /> {t('nkpp.in.inPhieu')}
            </Button>
          }
        />
      }
    >
      <div className="space-y-5">
        <DetailSection title={t('nkpp.detail.thongTin')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('nkpp.col.chiNhanh')} value={data.ten_chi_nhanh ?? ''} emptyText="—" icon={<Building2 size={12} />} />
            <DetailField label={t('nkpp.col.ngay')} value={formatYmdToDisplay(data.ngay)} icon={<Calendar size={12} />} />
            <DetailField label={t('nkpp.col.nhanSu')} value={data.ten_nhan_vien_phu_trach ?? ''} emptyText="—" icon={<User size={12} />} />
            <DetailField label={t('nkpp.col.soBuongDuThu')} value={data.so_buong_du_thu != null ? String(data.so_buong_du_thu) : ''} emptyText="—" />
            <DetailField label={t('nkpp.col.soBeSoChe')} value={data.so_be_so_che != null ? String(data.so_be_so_che) : ''} emptyText="—" />
            <DetailField
              label={t('nkpp.col.ghiChu')}
              value={data.ghi_chu ?? ''}
              emptyText="—"
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('nkpp.form.cacLanPha')} icon={<Gauge size={14} />} variant="secondary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-1.5 pr-3">{t('nkpp.detail.lanPha')}</th>
                  <th className="text-right font-medium py-1.5 px-3">{t('nkpp.detail.soKg')}</th>
                  <th className="text-right font-medium py-1.5 pl-3">{t('nkpp.col.dinhMuc')}</th>
                </tr>
              </thead>
              <tbody>
                {data.lan.map((l) => (
                  <tr key={l.lan} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-3">{t(`nkpp.col.lan${l.lan}`)}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">{formatKg(l.so_kg)}</td>
                    <td className="py-1.5 pl-3 text-right tabular-nums text-muted-foreground">{formatKg(l.dinh_muc_kg)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-2 pr-3">{t('nkpp.col.tongPhen')}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatKg(data.tong_thuc_te)}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{formatKg(data.tong_dinh_muc)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={cn('mt-2 text-sm font-semibold tabular-nums', mau)}>
            {t('nkpp.col.chenhLech')}: {formatChenhLech(data.chenh_lech)} kg
          </p>
        </DetailSection>

        <DetailSection title={t('nkpp.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
          <DetailFieldGrid>
            <DetailField label={t('nkpp.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
            <DetailField label={t('nkpp.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('nkpp.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default NhatKyPhaPhenDetail;
