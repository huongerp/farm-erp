import React, { useRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface Props {
  /** Mã hiển thị (barcode + QR). Nếu rỗng sẽ không vẽ. */
  value: string | null | undefined;
  /** Kích thước ô QR (px). */
  qrSize?: number;
  /** Chiều cao thanh barcode (px). */
  barcodeHeight?: number;
  className?: string;
}

/**
 * Hiển thị Barcode (CODE128) + QR code từ một mã (vd: ma_barcode tài sản).
 */
const BarcodeQRDisplay: React.FC<Props> = ({
  value,
  qrSize = 120,
  barcodeHeight = 48,
  className = '',
}) => {
  const canvasBarcodeRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const code = (value ?? '').trim();

  useEffect(() => {
    if (!code) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(code, { width: qrSize, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [code, qrSize]);

  useEffect(() => {
    if (!code || !canvasBarcodeRef.current) return;
    try {
      JsBarcode(canvasBarcodeRef.current, code, {
        format: 'CODE128',
        height: barcodeHeight,
        displayValue: true,
        margin: 4,
        fontOptions: 'bold',
      });
    } catch {
      // invalid character etc.
    }
  }, [code, barcodeHeight]);

  if (!code) {
    return (
      <div className={`rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground ${className}`}>
        Chưa có mã Barcode
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 ${className}`}>
      <div className="flex w-full flex-wrap items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">Barcode (CODE128)</span>
          <canvas ref={canvasBarcodeRef} aria-label={`Barcode ${code}`} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">QR Code</span>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR ${code}`} width={qrSize} height={qrSize} className="rounded border border-border" />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              …
            </div>
          )}
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">{code}</p>
    </div>
  );
};

export default BarcodeQRDisplay;
