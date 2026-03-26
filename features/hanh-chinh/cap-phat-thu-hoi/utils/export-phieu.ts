/**
 * Xuất phiếu cấp phát/thu hồi ra PDF, DOC, XLSX.
 * PDF: jsPDF + autotable. DOC: HTML table (Word). XLSX: SheetJS.
 */
import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiChiTiet } from '../core/types';
import {
  formatDate,
  formatDateTimeShort,
  formatDateVietnameseLong,
  formatDateTime,
  getTodayISODate,
} from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getLoaiPhieuLabel } from '../core/constants';

const FONT_DOC = "'Times New Roman', Times, serif";

function safe(v: string | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function fileName(phieu: PhieuCapPhatThuHoi): string {
  const slug = `${phieu.ma_phieu}_${phieu.loai_phieu}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_CPTH_${slug}_${getTodayISODate()}`;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface PhieuExportRow {
  ma_phieu: string;
  loai_phieu: string;
  ten_nguoi_giu_truoc: string;
  ten_nguoi_giu_sau: string;
  ngay_thuc_hien: string;
  ten_nguoi_thuc_hien: string;
  ghi_chu: string;
  tg_cap_nhat: string;
}

export function phieuToExportRow(p: PhieuCapPhatThuHoi): PhieuExportRow {
  return {
    ma_phieu: p.ma_phieu,
    loai_phieu: getLoaiPhieuLabel(p.loai_phieu, i18n.t),
    ten_nguoi_giu_truoc: p.ten_nguoi_giu_truoc ?? '',
    ten_nguoi_giu_sau: p.ten_nguoi_giu_sau ?? '',
    ngay_thuc_hien: formatDate(p.ngay_thuc_hien),
    ten_nguoi_thuc_hien: p.ten_nguoi_thuc_hien ?? '',
    ghi_chu: p.ghi_chu ?? '',
    tg_cap_nhat: formatDateTimeShort(p.tg_cap_nhat),
  };
}

export const PHIEU_EXPORT_COLUMNS: { key: keyof PhieuExportRow; label: string }[] = [
  { key: 'ma_phieu', label: i18n.t('capPhatThuHoi.store.maPhieuCol') },
  { key: 'loai_phieu', label: i18n.t('capPhatThuHoi.store.loaiCol') },
  { key: 'ten_nguoi_giu_truoc', label: i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol') },
  { key: 'ten_nguoi_giu_sau', label: i18n.t('capPhatThuHoi.store.nguoiGiuSauCol') },
  { key: 'ngay_thuc_hien', label: i18n.t('capPhatThuHoi.store.ngayCol') },
  { key: 'ten_nguoi_thuc_hien', label: i18n.t('capPhatThuHoi.store.nguoiThucHienCol') },
  { key: 'ghi_chu', label: i18n.t('capPhatThuHoi.store.ghiChuCol') },
  { key: 'tg_cap_nhat', label: i18n.t('capPhatThuHoi.store.updatedCol') },
];

export function exportPhieuToPDF(phieu: PhieuCapPhatThuHoi): Promise<void> {
  return Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('../../../../lib/jspdf-vietnamese-font'),
  ]).then(async ([{ jsPDF }, autoTableModule, viMod]) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    await viMod.ensureJsPDFVietnameseFont(doc);
    const F = viMod.JSPDF_VI_FONT_FAMILY;
    const autoTable = autoTableModule.default;
    const loaiLabel = getLoaiPhieuLabel(phieu.loai_phieu, i18n.t);

    doc.setFontSize(14);
    doc.text(`PHIẾU ${loaiLabel.toUpperCase()}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Mã phiếu: ${phieu.ma_phieu}`, 14, 22);
    doc.text(`Ngày thực hiện: ${formatDate(phieu.ngay_thuc_hien)}`, 14, 28);

    const infoRows = [
      ['Loại phiếu', loaiLabel],
      ['Người giữ trước', phieu.ten_nguoi_giu_truoc ?? '—'],
      ['Người nhận', phieu.ten_nguoi_giu_sau ?? '—'],
      ['Người thực hiện', phieu.ten_nguoi_thuc_hien ?? '—'],
      ['Ghi chú', phieu.ghi_chu ?? '—'],
    ];
    autoTable(doc, {
      head: [['Trường', 'Nội dung']],
      body: infoRows,
      startY: 34,
      styles: { font: F, fontSize: 9, cellPadding: 3 },
      headStyles: { font: F, fillColor: [59, 130, 246], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 135 } },
    });

    const chiTiet = phieu.chi_tiet ?? [];
    if (chiTiet.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 70;
      doc.setFontSize(11);
      doc.text('Danh sách tài sản', 14, finalY + 8);

      const detailRows = chiTiet.map((ct, idx) => [
        String(idx + 1),
        ct.ma_tai_san ?? '—',
        ct.ten_tai_san ?? '—',
        ct.ten_noi_luu_truoc ?? '—',
        ct.ten_noi_luu_sau ?? '—',
        ct.ghi_chu ?? '',
      ]);
      autoTable(doc, {
        head: [['STT', 'Mã TS', 'Tên tài sản', 'Nơi lưu trước', 'Nơi lưu sau', 'Ghi chú']],
        body: detailRows,
        startY: finalY + 12,
        styles: { font: F, fontSize: 8, cellPadding: 2.5 },
        headStyles: { font: F, fillColor: [59, 130, 246], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 28 },
        },
      });
    }

    const signY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 20
      : 200;
    doc.setFontSize(9);
    const col1 = 20;
    const col2 = 90;
    const col3 = 155;
    doc.text('Người giao', col1, signY, { align: 'center' });
    doc.text('Người nhận', col2, signY, { align: 'center' });
    doc.text('Người thực hiện', col3, signY, { align: 'center' });
    doc.text('(Ký, ghi rõ họ tên)', col1, signY + 5, { align: 'center' });
    doc.text('(Ký, ghi rõ họ tên)', col2, signY + 5, { align: 'center' });
    doc.text('(Ký, ghi rõ họ tên)', col3, signY + 5, { align: 'center' });

    doc.save(`${fileName(phieu)}.pdf`);
  });
}

