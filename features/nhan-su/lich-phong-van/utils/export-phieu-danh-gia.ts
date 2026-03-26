/**
 * Xuất phiếu đánh giá phỏng vấn ra PDF – nội dung theo chuẩn danh_gia_chi_tiet (5 phần).
 */
import type { LichPhongVan } from '../core/types';
import { formatDateTimeShort, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { getTrangThaiLichPVLabel, getHinhThucLabel } from '../core/constants';
import {
  parseDanhGiaChiTiet,
  XEP_HANG_OPTIONS,
  DE_XUAT_OPTIONS,
} from '../core/danh-gia-types';

function getXepHangLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const opt = XEP_HANG_OPTIONS.find((o) => o.value === value);
  return opt ? i18n.t(opt.labelKey) : value;
}
function getDeXuatLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const opt = DE_XUAT_OPTIONS.find((o) => o.value === value);
  return opt ? i18n.t(opt.labelKey) : value;
}

export function exportPhieuDanhGiaPVToPDF(data: LichPhongVan): Promise<void> {
  return Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('../../../../lib/jspdf-vietnamese-font'),
  ]).then(async ([{ jsPDF }, autoTableModule, viMod]) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    await viMod.ensureJsPDFVietnameseFont(doc);
    const F = viMod.JSPDF_VI_FONT_FAMILY;
    const autoTable = autoTableModule.default;
    const t = i18n.t.bind(i18n);

    doc.setFontSize(14);
    doc.text(t('lichPhongVan.export.phieuTitle'), 14, 15);
    doc.setFontSize(10);
    doc.text(
      `${data.ten_ung_vien ?? data.id_ung_vien} · ${t('lichPhongVan.detail.lichColVong')} ${data.so_vong}`,
      14,
      22
    );

    const tableOpts = {
      startY: 28 as number,
      styles: { font: F, fontSize: 9, cellPadding: 3 },
      headStyles: { font: F, fillColor: [59, 130, 246], fontStyle: 'bold' as const },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
    };

      const chiTiet = parseDanhGiaChiTiet(data.danh_gia_chi_tiet);
      const hasChiTiet = chiTiet != null;

      // 1. Thông tin cơ bản (lịch + người phỏng vấn nếu có)
      const basicRows: [string, string][] = [
        [t('lichPhongVan.store.ungVienCol'), data.ten_ung_vien ?? '—'],
        [t('lichPhongVan.detail.viTriUngTuyen'), data.ma_de_xuat ?? '—'],
        [t('lichPhongVan.store.soVongCol'), String(data.so_vong)],
        [t('lichPhongVan.detail.ngayGio'), `${data.ngay} – ${data.gio}`],
        [t('lichPhongVan.store.hinhThucCol'), getHinhThucLabel(data.hinh_thuc, t)],
        [t('lichPhongVan.store.diaDiemCol'), data.dia_diem ?? '—'],
        [t('lichPhongVan.store.trangThaiCol'), getTrangThaiLichPVLabel(data.trang_thai, t)],
      ];
      if (hasChiTiet && chiTiet.nguoi_phong_van) {
        basicRows.push([t('lichPhongVan.danhGia.nguoiPhongVan'), chiTiet.nguoi_phong_van]);
      }

      autoTable(doc, {
        head: [[t('lichPhongVan.export.fieldCol'), t('lichPhongVan.export.valueCol')]],
        body: basicRows,
        ...tableOpts,
      });

      let startY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 28;
      startY += 8;

      if (hasChiTiet) {
        const addSection = (title: string, rows: [string, string][]) => {
          doc.setFontSize(10);
          doc.setFont(F, 'bold');
          doc.text(title, 14, startY);
          startY += 6;
          autoTable(doc, {
            body: rows,
            startY,
            styles: { font: F, fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
          });
          startY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY;
          startY += 6;
        };

        addSection(t('lichPhongVan.danhGia.sectionHard'), [
          [t('lichPhongVan.danhGia.hardNghiepVu'), chiTiet.hard_nghiep_vu != null ? String(chiTiet.hard_nghiep_vu) : '—'],
          [t('lichPhongVan.danhGia.hardKinhNghiem'), chiTiet.hard_kinh_nghiem != null ? String(chiTiet.hard_kinh_nghiem) : '—'],
          [t('lichPhongVan.danhGia.hardKyThuat'), chiTiet.hard_ky_thuat != null ? String(chiTiet.hard_ky_thuat) : '—'],
        ]);
        addSection(t('lichPhongVan.danhGia.sectionSoft'), [
          [t('lichPhongVan.danhGia.softGiaoTiep'), chiTiet.soft_giao_tiep != null ? String(chiTiet.soft_giao_tiep) : '—'],
          [t('lichPhongVan.danhGia.softTuDuy'), chiTiet.soft_tu_duy != null ? String(chiTiet.soft_tu_duy) : '—'],
          [t('lichPhongVan.danhGia.softVanHoa'), chiTiet.soft_van_hoa != null ? String(chiTiet.soft_van_hoa) : '—'],
          [t('lichPhongVan.danhGia.softTacPhong'), chiTiet.soft_tac_phong != null ? String(chiTiet.soft_tac_phong) : '—'],
        ]);
        addSection(t('lichPhongVan.danhGia.sectionNhanXet'), [
          [t('lichPhongVan.danhGia.diemManh'), chiTiet.diem_manh ?? '—'],
          [t('lichPhongVan.danhGia.diemYeu'), chiTiet.diem_yeu ?? '—'],
          [t('lichPhongVan.danhGia.kyVongLuong'), chiTiet.ky_vong_luong ?? '—'],
        ]);
        addSection(t('lichPhongVan.danhGia.sectionKetLuan'), [
          [t('lichPhongVan.danhGia.xepHangChung'), getXepHangLabel(chiTiet.xep_hang_chung ?? undefined)],
          [t('lichPhongVan.danhGia.deXuatLabel'), getDeXuatLabel(chiTiet.de_xuat ?? undefined)],
          [t('lichPhongVan.danhGia.ghiChu'), chiTiet.ghi_chu ?? '—'],
        ]);
      } else {
        autoTable(doc, {
          body: [
            [t('lichPhongVan.form.danhGiaDiemSo'), data.danh_gia_diem_so ?? '—'],
            [t('lichPhongVan.form.danhGiaNhanXet'), data.danh_gia_nhan_xet ?? '—'],
          ],
          startY,
          styles: { font: F, fontSize: 9, cellPadding: 3 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
        });
        startY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY;
        startY += 6;
      }

      // Kết quả (mức lịch)
      doc.setFontSize(10);
      doc.setFont(F, 'bold');
      doc.text(t('lichPhongVan.store.ketQuaCol'), 14, startY);
      startY += 6;
      const ketQuaRows: [string, string][] = [[t('lichPhongVan.store.ketQuaCol'), data.ket_qua ?? '—']];
      if (data.ghi_chu && data.ghi_chu.trim() !== '' && !hasChiTiet) {
        ketQuaRows.push([t('lichPhongVan.form.ghiChu'), data.ghi_chu]);
      }
      autoTable(doc, {
        body: ketQuaRows,
        startY,
        styles: { font: F, fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
      });

      let finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY;
      if (hasChiTiet && data.ghi_chu && data.ghi_chu.trim() !== '') {
        finalY += 8;
        doc.setFontSize(10);
        doc.setFont(F, 'bold');
        doc.text(t('lichPhongVan.form.ghiChu'), 14, finalY);
        finalY += 6;
        doc.setFont(F, 'normal');
        const ghiChuLines = doc.splitTextToSize(data.ghi_chu, 170);
        doc.setFontSize(9);
        doc.text(ghiChuLines, 14, finalY);
        finalY += ghiChuLines.length * 5 + 4;
      }
      doc.setFont(F, 'normal');
      doc.setFontSize(8);
      doc.text(
        `${t('lichPhongVan.export.printedAt')}: ${formatDateTimeShort(new Date().toISOString())}`,
        14,
        finalY + 10
      );

      doc.save(`phieu_danh_gia_phong_van_${data.id}_${getTodayISODate()}.pdf`);
  });
}
