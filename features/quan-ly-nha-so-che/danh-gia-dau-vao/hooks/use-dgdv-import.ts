import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ImportColumn, ImportReferenceSheet, ImportSampleRow } from '../../../../components/shared/LazyImportDialog';
import type { ImportErrorRow, ImportMode, ImportOptions, ImportSummary } from '../../../../lib/import-types';
import { TRANG_THAI } from '../../../../lib/constants';
import { formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { importDongDgdvDb } from '../services/danh-gia-dau-vao-db.service';
import { COT_IMPORT_DGDV, GIA_TRI_DUT_DAY, parseDongImport, type CotImportDgdv, type PhieuCoDinh } from '../utils/import-dong';
import { LOAI_LY_DO_DGDV } from '../core/types';
import { useLyDoDgdv, useMauDay } from './use-danh-muc-dgdv';
import { QUERY_KEY_DGDV } from './use-danh-gia-dau-vao';

const BAT_BUOC = new Set<CotImportDgdv>(['ngay', 'chi_nhanh', 'lo', 'mau_1', 'so_luong']);
const MODES: ImportMode[] = ['create', 'upsert'];

/**
 * Wiring Import Excel «Chi tiết đánh giá» (khuôn `LazyImportDialog`). `coDinh` có → import vào một phiếu
 * (file mẫu bỏ cột Chi nhánh, chỉ nhận ngày trong tuần của phiếu). Chế độ: `create` = cộng thêm dòng,
 * `upsert` = thay số các ngày có trong file. Parse ở utils/import-dong, ghi ở RPC `rpc_dgdv_import`.
 */
export function useDgdvImport(coDinh?: (PhieuCoDinh & { id: string }) | null) {
  const { t } = useTranslation();
  const tr = useCallback((k: string, o?: Record<string, unknown>) => t(`danhGiaDauVao.import.${k}`, o ?? {}), [t]);
  const qc = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const { data: branches = [] } = useBranches();
  const { data: dsMau = [] } = useMauDay();
  const { data: dsLyDo = [] } = useLyDoDgdv();

  const cot = useMemo(() => COT_IMPORT_DGDV.filter((k) => !(coDinh && k === 'chi_nhanh')), [coDinh]);
  const chiNhanh = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh })),
    [branches]
  );

  const importColumns = useMemo<ImportColumn[]>(
    () => cot.map((key) => ({ key, label: tr(`col.${key}`), required: BAT_BUOC.has(key), hint: tr(`rule.${key}`) })),
    [cot, tr]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const ngay = formatYmdToDisplay(getTodayISO());
    const cn = chiNhanh[0]?.ma ?? 'FP1';
    // Theo file giấy: lô A3-3, dây «Xanh lá – Đen» tuần 42 nhiều dòng (mỗi dòng một đánh giá), đứt dây riêng.
    const mau = [
      [ngay, cn, 'A3-3', 'A.Hâu', 'Xanh lá', 'Đen', '', 42, 10, 'Thiếu lá', '', ''],
      [ngay, cn, 'A3-3', 'A.Hâu', 'Xanh lá', 'Đen', '', 42, 15, 'Chín xanh', 2, 'Chín bệnh'],
      [ngay, cn, 'A3-3', 'A.Hâu', 'Xanh lá', 'Đen', '', 42, 60, '', '', ''],
      [ngay, cn, 'A3-3', 'A.Hâu', 'Đỏ', 'Xanh dương', 'x', 42, 30, '', '', ''],
      [ngay, cn, 'A3-3', 'A.Hâu', GIA_TRI_DUT_DAY, '', '', '', 9, '', '', ''],
    ];
    return coDinh ? mau.map((r) => r.filter((_, i) => i !== 1)) : mau;
  }, [chiNhanh, coDinh]);

  const guideNotes = useMemo(
    () => [
      tr('guide1'),
      tr('guide2', { dutDay: GIA_TRI_DUT_DAY }),
      tr('guide3'),
      tr('guide4'),
      coDinh ? tr('guidePhieu', { tuan: coDinh.tuan, nam: coDinh.nam }) : tr('guideDanhSach'),
    ],
    [tr, coDinh]
  );

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      ...(coDinh ? [] : [{ name: tr('sheetChiNhanh'), headers: [tr('refMa'), tr('refTen')], data: chiNhanh.map((c) => [c.ma, c.ten]) }]),
      {
        name: tr('sheetMau'),
        headers: [tr('refTen'), tr('refMaMau')],
        data: [...dsMau.filter((m) => m.dang_dung).map((m) => [m.ten, m.ma_mau]), [GIA_TRI_DUT_DAY, tr('refDutDay')]],
      },
      {
        name: tr('sheetLyDo'),
        headers: [tr('refTen'), tr('refLoai')],
        data: dsLyDo.map((x) => [x.ten, x.loai === LOAI_LY_DO_DGDV.LOI ? tr('col.ly_do_loi') : tr('col.danh_gia')]),
      },
    ],
    [tr, coDinh, chiNhanh, dsMau, dsLyDo]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[], options: ImportOptions): Promise<ImportSummary> => {
      setImportErrors([]);
      const { dong, loi } = parseDongImport(rows, { chiNhanh, mau: dsMau }, coDinh ?? null);
      // Tất cả hoặc không: còn dòng lỗi thì không ghi — sửa file rồi nhập lại cả file.
      if (loi.length > 0) {
        setImportErrors(loi);
        toast.error(tr('coLoi', { n: loi.length }));
        return { created: 0, skipped: rows.length };
      }
      const kq = await importDongDgdvDb(dong, options.mode === 'upsert', coDinh?.id ?? null);
      if (kq.errors.length > 0) {
        const theoDong = new Map(rows.map((r, i) => [Number(r.__row ?? i + 2), r]));
        setImportErrors(kq.errors.map((e) => ({ ...e, values: theoDong.get(e.row) })));
        toast.error(tr('coLoi', { n: kq.errors.length }));
        return { created: 0, skipped: rows.length };
      }
      qc.invalidateQueries({ queryKey: QUERY_KEY_DGDV });
      toast.success(tr('thanhCong', { dong: kq.so_dong, phieu: kq.so_phieu_moi, lo: kq.so_lo_moi, day: kq.so_day_moi }));
      return { created: kq.so_dong };
    },
    [chiNhanh, dsMau, coDinh, qc, tr]
  );

  return {
    showImport,
    openImport: useCallback(() => {
      setImportErrors([]);
      setShowImport(true);
    }, []),
    closeImport: useCallback(() => setShowImport(false), []),
    dialogProps: {
      columns: importColumns,
      onImport: handleImport,
      importErrors,
      sampleRows,
      guideNotes,
      referenceSheets,
      modes: MODES,
      defaultMode: 'create' as ImportMode,
      modeLabels: {
        create: { label: tr('modeThem'), desc: tr('modeThemDesc') },
        upsert: { label: tr('modeThayThe'), desc: tr('modeThayTheDesc') },
      },
      templateFileName: coDinh ? tr('fileMauPhieu', { tuan: coDinh.tuan, nam: coDinh.nam }) : tr('fileMau'),
    },
  };
}
