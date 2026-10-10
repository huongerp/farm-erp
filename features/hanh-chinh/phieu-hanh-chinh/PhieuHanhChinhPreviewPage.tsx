/**
 * Trang in phiếu hành chính — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ chỉnh trên
 * bảng cài đặt; PDF / DOC chụp từ chính bản xem trước). Route: /hanh-chinh/phieu-hanh-chinh/preview/:id
 */
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useAuthStore } from '../../../store/useStore';
import { useAdminFormById } from './hooks/use-admin-form';
import { usePhieuHanhChinhViewScope } from './hooks/use-phieu-hanh-chinh-view-scope';
import { chonTabChoPhieu } from './core/deep-link';
import { soPhieuIn } from './core/phieu-in';
import { exportPhieuHanhChinhXLSX, tenFilePhieuHanhChinh } from './utils/export-phieu-xlsx';
import PhieuHanhChinhPreview from './components/preview/PhieuHanhChinhPreview';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuHanhChinhPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: phieu, isLoading, isError, error, refetch } = useAdminFormById(id ?? null);
  const { viewAll, isLoading: dangTaiPhamVi } = usePhieuHanhChinhViewScope();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');

  // Bảng phiếu chưa có RLS theo người: cổng "chỉ in phiếu của mình" nằm ở đây, giống deep-link.
  const duocXem = useMemo(
    () => !!phieu && chonTabChoPhieu({ nguoiTaoId: phieu.nguoi_tao_id, currentUserId, viewAll }).tab !== null,
    [phieu, currentUserId, viewAll]
  );
  const dangTai = isLoading || dangTaiPhamVi;
  const loi = isError
    ? ((error as Error)?.message ?? t('adminForm.print.loadError'))
    : dangTai
      ? null
      : !phieu
        ? t('adminForm.deepLink.notFound')
        : !duocXem
          ? t('adminForm.deepLink.noPermission')
          : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('adminForm.print.pageTitle')} - ${soPhieuIn(phieu.id)}` : t('adminForm.print.pageTitle')}
      mauKey="phieu-hanh-chinh"
      macDinh={MAC_DINH}
      coChuGocPt={12}
      tenFile={phieu ? tenFilePhieuHanhChinh(phieu) : 'phieu-hanh-chinh'}
      duongDanVe="/hanh-chinh/phieu-hanh-chinh"
      isLoading={dangTai}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu && duocXem
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuHanhChinhXLSX(phieu) }]
          : undefined
      }
    >
      {phieu && duocXem && <PhieuHanhChinhPreview phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuHanhChinhPreviewPage;
