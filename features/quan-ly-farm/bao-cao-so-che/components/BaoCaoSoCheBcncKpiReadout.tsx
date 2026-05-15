import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calculator } from 'lucide-react';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import { formatNumberVN } from '../../../../lib/utils';
import {
  findBaoCaoNhanCongByBranchAndDate,
  extractLaborSnapshotFromBcnc,
  extractBcncTableGhiChuRows,
  computeBaoCaoSoCheKpis,
  type BcscLaborFromBcncSnapshot,
} from '../core/bcsc-kpi';
import { BCSC_KPI_STT_OFFSET } from '../core/so-lieu-row-meta';

const ZERO_LABOR_SNAPSHOT: BcscLaborFromBcncSnapshot = {
  tongCongQuyDoiPhieu: 0,
  tongGio8TiepTheoCong: 0,
  congQuyDoiDinhBien: 0,
  gioTangCaTichDinhBien: 0,
};

interface Props {
  ngay: string;
  idChiNhanh: string;
  tongBuongSoChe: number;
  bcncList: FarmBaoCaoNhanCong[];
  /** ĐVT phiếu sơ chế (buồng, thùng, …) — dùng cho cột ĐVT của KPI */
  donViTinh?: string | null;
  /** STT cột đầu tiên bắt đầu từ số này (để nối tiếp các section trên form/chi tiết). */
  sttOffset?: number;
  /** `full` = hai khối (mặc định); `bcnc` / `kpi` = chỉ một khối (dùng trong FormSection cha). */
  variant?: 'full' | 'bcnc' | 'kpi';
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return formatNumberVN(n);
}

