/**
 * Xuất / in thống kê sản xuất — XLSX + PDF.
 * Pattern tham khảo: export-bao-cao-so-che.ts
 */
import { formatNumberVN, formatDateShort, getTodayISODate } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { ThongKeSanXuatStats, KpiAnalysis, ByChiNhanhRow } from '../components/stats/useThongKeSanXuatStats';
import type { ThongKeSanXuatSummary } from '../core/types';

// ─── Style constants ──────────────────────────────────────────────────────────

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const th = 'padding:3px 6px;border:1px solid #bbb;font-size:7.5pt;font-weight:600;background:#f3f4f6;text-align:center;vertical-align:bottom;white-space:nowrap';
const thL = `${th};text-align:left`;
const thR = `${th};text-align:right`;
const td = 'padding:2px 6px;border:1px solid #bbb;font-size:7.5pt;vertical-align:middle';
const tdR = `${td};text-align:right`;
const tdC = `${td};text-align:center`;
const tdBold = `${td};font-weight:600`;
const tdBoldR = `${tdBold};text-align:right`;
const trFoot = 'background:#f3f4f6;font-weight:600';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt1 = (v: number | null) =>
  v == null ? '—' : formatNumberVN(v, { maxFractionDigits: 1, minFractionDigits: 0 });
const fmtInt = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });
const fmtCur = (v: number) =>
  v === 0 ? '—' : v >= 1_000_000 ? `${formatNumberVN(v / 1_000_000, { maxFractionDigits: 1 })}tr` : fmtInt(v);
const fmtCurSigned = (v: number) => {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  const s = abs >= 1_000_000 ? `${formatNumberVN(abs / 1_000_000, { maxFractionDigits: 1 })}tr` : fmtInt(abs);
  return v > 0 ? `+${s}` : `-${s}`;
};
const fmtPctNum = (n: number, d: number) =>
  d > 0 ? `${formatNumberVN((n / d) * 100, { maxFractionDigits: 0 })}%` : '—';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildCompanyHeader(): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:52px;height:52px;object-fit:contain;flex-shrink:0" />`
    : '';
  return `
<div style="display:flex;align-items:flex-start;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:2px solid #333;font-family:${FONT}">
  ${logoHtml}
  <div>
    <div style="font-size:12pt;font-weight:bold;color:#111;text-transform:uppercase">${info.companyName}</div>
    ${info.address ? `<p style="font-size:8pt;color:#444;margin:2px 0 0 0">Địa chỉ: ${info.address}</p>` : ''}
  </div>
</div>`;
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildSummarySection(s: ThongKeSanXuatSummary): string {
  const kpiPct = s.ngayCoBcsc > 0 ? formatNumberVN((s.ngayDatKpi / s.ngayCoBcsc) * 100, { maxFractionDigits: 0 }) : '—';
  const rows: [string, string][] = [
    ['Tổng ngày dữ liệu', fmtInt(s.tongNgay)],
    ['Ngày đủ 3 báo cáo', `${fmtInt(s.ngayDu3Bc)} (${fmtPctNum(s.ngayDu3Bc, s.tongNgay)})`],
    ['Ngày đạt KPI / có BCSC', `${fmtInt(s.ngayDatKpi)} / ${fmtInt(s.ngayCoBcsc)} (${kpiPct}%)`],
    ['Tiền thưởng KPI (net)', fmtCurSigned(s.tongTienThuong)],
    ['Tổng công quy đổi', `${fmt1(s.tongCongQuyDoi)} (TB ${fmt1(s.tbCongQuyDoiNgay)}/ngày)`],
    ['Giờ tăng ca tích lũy', `${fmt1(s.tongGioTangCaTich)}h (TB ${fmt1(s.tbGioTangCaNgay)}h/ngày)`],
    ['TB nhân sự định biên / ngày', fmt1(s.tbCnDinhBien)],
    ['TB hệ số K định biên', fmt1(s.tbKDinhBien)],
    ['Tổng buồng sơ chế', fmtInt(s.tongBuongSoChe)],
    ['Tổng thùng đóng gói thực tế', fmtInt(s.tongSoThungTT)],
  ];
  const body = rows.map(([label, val]) =>
    `<tr><td style="${td}">${label}</td><td style="${tdBoldR}">${val}</td></tr>`
  ).join('');
  return `
<div style="margin-bottom:14px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">I. Tóm tắt tổng quan</div>
  <table style="width:340px;border-collapse:collapse">
    <tbody>${body}</tbody>
  </table>
</div>`;
}

