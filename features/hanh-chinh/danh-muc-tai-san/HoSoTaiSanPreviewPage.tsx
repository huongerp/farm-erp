/**
 * Trang in hồ sơ tài sản. Route: /ho-so-tai-san/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useTaiSanList } from './hooks/use-danh-muc-tai-san';
import { exportHoSoTaiSanExcel, getFileName } from './utils/export-ho-so-tai-san';
import HoSoTaiSanPreviewContent from './components/HoSoTaiSanPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const HoSoTaiSanPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: list = [], isLoading, isError, error, refetch } = useTaiSanList();
  const record = id ? list.find((a) => a.id === id) : undefined;

  const loi = isError
    ? (error?.message ?? t('danhSachTaiSan.preview.loadError'))
    : !isLoading && !record
      ? t('danhSachTaiSan.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={record ? `${t('danhSachTaiSan.preview.title')} - ${record.ma_tai_san} · ${record.ten_tai_san}` : t('danhSachTaiSan.preview.title')}
      mauKey="ho-so-tai-san"
      macDinh={MAC_DINH}
      tenFile={record ? getFileName(record) : 'ho-so-tai-san'}
      duongDanVe="/hanh-chinh/danh-muc-tai-san"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        record
          ? [{ key: 'xlsx', label: 'Excel', icon: <FileSpreadsheet size={16} />, onClick: () => exportHoSoTaiSanExcel(record) }]
          : undefined
      }
    >
      {record && <HoSoTaiSanPreviewContent record={record} />}
    </PhieuInPage>
  );
};

export default HoSoTaiSanPreviewPage;
