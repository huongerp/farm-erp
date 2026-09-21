/**
 * Trang preview công việc (mở tab mới) – toolbar Đóng + In, nội dung A4.
 * Route: /hanh-chinh/cong-viec/preview/:id
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react';
import { useCongViecList } from './hooks/use-cong-viec';
import { useEmployeesRefQuery } from '../../../lib/hooks/use-supabase-ref-queries';
import CongViecPreviewContent from './components/CongViecPreviewContent';

const CongViecPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('congViec.preview.title')} - ${record.tieu_de}`;
    return () => {
      document.title = prev;
    };
  }, [record, t]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // window.open(..., 'noopener') → window.opener === null, trình duyệt chặn window.close().
      navigate('/hanh-chinh/cong-viec', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {isError ? (error?.message ?? t('congViec.preview.loadError')) : t('congViec.preview.notFound')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium"
            >
              {t('common.retry')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            <X size={16} />
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cong-viec-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
      role="main"
      aria-label={t('congViec.preview.title')}
    >
      <div className="cong-viec-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
        >
          <Printer size={16} />
          {t('congViec.preview.print')}
        </button>
      </div>

      <div className="cong-viec-preview-body flex-1 overflow-auto p-4 md:p-6 flex justify-center">
        <div
          className="bg-white shadow-xl rounded-sm cong-viec-preview-content-wrapper"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          <CongViecPreviewContent record={record} congViecCon={congViecCon} getEmployeeName={getEmployeeName} />
        </div>
      </div>
    </div>
  );
};

export default CongViecPreviewPage;