function buildChiNhanhSection(rows: ByChiNhanhRow[]): string {
  if (rows.length === 0) return '';
  const body = rows.map((r) => {
    const net = r.tienThuongDuong + r.tienThuongAm;
    return `<tr>
      <td style="${td}">${r.ten}</td>
      <td style="${tdC}">${fmtInt(r.tongNgay)}</td>
      <td style="${tdR};font-weight:600">${fmt1(r.tongCongQuyDoi)}</td>
      <td style="${tdR}">${fmt1(r.tbCongQuyDoiNgay)}</td>
      <td style="${tdR}">${r.tongGioTangCaTich > 0 ? fmt1(r.tongGioTangCaTich) : '—'}</td>
      <td style="${tdC}">${r.ngayCoBcsc > 0 ? `${r.ngayDatKpi}/${r.ngayCoBcsc}` : '—'}</td>
      <td style="${tdC}">${r.kpiRate != null ? fmtPctNum(r.kpiRate, 100) : '—'}</td>
      <td style="${tdR};color:#16a34a">${r.tienThuongDuong > 0 ? fmtCur(r.tienThuongDuong) : '—'}</td>
      <td style="${tdR};color:#dc2626">${r.tienThuongAm < 0 ? fmtCur(Math.abs(r.tienThuongAm)) : '—'}</td>
      <td style="${tdR};font-weight:600;color:${net > 0 ? '#16a34a' : net < 0 ? '#dc2626' : '#111'}">${net !== 0 ? fmtCurSigned(net) : '—'}</td>
    </tr>`;
  }).join('');
  const tot = {
    ngay: rows.reduce((s, r) => s + r.tongNgay, 0),
    cqd: rows.reduce((s, r) => s + r.tongCongQuyDoi, 0),
    gtc: rows.reduce((s, r) => s + r.tongGioTangCaTich, 0),
    dat: rows.reduce((s, r) => s + r.ngayDatKpi, 0),
    bcsc: rows.reduce((s, r) => s + r.ngayCoBcsc, 0),
    duong: rows.reduce((s, r) => s + r.tienThuongDuong, 0),
    am: rows.reduce((s, r) => s + r.tienThuongAm, 0),
  };
  const totNet = tot.duong + tot.am;
  const foot = `<tr style="${trFoot}">
    <td style="${tdBold}">Tổng cộng</td>
    <td style="${tdC}">${fmtInt(tot.ngay)}</td>
    <td style="${tdBoldR}">${fmt1(tot.cqd)}</td>
    <td style="${tdR}">—</td>
    <td style="${tdR}">${tot.gtc > 0 ? fmt1(tot.gtc) : '—'}</td>
    <td style="${tdC}">${tot.bcsc > 0 ? `${tot.dat}/${tot.bcsc}` : '—'}</td>
    <td style="${tdC}">${fmtPctNum(tot.dat, tot.bcsc)}</td>
    <td style="${tdR};color:#16a34a">${tot.duong > 0 ? fmtCur(tot.duong) : '—'}</td>
    <td style="${tdR};color:#dc2626">${tot.am < 0 ? fmtCur(Math.abs(tot.am)) : '—'}</td>
    <td style="${tdR};font-weight:700;color:${totNet > 0 ? '#16a34a' : totNet < 0 ? '#dc2626' : '#111'}">${totNet !== 0 ? fmtCurSigned(totNet) : '—'}</td>
  </tr>`;
  return `
<div style="margin-bottom:14px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">II. Tổng hợp theo chi nhánh</div>
  <table style="width:100%;border-collapse:collapse;table-layout:auto">
    <thead><tr>
      <th style="${thL}">Chi nhánh</th>
      <th style="${th}">Ngày</th>
      <th style="${thR}">Công QĐ</th>
      <th style="${thR}">TB/ngày</th>
      <th style="${thR}">Giờ TC</th>
      <th style="${th}">KPI đạt</th>
      <th style="${th}">% KPI</th>
      <th style="${thR}">Thưởng (+)</th>
      <th style="${thR}">Phạt (−)</th>
      <th style="${thR}">Net</th>
    </tr></thead>
    <tbody>${body}</tbody>
    <tfoot>${foot}</tfoot>
  </table>
</div>`;
}

