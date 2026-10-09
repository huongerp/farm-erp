import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Warehouse } from 'lucide-react';
import TonKhoPTHangNxHistorySection from './TonKhoPTHangNxHistorySection';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailField from '../../../../components/shared/DetailField';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { TonKhoPTProductAgg } from '../core/types';

interface Props {
  agg: TonKhoPTProductAgg;
  /** Kỳ đang xem (YYYY-MM-DD, rỗng = không giới hạn). */
  ky: { tu: string; den: string };
  onClose: () => void;
}

const TonKhoPTProductDetail: React.FC<Props> = ({ agg, ky, onClose }) => {
  const { t } = useTranslation();
  const kyLabel = t('tonKhoPhanThuoc.detail.kyLabel', {
    tu: ky.tu ? formatYmdToDisplay(ky.tu) : t('tonKhoPhanThuoc.detail.tuDau'),
    den: ky.den ? formatYmdToDisplay(ky.den) : t('tonKhoPhanThuoc.detail.homNay'),
  });
  const th = 'text-right px-3 py-2 text-xs font-semibold whitespace-nowrap';
  const td = 'px-3 py-2 text-right tabular-nums';

  return (
    <GenericDrawer
      title={t('tonKhoPhanThuoc.detail.productTitle')}
      subtitle={`${agg.ma_hang} · ${kyLabel}`}
      icon={<Package size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex w-full justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground border border-border">
            {BTN_CLOSE()}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <DetailSection title={t('tonKhoPhanThuoc.detail.sectionSummary')} icon={<Package size={14} />}>
          <DetailFieldGrid cols={2}>
            <DetailField label={t('tonKhoPhanThuoc.table.maHang')} value={agg.ma_hang} icon={<Package size={14} />} />
            <DetailField label={t('tonKhoPhanThuoc.table.tenHang')} value={agg.ten_hang} />
            <DetailField label={t('tonKhoPhanThuoc.table.danhMuc')} value={agg.ten_danh_muc ?? '—'} />
            <DetailField label={t('tonKhoPhanThuoc.table.dvt')} value={agg.don_vi_tinh} />
            <DetailField label={t('tonKhoPhanThuoc.table.tonDau')} value={formatNumberVN(agg.ton_dau)} />
            <DetailField label={t('tonKhoPhanThuoc.table.nhap')} value={formatNumberVN(agg.nhap)} />
            <DetailField label={t('tonKhoPhanThuoc.table.xuat')} value={formatNumberVN(agg.xuat)} />
            <DetailField label={t('tonKhoPhanThuoc.table.chuyen')} value={formatNumberVN(agg.chuyen)} />
            <DetailField label={t('tonKhoPhanThuoc.table.tonCuoi')} value={formatNumberVN(agg.ton_cuoi)} />
            <DetailField
              label={t('tonKhoPhanThuoc.table.dinhMuc')}
              value={agg.dinh_muc ? formatNumberVN(agg.dinh_muc) : '—'}
            />
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('tonKhoPhanThuoc.detail.sectionByWarehouse')}
          icon={<Warehouse size={14} />}
          count={agg.kho.length}
          emptyTitle={t('tonKhoPhanThuoc.detail.emptyWarehouse')}
          maxTableHeight="280px"
        >
          {agg.kho.length > 0 ? (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold whitespace-nowrap">
                    {t('tonKhoPhanThuoc.table.kho')}
                  </th>
                  <th className={th}>{t('tonKhoPhanThuoc.table.tonDau')}</th>
                  <th className={th}>{t('tonKhoPhanThuoc.table.nhap')}</th>
                  <th className={th}>{t('tonKhoPhanThuoc.table.xuat')}</th>
                  <th className={th}>{t('tonKhoPhanThuoc.table.chuyen')}</th>
                  <th className={th}>{t('tonKhoPhanThuoc.table.tonCuoi')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {agg.kho.map((k) => {
                  const chuyen = k.chuyen_den - k.chuyen_di;
                  return (
                    <tr key={k.id_kho}>
                      <td className="px-3 py-2">{k.ten_kho}</td>
                      <td className={td}>{formatNumberVN(k.ton_dau)}</td>
                      <td className={cn(td, 'text-emerald-600 dark:text-emerald-400')}>{formatNumberVN(k.nhap)}</td>
                      <td className={cn(td, 'text-amber-600 dark:text-amber-400')}>{formatNumberVN(k.xuat)}</td>
                      <td className={cn(td, 'text-muted-foreground')}>
                        {chuyen > 0 ? `+${formatNumberVN(chuyen)}` : formatNumberVN(chuyen)}
                      </td>
                      <td className={cn(td, 'font-medium', k.ton_cuoi < 0 && 'text-destructive')}>
                        {formatNumberVN(k.ton_cuoi)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          ) : undefined}
        </GenericSubTableSection>

        <TonKhoPTHangNxHistorySection idHangHoa={agg.id_hang_hoa} ky={ky} />
      </div>
    </GenericDrawer>
  );
};

export default TonKhoPTProductDetail;
