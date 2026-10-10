/**
 * Trang in phiếu lương. Route: /phieu-luong/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useBangLuongById } from './hooks/use-bang-luong';
import { exportBangLuongExcel } from './utils/export-bang-luong';
import PayslipPreviewContent from './components/PayslipPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const PayslipPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: record, isLoading, isError, error, refetch } = useBangLuongById(id ?? null);

  const loi = isError
    ? (error?.message ?? t('bangLuong.preview.loadError'))
    : !isLoading && !record
      ? t('bangLuong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={record ? `${t('bangLuong.preview.title')} - ${record.ten_nhan_vien || record.ma_nhan_vien || record.id} · ${record.nam}-${String(record.thang).padStart(2, '0')}` : t('bangLuong.preview.title')}
      mauKey="phieu-luong"
      macDinh={MAC_DINH}
      tenFile={record ? `Phieu_luong_${record.ma_nhan_vien || record.id}_${record.nam}-${String(record.thang).padStart(2, "0")}` : 'phieu-luong'}
      duongDanVe="/hanh-chinh/bang-luong"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        record
          ? [{ key: 'xlsx', label: 'Excel', icon: <FileSpreadsheet size={16} />, onClick: () => exportBangLuongExcel(record) }]
          : undefined
      }
    >
      {record && <PayslipPreviewContent record={record} />}
    </PhieuInPage>
  );
};

export default PayslipPreviewPage;
