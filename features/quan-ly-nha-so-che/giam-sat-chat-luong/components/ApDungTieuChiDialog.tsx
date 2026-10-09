import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2, Minus, Plus, RefreshCw } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { ketLuanPhieu } from '../core/ket-luan';
import { anhChupTieuChi, soSanhBoTieuChi, type TruongTieuChi } from '../core/tieu-chi';
import { coKetLuan } from '../core/trang-thai';
import type { GiamSatChatLuong, KetLuanGscl, ThungMau, TieuChi } from '../core/types';
import { useApDungTieuChiMoi, useCaiDatGscl, useTieuChiDanhMuc } from '../hooks/use-giam-sat-chat-luong';
import { moTaNguongTieuChi } from '../utils/mo-ta-nguong';
import { KetLuanBadge } from './Badges';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau[];
  onClose: () => void;
}

/**
 * Xác nhận "Áp dụng tiêu chí mới": so bộ tiêu chí đang chụp trên phiếu với bộ trong Cài đặt —
 * tiêu chí thêm / bỏ / đổi ngưỡng và kết luận trước → sau — rồi mới ghi đúng bộ đã xem.
 */
const ApDungTieuChiDialog: React.FC<Props> = ({ phieu, thung, onClose }) => {
  const { t } = useTranslation();
  const { data: danhMuc, isLoading, isError, refetch } = useTieuChiDanhMuc({ luonMoi: true });
  const apDung = useApDungTieuChiMoi(onClose);
  const { data: caiDat } = useCaiDatGscl();
  const soTcKhongDat = caiDat?.so_tieu_chi_khong_dat;

  const boMoi = useMemo(() => (danhMuc ? anhChupTieuChi(danhMuc) : null), [danhMuc]);
  const ss = useMemo(() => (boMoi ? soSanhBoTieuChi(phieu.tieu_chi, boMoi) : null), [phieu.tieu_chi, boMoi]);

  /** Kết luận trước / sau — tính lại từ các thùng đã kiểm (chưa đủ thùng thì là tạm tính). */
  const ketLuan = useMemo(() => {
    const daKiem = thung.filter((x) => x.da_kiem).map((x) => x.ket_qua);
    const tinh = (bo: TieuChi[]): KetLuanGscl | null =>
      soTcKhongDat == null ? null : ketLuanPhieu(bo, daKiem, phieu.so_thung_mau, soTcKhongDat).ketLuan;
    return {
      tamTinh: !coKetLuan(phieu.trang_thai),
      truoc: coKetLuan(phieu.trang_thai) ? phieu.ket_luan : tinh(phieu.tieu_chi),
      sau: boMoi ? tinh(boMoi) : null,
    };
  }, [thung, phieu, boMoi, soTcKhongDat]);

  const nhanTruong = (k: TruongTieuChi) => t(`giamSatChatLuong.apDung.truong_${k}`);
  const moTa = (tc: TieuChi) => moTaNguongTieuChi(tc, t);
  const ten = (tc: TieuChi) => (
    <>
      <span className="font-medium">{tc.ten}</span>
      {tc.don_vi && <span className="text-muted-foreground text-xs"> ({tc.don_vi})</span>}
    </>
  );

  const nhom = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.apDung.title')}
      subtitle={phieu.so_phieu}
      icon={<RefreshCw className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={apDung.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => boMoi && apDung.mutate({ id: phieu.id, tieuChi: boMoi })}
            disabled={!ss?.coThayDoi || apDung.isPending}
          >
            {apDung.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {t('giamSatChatLuong.toolbar.apDungTieuChi')}
          </Button>
        </div>
      }
    >
      {isLoading && !danhMuc ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2 m-0">
          <Loader2 size={16} className="animate-spin" />
          {t('giamSatChatLuong.loading')}
        </p>
      ) : (isError && !danhMuc) || !ss || !boMoi ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive m-0">{t('giamSatChatLuong.apDung.loiTai')}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : !ss.coThayDoi ? (
        <p className="text-sm rounded-lg border border-border bg-muted/40 px-3 py-2.5 m-0">
          {t('giamSatChatLuong.apDung.khongDoi')}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground m-0">{t('giamSatChatLuong.apDung.gioiThieu')}</p>

          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            {ss.doi.length > 0 && (
              <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {t('giamSatChatLuong.apDung.demDoi', { n: ss.doi.length })}
              </span>
            )}
            {ss.them.length > 0 && (
              <span className="px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {t('giamSatChatLuong.apDung.demThem', { n: ss.them.length })}
              </span>
            )}
            {ss.bo.length > 0 && (
              <span className="px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                {t('giamSatChatLuong.apDung.demBo', { n: ss.bo.length })}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
              {t('giamSatChatLuong.apDung.demGiu', { n: ss.giuNguyen })}
            </span>
          </div>

          {ss.doi.length > 0 && (
            <div className="space-y-1.5">
              <div className={nhom}>{t('giamSatChatLuong.apDung.mucDoi')}</div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-2.5 py-1.5 font-semibold">{t('giamSatChatLuong.detail.tieuChi')}</th>
                      <th className="text-left px-2.5 py-1.5 font-semibold">{t('giamSatChatLuong.apDung.hienTai')}</th>
                      <th className="w-6" />
                      <th className="text-left px-2.5 py-1.5 font-semibold">{t('giamSatChatLuong.apDung.sauKhiApDung')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ss.doi.map(({ cu, moi, truong }) => (
                      <tr key={moi.ma} className="border-t border-border align-top">
                        <td className="px-2.5 py-1.5">
                          {ten(moi)}
                          <div className="text-[11px] text-muted-foreground">
                            {t('giamSatChatLuong.apDung.doiGi', { ds: truong.map(nhanTruong).join(', ') })}
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5 text-muted-foreground">
                          {truong.includes('ten') && <div className="line-through">{cu.ten}</div>}
                          {moTa(cu)}
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          <ArrowRight size={14} />
                        </td>
                        <td className="px-2.5 py-1.5 font-medium text-foreground">{moTa(moi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ss.them.length > 0 && (
            <div className="space-y-1.5">
              <div className={nhom}>{t('giamSatChatLuong.apDung.mucThem')}</div>
              <ul className="m-0 p-0 list-none space-y-1">
                {ss.them.map((tc) => (
                  <li key={tc.ma} className="flex items-start gap-2 text-sm">
                    <Plus size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>
                      {ten(tc)} <span className="text-muted-foreground">— {moTa(tc)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.apDung.ghiChuThem')}</p>
            </div>
          )}

          {ss.bo.length > 0 && (
            <div className="space-y-1.5">
              <div className={nhom}>{t('giamSatChatLuong.apDung.mucBo')}</div>
              <ul className="m-0 p-0 list-none space-y-1">
                {ss.bo.map((tc) => (
                  <li key={tc.ma} className="flex items-start gap-2 text-sm">
                    <Minus size={14} className="mt-0.5 shrink-0 text-rose-600" />
                    <span className="text-muted-foreground">{ten(tc)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.apDung.ghiChuBo')}</p>
            </div>
          )}

          {ss.doi.length === 0 && ss.them.length === 0 && ss.bo.length === 0 && (
            <p className="text-sm text-muted-foreground m-0">{t('giamSatChatLuong.apDung.chiDoiThuTu')}</p>
          )}

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className={nhom}>{t('giamSatChatLuong.apDung.ketLuan')}</div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <KetLuanBadge value={ketLuan.truoc} tamTinh={ketLuan.tamTinh} />
              <ArrowRight size={14} className="text-muted-foreground" />
              <KetLuanBadge value={ketLuan.sau} tamTinh={ketLuan.tamTinh} />
              {ketLuan.truoc !== ketLuan.sau && ketLuan.sau && (
                <span className={cn('text-xs font-medium', ketLuan.sau === 'khong_dat' ? 'text-rose-600' : 'text-emerald-600')}>
                  {t('giamSatChatLuong.apDung.ketLuanDoi')}
                </span>
              )}
            </div>
            {!ketLuan.truoc && !ketLuan.sau && (
              <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.apDung.chuaCoKetLuan')}</p>
            )}
          </div>
        </div>
      )}
    </GenericDrawer>
  );
};

export default ApDungTieuChiDialog;
