/**
 * Bảng cài đặt in — cạnh phải trên desktop, sheet đáy trên điện thoại. Khổ (A5/A4/A3), hướng,
 * lề từng cạnh (khoá «lề đều»), cỡ chữ, phông, số liên, đầu/chân trang, logo / ô ký / QR,
 * ẩn cột từng bảng. Lưu trên máy theo mẫu (chỉ phần khác mặc định).
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Link2Off, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  CANH_LE,
  FONT_IN,
  HUONG_GIAY_IN,
  KHO_GIAY_IN,
  LE_MAX_MM,
  LE_MIN_MM,
  SO_LIEN_MAX,
  TI_LE_CHU_MAX,
  TI_LE_CHU_MIN,
  coChuHienThi,
  doiCoChu,
  laLeDeu,
  type CaiDatIn,
  type DauChanTrang,
  type FontIn,
  type LeTrang,
} from '../../../lib/phieu-in/cai-dat-in';
import type { ThongTinBang } from '../../../lib/phieu-in/luoi-bang';
import { NutGatNho } from './NutGatNho';

interface Props {
  caiDat: CaiDatIn;
  coChuGocPt: number;
  doi: (sua: (c: CaiDatIn) => CaiDatIn) => void;
  khoiPhuc: () => void;
  coThayDoi: boolean;
  bang: ThongTinBang[];
  /** Trang có đường dẫn bản gốc → cho bật QR. */
  coQr: boolean;
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
    className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
  >
    {children}
  </button>
);

const BuocSo: React.FC<{
  giaTri: string;
  onGiam: () => void;
  onTang: () => void;
  giamTat?: boolean;
  tangTat?: boolean;
  nhanGiam: string;
  nhanTang: string;
}> = ({ giaTri, onGiam, onTang, giamTat, tangTat, nhanGiam, nhanTang }) => (
  <div className="flex items-center gap-1">
    <NutBuoc label={nhanGiam} disabled={giamTat} onClick={onGiam}>
      <Minus size={14} />
    </NutBuoc>
    <span className="flex-1 min-w-[3rem] text-center text-sm tabular-nums">{giaTri}</span>
    <NutBuoc label={nhanTang} disabled={tangTat} onClick={onTang}>
      <Plus size={14} />
    </NutBuoc>
  </div>
);

