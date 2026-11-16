import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { planTaiSanImport } from '../utils/import-tai-san';
import { useImportTaiSan } from './use-danh-muc-tai-san';

/** Wiring Import Excel danh sách tài sản. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useTaiSanImport() {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportTaiSan();
  const { data: nhom = [] } = useAssetGroups();
  const { data: noiLuu = [] } = useAssetStorageLocations();
  const { data: trangThai = [] } = useAssetStatuses();

  const importColumns = useMemo<ImportColumn[]>(() => {
    const tuyChon = t('danhSachTaiSan.import.hintTuyChon');
    return [
      { key: 'ma_tai_san', label: t('danhSachTaiSan.store.maCol'), required: true, hint: t('danhSachTaiSan.import.hintMa') },
      { key: 'ten_tai_san', label: t('danhSachTaiSan.store.tenCol'), required: true, hint: t('danhSachTaiSan.import.hintTen') },
      { key: 'nhom', label: t('danhSachTaiSan.store.nhomCol'), required: true, hint: t('danhSachTaiSan.import.hintNhom') },
      { key: 'noi_luu', label: t('danhSachTaiSan.store.noiLuuCol'), required: true, hint: t('danhSachTaiSan.import.hintNoiLuu') },
      { key: 'trang_thai', label: t('danhSachTaiSan.store.trangThaiCol'), required: true, hint: t('danhSachTaiSan.import.hintTrangThai') },
      { key: 'ngay_nhap', label: t('danhSachTaiSan.store.ngayNhapCol'), required: true, hint: t('danhSachTaiSan.import.hintNgay') },
      { key: 'nguyen_gia', label: t('danhSachTaiSan.store.nguyenGiaCol'), hint: t('danhSachTaiSan.import.hintNguyenGia') },
      {
        key: 'ngay_bat_dau_trich_khau_hao',
        label: t('danhSachTaiSan.detail.ngayBatDauTrichKhauHao'),
        hint: t('danhSachTaiSan.import.hintNgayKhauHao'),
      },
      { key: 'thuong_hieu', label: t('danhSachTaiSan.store.thuongHieuCol'), hint: tuyChon },
      { key: 'model', label: t('danhSachTaiSan.store.modelCol'), hint: tuyChon },
      { key: 'serial', label: t('danhSachTaiSan.store.serialCol'), hint: tuyChon },
      { key: 'xuat_xu', label: t('danhSachTaiSan.store.xuatXuCol'), hint: tuyChon },
      { key: 'ma_barcode', label: t('danhSachTaiSan.store.maBarcodeCol'), hint: t('danhSachTaiSan.import.hintBarcode') },
      { key: 'ten_nha_cung_cap', label: t('danhSachTaiSan.store.nhaCungCapCol'), hint: tuyChon },
      { key: 'ghi_chu', label: t('danhSachTaiSan.form.ghiChu'), hint: tuyChon },
    ];
  }, [t]);

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const n = nhom[0]?.ma || 'CCDC';
    const nl = noiLuu[0]?.ma_noi_luu || 'NSC01';
    const tt = trangThai[0]?.ten || 'Đang sử dụng';
    return [
      ['TS01-CAN01', t('danhSachTaiSan.import.exampleTen1'), n, nl, tt, '15/03/2026', 1500000, '', 'Yaohua', 'XK3190', '', 'Việt Nam', '', '', ''],
      ['TS01-CAN02', t('danhSachTaiSan.import.exampleTen2'), nhom[0]?.ten || n, noiLuu[0]?.ten_noi_luu || nl, tt, '15/03/2026', '', '', '', '', '', '', '', '', ''],
    ];
  }, [nhom, noiLuu, trangThai, t]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(() => {
    const headers = [t('danhSachTaiSan.import.refMa'), t('danhSachTaiSan.import.refTen')];
    return [
      { name: t('danhSachTaiSan.import.refNhom'), headers, data: nhom.map((x) => [x.ma, x.ten]) },
      { name: t('danhSachTaiSan.import.refNoiLuu'), headers, data: noiLuu.map((x) => [x.ma_noi_luu, x.ten_noi_luu]) },
      { name: t('danhSachTaiSan.import.refTrangThai'), headers, data: trangThai.map((x) => [x.ma, x.ten]) },
    ];
  }, [nhom, noiLuu, trangThai, t]);

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = planTaiSanImport(rows, { nhom, noiLuu, trangThai });
      const result =
        plan.toCreate.length > 0 ? await importMutation.mutateAsync(plan.toCreate) : { created: 0, errors: [] };
      setImportErrors([...plan.errors, ...result.errors].sort((a, b) => a.row - b.row));
      return { created: result.created, updated: 0 };
    },
    [nhom, noiLuu, trangThai, importMutation]
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
    templateFileName: t('danhSachTaiSan.importTemplateName'),
  };
}
