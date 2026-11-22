/** Xuất XLSX bảng thưởng vượt thùng tháng của một nhà sơ chế: sheet tổng theo người + sheet chi tiết từng ngày. */
import i18n from '../../../../lib/i18n';
import { ghiXlsxCoBangHinh } from '../../../../lib/export/xlsx-bang-hinh';
import { tenFileAnToan } from '../../../../lib/phieu-in/ten-file';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { CaiDatThuongVuot, DongThuongThang } from '../core/thuong-vuot-thung';

const r2 = (v: number) => Math.round(v * 100) / 100;

export async function exportThuongVuotThangToXLSX(p: {
  ds: readonly DongThuongThang[];
  thang: string;
  tenNhaSoChe: string;
  caiDat: CaiDatThuongVuot;
}): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const [y, m] = p.thang.split('-');
  const tieuDe = t('baoCaoNhanCong.vuot.tieuDeXuat', { thang: `${m}/${y}`, nhaSoChe: p.tenNhaSoChe });
  const ghiChu = t('baoCaoNhanCong.vuot.ghiChuThang', {
    nguongPct: formatNumberVN(p.caiDat.nguongPct, { maxFractionDigits: 2 }),
    donGia: formatNumberVN(p.caiDat.donGia),
  });
  const tenChuyen = (d: DongThuongThang) => d.chuyen.map((l) => t(`baoCaoNhanCong.chuyen.${l}`)).join(', ');

  const tong = p.ds.reduce(
    (s, d) => ({ gio: s.gio + d.gioCong, thung: s.thung + d.thungVuotQuyDoi, truocKi: s.truocKi + d.tienTruocKi, tien: s.tien + d.tien }),
    { gio: 0, thung: 0, truocKi: 0, tien: 0 }
  );
  const sheetTong = XLSX.utils.aoa_to_sheet([
    [tieuDe],
    [ghiChu],
    [],
    [
      t('baoCaoNhanCong.vuot.colStt'),
      t('baoCaoNhanCong.nsNhom.colHoTen'),
      t('baoCaoNhanCong.vuot.colViTri'),
      t('baoCaoNhanCong.nsNhom.colChuyen'),
      t('baoCaoNhanCong.vuot.colSoNgay'),
      t('baoCaoNhanCong.vuot.colGioTinh'),
      t('baoCaoNhanCong.vuot.colThungQuyDoi'),
      t('baoCaoNhanCong.vuot.colTruocKi'),
      t('baoCaoNhanCong.vuot.colKi'),
      t('baoCaoNhanCong.vuot.colThuong'),
    ],
    ...p.ds.map((d, i) => [i + 1, d.ho_ten, d.vi_tri ?? '', tenChuyen(d), d.soNgay, r2(d.gioCong), r2(d.thungVuotQuyDoi), Math.round(d.tienTruocKi), d.ki, d.tien]),
    [t('baoCaoNhanCong.nsNhom.tong'), '', '', '', '', r2(tong.gio), r2(tong.thung), Math.round(tong.truocKi), '', tong.tien],
  ]);
  sheetTong['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 20 }, { wch: 34 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 14 }];

  const sheetNgay = XLSX.utils.aoa_to_sheet([
    [tieuDe],
    [],
    [
      t('baoCaoNhanCong.nsNhom.colHoTen'),
      t('baoCaoNhanCong.vuot.colNgay'),
      t('baoCaoNhanCong.nsNhom.colChuyen'),
      t('baoCaoNhanCong.nsNhom.colNhom'),
      t('baoCaoNhanCong.vuot.colGioTinh'),
      t('baoCaoNhanCong.vuot.colThungQuyDoi'),
      t('baoCaoNhanCong.vuot.colTruocKi'),
    ],
    ...p.ds.flatMap((d) =>
      d.ngay.map((n) => [d.ho_ten, formatYmdToDisplay(n.ngay), t(`baoCaoNhanCong.chuyen.${n.loai_chuyen}`), n.soNhom, r2(n.gioCong), r2(n.thungVuotQuyDoi), Math.round(n.tien)])
    ),
  ]);
  sheetNgay['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 34 }, { wch: 7 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetTong, 'Thuong_vuot_thang');
  XLSX.utils.book_append_sheet(wb, sheetNgay, 'Chi_tiet_ngay');
  await ghiXlsxCoBangHinh(XLSX, wb, `${tenFileAnToan(`thuong-vuot-${p.thang}-${p.tenNhaSoChe}`)}.xlsx`);
}
