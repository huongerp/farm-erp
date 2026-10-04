import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImagePlus, Printer, RotateCcw, X } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { cn } from '../../../../../lib/utils';
import {
  CAI_DAT_TEM_MAC_DINH,
  KHO_TEM_GOI_Y,
  LOGO_MAX_BYTES,
  chuanHoaCaiDatTem,
  docCaiDatTem,
  ghiCaiDatTem,
  type CaiDatTem,
  type TruongTem,
} from '../../core/mau-tem';
import { TEM_MAU, dungHtmlTem, inTemGscl } from '../../utils/in-tem-gscl';

const TRUONG: (keyof TruongTem)[] = ['soPhieu', 'thung', 'ngay', 'farm', 'thanhPham', 'cayHang', 'nhan'];

/** px / mm ở 96dpi — khung xem trước vẽ đúng tỉ lệ tem rồi phóng to cho dễ nhìn. */
const PX_MM = 96 / 25.4;
const KHUNG_PX = 300;

/** Ô số: gõ tự do, chỉ áp dụng (và kẹp giới hạn) khi rời ô / Enter — tránh 6 → 20 khi đang gõ 60. */
const SoInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (n: number) => void;
}> = ({ label, value, min, max, step, onCommit }) => {
  const [nhap, setNhap] = useState(String(value));
  const [goc, setGoc] = useState(value);
  if (goc !== value) {
    // Giá trị đổi từ ngoài (chọn khổ gợi ý, về mặc định) → hiện giá trị mới.
    setGoc(value);
    setNhap(String(value));
  }
  const chot = () => {
    const n = Number(nhap.replace(',', '.'));
    if (nhap.trim() === '' || !Number.isFinite(n)) {
      setNhap(String(value));
      return;
    }
    const kep = Math.min(max, Math.max(min, n));
    setNhap(String(kep));
    onCommit(kep);
  };
  return (
    <Input
      label={label}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={nhap}
      onChange={(e) => setNhap(e.target.value)}
      onBlur={chot}
      onKeyDown={(e) => e.key === 'Enter' && chot()}
    />
  );
};

