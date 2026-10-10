/**
 * Trang in đề xuất mua hàng (Nhà sơ chế / Phân thuốc). Route: <basePath>/de-xuat-mua-hang/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDeXuatMuaHangById } from './hooks/use-de-xuat-mua-hang';
import { exportDeXuatMuaHangToXLSX, fileName } from './utils/export-de-xuat-mua-hang';
import DeXuatMuaHangPreviewContent from './components/DeXuatMuaHangPreviewContent';
import { useKhoBienThe } from '../kho-bien-the/KhoBienTheProvider';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const DeXuatMuaHangPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const bt = useKhoBienThe();
  const { data: phieu, isLoading, isError, error, refetch } = useDeXuatMuaHangById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('deXuatMuaHang.preview.loadError'))
    : !isLoading && !phieu
      ? t('deXuatMuaHang.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('deXuatMuaHang.preview.title')} - ${phieu.so_phieu}` : t('deXuatMuaHang.preview.title')}
      mauKey="de-xuat-mua-hang"
      macDinh={MAC_DINH}
      tenFile={phieu ? fileName(phieu) : 'de-xuat-mua-hang'}
      duongDanVe={`${bt.basePath}/de-xuat-mua-hang`}
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportDeXuatMuaHangToXLSX(phieu, phieu.chi_tiet ?? []) }]
          : undefined
      }
    >
      {phieu && <DeXuatMuaHangPreviewContent phieu={phieu} />}
    </PhieuInPage>
  );
};

export default DeXuatMuaHangPreviewPage;