function buildKpiSection(a: KpiAnalysis): string {
  const totNgay = a.tongNgayCoBcsc + a.ngayKhongCoBcsc;
  const rows = [
    ['Ngày đạt đủ KPI', a.ngayDatKpi, fmtPctNum(a.ngayDatKpi, a.tongNgayCoBcsc), a.tienThuongTrenNgayDat != null && a.tienThuongTrenNgayDat > 0 ? fmtCur(a.tienThuongTrenNgayDat) : '—', '—', a.tienThuongTrenNgayDat != null ? fmtCurSigned(a.tienThuongTrenNgayDat) : '—', '#16a34a'],
    ['Ngày chưa đạt KPI (có BCSC)', a.ngayKhongDatKpi, fmtPctNum(a.ngayKhongDatKpi, a.tongNgayCoBcsc), '—', a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat < 0 ? fmtCur(Math.abs(a.tienPhatTrenNgayKhongDat)) : '—', a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat !== 0 ? fmtCurSigned(a.tienPhatTrenNgayKhongDat) : '—', '#dc2626'],
    ['Không có BC sơ chế', a.ngayKhongCoBcsc, '—', '—', '—', '—', '#888'],
  ] as const;
  const body = rows.map(([label, count, pct, thuong, phat, net, color]) =>
    `<tr>
      <td style="${td};color:${color};font-weight:500">${label}</td>
      <td style="${tdC};font-weight:600">${fmtInt(count)}</td>
      <td style="${tdC}">${pct}</td>
      <td style="${tdR};color:#16a34a">${thuong}</td>
      <td style="${tdR};color:#dc2626">${phat}</td>
      <td style="${tdR};font-weight:600;color:${color}">${net}</td>
    </tr>`
  ).join('');
  const netColor = a.tienThuongNet > 0 ? '#16a34a' : a.tienThuongNet < 0 ? '#dc2626' : '#111';
  const foot = `<tr style="${trFoot}">
    <td style="${tdBold}">Tổng cộng</td>
    <td style="${tdC}">${fmtInt(totNgay)}</td>
    <td style="${tdC}">—</td>
    <td style="${tdR};color:#16a34a;font-weight:700">${a.tienThuongDuong > 0 ? fmtCurSigned(a.tienThuongDuong) : '—'}</td>
    <td style="${tdR};color:#dc2626;font-weight:700">${a.tienThuongAm < 0 ? fmtCurSigned(a.tienThuongAm) : '—'}</td>
    <td style="${tdR};font-weight:700;color:${netColor}">${a.tienThuongNet !== 0 ? fmtCurSigned(a.tienThuongNet) : '—'}</td>
  </tr>`;
  return `
<div style="margin-bottom:14px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">III. Phân tích KPI & Thưởng / Phạt</div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr>
      <th style="${thL}">Chỉ tiêu</th>
      <th style="${th}">Số ngày</th>
      <th style="${th}">Tỷ lệ</th>
      <th style="${thR}">Tiền thưởng (+)</th>
      <th style="${thR}">Tiền phạt (−)</th>
      <th style="${thR}">Net</th>
    </tr></thead>
    <tbody>${body}</tbody>
    <tfoot>${foot}</tfoot>
  </table>
</div>`;
}

// ─── Full HTML body ───────────────────────────────────────────────────────────

function buildBody(
  summary: ThongKeSanXuatSummary,
  stats: ThongKeSanXuatStats,
  periodLabel: string
): string {
  const printedAt = new Date().toLocaleString('vi-VN');
  const companyHeader = buildCompanyHeader();
  return [
    companyHeader,
    `<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:0 0 4px;font-family:${FONT}">THỐNG KÊ SẢN XUẤT</h1>`,
    `<p style="text-align:center;font-size:9pt;color:#555;margin:0 0 12px;font-family:${FONT}">${periodLabel}</p>`,
    buildSummarySection(summary),
    buildChiNhanhSection(stats.byChiNhanh),
    buildKpiSection(stats.kpiAnalysis),
    `<p style="font-size:7pt;color:#999;margin-top:16px;padding-top:8px;border-top:1px solid #eee;font-family:${FONT}">In lúc: ${printedAt}</p>`,
  ].join('');
}

// ─── Export functions ─────────────────────────────────────────────────────────

export async function exportThongKeSanXuatToPDF(
  summary: ThongKeSanXuatSummary,
  stats: ThongKeSanXuatStats,
  periodLabel: string
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const bodyContent = buildBody(summary, stats, periodLabel);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}img{max-width:100%}table{word-break:break-word}</style></head><body>`,
    `<div style="width:794px;padding:20px">${bodyContent}</div>`,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:834px;height:1123px;border:0;z-index:-1';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
  await new Promise((r) => setTimeout(r, 200));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');
    const canvas = await html2canvas(docEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    if (iframe.parentNode) document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, margin = 10;
    const pxToMm = 25.4 / 96;
    const wMm = (canvas.width / 2) * pxToMm;
    const hMm = (canvas.height / 2) * pxToMm;
    const scale = Math.min((pageW - margin * 2) / wMm, (pageH - margin * 2) / hMm, 1);
    const drawW = wMm * scale, drawH = hMm * scale;

    if (drawH <= pageH - margin * 2) {
      doc.addImage(imgData, 'PNG', margin, margin, drawW, drawH);
    } else {
      let yOffset = 0, page = 0;
      const slicePx = ((pageH - margin * 2) / scale / pxToMm) * 2;
      while (yOffset < canvas.height) {
        const sliceH = Math.min(slicePx, canvas.height - yOffset);
        const sc = document.createElement('canvas');
        sc.width = canvas.width; sc.height = sliceH;
        const ctx = sc.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceMm = (sliceH / 2) * pxToMm * scale;
        if (page > 0) doc.addPage();
        doc.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, drawW, sliceMm);
        yOffset += sliceH; page++;
      }
    }
    const fname = `thong_ke_san_xuat_${getTodayISODate()}`;
    download(doc.output('blob'), `${fname}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

