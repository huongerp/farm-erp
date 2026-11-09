/** Trang in phiếu checklist công đoạn — route /quan-ly-nha-so-che/checklist-ban-giao/preview/:id */
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDauChim } from '../../../components/shared/phieu-in/use-dau-chim';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDongByPhieu, usePhieuById } from './hooks/use-checklist-ban-giao';
import ChecklistBanGiaoPreview from './components/preview/ChecklistBanGiaoPreview';

// Phiếu A4 dọc, nội dung là bảng tích 2 khâu nên lề hẹp để kịp dòng.
const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 8 } as const;

const ChecklistPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = usePhieuById(id);
  const { data: dong = [], isLoading: dongLoading } = useDongByPhieu(id);
  const { data: branches = [] } = useBranches();

  const tenChiNhanh = useMemo(
    () => branches.find((b) => b.id === data?.id_chi_nhanh)?.ten_chi_nhanh ?? '',
    [branches, data?.id_chi_nhanh]
  );

  const dauChim = useDauChim(data?.trang_thai);
  const loi = isError
    ? (error?.message ?? t('checklistBanGiao.preview.notFound'))
    : !isLoading && !data
      ? t('checklistBanGiao.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('checklistBanGiao.preview.title')} - ${data.so_phieu}` : t('checklistBanGiao.preview.title')}
      mauKey="checklist-ban-giao"
      dauChim={dauChim}
      duongDanGoc={id ? `/quan-ly-nha-so-che/checklist-ban-giao/preview/${id}` : null}
      macDinh={MAC_DINH}
      coChuGocPt={9}
      tenFile={`Phieu-checklist-cong-doan-${data?.so_phieu ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/checklist-ban-giao"
      isLoading={isLoading || dongLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <ChecklistBanGiaoPreview phieu={data} dong={dong} tenChiNhanh={tenChiNhanh} />}
    </PhieuInPage>
  );
};

export default ChecklistPreviewPage;
