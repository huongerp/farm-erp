import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode } from 'lucide-react';
import { getBankByBin } from '../../../../lib/vn-banks';

interface Props {
  bin?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  size?: number;
  className?: string;
}

const VietQRPreview: React.FC<Props> = ({
  bin,
  accountNumber,
  accountName,
  size = 220,
  className = '',
}) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const trimmedBin = (bin ?? '').trim();
  const trimmedAcc = (accountNumber ?? '').trim();
  const trimmedName = (accountName ?? '').trim();
  const isComplete = !!trimmedBin && !!trimmedAcc && !!trimmedName;

  const bank = useMemo(() => getBankByBin(trimmedBin), [trimmedBin]);

  const qrUrl = useMemo(() => {
    if (!isComplete) return '';
    const url = `https://img.vietqr.io/image/${encodeURIComponent(trimmedBin)}-${encodeURIComponent(trimmedAcc)}-compact2.png?accountName=${encodeURIComponent(trimmedName)}`;
    return url;
  }, [isComplete, trimmedBin, trimmedAcc, trimmedName]);

  React.useEffect(() => {
    setImgError(false);
  }, [qrUrl]);

  if (!isComplete) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground ${className}`}
      >
        <QrCode size={32} className="opacity-50" />
        <p>{t('doiTac.form.qrHint')}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 ${className}`}
    >
      <span className="text-xs font-medium text-muted-foreground">
        {t('doiTac.form.qrTitle')}
      </span>
      {imgError ? (
        <div
          className="flex items-center justify-center rounded border border-dashed border-rose-300 bg-rose-50 text-xs text-rose-600 p-3"
          style={{ width: size, height: size }}
        >
          {t('doiTac.form.qrLoadError')}
        </div>
      ) : (
        <img
          src={qrUrl}
          alt={`VietQR ${bank?.shortName ?? trimmedBin} ${trimmedAcc}`}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setImgError(true)}
          className="rounded border border-border bg-white"
        />
      )}
      <div className="text-center">
        <div className="text-sm font-medium text-foreground">
          {bank?.shortName ?? trimmedBin}
        </div>
        <div className="font-mono text-xs text-muted-foreground tracking-wider">
          {trimmedAcc}
        </div>
        <div className="text-xs text-muted-foreground uppercase">
          {trimmedName}
        </div>
      </div>
    </div>
  );
};

export default VietQRPreview;
