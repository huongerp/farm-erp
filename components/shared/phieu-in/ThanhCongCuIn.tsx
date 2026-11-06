/**
 * Thanh công cụ trang in: Đóng · tiêu đề · zoom (vừa khung / 100% / ±) · «Trang x/y» + nhảy
 * trang · khoảng trang in · Cài đặt · Tải xuống · In. Không in (`print:hidden`).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, Maximize2, Minus, Plus, Printer, Settings2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface MucTaiThem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
}

interface Props {
  title: string;
  onDong: () => void;
  zoom: number;
  vuaKhung: boolean;
  onZoom: (z: number | 'vua') => void;
  trangHienTai: number;
  soTrang: number;
  onNhayTrang: (n: number) => void;
  khoangTrang: string;
  onKhoangTrang: (s: string) => void;
  loiKhoang: string | null;
  moCaiDat: boolean;
  onCaiDat: () => void;
  dinhDang: MucTaiThem[];
  dangTaiXuong: boolean;
  sanSang: boolean;
  onIn: () => void;
  toolbarExtra?: React.ReactNode;
}

const NUT = 'inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none';

export function ThanhCongCuIn(p: Props) {
  const { t } = useTranslation();
  const [moTai, setMoTai] = useState(false);
  /** Chuỗi đang gõ trong ô trang; null = không gõ → hiện trang đang xem. */
  const [oTrang, setOTrang] = useState<string | null>(null);
  const taiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moTai) return;
    const ngoai = (e: MouseEvent) => {
      if (taiRef.current && !taiRef.current.contains(e.target as Node)) setMoTai(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMoTai(false);
    document.addEventListener('mousedown', ngoai);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', ngoai);
      document.removeEventListener('keydown', esc);
    };
  }, [moTai]);

  const nhay = () => {
    const n = Math.round(Number(oTrang));
    if (oTrang && Number.isFinite(n) && n >= 1 && n <= p.soTrang) p.onNhayTrang(n);
    setOTrang(null);
  };

  return (
    <div className="phieu-in-toolbar flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-card border-b border-border shadow-sm shrink-0 print:hidden">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={p.onDong}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
        <span className="hidden md:inline text-sm font-semibold truncate">{p.title}</span>
      </div>

      {/* Zoom */}
      <div className="hidden sm:flex items-center gap-1">
        <button type="button" className={NUT} onClick={() => p.onZoom(p.zoom - 0.1)} aria-label={t('common.phieuIn.thuNho')} title={t('common.phieuIn.thuNho')}>
          <Minus size={14} />
        </button>
        <button
          type="button"
          className={cn(NUT, 'min-w-[3.5rem] tabular-nums')}
          onClick={() => p.onZoom(p.vuaKhung ? 1 : 'vua')}
          title={p.vuaKhung ? t('common.phieuIn.zoom100') : t('common.phieuIn.vuaKhung')}
        >
          {Math.round(p.zoom * 100)}%
        </button>
        <button type="button" className={NUT} onClick={() => p.onZoom(p.zoom + 0.1)} aria-label={t('common.phieuIn.phongTo')} title={t('common.phieuIn.phongTo')}>
          <Plus size={14} />
        </button>
        <button
          type="button"
          className={cn(NUT, p.vuaKhung && 'bg-muted')}
          onClick={() => p.onZoom('vua')}
          aria-pressed={p.vuaKhung}
          aria-label={t('common.phieuIn.vuaKhung')}
          title={t('common.phieuIn.vuaKhung')}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Trang x/y */}
      <div className="flex items-center gap-1 text-sm">
        <span className="hidden sm:inline text-muted-foreground">{t('common.phieuIn.trang')}</span>
        <input
          value={oTrang ?? String(p.trangHienTai)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setOTrang(e.target.value.replace(/\D/g, ''))}
          onBlur={nhay}
          onKeyDown={(e) => e.key === 'Enter' && nhay()}
          inputMode="numeric"
          aria-label={t('common.phieuIn.nhayTrang')}
          className="h-9 w-10 rounded-lg border border-border bg-card text-center tabular-nums"
        />
        <span className="tabular-nums text-muted-foreground">/ {p.soTrang}</span>
      </div>

      {/* Khoảng trang */}
      <div className="flex items-center gap-1">
        <input
          value={p.khoangTrang}
          onChange={(e) => p.onKhoangTrang(e.target.value)}
          placeholder={t('common.phieuIn.khoangTrangGoiY')}
          aria-label={t('common.phieuIn.khoangTrang')}
          aria-invalid={!!p.loiKhoang}
          title={p.loiKhoang ?? t('common.phieuIn.khoangTrang')}
          className={cn(
            'h-9 w-28 rounded-lg border bg-card px-2 text-sm',
            p.loiKhoang ? 'border-destructive text-destructive' : 'border-border'
          )}
        />
      </div>

      {p.toolbarExtra}

      <button type="button" onClick={p.onCaiDat} aria-pressed={p.moCaiDat} className={cn(NUT, p.moCaiDat && 'bg-muted')}>
        <Settings2 size={16} />
        <span className="hidden lg:inline">{t('common.phieuIn.caiDat')}</span>
      </button>

      {p.dinhDang.length > 0 && (
        <div className="relative" ref={taiRef}>
          <button type="button" onClick={() => setMoTai((o) => !o)} disabled={p.dangTaiXuong || !p.sanSang} className={NUT}>
            <Download size={16} />
            <span className="hidden lg:inline">{t('common.phieuIn.taiXuong')}</span>
            <ChevronDown size={14} className={cn('transition-transform', moTai && 'rotate-180')} />
          </button>
          {moTai && (
            <div className="absolute right-0 top-full mt-1 min-w-[120px] py-1 bg-card rounded-xl border border-border shadow-xl z-[100]">
              {p.dinhDang.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setMoTai(false);
                    void opt.onClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={p.onIn}
        disabled={!p.sanSang}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none"
      >
        <Printer size={16} />
        {t('common.phieuIn.in')}
      </button>
    </div>
  );
}
