/**
 * Trang in phiếu bảo trì / sửa chữa — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ chỉnh
 * trên bảng cài đặt; PDF / DOC chụp từ chính bản xem trước). Route: /hanh-chinh/chi-phi-tai-san/preview/:id
 */
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useAuthStore } from '../../../store/useStore';
import { usePhieuBaoTriById } from './hooks/use-bao-tri-sua-chua';
import { useBaoTriSuaChuaViewScope } from './hooks/use-bao-tri-sua-chua-view-scope';
import { useTaiSanTomTat } from '../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { exportPhieuBaoTriXLSX, tenFilePhieuBaoTri } from './utils/export-phieu-xlsx';
import PhieuBaoTriPreview from './components/preview/PhieuBaoTriPreview';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuBaoTriPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuBaoTriById(id ?? null);
  const { viewAll, isLoading: dangTaiPhamVi } = useBaoTriSuaChuaViewScope();
  const { data: taiSanList = [], isLoading: dangTaiTaiSan } = useTaiSanTomTat();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');

  // Bảng phiếu chưa có RLS theo người: cổng xem khớp phạm vi danh sách (TatCaTab) —
  // xem tất cả, hoặc phiếu do mình tạo, hoặc phiếu của tài sản mình đang giữ.
  const duocXem = useMemo(() => {
    if (!phieu) return false;
    if (viewAll || String(phieu.id_nguoi_tao) === String(currentUserId)) return true;
    const taiSan = taiSanList.find((a) => String(a.id) === String(phieu.id_tai_san));
    return !!taiSan && String(taiSan.id_nhan_vien_dang_giu) === String(currentUserId);
  }, [phieu, currentUserId, viewAll, taiSanList]);

  const dangTai = isLoading || dangTaiPhamVi || dangTaiTaiSan;
  const loi = isError
    ? ((error as Error)?.message ?? t('baoTriSuaChua.print.loadError'))
    : dangTai
      ? null
      : !phieu
        ? t('baoTriSuaChua.print.notFound')
        : !duocXem
          ? t('baoTriSuaChua.print.noPermission')
          : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('baoTriSuaChua.print.pageTitle')} - ${phieu.ma_phieu}` : t('baoTriSuaChua.print.pageTitle')}
      mauKey="phieu-bao-tri"
      macDinh={MAC_DINH}
      coChuGocPt={12}
      tenFile={phieu ? tenFilePhieuBaoTri(phieu) : 'phieu-bao-tri'}
      duongDanVe="/hanh-chinh/chi-phi-tai-san"
      isLoading={dangTai}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu && duocXem
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuBaoTriXLSX(phieu) }]
          : undefined
      }
    >
      {phieu && duocXem && <PhieuBaoTriPreview phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuBaoTriPreviewPage;
