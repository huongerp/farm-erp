/**
 * Tải phiếu in về máy: PDF / DOC / XLSX. Bố cục chỉ có MỘT nguồn là component preview
 * đang hiển thị — PDF chụp chính nút đó, DOC nhân bản nút đó kèm style đã tính.
 */
import type { TFunction } from 'i18next';
import type { DangKyNhanHang } from '../core/types';
import type { NhomHangHoa } from '../core/gop-hang-hoa';
import {
  cssPageSize,
  kichThuocGiay,
  leTrang,
  taoSheetXlsx,
  tenFileIn,
  type ThamSoIn,
} from '../core/mau-in';
import { taiDocTuNode, taiPdfTuNode } from '../../../../lib/phieu-in/xuat-phieu';

export type DinhDangTai = 'pdf' | 'doc' | 'xlsx';

/** PDF đúng khổ / hướng đang xem — dùng chung lib/phieu-in/xuat-phieu. */
export async function taiPdf(node: HTMLElement, phieu: DangKyNhanHang, ts: ThamSoIn): Promise<void> {
  const { wMm, hMm } = kichThuocGiay(ts.kho, ts.huong);
  await taiPdfTuNode(node, { kho: ts.kho, huong: ts.huong, wMm, hMm, tenFile: tenFileIn(ts.loai, phieu) });
}

export function taiDoc(node: HTMLElement, phieu: DangKyNhanHang, ts: ThamSoIn): void {
  taiDocTuNode(node, { pageSize: cssPageSize(ts.kho, ts.huong), leMm: leTrang(ts.kho), tenFile: tenFileIn(ts.loai, phieu) });
}

export async function taiXlsx(phieu: DangKyNhanHang, nhom: NhomHangHoa[], ts: ThamSoIn, t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const sheets = taoSheetXlsx(ts.loai, phieu, nhom, (k) => t(`dangKyNhanHang.${k}`));
  sheets.forEach((sh, i) => {
    const ws = XLSX.utils.aoa_to_sheet(sh.dong);
    ws['!cols'] =
      i === 0 ? [{ wch: 24 }, { wch: 44 }] : [{ wch: 6 }, { wch: 16 }, { wch: 34 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, sh.ten.slice(0, 31));
  });
  XLSX.writeFile(wb, `${tenFileIn(ts.loai, phieu)}.xlsx`);
}
