import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { KHO_TRANG_THAI_OPTIONS, planKhoImport } from '../utils/import-kho';
import { useImportKho } from './use-kho';

/** Wiring Import Excel danh sách kho. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useKhoImport() {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportKho();
  const { data: branches = [] } = useBranches();

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'ma_kho', label: t('kho.form.code'), required: true, hint: t('kho.import.hintMa') },
      { key: 'ten_kho', label: t('kho.form.name'), required: true, hint: t('kho.import.hintTen') },
      { key: 'chi_nhanh', label: t('kho.form.branch'), required: true, hint: t('kho.import.hintChiNhanh') },
      { key: 'dia_chi', label: t('kho.form.address'), hint: t('kho.import.hintTuyChon') },
      { key: 'mo_ta', label: t('kho.detail.description'), hint: t('kho.import.hintTuyChon') },
      { key: 'thu_tu', label: t('kho.detail.order'), hint: t('kho.import.hintThuTu') },
      { key: 'trang_thai', label: t('common.status'), hint: t('kho.import.hintTrangThai') },
    ],
    [t]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const cn = branches[0]?.ma_chi_nhanh || 'FARM01';
    return [
      ['KHO_PHAN', t('kho.import.exampleTen1'), cn, t('kho.import.exampleDiaChi'), '', 1, KHO_TRANG_THAI_OPTIONS[0].value],
      ['KHO_THUOC', t('kho.import.exampleTen2'), branches[0]?.ten_chi_nhanh || cn, '', '', 2, ''],
    ];
  }, [branches, t]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: t('kho.import.sheetChiNhanh'),
        headers: [t('kho.import.refMa'), t('kho.import.refTen')],
        data: branches.map((b) => [b.ma_chi_nhanh, b.ten_chi_nhanh]),
      },
      {
        name: t('kho.import.sheetTrangThai'),
        headers: [t('common.status')],
        data: KHO_TRANG_THAI_OPTIONS.map((o) => [o.value]),
      },
    ],
    [branches, t]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = planKhoImport(
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
    templateFileName: t('kho.importTemplateName'),
  };
}
