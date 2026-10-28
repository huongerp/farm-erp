import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatDbError } from '../../../../lib/db-errors';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { DgdvPhieuDayDu } from '../core/types';
import { DGDV_XUAT_CHI_TIET_TOI_DA, type DgdvListServerQuery } from '../services/danh-gia-dau-vao-list-query';
import { fetchAllDgdvForListQueryDb } from '../services/danh-gia-dau-vao-db.service';
import { getDgdvDayDuTheoIds } from '../services/danh-gia-dau-vao-service';
import { dungDongXuatChiTiet, dungSheetXuatChiTiet, taiXlsxChiTiet, tenFileXuatChiTiet } from '../utils/export-chi-tiet';
import { useDgdvMauImport } from './use-dgdv-import';
import { useMauDay } from './use-danh-muc-dgdv';

/**
 * Xuất Excel chi tiết dạng dòng (khuôn file import — nhập ngược lại được): một phiếu (`xuatPhieu`) hoặc
 * mọi phiếu khớp bộ lọc danh sách (`xuatTheoLoc`, tối đa `DGDV_XUAT_CHI_TIET_TOI_DA` phiếu).
 */
export function useDgdvXuatChiTiet() {
  const { t } = useTranslation();
  const { importColumns, guideNotes, referenceSheets } = useDgdvMauImport(null);
  const { data: branches = [] } = useBranches();
  const { mauTheoId } = useMauDay();
  const [dangXuat, setDangXuat] = useState(false);

  const maTheoId = useMemo(() => new Map(branches.map((b) => [String(b.id), b.ma_chi_nhanh])), [branches]);

  const ghiFile = useCallback(
    async (dsPhieu: DgdvPhieuDayDu[]) => {
      const dong = dungDongXuatChiTiet(dsPhieu, {
        chiNhanh: (id, ten) => maTheoId.get(id) ?? ten ?? id,
        mauTheoId,
      });
      if (dong.length === 0) {
        toast.warning(t('danhGiaDauVao.xuat.khongCoDong'));
        return;
      }
      const sheets = dungSheetXuatChiTiet({
        columns: importColumns,
        referenceSheets,
        dong,
        labels: {
          inputSheet: t('shared.import.templateSheetName'),
          guideSheet: t('shared.import.guideSheetName'),
          exampleSheet: t('shared.import.exampleSheetName'),
          guideColumn: t('shared.import.guideColumn'),
          guideRequired: t('shared.import.guideRequired'),
          guideRule: t('shared.import.guideRule'),
          guideExample: t('shared.import.guideExample'),
          yes: t('shared.import.guideYes'),
          no: t('shared.import.guideNo'),
          notes: [t('danhGiaDauVao.xuat.ghiChuNhapLai'), ...guideNotes],
        },
      });
      await taiXlsxChiTiet(sheets, tenFileXuatChiTiet(dsPhieu));
      toast.success(t('danhGiaDauVao.xuat.daXuat', { dong: dong.length, phieu: dsPhieu.length }));
    },
    [importColumns, referenceSheets, guideNotes, maTheoId, mauTheoId, t]
  );

  const chay = useCallback(async (viec: () => Promise<void>) => {
    setDangXuat(true);
    try {
      await viec();
    } catch (err) {
      toast.error(formatDbError(err));
    } finally {
      setDangXuat(false);
    }
  }, []);

  const xuatPhieu = useCallback((phieu: DgdvPhieuDayDu) => chay(() => ghiFile([phieu])), [chay, ghiFile]);

  /** `tongSo` = tổng phiếu khớp lọc (đã có từ trang danh sách) — quá giới hạn thì báo, không tải. */
  const xuatTheoLoc = useCallback(
    (query: DgdvListServerQuery, tongSo: number) => {
      if (tongSo === 0) {
        toast.warning(t('danhGiaDauVao.noExportData'));
        return Promise.resolve();
      }
      if (tongSo > DGDV_XUAT_CHI_TIET_TOI_DA) {
        toast.warning(t('danhGiaDauVao.xuat.quaNhieu', { n: tongSo, max: DGDV_XUAT_CHI_TIET_TOI_DA }));
        return Promise.resolve();
      }
      return chay(async () => {
        const ds = await fetchAllDgdvForListQueryDb(query);
        await ghiFile(await getDgdvDayDuTheoIds(ds.map((r) => r.id)));
      });
    },
    [chay, ghiFile, t]
  );

  return { xuatPhieu, xuatTheoLoc, dangXuat };
}
