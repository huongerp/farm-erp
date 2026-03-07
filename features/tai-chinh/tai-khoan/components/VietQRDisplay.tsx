import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { genVietQRBase64 } from '../utils/vietqr';

interface Props {
  ma_ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  amount?: number;
  memo?: string;
  size?: number;
  className?: string;
}

/**
 * Hiển thị mã VietQR (chuẩn NAPAS) – sinh local, không cần cấu hình API.
 */
const VietQRDisplay: React.FC<Props> = ({
  ma_ngan_hang,
  so_tai_khoan,
  chu_tai_khoan,
  amount,
  memo,
  size = 200,
  className,
}) => {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const hasRequired = !!(ma_ngan_hang?.trim() && so_tai_khoan?.trim());

  useEffect(() => {
    if (!hasRequired) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    genVietQRBase64({
      ma_ngan_hang,
      so_tai_khoan,
      chu_tai_khoan,
      amount,
      memo,
    })
      .then((dataUrl) => {
        setSrc(dataUrl);
        setError(!dataUrl);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [hasRequired, ma_ngan_hang, so_tai_khoan, chu_tai_khoan, amount, memo]);

  if (!hasRequired) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('taiKhoan.detail.vietQRMissingData')}
      </p>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">{t('taiKhoan.loading')}</span>
      </div>
    );
  }

  if (error || !src) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('taiKhoan.detail.vietQRError')}
      </p>
    );
  }

  return (
    <img
      src={src}
      alt="VietQR"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default VietQRDisplay;
