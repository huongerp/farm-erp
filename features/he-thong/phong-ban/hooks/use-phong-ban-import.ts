import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { PHONG_BAN_TRANG_THAI_OPTIONS, planPhongBanImport } from '../utils/import-phong-ban';
import { useImportDepartments } from './use-phong-ban';

/** Wiring Import Excel phòng ban. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function usePhongBanImport() {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportDepartments();

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'ten_phong_ban', label: t('department.name'), required: true, hint: t('department.import.hintTen') },
      { key: 'chuc_nang', label: t('department.store.chucNangCol'), hint: t('department.import.hintChucNang') },
      { key: 'tt', label: t('department.detail.order'), hint: t('department.import.hintThuTu') },
      { key: 'trang_thai', label: t('common.status'), hint: t('department.import.hintTrangThai') },
    ],
    [t]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(
    () => [
      [t('department.import.exampleTen1'), t('department.import.exampleChucNang1'), 1, PHONG_BAN_TRANG_THAI_OPTIONS[0].value],
      [t('department.import.exampleTen2'), '', 2, ''],
    ],
    [t]
  );

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: t('department.import.sheetTrangThai'),
        headers: [t('common.status')],
        data: PHONG_BAN_TRANG_THAI_OPTIONS.map((o) => [o.value]),
      },
    ],
    [t]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = planPhongBanImport(rows);
      const result = plan.toCreate.length > 0 ? await importMutation.mutateAsync(plan.toCreate) : { created: 0, errors: [] };
      setImportErrors([...plan.errors, ...result.errors].sort((a, b) => a.row - b.row));
      return { created: result.created, updated: 0 };
    },
    [importMutation]
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
    templateFileName: t('department.importTemplateName'),
  };
}
