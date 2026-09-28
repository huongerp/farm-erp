import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN, getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import { planCongViecImport } from '../utils/import-cong-viec';
import { useImportCongViec } from './use-cong-viec';

/** Wiring Import Excel công việc. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useCongViecImport() {
  const { t } = useTranslation();
  const tr = useCallback((k: string) => t(`congViec.nhapExcel.${k}`), [t]);
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportCongViec();
  const { data: nhanVien = [] } = useEmployeesRefQuery();

  const uuTienOptions = useMemo(
    () => CONG_VIEC_UU_TIEN.map((v) => ({ value: v, labels: [getUuTienLabel(v, t)] })),
    [t]
  );
  const trangThaiOptions = useMemo(
    () => CONG_VIEC_TRANG_THAI.map((v) => ({ value: v, labels: [getTrangThaiLabel(v, t)] })),
    [t]
  );

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'tieu_de', label: t('congViec.form.tieuDe'), required: true, hint: tr('hintTieuDe') },
      { key: 'mo_ta', label: t('congViec.form.moTa'), hint: tr('hintTuyChon') },
      { key: 'uu_tien', label: t('congViec.form.uuTien'), hint: tr('hintUuTien') },
      { key: 'trang_thai', label: t('congViec.form.trangThai'), hint: tr('hintTrangThai') },
      { key: 'trach_nhiem', label: t('congViec.form.trachNhiem'), required: true, hint: tr('hintTrachNhiem') },
      { key: 'nguoi_ho_tro', label: t('congViec.form.nguoiHoTro'), hint: tr('hintNguoiHoTro') },
    ],
    [t, tr]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const nv1 = nhanVien[0]?.ma_nhan_vien || 'NV1';
    const nv2 = nhanVien[1]?.ma_nhan_vien;
    return [
      [tr('exampleTieuDe1'), tr('exampleMoTa1'), getUuTienLabel('cao', t), getTrangThaiLabel('dang_thuc_hien', t), nv1, nv2 ?? ''],
      [tr('exampleTieuDe2'), '', '', '', nhanVien[0]?.ho_ten || nv1, ''],
    ];
  }, [nhanVien, t, tr]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: tr('sheetNhanVien'),
        headers: [tr('refMaNv'), tr('refHoTen')],
        data: nhanVien.map((n) => [n.ma_nhan_vien, n.ho_ten]),
      },
      {
        name: tr('sheetGiaTri'),
        headers: [tr('refCot'), tr('refGiaTri')],
        data: [
          [t('congViec.form.uuTien'), uuTienOptions.map((o) => o.labels[0]).join(' / ')],
          [t('congViec.form.trangThai'), trangThaiOptions.map((o) => o.labels[0]).join(' / ')],
        ],
      },
    ],
    [nhanVien, uuTienOptions, trangThaiOptions, t, tr]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = planCongViecImport(rows, {
        nhanVien: nhanVien.map((n) => ({ id: String(n.id), ma_nhan_vien: n.ma_nhan_vien, ho_ten: n.ho_ten })),
        uuTienOptions,
        trangThaiOptions,
      });
      const result = plan.toCreate.length > 0 ? await importMutation.mutateAsync(plan.toCreate) : { created: 0, errors: [] };
      setImportErrors([...plan.errors, ...result.errors].sort((a, b) => a.row - b.row));
      return { created: result.created, updated: 0 };
    },
    [nhanVien, uuTienOptions, trangThaiOptions, importMutation]
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
    templateFileName: tr('templateName'),
  };
}
