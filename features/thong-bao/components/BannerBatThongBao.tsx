import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/useStore';
import { batPush, dongBoLaiDangKy, trangThaiPushHienTai } from '../services/push-service';

const KHOA_BO_QUA = 'thong-bao-banner-bo-qua';

/**
 * Dải mời bật thông báo, hiện một lần sau khi đăng nhập.
 *
 * Vì sao phải có một cú bấm thay vì tự xin quyền lúc tải trang: Safari trên iOS
 * từ chối thẳng `Notification.requestPermission()` nếu nó không đến từ thao tác
 * của người dùng, còn Chrome ghi nhận là "chặn vĩnh viễn" khi người dùng bấm
 * Chặn theo phản xạ — sau đó không cách nào bật lại từ trong app. Mọi loại thông
 * báo vẫn mặc định bật sẵn; đây chỉ là cánh cửa cấp quyền của trình duyệt.
 */
const BannerBatThongBao: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [hien, setHien] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Service worker mới (hoặc lần dọn SW theo SW_UNREGISTER_BUSTER) xoá mất
    // subscription cũ — dựng lại im lặng để người dùng không phải làm gì.
    void dongBoLaiDangKy();

    let daBoQua = false;
    try {
      daBoQua = localStorage.getItem(KHOA_BO_QUA) === '1';
    } catch {
      // Chế độ riêng tư chặn localStorage — coi như chưa bỏ qua.
    }
    setHien(!daBoQua && trangThaiPushHienTai() === 'chua_cap_quyen');
  }, [user]);

  const boQua = () => {
    setHien(false);
    try {
      localStorage.setItem(KHOA_BO_QUA, '1');
    } catch {
      // Không lưu được thì lần sau hiện lại — chấp nhận được.
    }
  };

  const bat = async () => {
    setDangXuLy(true);
    try {
      const kq = await batPush();
      if (kq.ok) toast.success(t('settings.push.enabled'));
      else if (kq.trangThai === 'bi_chan') toast.error(t('settings.push.blocked'));
      boQua();
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <AnimatePresence>
      {hien && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-3 md:mx-5 mt-3 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
            <Bell size={16} className="text-primary shrink-0" />
            <p className="flex-1 text-xs text-foreground min-w-0">{t('settings.push.banner')}</p>
            <button
              type="button"
              disabled={dangXuLy}
              onClick={() => void bat()}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {t('settings.push.bannerAction')}
            </button>
            <button
              type="button"
              aria-label={t('settings.push.bannerDismiss')}
              onClick={boQua}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BannerBatThongBao;
