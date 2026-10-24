import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Warehouse } from 'lucide-react';
import TonKhoPTHangNxHistorySection from './TonKhoPTHangNxHistorySection';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailField from '../../../../components/shared/DetailField';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
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

  const khoColumns: SubTableColumn[] = [
    { id: 'ten_kho', label: t('tonKhoPhanThuoc.table.kho'), width: 200, minWidth: 120, sticky: true, mobile: 'title' },
    { id: 'ton_dau', label: t('tonKhoPhanThuoc.table.tonDau'), width: 100, minWidth: 70, align: 'right' },
    { id: 'nhap', label: t('tonKhoPhanThuoc.table.nhap'), width: 100, minWidth: 70, align: 'right' },
    { id: 'xuat', label: t('tonKhoPhanThuoc.table.xuat'), width: 100, minWidth: 70, align: 'right' },
    { id: 'chuyen', label: t('tonKhoPhanThuoc.table.chuyen'), width: 100, minWidth: 70, align: 'right' },
    { id: 'ton_cuoi', label: t('tonKhoPhanThuoc.table.tonCuoi'), width: 110, minWidth: 80, align: 'right' },
  ];

  const renderKhoCell = (colId: string, k: TonKhoPTProductAgg['kho'][number]) => {
    switch (colId) {
      case 'ten_kho':
        return k.ten_kho;
      case 'ton_dau':
        return <span className="tabular-nums">{formatNumberVN(k.ton_dau)}</span>;
      case 'nhap':
        return <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumberVN(k.nhap)}</span>;
      case 'xuat':
        return <span className="tabular-nums text-amber-600 dark:text-amber-400">{formatNumberVN(k.xuat)}</span>;
      case 'chuyen': {
        const chuyen = k.chuyen_den - k.chuyen_di;
        return (
          <span className="tabular-nums text-muted-foreground">
            {chuyen > 0 ? `+${formatNumberVN(chuyen)}` : formatNumberVN(chuyen)}
          </span>
        );
      }
      case 'ton_cuoi':
        return (
          <span className={cn('tabular-nums font-medium', k.ton_cuoi < 0 && 'text-destructive')}>
            {formatNumberVN(k.ton_cuoi)}
          </span>
        );
      default:
        return null;
    }
  };

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
          contentMode="raw"
        >
          {agg.kho.length > 0 ? (
            // SubTable: desktop là bảng như cũ, điện thoại chuyển sang thẻ (Kho làm tiêu đề, 5 số xếp lưới 2 cột).
            <SubTable
              tableKey="ton-kho-pt.detail-kho"
              columns={khoColumns}
              rows={agg.kho}
              keyExtractor={(k) => k.id_kho}
              renderCell={renderKhoCell}
              maxHeight="280px"
            />
          ) : undefined}
        </GenericSubTableSection>

        <TonKhoPTHangNxHistorySection idHangHoa={agg.id_hang_hoa} ky={ky} />
      </div>
    </GenericDrawer>
  );
};

export default TonKhoPTProductDetail;
