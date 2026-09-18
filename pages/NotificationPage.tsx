import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import NotificationItem from '../components/notification/NotificationItem';
import Section from '../components/shared/Section';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useConfirmStore } from '../store/useConfirmStore';
import {
  useDanhSachThongBao,
  useDemChuaDoc,
  useDemTheoModule,
  useDanhDauDaDoc,
  useXoaMotThongBao,
  useDocTatCa,
  useXoaTatCa,
} from '../features/thong-bao/hooks/use-thong-bao';
import { nhomTheoNgay } from '../features/thong-bao/core/nhom-theo-ngay';
import { khoaI18nTenModule, MODULE_CO_THONG_BAO } from '../features/thong-bao/core/loai-su-kien';

const SO_DONG_MOI_TRANG = 30;

/**
 * Trang thông báo đầy đủ — cùng dữ liệu với chuông nhưng bố cục rộng và phân
 * trang sâu hơn. Bộ lọc ở đây độc lập với bộ lọc trên chuông để người dùng soi
 * lại lịch sử mà không làm xáo trạng thái panel đang mở.
 */
const NotificationPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);

  const [moduleId, setModuleId] = useState<string | null>(null);
  const [chiChuaDoc, setChiChuaDoc] = useState(false);
  const [trangSo, setTrangSo] = useState(0);

  const { data: soChuaDoc = 0 } = useDemChuaDoc();
  const { data: demTheoModule = {} } = useDemTheoModule(true);
  const { data: trang, isPending } = useDanhSachThongBao(
    { moduleId, chiChuaDoc, trang: trangSo, soDong: SO_DONG_MOI_TRANG },
    true
  );

  const danhDauDaDoc = useDanhDauDaDoc();
  const xoaMot = useXoaMotThongBao();
  const docTatCa = useDocTatCa();
  const xoaTatCa = useXoaTatCa();

  const items = useMemo(() => trang?.items ?? [], [trang]);
  const tong = trang?.tong ?? 0;
  const cacNhom = useMemo(() => nhomTheoNgay(items), [items]);
  const soTrang = Math.max(1, Math.ceil(tong / SO_DONG_MOI_TRANG));

  const moduleCoThongBao = useMemo(
    () => MODULE_CO_THONG_BAO.filter((m) => (demTheoModule[m] ?? 0) > 0),
    [demTheoModule]
  );

  const tenModule = moduleId ? khoaI18nTenModule(moduleId) : null;
  const phamVi = tenModule ? t(tenModule) : t('notification.scopeAll');

  const doiBoLoc = (thayDoi: () => void) => {
    thayDoi();
    setTrangSo(0);
  };

  return (
    <div className="min-h-full bg-card rounded-xl border border-border shadow-sm p-4 md:p-5">
      <div className="space-y-4">
        <Section
          title={t('notification.title')}
          icon={<Bell size={16} className="text-primary" />}
          action={
            <div className="flex items-center gap-2">
              {soChuaDoc > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    confirm({
                      title: t('notification.confirmMarkAllTitle'),
                      message: t('notification.confirmMarkAllMessage', { count: soChuaDoc, scope: phamVi }),
                      variant: 'info',
                      confirmText: t('notification.markAllRead'),
                      onConfirm: () => docTatCa.mutate(moduleId),
                    })
                  }
                >
                  <CheckCheck size={14} />
                  {t('notification.markAllRead')}
                </Button>
              )}
              {tong > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    confirm({
                      title: t('notification.confirmClearAllTitle'),
                      message: t('notification.confirmClearAllMessage', { count: tong, scope: phamVi }),
                      variant: 'danger',
                      confirmText: t('notification.clearAll'),
                      onConfirm: () => xoaTatCa.mutate(moduleId),
                    })
                  }
                >
                  <Trash2 size={14} />
                  {t('notification.clearAll')}
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            {/* Bộ lọc */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50 w-fit">
                {[
                  { label: t('notification.filterAll'), giaTri: false },
                  { label: t('notification.filterUnread'), giaTri: true },
                ].map((tab) => (
                  <button
                    key={String(tab.giaTri)}
                    type="button"
                    onClick={() => doiBoLoc(() => setChiChuaDoc(tab.giaTri))}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      chiChuaDoc === tab.giaTri
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.label}
                    {tab.giaTri && soChuaDoc > 0 ? ` (${soChuaDoc})` : ''}
                  </button>
                ))}
              </div>

              {moduleCoThongBao.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => doiBoLoc(() => setModuleId(null))}
                    className={cn(
                      'shrink-0 px-2.5 py-1 text-2xs font-medium rounded-full border transition-colors',
                      moduleId === null
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('notification.scopeAll')}
                  </button>
                  {moduleCoThongBao.map((m) => {
                    const khoa = khoaI18nTenModule(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => doiBoLoc(() => setModuleId(moduleId === m ? null : m))}
                        className={cn(
                          'shrink-0 px-2.5 py-1 text-2xs font-medium rounded-full border transition-colors whitespace-nowrap',
                          moduleId === m
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {khoa ? t(khoa) : m}
                        <span className="ml-1 opacity-70">{demTheoModule[m]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danh sách */}
            {isPending && items.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : items.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                {cacNhom.map((nhom) => (
                  <div key={nhom.nhom}>
                    <p className="px-4 py-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-border">
                      {t(`notification.group.${nhom.nhom}`)}
                    </p>
                    <ul className="p-2 space-y-0.5">
                      <AnimatePresence mode="popLayout">
                        {nhom.items.map((item) => (
                          <NotificationItem
                            key={item.id}
                            item={item}
                            onMarkRead={(id) => danhDauDaDoc.mutate(id)}
                            onRemove={(id) => xoaMot.mutate(id)}
                            hienTenModule={moduleId === null}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">
                {chiChuaDoc || moduleId ? t('notification.emptyFiltered') : t('notification.empty')}
              </p>
            )}

            {soTrang > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {t('notification.pageInfo', { current: trangSo + 1, total: soTrang, count: tong })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={trangSo === 0}
                    onClick={() => setTrangSo((p) => Math.max(0, p - 1))}
                  >
                    {t('common.prevPage')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={trangSo >= soTrang - 1}
                    onClick={() => setTrangSo((p) => p + 1)}
                  >
                    {t('common.nextPage')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default NotificationPage;
