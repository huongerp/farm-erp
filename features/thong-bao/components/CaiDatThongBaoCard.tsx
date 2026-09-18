import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bell, BellOff, Smartphone, Trash2, Send, ShieldAlert, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import Button from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { useConfirmStore } from '../../../store/useConfirmStore';
import {
  useCaiDatThongBao,
  useLuuCaiDatThongBao,
  useLuuTuyChonThongBao,
  useThietBiPush,
  useXoaThietBiPush,
} from '../hooks/use-thong-bao';
import {
  batPush,
  tatPushTrenThietBiNay,
  trangThaiPushHienTai,
  guiThuPush,
  type TrangThaiPush,
} from '../services/push-service';
import { LOAI_SU_KIEN_THEO_MODULE, khoaI18nLoaiSuKien, khoaI18nTenModule } from '../core/loai-su-kien';
import { TUY_CHON_MAC_DINH, type CaiDatThongBao } from '../core/types';

/**
 * Tra cài đặt đang áp cho một cặp module + loại sự kiện.
 * Bảng chỉ lưu ngoại lệ nên không tìm thấy dòng nào nghĩa là bật cả hai.
 */
function tra(ds: readonly CaiDatThongBao[], moduleId: string, loai: string) {
  const dungLoai = ds.find((d) => d.moduleId === moduleId && d.loaiSuKien === loai);
  if (dungLoai) return { trongApp: dungLoai.trongApp, push: dungLoai.push };
  const caModule = ds.find((d) => d.moduleId === moduleId && d.loaiSuKien === '*');
  if (caModule) return { trongApp: caModule.trongApp, push: caModule.push };
  return { trongApp: true, push: true };
}

