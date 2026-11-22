/**
 * Xuất Excel tab «Tỷ lệ lỗi» qua ExportDialog: MỘT sheet phẳng gồm dòng tổng theo nhóm (kể cả «Chưa phân
 * loại» nếu có) rồi các dòng theo lô × nhóm (nhãn «<tên lô> — <tên nhóm>»). Số lấy nguyên từ core/nhom-loi —
 * không cộng lại; % làm tròn 1 chữ số như `utils/export-tong-hop`.
 */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import type { KqNhomLoi, KqNhomLoiLo, KqNhomLoiTong } from '../core/nhom-loi';
import type { VarDgdvNhomLoi } from '../core/types';

/** % làm tròn 1 chữ số; không tính được → '' (ô trống). */
const pt = (v: number | null) => (v == null ? '' : Math.round(v * 10) / 10);

export function cotXuatTiLeLoi(t: TFunction): ExportColumn[] {
  return [
    { key: 'nhom', label: t('danhGiaDauVao.tiLeLoi.colNhom') },
    { key: 'so_danh_gia', label: t('danhGiaDauVao.tiLeLoi.colDanhGia'), type: 'number' },
    { key: 'so_huy', label: t('danhGiaDauVao.tiLeLoi.colHuy'), type: 'number' },
    { key: 'tong', label: t('danhGiaDauVao.tiLeLoi.colTong'), type: 'number' },
    { key: 'ti_le_thu', label: t('danhGiaDauVao.tiLeLoi.colTiLeThu'), type: 'percent' },
    { key: 'ti_le_loi', label: t('danhGiaDauVao.tiLeLoi.colTiLeLoi'), type: 'percent' },
  ];
}

/** Một dòng tổng của một nhóm (nhãn «Chưa phân loại» truyền riêng vì `KqNhomLoi.ten` của nhóm ảo rỗng). */
const dongNhom = (n: KqNhomLoi, ten: string) => ({
  nhom: ten,
  so_danh_gia: n.soDanhGia,
  so_huy: n.soHuy,
  tong: n.so,
  ti_le_thu: pt(n.tiLeTrenThu),
  ti_le_loi: pt(n.tiLeTrongTongLoi),
});

/** Tổng % trên tổng thu / tổng lỗi của một ô theo lô không tính được (chỉ có số buồng) → để trống. */
const dongOLo = (tenLo: string, tenNhom: string, soDanhGia: number, soHuy: number) => ({
  nhom: `${tenLo} — ${tenNhom}`,
  so_danh_gia: soDanhGia,
  so_huy: soHuy,
  tong: soDanhGia + soHuy,
  ti_le_thu: '',
  ti_le_loi: '',
});

/**
 * Dòng xuất: đầu là từng nhóm đang dùng (đúng thứ tự bảng), thêm «Chưa phân loại» nếu có; sau đó mỗi lô
 * (chỉ nhóm có số > 0) để bảng phẳng không phình toàn ô 0.
 */
export function dongXuatTiLeLoi(
  kq: KqNhomLoiTong,
  loRows: readonly KqNhomLoiLo[],
  dsNhom: readonly VarDgdvNhomLoi[],
  tenLo: (id: string) => string,
  t: TFunction
): Record<string, unknown>[] {
  const ds: Record<string, unknown>[] = kq.dsNhom.map((n) => dongNhom(n, n.ten));
  const tenChua = t('danhGiaDauVao.tiLeLoi.chuaPhanLoai');
  if (kq.chuaPhanLoai.so > 0) ds.push(dongNhom(kq.chuaPhanLoai, tenChua));

  // Cột nhóm theo lô = nhóm đang dùng, xếp `thu_tu` (giống cột bảng trên màn).
  const nhomDung = dsNhom
    .filter((n) => n.dang_dung)
    .slice()
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ten.localeCompare(b.ten, 'vi'));
  const coChua = loRows.some((r) => {
    const o = r.theoNhom[''];
    return !!o && o.soDanhGia + o.soHuy > 0;
  });

  for (const lo of loRows) {
    const ten = tenLo(lo.id_lo);
    for (const n of nhomDung) {
      const o = lo.theoNhom[n.id];
      if (!o || o.soDanhGia + o.soHuy <= 0) continue;
      ds.push(dongOLo(ten, n.ten, o.soDanhGia, o.soHuy));
    }
    if (coChua) {
      const o = lo.theoNhom[''];
      if (o && o.soDanhGia + o.soHuy > 0) ds.push(dongOLo(ten, tenChua, o.soDanhGia, o.soHuy));
    }
  }
  return ds;
}
