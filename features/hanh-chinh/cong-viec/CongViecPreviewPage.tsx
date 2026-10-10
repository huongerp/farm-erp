/**
 * Trang in công việc — khung in dùng chung. Route: /hanh-chinh/cong-viec/preview/:id
 */
import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useCongViecList } from './hooks/use-cong-viec';
import { useEmployeesRefQuery } from '../../../lib/hooks/use-ref-queries';
import CongViecPreviewContent from './components/CongViecPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const CongViecPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: list = [], isLoading, isError, error, refetch } = useCongViecList();
  const { data: employees = [] } = useEmployeesRefQuery();

  const record = useMemo(
    () => (id ? list.find((c) => String(c.id) === String(id)) : undefined),
    [list, id]
  );
  const congViecCon = useMemo(
    () => (record ? list.filter((c) => c.id_cha === record.id) : []),
    [list, record]
  );

  const employeeNameMap = useMemo(() => {
    const m = new Map<string, string>();
    employees.forEach((e) => {
      const label = e.ho_ten
        ? `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}`
        : e.ma_nhan_vien || String(e.id);
      m.set(String(e.id), label);
    });
    return m;
  }, [employees]);

  const getEmployeeName = useCallback(
    (empId: number | string | null | undefined) => {
      if (empId == null) return '—';
      return employeeNameMap.get(String(empId)) ?? String(empId);
    },
    [employeeNameMap]
  );

  const loi = isError
    ? (error?.message ?? t('congViec.preview.loadError'))
    : !isLoading && !record
      ? t('congViec.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={record ? `${t('congViec.preview.title')} - ${record.tieu_de}` : t('congViec.preview.title')}
      mauKey="cong-viec"
      macDinh={MAC_DINH}
      tenFile={record ? `Cong_viec_${record.id}` : 'cong-viec'}
      duongDanVe="/hanh-chinh/cong-viec"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {record && <CongViecPreviewContent record={record} congViecCon={congViecCon} getEmployeeName={getEmployeeName} />}
    </PhieuInPage>
  );
};

export default CongViecPreviewPage;