/** Tab "Mẫu tem": lưu NGAY trên máy này (localStorage) mỗi lần đổi. */
const MauTemTab: React.FC = () => {
  const { t } = useTranslation();
  const [c, setC] = useState<CaiDatTem>(() => docCaiDatTem());
  const [html, setHtml] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const doi = (patch: Partial<CaiDatTem>) =>
    setC((cur) => {
      const next = chuanHoaCaiDatTem({ ...cur, ...patch });
      if (!ghiCaiDatTem(next)) toast.error(t('giamSatChatLuong.caiDat.khongLuuDuoc'));
      return next;
    });

  useEffect(() => {
    let huy = false;
    // Xem trước luôn ở chế độ cuộn — một tem đúng khổ.
    dungHtmlTem([TEM_MAU], { ...c, cheDo: 'cuon' })
      .then((h) => !huy && setHtml(h))
      .catch(() => !huy && setHtml(''));
    return () => {
      huy = true;
    };
  }, [c]);

  const chonLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(t('giamSatChatLuong.caiDat.logoQuaLon', { kb: Math.round(LOGO_MAX_BYTES / 1024) }));
      return;
    }
    const r = new FileReader();
    r.onload = () => typeof r.result === 'string' && doi({ logo: r.result });
    r.readAsDataURL(file);
  };

  const rongPx = c.rong * PX_MM;
  const caoPx = c.cao * PX_MM;
  const tiLe = Math.min(KHUNG_PX / rongPx, 220 / caoPx, 3);

  const nhom = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
  const chip = (active: boolean) =>
    cn(
      'px-2.5 py-1 rounded-lg border text-xs font-medium tabular-nums',
      active ? 'bg-primary text-white border-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5">
      <div className="space-y-4 min-w-0">
        <div className="space-y-2">
          <div className={nhom}>{t('giamSatChatLuong.caiDat.khoTem')}</div>
          <div className="flex flex-wrap gap-1.5">
            {KHO_TEM_GOI_Y.map(([w, h]) => (
              <button key={`${w}x${h}`} type="button" className={chip(c.rong === w && c.cao === h)} onClick={() => doi({ rong: w, cao: h })}>
                {w}×{h}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SoInput label={t('giamSatChatLuong.caiDat.rong')} min={20} max={150} value={c.rong} onCommit={(n) => doi({ rong: n })} />
            <SoInput label={t('giamSatChatLuong.caiDat.cao')} min={15} max={150} value={c.cao} onCommit={(n) => doi({ cao: n })} />
          </div>
        </div>

        <div className="space-y-2">
          <div className={nhom}>{t('giamSatChatLuong.caiDat.cheDo')}</div>
          <div className="flex flex-wrap gap-1.5">
            {(['cuon', 'a4'] as const).map((m) => (
              <button key={m} type="button" className={chip(c.cheDo === m)} onClick={() => doi({ cheDo: m })}>
                {t(`giamSatChatLuong.caiDat.cheDo_${m}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground m-0">{t(`giamSatChatLuong.caiDat.cheDoHint_${c.cheDo}`)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SoInput label={t('giamSatChatLuong.caiDat.le')} step={0.5} min={0} max={10} value={c.le} onCommit={(n) => doi({ le: n })} />
          <SoInput label={t('giamSatChatLuong.caiDat.coQr')} step={5} min={50} max={100} value={c.tiLeQr} onCommit={(n) => doi({ tiLeQr: n })} />
          <SoInput label={t('giamSatChatLuong.caiDat.coChu')} step={0.5} min={5} max={20} value={c.coChu} onCommit={(n) => doi({ coChu: n })} />
        </div>

        <div className="space-y-2">
          <div className={nhom}>{t('giamSatChatLuong.caiDat.truongHien')}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {TRUONG.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={c.truong[k]}
                  onChange={(e) => doi({ truong: { ...c.truong, [k]: e.target.checked } })}
                />
                {t(`giamSatChatLuong.caiDat.truong_${k}`)}
              </label>
            ))}
          </div>
        </div>

        {c.truong.nhan && (
          <div className="flex items-end gap-2">
            <div className="w-28">
              <Input
                label={t('giamSatChatLuong.caiDat.nhan')}
                value={c.nhan}
                maxLength={12}
                onChange={(e) => doi({ nhan: e.target.value })}
                disabled={!!c.logo}
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                chonLogo(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {c.logo ? (
              <div className="flex items-center gap-2">
                <img src={c.logo} alt="" className="h-9 w-auto max-w-[80px] object-contain rounded border border-border bg-white p-0.5" />
                <Button type="button" variant="outline" size="sm" onClick={() => doi({ logo: null })}>
                  <X size={14} className="mr-1" />
                  {t('giamSatChatLuong.caiDat.boLogo')}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={14} className="mr-1.5" />
                {t('giamSatChatLuong.caiDat.taiLogo')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 md:w-[320px]">
        <div className={nhom}>{t('giamSatChatLuong.caiDat.xemTruoc')}</div>
        <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-center min-h-[160px]">
          <div style={{ width: rongPx * tiLe, height: caoPx * tiLe }} className="shadow-md bg-white overflow-hidden">
            <iframe
              title={t('giamSatChatLuong.caiDat.xemTruoc')}
              srcDoc={html}
              style={{ width: rongPx, height: caoPx, transform: `scale(${tiLe})`, transformOrigin: '0 0', border: 0 }}
              className="pointer-events-none bg-white"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground m-0">
          {t('giamSatChatLuong.caiDat.xemTruocHint', { rong: c.rong, cao: c.cao })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void inTemGscl([TEM_MAU], c)}>
            <Printer size={14} className="mr-1.5" />
            {t('giamSatChatLuong.caiDat.inThu')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => doi(CAI_DAT_TEM_MAC_DINH)}>
            <RotateCcw size={14} className="mr-1.5" />
            {t('giamSatChatLuong.caiDat.macDinh')}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground m-0">{t('giamSatChatLuong.caiDat.luuTrenMay')}</p>
      </div>
    </div>
  );
};

export default MauTemTab;