function MetricTable({
  headers,
  rows,
}: {
  headers: { stt: string; chiSo: string; dvt: string; giaTri: string; ghiChu: string };
  rows: { stt: number; chiSo: string; dvt: string; giaTri: string; ghiChu: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[520px] text-sm text-left border-collapse">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="px-2 py-2 font-medium text-xs whitespace-nowrap w-10 text-center">{headers.stt}</th>
            <th className="px-2 py-2 font-medium text-xs min-w-[10rem]">{headers.chiSo}</th>
            <th className="px-2 py-2 font-medium text-xs whitespace-nowrap w-24">{headers.dvt}</th>
            <th className="px-2 py-2 font-medium text-xs whitespace-nowrap w-28 text-right">{headers.giaTri}</th>
            <th className="px-2 py-2 font-medium text-xs min-w-[12rem]">{headers.ghiChu}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.stt}-${r.chiSo}`} className="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td className="px-2 py-1.5 text-center text-xs text-muted-foreground tabular-nums">{r.stt}</td>
              <td className="px-2 py-1.5 text-xs text-foreground">{r.chiSo}</td>
              <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{r.dvt}</td>
              <td className="px-2 py-1.5 text-xs font-medium tabular-nums text-right">{r.giaTri}</td>
              <td className="px-2 py-1.5 text-xs text-muted-foreground leading-snug whitespace-pre-wrap">{r.ghiChu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BaoCaoSoCheBcncKpiReadout: React.FC<Props> = ({
  ngay,
  idChiNhanh,
  tongBuongSoChe,
  bcncList,
  donViTinh,
  sttOffset = 0,
  variant = 'full',
}) => {
  const { t } = useTranslation();
  const slipU = donViTinh?.trim() || t('baoCaoSoChe.readout.slipUnitFallback');

  const bcncSttBase = variant === 'bcnc' ? (sttOffset ?? 0) : 0;
  const kpiSttBase =
    variant === 'kpi' ? (sttOffset ?? 0) : variant === 'full' ? BCSC_KPI_STT_OFFSET : 0;

  const bcnc = useMemo(
    () => findBaoCaoNhanCongByBranchAndDate(bcncList, ngay, idChiNhanh),
    [bcncList, ngay, idChiNhanh]
  );
  const labor = useMemo(() => (bcnc ? extractLaborSnapshotFromBcnc(bcnc) : null), [bcnc]);

  const laborForBcncTable = useMemo(() => {
    if (!ngay || !idChiNhanh) return null;
    return labor ?? ZERO_LABOR_SNAPSHOT;
  }, [ngay, idChiNhanh, labor]);

  const bcncGhiChu = useMemo(() => extractBcncTableGhiChuRows(bcnc), [bcnc]);

  const kpis = useMemo(() => computeBaoCaoSoCheKpis(tongBuongSoChe, bcnc), [tongBuongSoChe, bcnc]);

  const th = useMemo(
    () => ({
      stt: t('baoCaoSoChe.store.colStt'),
      chiSo: t('baoCaoSoChe.readout.colChiSo'),
      dvt: t('baoCaoSoChe.readout.colDvt'),
      giaTri: t('baoCaoSoChe.readout.colGiaTri'),
      ghiChu: t('baoCaoSoChe.readout.colGhiChu'),
    }),
    [t]
  );

  const bcncRows = useMemo(() => {
    if (!laborForBcncTable) return [];
    const L = laborForBcncTable;
    const [g1, g2, g3, g4] = bcncGhiChu;
    const o = bcncSttBase;
    return [
      {
        stt: o + 1,
        chiSo: t('baoCaoSoChe.bcnc.tongCongNhanLamViec'),
        dvt: t('baoCaoSoChe.bcnc.dvt.tongCong'),
        giaTri: fmtNum(L.tongCongQuyDoiPhieu),
        ghiChu: g1,
      },
      {
        stt: o + 2,
        chiSo: t('baoCaoSoChe.bcnc.tongGio8'),
        dvt: t('baoCaoSoChe.bcnc.dvt.gio'),
        giaTri: fmtNum(L.tongGio8TiepTheoCong),
        ghiChu: g2,
      },
      {
        stt: o + 3,
        chiSo: t('baoCaoSoChe.bcnc.soCnDinhBien'),
        dvt: t('baoCaoSoChe.bcnc.dvt.tongCong'),
        giaTri: fmtNum(L.congQuyDoiDinhBien),
        ghiChu: g3,
      },
      {
        stt: o + 4,
        chiSo: t('baoCaoSoChe.bcnc.gioTcCnDinhBien'),
        dvt: t('baoCaoSoChe.bcnc.dvt.gio'),
        giaTri: fmtNum(L.gioTangCaTichDinhBien),
        ghiChu: g4,
      },
    ];
  }, [laborForBcncTable, bcncGhiChu, bcncSttBase, t]);

  const kpiRows = useMemo(
    () => {
      const o = kpiSttBase;
      return [
        {
          stt: o + 1,
          chiSo: t('baoCaoSoChe.kpi.nsThungCongNgay'),
          dvt: t('baoCaoSoChe.kpi.dvt.perCong', { dvt: slipU }),
          giaTri: fmtNum(kpis.nsThungCongNgay),
          ghiChu: '—',
        },
        {
          stt: o + 2,
          chiSo: t('baoCaoSoChe.kpi.nsThungGioCong'),
          dvt: t('baoCaoSoChe.kpi.dvt.perGio', { dvt: slipU }),
          giaTri: fmtNum(kpis.nsThungGioCong),
          ghiChu: '—',
        },
        {
          stt: o + 3,
          chiSo: t('baoCaoSoChe.kpi.nsBinhQuanNguoiGio'),
          dvt: t('baoCaoSoChe.kpi.dvt.perCongGio', { dvt: slipU }),
          giaTri: fmtNum(kpis.nsBinhQuanNguoiGio),
          ghiChu: '—',
        },
        {
          stt: o + 4,
          chiSo: t('baoCaoSoChe.kpi.soThungTp'),
          dvt: slipU,
          giaTri: fmtNum(kpis.thungThanhPham),
          ghiChu: '—',
        },
        {
          stt: o + 5,
          chiSo: t('baoCaoSoChe.kpi.tongLuong'),
          dvt: t('baoCaoSoChe.kpi.dvt.tongLuong'),
          giaTri: fmtNum(kpis.tongLuong),
          ghiChu: '—',
        },
        {
          stt: o + 6,
          chiSo: t('baoCaoSoChe.kpi.chiPhiNcPerKg'),
          dvt: t('baoCaoSoChe.kpi.dvt.chiPhiPerKg'),
          giaTri: fmtNum(kpis.chiPhiNhanCongPerKg),
          ghiChu: '—',
        },
      ];
    },
    [kpis, slipU, kpiSttBase, t]
  );

  const bcncBlock = (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      {variant === 'full' ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users size={16} className="text-cyan-600 shrink-0" />
          {t('baoCaoSoChe.bcnc.sectionTitle')}
        </div>
      ) : null}
      {!ngay || !idChiNhanh ? (
        <p className="text-xs text-muted-foreground">{t('baoCaoSoChe.bcnc.needNgayChiNhanh')}</p>
      ) : (
        <MetricTable headers={th} rows={bcncRows} />
      )}
    </div>
  );

  const kpiBlock = (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      {variant === 'full' ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calculator size={16} className="text-primary shrink-0" />
          {t('baoCaoSoChe.kpi.sectionTitle')}
        </div>
      ) : null}
      <MetricTable headers={th} rows={kpiRows} />
    </div>
  );

  if (variant === 'bcnc') return bcncBlock;
  if (variant === 'kpi') return kpiBlock;

  return (
    <div className="space-y-4">
      {bcncBlock}
      {kpiBlock}
    </div>
  );
};

export default BaoCaoSoCheBcncKpiReadout;