const CaiDatThongBaoCard: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);

  const [trangThai, setTrangThai] = useState<TrangThaiPush>(() => trangThaiPushHienTai());
  const [dangXuLy, setDangXuLy] = useState(false);
  const [moduleMoRong, setModuleMoRong] = useState<string | null>(null);

  const { data, isPending } = useCaiDatThongBao();
  const { data: thietBi = [] } = useThietBiPush();
  const luuCaiDat = useLuuCaiDatThongBao();
  const luuTuyChon = useLuuTuyChonThongBao();
  const xoaThietBi = useXoaThietBiPush();

  const caiDat = useMemo(() => data?.caiDat ?? [], [data]);
  const tuyChon = data?.tuyChon ?? TUY_CHON_MAC_DINH;

  const daBat = trangThai === 'da_bat';
  const khongDungDuoc =
    trangThai === 'khong_ho_tro' || trangThai === 'chua_cau_hinh' || trangThai === 'ios_chua_cai_pwa';

  const batTat = async (bat: boolean) => {
    setDangXuLy(true);
    try {
      if (bat) {
        const kq = await batPush();
        setTrangThai(kq.trangThai);
        if (kq.ok) toast.success(t('settings.push.enabled'));
        else if (kq.trangThai === 'bi_chan') toast.error(t('settings.push.blocked'));
        else toast.error(t('settings.push.failed'));
      } else {
        await tatPushTrenThietBiNay();
        setTrangThai(trangThaiPushHienTai());
        toast.success(t('settings.push.disabled'));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDangXuLy(false);
    }
  };

  const guiThu = async () => {
    setDangXuLy(true);
    try {
      const ok = await guiThuPush();
      if (ok) toast.success(t('settings.push.testSent'));
      else toast.error(t('settings.push.testFailed'));
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <motion.div
      id="thong-bao"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card p-5 rounded-xl border border-border shadow-sm scroll-mt-20"
    >
      <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2 border-b border-border pb-3">
        <Bell className="w-4 h-4 text-muted-foreground" />
        {t('settings.notifications')}
      </h3>

      {/* Trạng thái push trên thiết bị này */}
      <div className="space-y-3">
        {trangThai === 'ios_chua_cai_pwa' ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Info size={15} /> {t('settings.push.iosTitle')}
            </p>
            <ol className="text-xs text-muted-foreground list-decimal ml-5 space-y-0.5">
              <li>{t('settings.push.iosStep1')}</li>
              <li>{t('settings.push.iosStep2')}</li>
              <li>{t('settings.push.iosStep3')}</li>
            </ol>
          </div>
        ) : trangThai === 'bi_chan' ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert size={15} /> {t('settings.push.blockedTitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('settings.push.blockedHint')}</p>
          </div>
        ) : trangThai === 'chua_cau_hinh' ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BellOff size={14} /> {t('settings.push.notConfigured')}
            </p>
          </div>
        ) : (
          <ToggleSwitch
            checked={daBat}
            onChange={(v) => void batTat(v)}
            disabled={dangXuLy || khongDungDuoc}
            label={t('settings.push.deviceToggle')}
            description={t('settings.push.deviceToggleDesc')}
          />
        )}

        {daBat && (
          <Button variant="secondary" size="sm" className="gap-1.5" disabled={dangXuLy} onClick={() => void guiThu()}>
            {dangXuLy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t('settings.push.sendTest')}
          </Button>
        )}
      </div>

      {/* Thiết bị đã đăng ký */}
      {thietBi.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('settings.push.devices')}
          </p>
          <ul className="space-y-1.5">
            {thietBi.map((tb) => (
              <li
                key={tb.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <Smartphone size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {tb.tenThietBi ?? t('settings.push.unknownDevice')}
                  </p>
                  {tb.tgDungCuoi && (
                    <p className="text-2xs text-muted-foreground">
                      {t('settings.push.lastUsed', { date: new Date(tb.tgDungCuoi).toLocaleDateString('vi-VN') })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={t('settings.push.removeDevice')}
                  onClick={() =>
                    confirm({
                      title: t('settings.push.removeDevice'),
                      message: t('settings.push.removeDeviceConfirm', {
                        name: tb.tenThietBi ?? t('settings.push.unknownDevice'),
                      }),
                      variant: 'danger',
                      onConfirm: () => xoaThietBi.mutate(tb.id),
                    })
                  }
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Giờ yên lặng */}
      <div className="mt-5 pt-4 border-t border-border space-y-3">
        <ToggleSwitch
          checked={tuyChon.gioYenLangBat}
          onChange={(v) => luuTuyChon.mutate({ ...tuyChon, gioYenLangBat: v })}
          label={t('settings.push.quietHours')}
          description={t('settings.push.quietHoursDesc', {
            from: `${String(tuyChon.gioYenLangTu).padStart(2, '0')}:00`,
            to: `${String(tuyChon.gioYenLangDen).padStart(2, '0')}:00`,
          })}
        />
        {tuyChon.gioYenLangBat && (
          <div className="flex items-center gap-2 pl-1">
            {(['gioYenLangTu', 'gioYenLangDen'] as const).map((khoa) => (
              <label key={khoa} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {t(khoa === 'gioYenLangTu' ? 'settings.push.from' : 'settings.push.to')}
                <select
                  value={tuyChon[khoa]}
                  onChange={(e) => luuTuyChon.mutate({ ...tuyChon, [khoa]: Number(e.target.value) })}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Ma trận module × loại sự kiện */}
      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t('settings.push.perModule')}
        </p>

        {isPending ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(LOAI_SU_KIEN_THEO_MODULE).map(([moduleId, dsLoai]) => {
              const khoaTen = khoaI18nTenModule(moduleId);
              const moRong = moduleMoRong === moduleId;
              const caModule = tra(caiDat, moduleId, '*');
              // Module coi là "tắt hẳn" khi mọi loại sự kiện đều không vào chuông.
              const tatHet = dsLoai.every((l) => !tra(caiDat, moduleId, l).trongApp);

              return (
                <div key={moduleId} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setModuleMoRong(moRong ? null : moduleId)}
                      className="flex-1 text-left text-xs font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {khoaTen ? t(khoaTen) : moduleId}
                    </button>
                    <ToggleSwitch
                      checked={!tatHet}
                      onChange={(v) =>
                        luuCaiDat.mutate({
                          moduleId,
                          loaiSuKien: '*',
                          trongApp: v,
                          push: v ? caModule.push : false,
                        })
                      }
                      label=""
                      className="shrink-0"
                    />
                  </div>

                  {moRong && (
                    <ul className="divide-y divide-border">
                      {dsLoai.map((loai) => {
                        const gt = tra(caiDat, moduleId, loai);
                        return (
                          <li key={loai} className="flex items-center gap-3 px-3 py-2">
                            <span
                              className={cn(
                                'flex-1 text-xs',
                                gt.trongApp ? 'text-foreground' : 'text-muted-foreground line-through'
                              )}
                            >
                              {t(khoaI18nLoaiSuKien(loai))}
                            </span>
                            <label className="flex items-center gap-1 text-2xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={gt.trongApp}
                                onChange={(e) =>
                                  luuCaiDat.mutate({
                                    moduleId,
                                    loaiSuKien: loai,
                                    trongApp: e.target.checked,
                                    push: e.target.checked ? gt.push : false,
                                  })
                                }
                                className="accent-primary"
                              />
                              {t('settings.push.inApp')}
                            </label>
                            <label className="flex items-center gap-1 text-2xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={gt.push}
                                disabled={!gt.trongApp}
                                onChange={(e) =>
                                  luuCaiDat.mutate({
                                    moduleId,
                                    loaiSuKien: loai,
                                    trongApp: gt.trongApp,
                                    push: e.target.checked,
                                  })
                                }
                                className="accent-primary disabled:opacity-40"
                              />
                              {t('settings.push.push')}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CaiDatThongBaoCard;
