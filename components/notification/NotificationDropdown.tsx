import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, ChevronRight, ChevronUp, Settings2, Loader2 } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useConfirmStore } from '../../store/useConfirmStore';
import NotificationItem from './NotificationItem';
import Combobox from '../ui/Combobox';
import { cn } from '../../lib/utils';
import {
  useDanhSachThongBao,
  useDemChuaDoc,
  useDemTheoModule,
  useDanhDauDaDoc,
  useXoaMotThongBao,
  useDocTatCa,
  useXoaTatCa,
} from '../../features/thong-bao/hooks/use-thong-bao';
import { nhomTheoNgay } from '../../features/thong-bao/core/nhom-theo-ngay';
import { khoaI18nTenModule, MODULE_CO_THONG_BAO } from '../../features/thong-bao/core/loai-su-kien';

const SO_DONG_XEM_TRUOC = 5;
const SO_DONG_MO_RONG = 30;

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  className?: string;
  /** Khi 'top', panel mở phía trên anchor (dùng trong bottom nav). */
  placement?: 'default' | 'top';
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  anchorRef: _anchorRef,
  className,
  placement = 'default',
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const moduleDangLoc = useNotificationStore((s) => s.moduleDangLoc);
  const chiChuaDoc = useNotificationStore((s) => s.chiChuaDoc);
  const setModuleDangLoc = useNotificationStore((s) => s.setModuleDangLoc);
  const setChiChuaDoc = useNotificationStore((s) => s.setChiChuaDoc);

  const confirm = useConfirmStore((s) => s.confirm);

  const { data: soChuaDoc = 0 } = useDemChuaDoc();
  const { data: demTheoModule = {} } = useDemTheoModule(isOpen);
  const { data: trang, isPending } = useDanhSachThongBao(
    {
      moduleId: moduleDangLoc,
      chiChuaDoc,
      soDong: expanded ? SO_DONG_MO_RONG : SO_DONG_XEM_TRUOC,
    },
    isOpen
  );

  const danhDauDaDoc = useDanhDauDaDoc();
  const xoaMot = useXoaMotThongBao();
  const docTatCa = useDocTatCa();
  const xoaTatCa = useXoaTatCa();

  useEffect(() => {
    if (!isOpen) setExpanded(false);
  }, [isOpen]);

  const items = useMemo(() => trang?.items ?? [], [trang]);
  const tong = trang?.tong ?? 0;
  const hasItems = items.length > 0;
  const hasMore = tong > items.length;
  const cacNhom = useMemo(() => nhomTheoNgay(items), [items]);

  /**
   * Chỉ hiện chip của module người dùng THẬT SỰ có thông báo. Bày đủ 7 module
   * trong khi 5 trong số đó trống chỉ làm rối hàng lọc.
   */
  const moduleCoTrongChuong = useMemo(
    () => MODULE_CO_THONG_BAO.filter((m) => (demTheoModule[m] ?? 0) > 0),
    [demTheoModule]
  );

  const luaChonModule = useMemo(
    () => [
      { value: '', label: t('notification.scopeAll') },
      ...moduleCoTrongChuong.map((m) => {
        const khoa = khoaI18nTenModule(m);
        return { value: m, label: `${khoa ? t(khoa) : m} (${demTheoModule[m]})` };
      }),
    ],
    [moduleCoTrongChuong, demTheoModule, t]
  );

  if (!isOpen) return null;

  const isOpenUp = placement === 'top';
  const tenModuleDangLoc = moduleDangLoc ? khoaI18nTenModule(moduleDangLoc) : null;
  const phamVi = tenModuleDangLoc ? t(tenModuleDangLoc) : t('notification.scopeAll');

  /**
   * Hộp xác nhận nói rõ phạm vi đang áp: xoá 12 thông báo của riêng Phiếu kho
   * khác hẳn xoá sạch cả 84 dòng.
   */
  /**
   * Đóng panel trước khi mở hộp xác nhận: panel nằm trong portal ở z-[9999], cao
   * hơn lớp phủ của ConfirmDialog, nên để mở thì panel che mất nửa hộp thoại.
   */
  const xacNhanDocTatCa = () => {
    onClose();
    confirm({
      title: t('notification.confirmMarkAllTitle'),
      message: t('notification.confirmMarkAllMessage', { count: soChuaDoc, scope: phamVi }),
      variant: 'info',
      confirmText: t('notification.markAllRead'),
      onConfirm: () => docTatCa.mutate(moduleDangLoc),
    });
  };

  const xacNhanXoaTatCa = () => {
    onClose();
    confirm({
      title: t('notification.confirmClearAllTitle'),
      message: t('notification.confirmClearAllMessage', { count: tong, scope: phamVi }),
      variant: 'danger',
      confirmText: t('notification.clearAll'),
      onConfirm: () => xoaTatCa.mutate(moduleDangLoc),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: isOpenUp ? -8 : 8, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        maxHeight: expanded ? 560 : 460,
      }}
      exit={{ opacity: 0, y: isOpenUp ? -8 : 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role="dialog"
      aria-label={t('notification.title')}
      className={cn(
        'absolute right-0 w-[min(100vw-2rem,380px)] max-w-full',
        isOpenUp ? 'bottom-full mb-2' : 'top-full mt-2',
        'bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden z-50',
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={18} className="text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground truncate">
            {t('notification.title')}
          </h3>
          {soChuaDoc > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              {soChuaDoc}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {soChuaDoc > 0 && (
            <button
              type="button"
              onClick={xacNhanDocTatCa}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              title={t('notification.markAllRead')}
              aria-label={t('notification.markAllRead')}
            >
              <CheckCheck size={16} />
            </button>
          )}
          {hasItems && (
            <button
              type="button"
              onClick={xacNhanXoaTatCa}
              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title={t('notification.clearAll')}
              aria-label={t('notification.clearAll')}
            >
              <Trash2 size={16} />
            </button>
          )}
          <Link
            to="/cai-dat#thong-bao"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            title={t('notification.settings')}
            aria-label={t('notification.settings')}
          >
            <Settings2 size={16} />
          </Link>
        </div>
      </div>

      {/* Bộ lọc gọn trong MỘT hàng: tab trạng thái bên trái, chọn module bên phải */}
      <div className="shrink-0 border-b border-border px-3 py-2 flex items-center gap-2">
        <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50 shrink-0">
          {[
            { id: 'all', label: t('notification.filterAll'), chiChuaDoc: false },
            { id: 'unread', label: t('notification.filterUnread'), chiChuaDoc: true },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChiChuaDoc(tab.chiChuaDoc)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                chiChuaDoc === tab.chiChuaDoc
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.chiChuaDoc && soChuaDoc > 0 ? ` (${soChuaDoc})` : ''}
            </button>
          ))}
        </div>

        {/* Danh sách module dài dần theo thời gian nên dùng ô chọn thay vì hàng
            chip cuộn ngang — gọn hơn và không ăn thêm một dòng của panel. */}
        {moduleCoTrongChuong.length > 0 && (
          <Combobox
            options={luaChonModule}
            // Để null thay vì '' khi không lọc: Combobox chỉ hiện nút xoá khi giá
            // trị khớp một mục, nên '' sẽ làm nút xoá hiện cả lúc đang xem tất cả.
            value={moduleDangLoc}
            placeholder={t('notification.scopeAll')}
            onChange={(v: string) => setModuleDangLoc(v === '' ? null : v)}
            // Nhiều nhất là bảy module nên ô tìm kiếm chỉ tổ thêm một bước bấm.
            searchable={false}
            dropdownAutoHeight
            className="ml-auto min-w-0 flex-1"
            triggerClassName={cn(
              'h-7 px-2 text-xs rounded-lg',
              moduleDangLoc && 'border-primary/40 text-primary'
            )}
          />
        )}
      </div>

      {/* Danh sách */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
        {isPending && !hasItems ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : hasItems ? (
          <>
            {cacNhom.map((nhom) => (
              <div key={nhom.nhom}>
                <p className="sticky top-0 z-10 px-4 py-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground bg-card/95 backdrop-blur-sm">
                  {t(`notification.group.${nhom.nhom}`)}
                </p>
                <ul className="px-2 pb-1 space-y-0.5">
                  <AnimatePresence mode="popLayout">
                    {nhom.items.map((item) => (
                      <NotificationItem
                        key={item.id}
                        item={item}
                        onMarkRead={(id) => danhDauDaDoc.mutate(id)}
                        onRemove={(id) => xoaMot.mutate(id)}
                        onNavigate={onClose}
                        hienTenModule={moduleDangLoc === null}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))}
            <div className="shrink-0 border-t border-border p-2 space-y-1">
              {(hasMore || expanded) && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {expanded ? t('notification.collapse') : t('notification.viewMore')}
                  {expanded ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <Link
                to="/thong-bao"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {t('notification.viewAll')}
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t('notification.empty')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {chiChuaDoc || moduleDangLoc ? t('notification.emptyFiltered') : t('notification.emptyHint')}
            </p>
            {(chiChuaDoc || moduleDangLoc) && (
              <button
                type="button"
                onClick={() => {
                  setChiChuaDoc(false);
                  setModuleDangLoc(null);
                }}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                {t('notification.clearFilter')}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
