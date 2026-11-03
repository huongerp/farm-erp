import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { ImportColumn, ImportErrorRow, ImportReferenceSheet, ImportSampleRow, ImportSummary } from '../../../../lib/import-types';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { CHAM_CONG_CODES, LOAI_CHUYEN_CODES } from '../core/types';
import { COT_IMPORT_BCNC, planBaoCaoNhanCongImport } from '../utils/import-bao-cao-nhan-cong';
import { getBaoCaoNhanCongTomTat } from '../services/bao-cao-nhan-cong-service';
import { createBaoCaoNhanCongDb } from '../services/bao-cao-nhan-cong-db.service';
import { QUERY_KEY_BAO_CAO_NHAN_CONG } from './use-bao-cao-nhan-cong';
import { useBaoCaoNhanCongPermissions } from './use-bao-cao-nhan-cong-permissions';
import { useBaoCaoNhanCongViewScope } from './use-bao-cao-nhan-cong-view-scope';

const REQUIRED = new Set(['ngay', 'chi_nhanh', 'loai_chuyen', 'cham_cong']);

export function useBaoCaoNhanCongImport() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { canCreate } = useBaoCaoNhanCongPermissions();
  const scope = useBaoCaoNhanCongViewScope();
  const { data: branches = [] } = useBranches();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const tr = useCallback((key: string) => t(`baoCaoNhanCong.import.${key}`), [t]);
  const chiNhanh = useMemo(() => branches
    .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG && !scope.isLoading && (scope.viewAll || scope.allowedBranchIds.includes(String(b.id))))
    .map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh })), [branches, scope]);
  const columns = useMemo<ImportColumn[]>(() => COT_IMPORT_BCNC.map((key) => ({ key, label: tr(`col.${key}`), required: REQUIRED.has(key), hint: tr(`hint.${key}`) })), [tr]);
  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const ngay = formatYmdToDisplay(getTodayISO());
    const cn = chiNhanh[0]?.ma ?? '';
    return [
      [ngay, cn, 'XAN_NAI', tr('tenMau1'), tr('viTriMau'), 'CA_NGAY', '', 7.5, 2, '', ''],
      [ngay, cn, 'XAN_NAI', tr('tenMau2'), '', 'SANG', '', 3.75, '', '', ''],
      [ngay, cn, 'TIA_DANH_GIA', '', '', 'CA_NGAY', 10, 7.5, 1.5, '', ''],
    ];
  }, [chiNhanh, tr]);
  const referenceSheets = useMemo<ImportReferenceSheet[]>(() => [
    { name: tr('sheetChiNhanh'), headers: [tr('ma'), tr('ten')], data: chiNhanh.map((b) => [b.ma, b.ten]) },
    { name: tr('sheetChuyen'), headers: [tr('ma'), tr('ten')], data: LOAI_CHUYEN_CODES.map((c) => [c, t(`baoCaoNhanCong.chuyen.${c}`)]) },
    { name: tr('sheetChamCong'), headers: [tr('ma'), tr('ten')], data: CHAM_CONG_CODES.map((c) => [c, c === 'NGHI' ? tr('nghi') : t(`baoCaoNhanCong.nv.chamCong.${c}`)]) },
  ], [chiNhanh, t, tr]);
  const guideNotes = useMemo(() => ['guide1', 'guide2', 'guide3', 'guide4'].map(tr), [tr]);

  const handleImport = useCallback(async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
    setImportErrors([]);
    if (!canCreate || scope.isLoading || !user?.id) throw new Error(t('baoCaoNhanCong.toast.createNotAllowed'));
    // Đọc mới lúc nhập, không dùng danh sách phân trang hay cache để chặn trùng.
    const existing = await getBaoCaoNhanCongTomTat(scope.viewAll, scope.allowedBranchIds);
    const plan = planBaoCaoNhanCongImport(rows, chiNhanh, existing);
    if (plan.errors.length) {
      setImportErrors(plan.errors);
      return { created: 0, skipped: rows.length };
    }
    const errors: ImportErrorRow[] = [];
    let created = 0;
    try {
      for (const phieu of plan.phieu) {
        try {
          await createBaoCaoNhanCongDb(phieu.values, user.id);
          created += phieu.rows.length;
        } catch (error) {
          const msg = error instanceof Error ? error.message : tr('loiLuu');
          phieu.rows.forEach((r) => errors.push({ row: Number(r[IMPORT_ROW_KEY] ?? rows.indexOf(r) + 2), msg, values: r }));
        }
      }
    } finally {
      await qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
    }
    setImportErrors(errors);
    return { created, skipped: rows.length - created };
  }, [canCreate, scope, user, t, chiNhanh, tr, qc]);

  return {
    showImport,
    openImport: () => { setImportErrors([]); setShowImport(true); },
    closeImport: () => { setShowImport(false); setImportErrors([]); },
    dialogProps: { requireAllRowsValid: true, columns, sampleRows, referenceSheets, guideNotes, importErrors, onImport: handleImport, templateFileName: tr('fileMau') },
  };
}
