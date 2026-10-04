import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardList, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import AdminFormFormsTab from './components/forms-tab';
import AdminFormQuotaTab from './components/quota-tab';
import { usePhieuHanhChinhViewScope } from './hooks/use-phieu-hanh-chinh-view-scope';
import { useAdminFormById } from './hooks/use-admin-form';
import { chonTabChoPhieu, THAM_SO_PHIEU } from './core/deep-link';
import { useAuthStore } from '../../../store/useStore';
import type { AdminFormRequest } from './core/types';

const AdminFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll, isLoading: dangTaiPhamVi } = usePhieuHanhChinhViewScope();
  const [activeTab, setActiveTab] = useState('list');

  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');
  const idTuLink = searchParams.get(THAM_SO_PHIEU);
  const { data: phieuTuLink, isError } = useAdminFormById(idTuLink);
  const [phieuMoTuLink, setPhieuMoTuLink] = useState<AdminFormRequest | null>(null);
  const daXuLyRef = useRef<string | null>(null);

  // Một tab "Phiếu" cho mọi người: có viewAll thì thấy thêm phiếu người khác + chip Người gửi.
  const tabs = useMemo(
    () => [
      { id: 'list', label: t('adminForm.tabs.list'), icon: ClipboardList },
      { id: 'quota', label: t('adminForm.tabs.quota'), icon: BarChart3 },
    ],
    [t]
  );

  // Bấm lại đúng thông báo cũ sẽ đặt lại ?phieu=<id> đã bị xoá khỏi URL. Nhả
  // khoá khi param biến mất, thay vì khoá cứng theo id — nếu không thì lần bấm
  // thứ hai vào cùng một thông báo sẽ không mở được nữa.
  useEffect(() => {
    if (!idTuLink) daXuLyRef.current = null;
  }, [idTuLink]);

  /**
   * Deep-link từ thông báo: `?phieu=<id>` → chọn đúng tab rồi bật drawer.
   * Phải chờ phạm vi xem nạp xong: viewAll khởi đầu là false, quyết sớm thì
   * người có quyền quản lý bị báo nhầm "không có quyền".
   * Quyết định tính thuần lúc render; null = chưa đủ dữ liệu để quyết (đang tải).
   */
  const ketQuaLink = useMemo(():
    | { loai: 'loi'; thongBaoKey: string }
    | { loai: 'mo'; tab: 'list'; phieu: AdminFormRequest }
    | null => {
    if (!idTuLink || dangTaiPhamVi || !currentUserId) return null;
    if (isError || phieuTuLink === null) return { loai: 'loi', thongBaoKey: 'adminForm.deepLink.notFound' };
    if (!phieuTuLink) return null; // đang tải
    const ketQua = chonTabChoPhieu({
      nguoiTaoId: phieuTuLink.nguoi_tao_id,
      currentUserId,
      viewAll,
    });
    if (ketQua.tab === null) return { loai: 'loi', thongBaoKey: 'adminForm.deepLink.noPermission' };
    return { loai: 'mo', tab: ketQua.tab, phieu: phieuTuLink };
  }, [idTuLink, phieuTuLink, isError, viewAll, dangTaiPhamVi, currentUserId]);

  // Chọn tab + giữ phiếu vào state ngay lúc render (mẫu "adjust state while rendering").
  // Giữ phiếu vào state TRƯỚC khi dọn param: dọn xong query bị tắt, data biến
  // mất, truyền thẳng phieuTuLink xuống tab thì drawer chớp rồi tắt.
  // Param biến mất thì nhả khoá để bấm lại cùng thông báo vẫn mở được.
  const [idDaMoTuLink, setIdDaMoTuLink] = useState<string | null>(null);
  if (!idTuLink && idDaMoTuLink !== null) setIdDaMoTuLink(null);
  if (ketQuaLink?.loai === 'mo' && idDaMoTuLink !== idTuLink) {
    setIdDaMoTuLink(idTuLink);
    setActiveTab(ketQuaLink.tab);
    setPhieuMoTuLink(ketQuaLink.phieu);
  }

  // Phần tác dụng phụ (toast + dọn ?phieu= khỏi URL) vẫn chạy trong effect.
  useEffect(() => {
    if (!idTuLink || !ketQuaLink) return;
    if (daXuLyRef.current === idTuLink) return;
    if (ketQuaLink.loai === 'loi') toast.error(t(ketQuaLink.thongBaoKey));
    daXuLyRef.current = idTuLink;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(THAM_SO_PHIEU);
        return next;
      },
      { replace: true }
    );
  }, [idTuLink, ketQuaLink, setSearchParams, t]);

  const xoaPhieuMoTuLink = useCallback(() => setPhieuMoTuLink(null), []);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'list' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormFormsTab
            viewAll={viewAll}
            dangTaiPhamVi={dangTaiPhamVi}
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
