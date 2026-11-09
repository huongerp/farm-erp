/**
 * Trang in mẫu checklist TRẮNG — route /quan-ly-nha-so-che/checklist-mau/preview/:id
 * Dùng để in biểu mẫu giấy cho người làm điền tay.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useMauChiTiet } from './hooks/use-checklist-mau';
import ChecklistMauPreview from './components/preview/ChecklistMauPreview';

// Mẫu A4 dọc, lề hẹp để bảng nhiều cột vẫn đủ chỗ ghi tay.
const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 8 } as const;

const ChecklistMauPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useMauChiTiet(id ?? '');

  const loi = isError
    ? (error?.message ?? t('checklistMau.preview.notFound'))
    : !isLoading && id && !data
      ? t('checklistMau.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${data.mau.ten}${data.mau.ma ? ` - ${data.mau.ma}` : ''}` : t('checklistMau.preview.title')}
      mauKey="checklist-mau"
      macDinh={MAC_DINH}
      coChuGocPt={9}
      tenFile={`Mau-checklist-${data?.mau.ma ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/checklist-mau"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <ChecklistMauPreview data={data} />}
    </PhieuInPage>
  );
};

export default ChecklistMauPreviewPage;
