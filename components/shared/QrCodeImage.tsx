import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../lib/utils';

/** Tạo QR dạng data URL (PNG). `margin` = số ô trắng quanh mã. */
export function taoQrDataUrl(value: string, size = 256, margin = 1): Promise<string> {
  return QRCode.toDataURL(value, { width: size, margin, errorCorrectionLevel: 'M' });
}

interface Props {
  value: string;
  /** Cạnh ảnh (px). */
  size?: number;
  className?: string;
}

/** Ảnh QR của một chuỗi (vd mã hàng hoá) — dùng chung, không phụ thuộc feature nào. */
const QrCodeImage: React.FC<Props> = ({ value, size = 160, className }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!value) return;
    taoQrDataUrl(value, size * 2)
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className={cn('bg-white rounded-lg border border-border p-1.5 inline-flex', className)}
      style={{ width: size + 12, height: size + 12 }}
    >
      {src ? <img src={src} alt={value} width={size} height={size} /> : null}
    </div>
  );
};

export default QrCodeImage;
