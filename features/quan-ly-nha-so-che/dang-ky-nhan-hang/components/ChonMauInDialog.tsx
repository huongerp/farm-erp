import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Eye, FileStack, Printer, Ticket } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import {
  HUONG_GIAY,
  KHO_GIAY,
  THAM_SO_IN_MAC_DINH,
  chuanHoaThamSoIn,
  taoUrlPreview,
  type HuongGiay,
  type KhoGiay,
  type LoaiIn,
} from '../core/mau-in';

const LUU_KHO_HUONG = 'dknh-in-kho-huong';

const LOAI: { id: LoaiIn; icon: React.ReactNode; tone: string }[] = [
  { id: 'dang-ky', icon: <Ticket size={18} />, tone: 'bg-primary/10 text-primary' },
  { id: 'kiem-hang', icon: <ClipboardCheck size={18} />, tone: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'tong-hop', icon: <FileStack size={18} />, tone: 'bg-violet-500/10 text-violet-600' },
];

/** Khổ / hướng lần trước — tiện cho người in phiếu cổng hằng ngày. */
function docKhoHuongDaLuu(): { kho: KhoGiay; huong: HuongGiay } {
  try {
    const v = JSON.parse(localStorage.getItem(LUU_KHO_HUONG) ?? 'null') as { kho?: string; huong?: string } | null;
    const p = chuanHoaThamSoIn({ loai: 'dang-ky', kho: v?.kho, huong: v?.huong });
    return { kho: p.kho, huong: p.huong };
  } catch {
    return { kho: THAM_SO_IN_MAC_DINH.kho, huong: THAM_SO_IN_MAC_DINH.huong };
  }
}

const NutGat = <T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
}) => (
  <div>
    <p className="text-xs font-medium mb-1.5">{label}</p>
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            'px-4 py-1.5 text-xs font-medium rounded-md transition',
            value === o ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  </div>
);

/** Popup chọn loại phiếu in (+ khổ / hướng cho phiếu đăng ký) rồi mở trang preview ở tab mới. */
const ChonMauInDialog: React.FC<{ idPhieu: string; onClose: () => void }> = ({ idPhieu, onClose }) => {
  const { t } = useTranslation();
  const [loai, setLoai] = useState<LoaiIn>('dang-ky');
  const [{ kho, huong }, setKhoHuong] = useState(docKhoHuongDaLuu);

  const xemTruoc = () => {
    if (loai === 'dang-ky') {
      try {
        localStorage.setItem(LUU_KHO_HUONG, JSON.stringify({ kho, huong }));
      } catch {
        /* không lưu được cũng không sao */
      }
    }
    window.open(taoUrlPreview(idPhieu, { loai, kho, huong }), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <GenericDrawer
      title={t('dangKyNhanHang.mauIn.title')}
      subtitle={t('dangKyNhanHang.mauIn.subtitle')}
      icon={<Printer className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={xemTruoc}>
            <Eye size={14} className="mr-1.5" />
            {t('dangKyNhanHang.mauIn.xemTruoc')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="space-y-2" role="radiogroup" aria-label={t('dangKyNhanHang.mauIn.title')}>
          {LOAI.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={loai === o.id}
              onClick={() => setLoai(o.id)}
              onDoubleClick={xemTruoc}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition',
                loai === o.id
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03]'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <span className={cn('h-10 w-10 shrink-0 rounded-full flex items-center justify-center', o.tone)}>
                {o.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t(`dangKyNhanHang.preview.title.${o.id}`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`dangKyNhanHang.mauIn.moTa.${o.id}`)}</span>
              </span>
            </button>
          ))}
        </div>

        {loai === 'dang-ky' ? (
          <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-muted/20 p-3">
            <NutGat
              label={t('dangKyNhanHang.preview.khoGiay')}
              options={KHO_GIAY}
              value={kho}
              onChange={(v) => setKhoHuong((s) => ({ ...s, kho: v }))}
              labelOf={(v) => v.toUpperCase()}
            />
            <NutGat
              label={t('dangKyNhanHang.preview.huong')}
              options={HUONG_GIAY}
              value={huong}
              onChange={(v) => setKhoHuong((s) => ({ ...s, huong: v }))}
              labelOf={(v) => t(`dangKyNhanHang.preview.huong_${v}`)}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('dangKyNhanHang.mauIn.a4Doc')}</p>
        )}
      </div>
    </GenericDrawer>
  );
};

export default ChonMauInDialog;
