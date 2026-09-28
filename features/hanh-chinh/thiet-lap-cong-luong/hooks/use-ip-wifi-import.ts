import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { IP_TRANG_THAI_OPTIONS, planIpWifiImport } from '../utils/import-ip-wifi';
import { useImportPayrollWifiIps } from './use-payroll-wifi-ip';

/** Wiring Import Excel IP wifi chấm công. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useIpWifiImport(branches: Branch[]) {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportPayrollWifiIps();

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'chi_nhanh', label: t('payrollIp.import.colChiNhanh'), required: true, hint: t('payrollIp.import.hintChiNhanh') },
      { key: 'ip_wifi', label: t('payrollIp.store.ipCol'), required: true, hint: t('payrollIp.import.hintIp') },
      { key: 'ghi_chu', label: t('payrollIp.store.noteCol'), hint: t('payrollIp.import.hintTuyChon') },
      { key: 'trang_thai', label: t('payrollIp.store.statusCol'), hint: t('payrollIp.import.hintTrangThai') },
    ],
    [t]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const cn = branches[0]?.ma_chi_nhanh || 'FARM01';
    return [
      [cn, '113.161.10.25', t('payrollIp.import.exampleGhiChu'), IP_TRANG_THAI_OPTIONS[0].value],
      [branches[0]?.ten_chi_nhanh || cn, '14.232.8.101', '', ''],
    ];
  }, [branches, t]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: t('payrollIp.import.sheetChiNhanh'),
        headers: [t('payrollIp.import.refMa'), t('payrollIp.import.refTen')],
        data: branches.map((b) => [b.ma_chi_nhanh, b.ten_chi_nhanh]),
      },
      {
        name: t('payrollIp.import.sheetTrangThai'),
        headers: [t('payrollIp.store.statusCol')],
        data: IP_TRANG_THAI_OPTIONS.map((o) => [o.value]),
      },
    ],
    [branches, t]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = planIpWifiImport(
        rows,
        branches.map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh }))
      );
      const result = plan.toCreate.length > 0 ? await importMutation.mutateAsync(plan.toCreate) : { created: 0, errors: [] };
      setImportErrors([...plan.errors, ...result.errors].sort((a, b) => a.row - b.row));
      return { created: result.created, updated: 0 };
    },
    [branches, importMutation]
  );

  return {
    showImport,
    openImport: () => setShowImport(true),
    closeImport: () => {
      setShowImport(false);
      setImportErrors([]);
    },
    importColumns,
    sampleRows,
    referenceSheets,
    importErrors,
    handleImport,
    templateFileName: t('payrollIp.importTemplateName'),
  };
}
