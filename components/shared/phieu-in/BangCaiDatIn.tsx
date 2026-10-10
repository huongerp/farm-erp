/** Bảng cài đặt in (khổ, hướng, lề, phông, cỡ chữ, cột) — cạnh phải trên desktop, sheet đáy trên điện thoại. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  FONT_IN,
  HUONG_GIAY_IN,
  KHO_GIAY_IN,
  LE_MAX_MM,
  LE_MIN_MM,
  TI_LE_CHU_MAX,
  TI_LE_CHU_MIN,
  coChuHienThi,
  doiCoChu,
  type CaiDatIn,
  type FontIn,
} from '../../../lib/phieu-in/cai-dat-in';
import { NutGatNho } from './NutGatNho';

interface Props {
  caiDat: CaiDatIn;
  coChuGocPt: number;
  coCotDaChinh: boolean;
  onDoi: (patch: Partial<Omit<CaiDatIn, 'cot'>>) => void;
  onDatLaiCot: () => void;
  onKhoiPhuc: () => void;
  onDong: () => void;
}

const Muc: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    {children}
  </div>
);

const NutBuoc: React.FC<{ label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }> = ({
  label,
  disabled,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
  >
    {children}
  </button>
);

const BangCaiDatIn: React.FC<Props> = ({ caiDat, coChuGocPt, coCotDaChinh, onDoi, onDatLaiCot, onKhoiPhuc, onDong }) => {
  const { t } = useTranslation();
  const pt = coChuHienThi(coChuGocPt, caiDat.tiLeChu);
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/30 md:hidden print:hidden" onClick={onDong} aria-hidden />
      <aside
        className={cn(
          'phieu-in-cai-dat print:hidden z-[81] bg-card flex flex-col',
          'fixed inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl shadow-2xl',
          'md:static md:inset-auto md:max-h-none md:rounded-none md:shadow-none md:w-72 md:shrink-0 md:border-l md:border-border'
        )}
        aria-label={t('common.phieuIn.caiDat')}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{t('common.phieuIn.caiDat')}</h2>
          <button
            type="button"
            onClick={onDong}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.phieuIn.dongCaiDat')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Muc label={t('common.phieuIn.khoGiay')}>
            <NutGatNho
              className="w-full"
              options={KHO_GIAY_IN}
              value={caiDat.kho}
              onChange={(kho) => onDoi({ kho })}
              labelOf={(v) => v.toUpperCase()}
            />
          </Muc>
          <Muc label={t('common.phieuIn.huong')}>
            <NutGatNho
              className="w-full"
              options={HUONG_GIAY_IN}
              value={caiDat.huong}
              onChange={(huong) => onDoi({ huong })}
              labelOf={(v) => t(`common.phieuIn.huong_${v}`)}
            />
          </Muc>
          <div className="grid grid-cols-2 gap-3">
            <Muc label={t('common.phieuIn.le')}>
              <div className="flex items-center gap-1.5">
                <NutBuoc
                  label={t('common.phieuIn.giamLe')}
                  disabled={caiDat.leMm <= LE_MIN_MM}
                  onClick={() => onDoi({ leMm: caiDat.leMm - 1 })}
                >
                  <Minus size={14} />
                </NutBuoc>
                <span className="min-w-[3.25rem] text-center text-sm tabular-nums">{caiDat.leMm} mm</span>
                <NutBuoc
                  label={t('common.phieuIn.tangLe')}
                  disabled={caiDat.leMm >= LE_MAX_MM}
                  onClick={() => onDoi({ leMm: caiDat.leMm + 1 })}
                >
                  <Plus size={14} />
                </NutBuoc>
              </div>
            </Muc>
            <Muc label={t('common.phieuIn.coChu')}>
              <div className="flex items-center gap-1.5">
                <NutBuoc
                  label={t('common.phieuIn.giamCoChu')}
                  disabled={caiDat.tiLeChu <= TI_LE_CHU_MIN}
                  onClick={() => onDoi({ tiLeChu: doiCoChu(coChuGocPt, caiDat.tiLeChu, -1) })}
                >
                  <Minus size={14} />
                </NutBuoc>
                <span className="min-w-[3.25rem] text-center text-sm tabular-nums">{pt} pt</span>
                <NutBuoc
                  label={t('common.phieuIn.tangCoChu')}
                  disabled={caiDat.tiLeChu >= TI_LE_CHU_MAX}
                  onClick={() => onDoi({ tiLeChu: doiCoChu(coChuGocPt, caiDat.tiLeChu, 1) })}
                >
                  <Plus size={14} />
                </NutBuoc>
              </div>
            </Muc>
          </div>
          <Muc label={t('common.phieuIn.font')}>
            <select
              value={caiDat.font}
              onChange={(e) => onDoi({ font: e.target.value as FontIn })}
              className="w-full h-9 rounded-lg border border-border bg-card px-2 text-sm"
            >
              {FONT_IN.map((f) => (
                <option key={f} value={f}>
                  {t(`common.phieuIn.font_${f}`)}
                </option>
              ))}
            </select>
          </Muc>
          <Muc label={t('common.phieuIn.cot')}>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('common.phieuIn.cotHint')}</p>
            <button
              type="button"
              onClick={onDatLaiCot}
              disabled={!coCotDaChinh}
              className="w-full h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
            >
              {t('common.phieuIn.datLaiCot')}
            </button>
          </Muc>
        </div>
        <div className="p-4 border-t border-border space-y-2">
          <button
            type="button"
            onClick={onKhoiPhuc}
            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/60"
          >
            <RotateCcw size={14} />
            {t('common.phieuIn.khoiPhuc')}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">{t('common.phieuIn.nhoTheoMau')}</p>
        </div>
      </aside>
    </>
  );
};

export default BangCaiDatIn;