const HopKiem: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  label,
  checked,
  onChange,
  disabled,
}) => (
  <label className={cn('flex items-center gap-2 text-sm cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
    <input
      type="checkbox"
      className="h-4 w-4 accent-[var(--color-primary)]"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="min-w-0 truncate">{label}</span>
  </label>
);

const BangCaiDatIn: React.FC<Props> = ({ caiDat, coChuGocPt, doi, khoiPhuc, coThayDoi, bang, coQr, onDong }) => {
  const { t } = useTranslation();
  const [khoaLe, setKhoaLe] = useState(() => laLeDeu(caiDat.le));
  const pt = coChuHienThi(coChuGocPt, caiDat.tiLeChu);
  const dat = (patch: Partial<CaiDatIn>) => doi((c) => ({ ...c, ...patch }));
  const datDauChan = (patch: Partial<DauChanTrang>) => doi((c) => ({ ...c, dauChan: { ...c.dauChan, ...patch } }));
  const doiLe = (canh: keyof LeTrang, buoc: number) =>
    doi((c) => {
      const v = Math.min(LE_MAX_MM, Math.max(LE_MIN_MM, c.le[canh] + buoc));
      return { ...c, le: khoaLe ? { tren: v, phai: v, duoi: v, trai: v } : { ...c.le, [canh]: v } };
    });
  const anCot = (b: string, k: number, an: boolean) =>
    doi((c) => {
      const ds = new Set(c.anCot[b] ?? []);
      if (an) ds.add(k);
      else ds.delete(k);
      const anCot = { ...c.anCot, [b]: [...ds].sort((x, y) => x - y) };
      if (anCot[b].length === 0) delete anCot[b];
      return { ...c, anCot };
    });
  const bangAnDuoc = bang.filter((b) => b.choAnCot);
  const coCotDaChinh = Object.keys(caiDat.cot).length > 0 || Object.keys(caiDat.anCot).length > 0;

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
            <NutGatNho className="w-full" options={KHO_GIAY_IN} value={caiDat.kho} onChange={(kho) => dat({ kho })} labelOf={(v) => v.toUpperCase()} />
          </Muc>
          <Muc label={t('common.phieuIn.huong')}>
            <NutGatNho
              className="w-full"
              options={HUONG_GIAY_IN}
              value={caiDat.huong}
              onChange={(huong) => dat({ huong })}
              labelOf={(v) => t(`common.phieuIn.huong_${v}`)}
            />
          </Muc>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">{t('common.phieuIn.le')}</p>
              <button
                type="button"
                onClick={() => setKhoaLe((k) => !k)}
                aria-pressed={khoaLe}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs',
                  khoaLe ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {khoaLe ? <Link2 size={12} /> : <Link2Off size={12} />}
                {t('common.phieuIn.leDeu')}
              </button>
            </div>
            {khoaLe ? (
              <BuocSo
                giaTri={`${caiDat.le.tren} mm`}
                onGiam={() => doiLe('tren', -1)}
                onTang={() => doiLe('tren', 1)}
                giamTat={caiDat.le.tren <= LE_MIN_MM}
                tangTat={caiDat.le.tren >= LE_MAX_MM}
                nhanGiam={t('common.phieuIn.giamLe')}
                nhanTang={t('common.phieuIn.tangLe')}
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {CANH_LE.map((canh) => (
                  <div key={canh}>
                    <p className="text-[11px] text-muted-foreground mb-0.5">{t(`common.phieuIn.le_${canh}`)}</p>
                    <BuocSo
                      giaTri={`${caiDat.le[canh]}`}
                      onGiam={() => doiLe(canh, -1)}
                      onTang={() => doiLe(canh, 1)}
                      giamTat={caiDat.le[canh] <= LE_MIN_MM}
                      tangTat={caiDat.le[canh] >= LE_MAX_MM}
                      nhanGiam={`${t('common.phieuIn.giamLe')} ${t(`common.phieuIn.le_${canh}`)}`}
                      nhanTang={`${t('common.phieuIn.tangLe')} ${t(`common.phieuIn.le_${canh}`)}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Muc label={t('common.phieuIn.coChu')}>
              <BuocSo
                giaTri={`${pt} pt`}
                onGiam={() => dat({ tiLeChu: doiCoChu(coChuGocPt, caiDat.tiLeChu, -1) })}
                onTang={() => dat({ tiLeChu: doiCoChu(coChuGocPt, caiDat.tiLeChu, 1) })}
                giamTat={caiDat.tiLeChu <= TI_LE_CHU_MIN}
                tangTat={caiDat.tiLeChu >= TI_LE_CHU_MAX}
                nhanGiam={t('common.phieuIn.giamCoChu')}
                nhanTang={t('common.phieuIn.tangCoChu')}
              />
            </Muc>
            <Muc label={t('common.phieuIn.soLien')}>
              <BuocSo
                giaTri={String(caiDat.soLien)}
                onGiam={() => dat({ soLien: caiDat.soLien - 1 })}
                onTang={() => dat({ soLien: caiDat.soLien + 1 })}
                giamTat={caiDat.soLien <= 1}
                tangTat={caiDat.soLien >= SO_LIEN_MAX}
                nhanGiam={t('common.phieuIn.giamLien')}
                nhanTang={t('common.phieuIn.tangLien')}
              />
            </Muc>
          </div>

          <Muc label={t('common.phieuIn.font')}>
            <select
              value={caiDat.font}
              onChange={(e) => dat({ font: e.target.value as FontIn })}
              className="w-full h-9 rounded-lg border border-border bg-card px-2 text-sm"
            >
              {FONT_IN.map((f) => (
                <option key={f} value={f}>
                  {t(`common.phieuIn.font_${f}`)}
                </option>
              ))}
            </select>
          </Muc>

          <Muc label={t('common.phieuIn.dauChanTrang')}>
            <div className="space-y-1.5">
              <HopKiem label={t('common.phieuIn.hienSoTrang')} checked={caiDat.dauChan.soTrang} onChange={(v) => datDauChan({ soTrang: v })} />
              <HopKiem label={t('common.phieuIn.hienGioIn')} checked={caiDat.dauChan.gioIn} onChange={(v) => datDauChan({ gioIn: v })} />
              <HopKiem label={t('common.phieuIn.hienNguoiIn')} checked={caiDat.dauChan.nguoiIn} onChange={(v) => datDauChan({ nguoiIn: v })} />
              <HopKiem
                label={t('common.phieuIn.lapTieuDeBang')}
                checked={caiDat.dauChan.lapTieuDeBang}
                onChange={(v) => datDauChan({ lapTieuDeBang: v })}
              />
              <HopKiem label={t('common.phieuIn.hienLogo')} checked={caiDat.hienLogo} onChange={(v) => dat({ hienLogo: v })} />
              <HopKiem label={t('common.phieuIn.hienChuKy')} checked={caiDat.hienChuKy} onChange={(v) => dat({ hienChuKy: v })} />
              <HopKiem label={t('common.phieuIn.hienQr')} checked={coQr && caiDat.qr} disabled={!coQr} onChange={(v) => dat({ qr: v })} />
            </div>
          </Muc>

          <Muc label={t('common.phieuIn.cot')}>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('common.phieuIn.cotHint')}</p>
            {bangAnDuoc.map((b) => (
              <div key={b.chiSo} className="rounded-lg border border-border p-2 space-y-1">
                {bangAnDuoc.length > 1 && (
                  <p className="text-[11px] font-medium text-muted-foreground">{t('common.phieuIn.bangSo', { so: b.chiSo + 1 })}</p>
                )}
                {b.tieuDe.map((ten, k) => {
                  const an = (caiDat.anCot[String(b.chiSo)] ?? []).includes(k);
                  const conHien = b.soCot - (caiDat.anCot[String(b.chiSo)]?.length ?? 0);
                  return (
                    <HopKiem
                      key={k}
                      label={ten || t('common.phieuIn.cotSo', { so: k + 1 })}
                      checked={!an}
                      // Giữ tối thiểu 1 cột hiện.
                      disabled={!an && conHien <= 1}
                      onChange={(hien) => anCot(String(b.chiSo), k, !hien)}
                    />
                  );
                })}
              </div>
            ))}
            <button
              type="button"
              onClick={() => doi((c) => ({ ...c, cot: {}, anCot: {} }))}
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
            onClick={() => {
              khoiPhuc();
              setKhoaLe(true);
            }}
            disabled={!coThayDoi}
            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
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