export function printThongKeSanXuat(
  summary: ThongKeSanXuatSummary,
  stats: ThongKeSanXuatStats,
  periodLabel: string
): void {
  const bodyContent = buildBody(summary, stats, periodLabel);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write([
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:20px;font-family:${FONT};font-size:10pt;color:#222}@media print{@page{size:A4;margin:12mm}}</style>`,
    '</head><body>',
    bodyContent,
    '<script>window.onload=()=>{window.print();window.close();}<\/script>',
    '</body></html>',
  ].join(''));
  w.document.close();
}

export async function exportThongKeSanXuatToXLSX(
  summary: ThongKeSanXuatSummary,
  stats: ThongKeSanXuatStats,
  periodLabel: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const info = useUIStore.getState().companyInfo;
  const a = stats.kpiAnalysis;

  const rows: (string | number | null)[][] = [
    [info.companyName],
    info.address ? ['Địa chỉ:', info.address] : [],
    [],
    ['THỐNG KÊ SẢN XUẤT'],
    ['Kỳ báo cáo:', periodLabel],
    [],
    // I. Summary
    ['I. TÓM TẮT'],
    ['Tổng ngày', summary.tongNgay],
    ['Ngày đủ 3 BC', summary.ngayDu3Bc],
    ['Ngày đạt KPI', summary.ngayDatKpi],
    ['Tiền thưởng net', summary.tongTienThuong],
    ['Công quy đổi tổng', summary.tongCongQuyDoi],
    ['Giờ tăng ca tổng', summary.tongGioTangCaTich],
    ['Buồng sơ chế tổng', summary.tongBuongSoChe],
    ['Thùng TT tổng', summary.tongSoThungTT],
    [],
    // II. By chi nhánh
    ['II. THEO CHI NHÁNH'],
    ['Chi nhánh', 'Số ngày', 'Công QĐ', 'TB/ngày', 'Giờ TC', 'KPI đạt', 'Có BCSC', '% KPI', 'Thưởng (+)', 'Phạt (−)', 'Net'],
    ...stats.byChiNhanh.map((r) => [
      r.ten, r.tongNgay, r.tongCongQuyDoi, r.tbCongQuyDoiNgay ?? '', r.tongGioTangCaTich,
      r.ngayDatKpi, r.ngayCoBcsc,
      r.kpiRate != null ? `${formatNumberVN(r.kpiRate, { maxFractionDigits: 0 })}%` : '—',
      r.tienThuongDuong, r.tienThuongAm, r.tienThuongDuong + r.tienThuongAm,
    ]),
    [],
    // III. KPI analysis
    ['III. PHÂN TÍCH KPI & THƯỞNG/PHẠT'],
    ['Chỉ tiêu', 'Số ngày', 'Tỷ lệ', 'Tiền thưởng (+)', 'Tiền phạt (−)', 'Net'],
    ['Đạt đủ KPI', a.ngayDatKpi, fmtPctNum(a.ngayDatKpi, a.tongNgayCoBcsc), a.tienThuongTrenNgayDat ?? 0, 0, a.tienThuongTrenNgayDat ?? 0],
    ['Chưa đạt KPI (có BCSC)', a.ngayKhongDatKpi, fmtPctNum(a.ngayKhongDatKpi, a.tongNgayCoBcsc), 0, a.tienPhatTrenNgayKhongDat ?? 0, a.tienPhatTrenNgayKhongDat ?? 0],
    ['Không có BCSC', a.ngayKhongCoBcsc, '—', 0, 0, 0],
    ['Tổng', a.tongNgayCoBcsc + a.ngayKhongCoBcsc, '—', a.tienThuongDuong, a.tienThuongAm, a.tienThuongNet],
  ].filter((r) => r.length > 0);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Thống kê sản xuất');
  XLSX.writeFile(wb, `thong_ke_san_xuat_${getTodayISODate()}.xlsx`);
}
