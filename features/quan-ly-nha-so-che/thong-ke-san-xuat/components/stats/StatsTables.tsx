import React from 'react';
import { Building2, FileCheck, CheckCircle2, Banknote } from 'lucide-react';
import { formatNumberVN } from '../../../../../lib/utils';
import type { ThongKeSanXuatStats, ByChiNhanhRow, KpiAnalysis } from './useThongKeSanXuatStats';

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
const fmtPct = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v, { maxFractionDigits: 0 })}%`;

// ─── Shared components ────────────────────────────────────────────────────────

function TableShell({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const TH = ({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) => (
  <th className={`px-3 py-2 text-caption font-medium text-muted-foreground bg-muted/30 border-b border-border whitespace-nowrap${right ? ' text-right' : center ? ' text-center' : ' text-left'}`}>
    {children}
  </th>
);
const TD = ({ children, right, center, cls }: { children: React.ReactNode; right?: boolean; center?: boolean; cls?: string }) => (
  <td className={`px-3 py-2 text-xs border-b border-border/40 whitespace-nowrap${right ? ' text-right tabular-nums' : center ? ' text-center' : ''} ${cls ?? ''}`}>
    {children}
  </td>
);

// ─── Table 1: Tổng hợp theo chi nhánh ────────────────────────────────────────

function TableByChiNhanh({ rows }: { rows: ByChiNhanhRow[] }) {
  return (
    <TableShell title="Tổng hợp theo chi nhánh" icon={<Building2 size={14} className="text-primary" />}>
      <table className="w-full text-xs min-w-[700px]">
        <thead>
          <tr>
            <TH>Chi nhánh</TH>
            <TH right>Số ngày</TH>
            <TH right>Công QĐ tổng</TH>
            <TH right>Công QĐ TB/ngày</TH>
            <TH right>Giờ TC</TH>
            <TH right>KPI đạt/có BCSC</TH>
            <TH right>% KPI</TH>
            <TH right>Tiền thưởng</TH>
            <TH right>Tiền phạt</TH>
            <TH right>Net</TH>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.length === 0 ? (
            <tr><td colSpan={10} className="px-4 py-6 text-center text-muted-foreground text-xs">Chưa có dữ liệu</td></tr>
          ) : rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20 transition-colors">
              <TD cls="font-medium text-foreground">{r.ten}</TD>
              <TD right>{fmtInt(r.tongNgay)}</TD>
              <TD right cls="font-semibold">{fmt1(r.tongCongQuyDoi)}</TD>
              <TD right>{fmt1(r.tbCongQuyDoiNgay)}</TD>
              <TD right cls={r.tongGioTangCaTich > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}>{r.tongGioTangCaTich > 0 ? fmt1(r.tongGioTangCaTich) : '—'}</TD>
              <TD right>{r.ngayCoBcsc > 0 ? `${r.ngayDatKpi}/${r.ngayCoBcsc}` : '—'}</TD>
              <TD right cls={r.kpiRate != null ? (r.kpiRate >= 80 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : r.kpiRate < 50 ? 'text-red-500' : '') : ''}>{fmtPct(r.kpiRate)}</TD>
              <TD right cls="text-emerald-600 dark:text-emerald-400">{r.tienThuongDuong > 0 ? fmtCur(r.tienThuongDuong) : '—'}</TD>
              <TD right cls="text-red-500 dark:text-red-400">{r.tienThuongAm < 0 ? fmtCur(Math.abs(r.tienThuongAm)) : '—'}</TD>
              <TD right cls={r.tongTienThuong > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : r.tongTienThuong < 0 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>{r.tongTienThuong !== 0 ? fmtCurSigned(r.tongTienThuong) : '—'}</TD>
            </tr>
          ))}
        </tbody>
        {rows.length > 1 && (() => {
          const totNgay = rows.reduce((s, r) => s + r.tongNgay, 0);
          const totCongQD = rows.reduce((s, r) => s + r.tongCongQuyDoi, 0);
          const totGioTC = rows.reduce((s, r) => s + r.tongGioTangCaTich, 0);
          const totDat = rows.reduce((s, r) => s + r.ngayDatKpi, 0);
          const totBcsc = rows.reduce((s, r) => s + r.ngayCoBcsc, 0);
          const totDuong = rows.reduce((s, r) => s + r.tienThuongDuong, 0);
          const totAm = rows.reduce((s, r) => s + r.tienThuongAm, 0);
          const totNet = totDuong + totAm;
          return (
            <tfoot>
              <tr className="bg-muted/40 font-semibold border-t border-border">
                <TD cls="font-semibold text-foreground">Tổng cộng</TD>
                <TD right>{fmtInt(totNgay)}</TD>
                <TD right cls="font-bold text-foreground">{fmt1(totCongQD)}</TD>
                <TD right>—</TD>
                <TD right cls={totGioTC > 0 ? 'text-orange-600 dark:text-orange-400' : ''}>{totGioTC > 0 ? fmt1(totGioTC) : '—'}</TD>
                <TD right>{totBcsc > 0 ? `${totDat}/${totBcsc}` : '—'}</TD>
                <TD right cls="text-foreground">{fmtPct(totBcsc > 0 ? (totDat / totBcsc) * 100 : null)}</TD>
                <TD right cls="text-emerald-600 dark:text-emerald-400">{totDuong > 0 ? fmtCur(totDuong) : '—'}</TD>
                <TD right cls="text-red-500 dark:text-red-400">{totAm < 0 ? fmtCur(Math.abs(totAm)) : '—'}</TD>
                <TD right cls={totNet > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : totNet < 0 ? 'text-red-500 font-bold' : ''}>{totNet !== 0 ? fmtCurSigned(totNet) : '—'}</TD>
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </TableShell>
  );
}

// ─── Table 2: KPI & Thưởng/Phạt ─────────────────────────────────────────────

function TableKpiAnalysis({ a }: { a: KpiAnalysis }) {
  const kpiRows = [
    {
      label: 'Ngày đạt đủ KPI',
      count: a.ngayDatKpi,
      pct: a.tongNgayCoBcsc > 0 ? fmtPct((a.ngayDatKpi / a.tongNgayCoBcsc) * 100) : '—',
      tienThuong: a.tienThuongTrenNgayDat != null && a.tienThuongTrenNgayDat > 0 ? fmtCur(a.tienThuongTrenNgayDat) : '—',
      tienPhat: '—',
      net: a.tienThuongTrenNgayDat != null ? fmtCurSigned(a.tienThuongTrenNgayDat) : '—',
      cls: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Ngày chưa đạt KPI (có BCSC)',
      count: a.ngayKhongDatKpi,
      pct: a.tongNgayCoBcsc > 0 ? fmtPct((a.ngayKhongDatKpi / a.tongNgayCoBcsc) * 100) : '—',
      tienThuong: '—',
      tienPhat: a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat < 0 ? fmtCur(Math.abs(a.tienPhatTrenNgayKhongDat)) : '—',
      net: a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat !== 0 ? fmtCurSigned(a.tienPhatTrenNgayKhongDat) : '—',
      cls: 'text-red-500 dark:text-red-400',
    },
    {
      label: 'Ngày không có BC sơ chế',
      count: a.ngayKhongCoBcsc,
      pct: '—',
      tienThuong: '—',
      tienPhat: '—',
      net: '—',
      cls: 'text-muted-foreground',
    },
  ];

  return (
    <TableShell title="Phân tích KPI & Thưởng / Phạt" icon={<CheckCircle2 size={14} className="text-primary" />}>
      <table className="w-full text-xs min-w-[520px]">
        <thead>
          <tr>
            <TH>Chỉ tiêu</TH>
            <TH right>Số ngày</TH>
            <TH right>Tỷ lệ</TH>
            <TH right>Tiền thưởng (+)</TH>
            <TH right>Tiền phạt (−)</TH>
            <TH right>Net</TH>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {kpiRows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              <TD cls={`font-medium ${r.cls}`}>{r.label}</TD>
              <TD right cls="font-semibold">{fmtInt(r.count)}</TD>
              <TD right cls="text-muted-foreground">{r.pct}</TD>
              <TD right cls="text-emerald-600 dark:text-emerald-400">{r.tienThuong}</TD>
              <TD right cls="text-red-500 dark:text-red-400">{r.tienPhat}</TD>
              <TD right cls={r.net.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : r.net.startsWith('-') ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>{r.net}</TD>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 font-semibold border-t border-border">
            <TD cls="font-semibold text-foreground">Tổng cộng</TD>
            <TD right>{fmtInt(a.tongNgayCoBcsc + a.ngayKhongCoBcsc)}</TD>
            <TD right>—</TD>
            <TD right cls="text-emerald-600 dark:text-emerald-400 font-bold">{a.tienThuongDuong > 0 ? fmtCurSigned(a.tienThuongDuong) : '—'}</TD>
            <TD right cls="text-red-500 dark:text-red-400 font-bold">{a.tienThuongAm < 0 ? fmtCurSigned(a.tienThuongAm) : '—'}</TD>
            <TD right cls={a.tienThuongNet > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold text-sm' : a.tienThuongNet < 0 ? 'text-red-500 font-bold text-sm' : ''}>{a.tienThuongNet !== 0 ? fmtCurSigned(a.tienThuongNet) : '—'}</TD>
          </tr>
        </tfoot>
      </table>
    </TableShell>
  );
}

// ─── Table 3: Trạng thái BC ───────────────────────────────────────────────────

function TableBcStatus({ rows }: { rows: ThongKeSanXuatStats['bcStatusRows'] }) {
  return (
    <TableShell title="Mức độ hoàn thiện báo cáo" icon={<FileCheck size={14} className="text-primary" />}>
      <table className="w-full text-xs">
        <thead>
          <tr><TH>Chỉ tiêu</TH><TH right>Số ngày</TH><TH right>Tỷ lệ</TH></tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              <TD cls={i === 0 ? 'font-semibold text-foreground' : 'text-foreground'}>{r.label}</TD>
              <TD right cls="font-semibold">{fmtInt(r.count)}</TD>
              <TD right cls={i === 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>{r.pct}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

// ─── Table 4: Sơ chế & Đóng thùng ────────────────────────────────────────────

function TableSoCheThung({ rows }: { rows: ByChiNhanhRow[] }) {
  const visible = rows.filter((r) => r.tongBuongSoChe > 0 || r.tongThungKH > 0 || r.tongThungTT > 0);
  if (visible.length === 0) return null;
  return (
    <TableShell title="Sơ chế & Đóng thùng theo chi nhánh" icon={<Banknote size={14} className="text-primary" />}>
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr><TH>Chi nhánh</TH><TH right>Buồng sơ chế</TH><TH right>Thùng KH</TH><TH right>Thùng TT</TH><TH right>TT/KH</TH></tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {visible.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20 transition-colors">
              <TD cls="font-medium text-foreground">{r.ten}</TD>
              <TD right>{r.tongBuongSoChe > 0 ? fmtInt(r.tongBuongSoChe) : '—'}</TD>
              <TD right>{r.tongThungKH > 0 ? fmtInt(r.tongThungKH) : '—'}</TD>
              <TD right cls="font-semibold text-indigo-600 dark:text-indigo-400">{r.tongThungTT > 0 ? fmtInt(r.tongThungTT) : '—'}</TD>
              <TD right cls={r.tongThungKH > 0 && r.tongThungTT >= r.tongThungKH ? 'text-emerald-600 dark:text-emerald-400' : ''}>{r.tongThungKH > 0 ? fmtPct((r.tongThungTT / r.tongThungKH) * 100) : '—'}</TD>
            </tr>
          ))}
        </tbody>
        {visible.length > 1 && (() => {
          const totSC = visible.reduce((s, r) => s + r.tongBuongSoChe, 0);
          const totKH = visible.reduce((s, r) => s + r.tongThungKH, 0);
          const totTT = visible.reduce((s, r) => s + r.tongThungTT, 0);
          return (
            <tfoot>
              <tr className="bg-muted/40 border-t border-border">
                <TD cls="font-semibold text-foreground">Tổng cộng</TD>
                <TD right cls="font-bold">{totSC > 0 ? fmtInt(totSC) : '—'}</TD>
                <TD right cls="font-bold">{totKH > 0 ? fmtInt(totKH) : '—'}</TD>
                <TD right cls="font-bold text-indigo-600 dark:text-indigo-400">{totTT > 0 ? fmtInt(totTT) : '—'}</TD>
                <TD right cls="font-semibold">{totKH > 0 ? fmtPct((totTT / totKH) * 100) : '—'}</TD>
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </TableShell>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  stats: ThongKeSanXuatStats;
}

const StatsTables: React.FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-3">
      <TableByChiNhanh rows={stats.byChiNhanh} />
      <TableKpiAnalysis a={stats.kpiAnalysis} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TableBcStatus rows={stats.bcStatusRows} />
        <TableSoCheThung rows={stats.byChiNhanh} />
      </div>
    </div>
  );
};

export default StatsTables;