/* ------------------------------------------------------------------ */
/*  DOC: table-based HTML (Word)                                       */
/* ------------------------------------------------------------------ */

export async function exportPhieuToDoc(phieu: PhieuCapPhatThuHoi): Promise<void> {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const chiTiet: PhieuCapPhatThuHoiChiTiet[] = phieu.chi_tiet ?? [];
  const loaiLabel = getLoaiPhieuLabel(phieu.loai_phieu, t);
  const title = `PHIẾU ${loaiLabel.toUpperCase()}`;
  const dateLine = formatDateVietnameseLong(phieu.ngay_thuc_hien);
  const printedAt = formatDateTime(new Date());

  let detailRows = '';
  if (chiTiet.length > 0) {
    const headers = ['TT', t('capPhatThuHoi.store.maTaiSanCol'), t('capPhatThuHoi.store.taiSanCol'), t('capPhatThuHoi.store.noiLuuTruocCol'), t('capPhatThuHoi.store.noiLuuSauCol'), t('capPhatThuHoi.store.ghiChuCol')];
    detailRows =
      '<tr style="background:#2563eb;color:#fff;font-weight:bold">' +
      headers.map((h) => `<td style="border:1px solid #999;padding:4px 6px">${h}</td>`).join('') +
      '</tr>';
    chiTiet.forEach((ct, idx) => {
      detailRows +=
        '<tr>' +
        [idx + 1, safe(ct.ma_tai_san), safe(ct.ten_tai_san), safe(ct.ten_noi_luu_truoc), safe(ct.ten_noi_luu_sau), safe(ct.ghi_chu)]
          .map((v) => `<td style="border:1px solid #999;padding:4px 6px">${v}</td>`)
          .join('') +
        '</tr>';
    });
    detailRows +=
      `<tr style="background:#f1f5f9;font-weight:bold">` +
      `<td colspan="6" style="border:1px solid #999;padding:4px 6px">${t('capPhatThuHoi.preview.totalAssets')}: ${chiTiet.length}</td></tr>`;
  }

  const sign = (label: string) =>
    `<td width="33%" style="text-align:center;padding:8px;vertical-align:top"><b>${label}</b><br/><span style="font-size:9pt;color:#666">${t('capPhatThuHoi.preview.signHint')}</span></td>`;

  const body = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:11pt">
<tr><td style="padding-bottom:12px;border-bottom:2px solid #333">
  <p style="margin:0;font-size:14pt;font-weight:bold">${info.companyName}</p>
  ${info.address ? `<p style="margin:4px 0 0 0;font-size:9pt">${i18n.t('company.address')}: ${info.address}</p>` : ''}
  ${info.email || info.phone ? `<p style="margin:2px 0 0 0;font-size:9pt">${[info.email, info.phone].filter(Boolean).join(' · ')}</p>` : ''}
</td></tr>
<tr><td style="padding:8px 0 4px 0">${dateLine}</td></tr>
<tr><td style="text-align:center;padding:8px 0"><b style="font-size:14pt">${title}</b><br/>(${t('capPhatThuHoi.store.maPhieuCol')}: ${phieu.ma_phieu})</td></tr>
<tr><td style="padding:4px 0"><b>${t('capPhatThuHoi.preview.nguoiGiao')}:</b> ${safe(phieu.ten_nguoi_giu_truoc)} &nbsp;&nbsp; <b>${t('capPhatThuHoi.preview.nguoiNhan')}:</b> ${safe(phieu.ten_nguoi_giu_sau)}</td></tr>
<tr><td style="padding:4px 0"><b>${t('capPhatThuHoi.store.nguoiThucHienCol')}:</b> ${safe(phieu.ten_nguoi_thuc_hien)}</td></tr>
<tr><td style="padding:4px 0 12px 0"><b>${t('capPhatThuHoi.store.ghiChuCol')}:</b> ${safe(phieu.ghi_chu)}</td></tr>
${detailRows ? `
<tr><td style="padding:8px 0 4px 0"><b>${t('capPhatThuHoi.detail.sectionAssets')}</b></td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:10pt">${detailRows}</table></td></tr>
` : ''}
<tr><td style="padding-top:24px;border-top:1px solid #ccc">
  <table width="100%"><tr>${sign(t('capPhatThuHoi.preview.signNguoiGiao'))}${sign(t('capPhatThuHoi.preview.signNguoiNhan'))}${sign(t('capPhatThuHoi.preview.signNguoiThucHien'))}</tr></table>
</td></tr>
<tr><td style="padding-top:12px;border-top:1px solid #ddd;font-size:8pt;color:#888">${t('capPhatThuHoi.preview.printedAt')} ${printedAt}</td></tr>
</table>`;

  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>body,td,th,p{font-family:${FONT_DOC};font-size:11pt;}</style></head>`,
    `<body style="font-family:${FONT_DOC};margin:40px">${body}</body>`,
    '</html>',
  ].join('');
  download(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${fileName(phieu)}.doc`);
}

/* ------------------------------------------------------------------ */
/*  XLSX                                                               */
/* ------------------------------------------------------------------ */

export async function exportPhieuToXLSX(phieu: PhieuCapPhatThuHoi): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const chiTiet = phieu.chi_tiet ?? [];
  const loaiLabel = getLoaiPhieuLabel(phieu.loai_phieu, t);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [formatDateVietnameseLong(phieu.ngay_thuc_hien)],
    [`PHIẾU ${loaiLabel.toUpperCase()}`],
    [t('capPhatThuHoi.store.maPhieuCol'), phieu.ma_phieu],
    [t('capPhatThuHoi.preview.nguoiGiao'), safe(phieu.ten_nguoi_giu_truoc)],
    [t('capPhatThuHoi.preview.nguoiNhan'), safe(phieu.ten_nguoi_giu_sau)],
    [t('capPhatThuHoi.store.nguoiThucHienCol'), safe(phieu.ten_nguoi_thuc_hien)],
    [t('capPhatThuHoi.store.ghiChuCol'), safe(phieu.ghi_chu)],
    [],
    ['TT', t('capPhatThuHoi.store.maTaiSanCol'), t('capPhatThuHoi.store.taiSanCol'), t('capPhatThuHoi.store.noiLuuTruocCol'), t('capPhatThuHoi.store.noiLuuSauCol'), t('capPhatThuHoi.store.ghiChuCol')],
  ];

  chiTiet.forEach((ct, idx) => {
    rows.push([
      idx + 1,
      safe(ct.ma_tai_san),
      safe(ct.ten_tai_san),
      safe(ct.ten_noi_luu_truoc),
      safe(ct.ten_noi_luu_sau),
      safe(ct.ghi_chu),
    ]);
  });

  if (chiTiet.length > 0) {
    rows.push([t('capPhatThuHoi.preview.totalAssets'), chiTiet.length, '', '', '', '']);
  }

  rows.push([]);
  rows.push([t('capPhatThuHoi.preview.signNguoiGiao'), t('capPhatThuHoi.preview.signNguoiNhan'), t('capPhatThuHoi.preview.signNguoiThucHien')]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_CPTH');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
