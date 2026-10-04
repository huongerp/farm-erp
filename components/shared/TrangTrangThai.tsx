import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileQuestion, Home, ShieldX } from 'lucide-react';
import Button from '../ui/Button';

interface TrangTrangThaiProps {
  /** 404: đường dẫn không tồn tại · 403: không có quyền xem module. */
  loai: '404' | '403';
  /** Trang để quay về khi không có lịch sử (mở link trực tiếp). Mặc định trang chủ. */
  veTrang?: string;
}

/**
 * Trang báo lỗi điều hướng: giải thích chuyện gì xảy ra và cho hai lối ra (Quay lại / Trang chủ),
 * thay cho việc âm thầm đẩy về trang chủ hay chỉ hiện một dòng chữ.
 */
const TrangTrangThai: React.FC<TrangTrangThaiProps> = ({ loai, veTrang = '/' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = loai === '404' ? FileQuestion : ShieldX;

  const quayLai = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(veTrang, { replace: true });
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[calc(100dvh-8rem)]">
      <div className="max-w-md w-full text-center">
        <Icon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" strokeWidth={1.4} aria-hidden />
        <p className="text-sm font-semibold text-primary tabular-nums">{loai}</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{t(`page.trangThai.${loai}.title`)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(`page.trangThai.${loai}.description`)}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={quayLai}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t('common.back')}
          </Button>
          <Button size="sm" onClick={() => navigate('/', { replace: true })}>
            <Home className="mr-1.5 h-4 w-4" />
            {t('shared.error.backHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrangTrangThai;
