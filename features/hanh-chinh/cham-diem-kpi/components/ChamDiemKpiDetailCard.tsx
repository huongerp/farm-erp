import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Scale, CheckCircle2, XCircle } from 'lucide-react';
import type { ChamDiemKpiRecord } from '../core/types';
import { getDanhGiaKpiLabel, getKpiLoaiLabel, NGUONG_DAT_KPI } from '../core/constants';

interface Props {
  record: ChamDiemKpiRecord;
  onClose?: () => void;
}

const ChamDiemKpiDetailCard: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const periodStr = `${record.nam}-${String(record.thang).padStart(2, '0')}`;
  const isDat = record.danh_gia === 'dat';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">
            {record.ten_nhan_vien || record.ma_nhan_vien || record.id_nhan_vien}
          </h3>
          <p className="text-sm text-muted-foreground">
            {record.ten_phong_ban} · {record.ten_chuc_vu} · {periodStr}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            isDat
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isDat ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {getDanhGiaKpiLabel(record.danh_gia, t)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t('chamDiemKpi.diemKpi')}</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {record.diem_kpi.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t('chamDiemKpi.diemCongTru')}</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {record.diem_cong_tru_net >= 0 ? '+' : ''}{record.diem_cong_tru_net}
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
          <p className="text-xs text-primary font-medium">{t('chamDiemKpi.tongKpi')}</p>
          <p className="text-lg font-bold text-primary tabular-nums">
            {record.tong_kpi.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t('chamDiemKpi.nguongDat', { point: NGUONG_DAT_KPI })}</p>
          <p className="text-sm font-medium text-foreground">≥ {NGUONG_DAT_KPI}</p>
        </div>
      </div>

      {record.chi_tiet && record.chi_tiet.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Target size={14} />
            {t('chamDiemKpi.kpiSection')}
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left p-2 font-medium">{t('chamDiemKpi.chiSo')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.tyTrong')}</th>
                  <th className="text-left p-2 font-medium w-20">{t('chamDiemKpi.loai')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.mucTieu')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.thucDat')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.tyLe')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.diem')}</th>
                </tr>
              </thead>
              <tbody>
                {record.chi_tiet.map((ct) => (
                  <tr key={ct.id} className="border-b border-border/50">
                    <td className="p-2">{ct.ten_chi_so || ct.id_chi_so}</td>
                    <td className="p-2 text-right tabular-nums">{ct.ty_trong}%</td>
                    <td className="p-2">{ct.loai ? getKpiLoaiLabel(ct.loai, t) : '—'}</td>
                    <td className="p-2 text-right tabular-nums">{ct.muc_tieu ?? '—'}</td>
                    <td className="p-2 text-right tabular-nums">{ct.thuc_dat ?? '—'}</td>
                    <td className="p-2 text-right tabular-nums">{ct.ty_le != null ? `${ct.ty_le}%` : '—'}</td>
                    <td className="p-2 text-right font-medium tabular-nums">{ct.diem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {record.diem_cong_tru_list && record.diem_cong_tru_list.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Scale size={14} />
            {t('chamDiemKpi.diemCongTruSection')}
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left p-2 font-medium">{t('chamDiemKpi.hangMuc')}</th>
                  <th className="text-left p-2 font-medium w-24">{t('chamDiemKpi.loai')}</th>
                  <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.diem')}</th>
                </tr>
              </thead>
              <tbody>
                {record.diem_cong_tru_list.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="p-2">{d.ten_hang_muc || d.ma_hang_muc || '—'}</td>
                    <td className="p-2">
                      <span
                        className={
                          d.loai === 'cong'
                            ? 'text-emerald-600 font-medium'
                            : 'text-rose-600 font-medium'
                        }
                      >
                        {d.loai === 'cong' ? t('chamDiemKpi.cong') : t('chamDiemKpi.tru')}
                      </span>
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {d.loai === 'cong' ? '+' : '-'}{d.diem}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChamDiemKpiDetailCard;
