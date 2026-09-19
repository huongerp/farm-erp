import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardList, Users, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import AdminFormMyTab from './components/my-tab';
import AdminFormManagedTab from './components/managed-tab';
import AdminFormQuotaTab from './components/quota-tab';
import { usePhieuHanhChinhViewScope } from './hooks/use-phieu-hanh-chinh-view-scope';
import { useAdminFormById } from './hooks/use-admin-form';
import { chonTabChoPhieu, THAM_SO_PHIEU } from './core/deep-link';
import { useAuthStore } from '../../../store/useStore';
import type { AdminFormRequest } from './core/types';

const AdminFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll, isLoading: dangTaiPhamVi } = usePhieuHanhChinhViewScope();
  const [activeTab, setActiveTab] = useState('my');

  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');
  const idTuLink = searchParams.get(THAM_SO_PHIEU);
  const { data: phieuTuLink, isError } = useAdminFormById(idTuLink);
  const [phieuMoTuLink, setPhieuMoTuLink] = useState<AdminFormRequest | null>(null);
  const daXuLyRef = useRef<string | null>(null);

  const tabs = useMemo(() => {
    const all = [
      { id: 'my', label: t('adminForm.tabs.my'), icon: ClipboardList },
      { id: 'managed', label: t('adminForm.tabs.managed'), icon: Users },
      { id: 'quota', label: t('adminForm.tabs.quota'), icon: BarChart3 },
    ];
    return viewAll ? all : [all[0], all[2]];
  }, [t, viewAll]);

  // Bấm lại đúng thông báo cũ sẽ đặt lại ?phieu=<id> đã bị xoá khỏi URL. Nhả
  // khoá khi param biến mất, thay vì khoá cứng theo id — nếu không thì lần bấm
  // thứ hai vào cùng một thông báo sẽ không mở được nữa.
  useEffect(() => {
    if (!idTuLink) daXuLyRef.current = null;
  }, [idTuLink]);

  /**
   * Deep-link từ thông báo: `?phieu=<id>` → chọn đúng tab rồi bật drawer.
   * Phải chờ phạm vi xem nạp xong: viewAll khởi đầu là false, quyết sớm thì
   * người có quyền quản lý bị đẩy nhầm về tab "Của tôi".
   */
  useEffect(() => {
    if (!idTuLink || dangTaiPhamVi || !currentUserId) return;
    if (daXuLyRef.current === idTuLink) return;

    const donDep = () => {
      daXuLyRef.current = idTuLink;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(THAM_SO_PHIEU);
          return next;
        },
        { replace: true }
      );
    };

    if (isError || phieuTuLink === null) {
      toast.error(t('adminForm.deepLink.notFound'));
      donDep();
      return;
    }
    if (!phieuTuLink) return; // đang tải

    const ketQua = chonTabChoPhieu({
      nguoiTaoId: phieuTuLink.nguoi_tao_id,
      currentUserId,
      viewAll,
    });
    if (ketQua.tab === null) {
      toast.error(t('adminForm.deepLink.noPermission'));
      donDep();
      return;
    }

    setActiveTab(ketQua.tab);
    // Giữ phiếu vào state TRƯỚC khi dọn param: dọn xong query bị tắt, data biến
    // mất, truyền thẳng phieuTuLink xuống tab thì drawer chớp rồi tắt.
    setPhieuMoTuLink(phieuTuLink);
    donDep();
  }, [idTuLink, phieuTuLink, isError, viewAll, dangTaiPhamVi, currentUserId, setSearchParams, t]);

  const xoaPhieuMoTuLink = useCallback(() => setPhieuMoTuLink(null), []);

  useEffect(() => {
    if (!viewAll && activeTab === 'managed') setActiveTab('my');
  }, [viewAll, activeTab]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'my' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormMyTab
            deepLinkItem={phieuMoTuLink}
            onDeepLinkConsumed={xoaPhieuMoTuLink}
          />
        </div>
      ) : activeTab === 'managed' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormManagedTab
            deepLinkItem={phieuMoTuLink}
            onDeepLinkConsumed={xoaPhieuMoTuLink}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormQuotaTab />
        </div>
      )}
    </div>
  );
};

export default AdminFormPage;
