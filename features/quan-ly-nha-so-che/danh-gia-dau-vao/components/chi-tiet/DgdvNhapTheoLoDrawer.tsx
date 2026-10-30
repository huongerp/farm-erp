/**
 * Drawer con «Nhập theo lô»: chọn lô (hiện tổ trưởng) → một hàng cho MỖI dây của phiếu (dây đã có nhiều dòng
 * thì mỗi dòng một hàng, «+» thêm dòng cho dây) + hàng «Đứt dây»; ô SL · đánh giá · SL lỗi · lý do lỗi, số đã có
 * điền sẵn. Enter ở ô số nhảy ô số kế (SL → SL lỗi → hàng dưới), Tab theo thứ tự ô; SL lỗi > SL báo đỏ ngay và
 * chặn lưu. «Lưu & sang lô kế» theo thứ tự lô của phiếu. Ghi: `keHoachLuuCaLo` (core/chi-tiet-dong) →
 * `useLuuCaLoDgdv` (cùng đường ghi từng dòng). Điện thoại: mỗi hàng một card 4 ô, nút lưu ở footer dính đáy.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ListPlus, Plus, Rows3 } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import Combobox from '../../../../../components/ui/Combobox';
import { DRAWER_WIDTH_BAO_CAO_SO_CHE } from '../../../../../lib/dialog-sizes';
import { useIsMobile } from '../../../../../lib/hooks/use-is-mobile';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../../lib/button-labels';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { LOAI_LY_DO_DGDV } from '../../core/types';
import {
  hangNhapCuaLo,
  keHoachLuuCaLo,
  loiHangNhap,
  themHangChoDay,
  type DgdvHangNhapLo,
  type LoiHangNhap,
} from '../../core/chi-tiet-dong';
import { tenKhongTrung } from '../../core/chuan-hoa-ten';
import { useLuuCaLoDgdv } from '../../hooks/use-danh-gia-dau-vao';
import { useLyDoDgdv, useMauDay, useThemLyDoNeuMoi } from '../../hooks/use-danh-muc-dgdv';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';
import { ChipDay } from '../ChipDay';
import FooterLuuTiep from '../form/FooterLuuTiep';

interface Props {
  phieu: DgdvPhieuDayDu;
  /** Lô mở sẵn; null = lô đầu tiên của phiếu. */
  idPhieuLo: string | null;
  onClose: () => void;
  stackLevel: number;
}

type CotSo = 'so_luong' | 'so_luong_huy';

/** Ô số: chỉ giữ chữ số; rỗng = 0. */
const docSo = (s: string) => {
  const n = Number(s.replace(/\D/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const oSo =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-right text-body-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';
const oLoi = 'border-destructive ring-1 ring-destructive/40 bg-rose-50 dark:bg-rose-950/30';

const DgdvNhapTheoLoDrawer: React.FC<Props> = ({ phieu, idPhieuLo, onClose, stackLevel }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const confirm = useConfirmStore((s) => s.confirm);
  const luu = useLuuCaLoDgdv();
  const themLyDo = useThemLyDoNeuMoi();
  const { data: dsLyDo = [] } = useLyDoDgdv();
  const { mauTheoId } = useMauDay();

  const loSapXep = useMemo(() => [...phieu.lo].sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id)), [phieu.lo]);
  const cotTheoId = useMemo(() => new Map(phieu.cot.map((c) => [c.id, c])), [phieu.cot]);

  // Bảng nhập của lô đang chọn; phiếu tải lại (sau khi lưu) mà chưa gõ gì → dựng lại từ số mới.
  const [st, setSt] = useState(() => {
    const idLo = idPhieuLo ?? loSapXep[0]?.id ?? '';
    return { idLo, phieu, hang: hangNhapCuaLo(phieu, idLo, phieu.ngay), dirty: false };
  });
  if (st.phieu !== phieu && !st.dirty) {
    setSt({ ...st, phieu, hang: hangNhapCuaLo(phieu, st.idLo, phieu.ngay) });
  }
  const { idLo, hang, dirty } = st;
  const lo = loSapXep.find((l) => l.id === idLo);
  const viTriLo = loSapXep.findIndex((l) => l.id === idLo);
  const loKe = viTriLo >= 0 ? loSapXep[viTriLo + 1] : undefined;

  const doiHang = (key: string, gt: Partial<DgdvHangNhapLo>) =>
    setSt((s) => ({ ...s, dirty: true, hang: s.hang.map((h) => (h.key === key ? { ...h, ...gt } : h)) }));

  const chuyenLo = useCallback(
    (id: string) => setSt((s) => ({ ...s, idLo: id, hang: hangNhapCuaLo(phieu, id, phieu.ngay), dirty: false, phieu })),
    [phieu]
  );

  // ---- Focus: Enter nhảy ô số kế; mở drawer / đổi lô → ô SL đầu ----
  const oRef = useRef(new Map<string, HTMLInputElement>());
  const thuTuO = useMemo(
    () => hang.flatMap((h) => (h.id_cot == null ? [`${h.key}:so_luong`] : [`${h.key}:so_luong`, `${h.key}:so_luong_huy`])),
    [hang]
  );
  const focusO = (k: string | undefined) => {
    const el = k ? oRef.current.get(k) : undefined;
    el?.focus();
    el?.select();
  };
  useEffect(() => {
    const h = setTimeout(() => focusO(thuTuO[0]), 200);
    return () => clearTimeout(h);
    // Chỉ khi đổi lô — gõ số không được kéo focus về đầu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLo]);
  const onEnter = (k: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    focusO(thuTuO[thuTuO.indexOf(k) + 1]);
  };

  const loi = useMemo(() => new Map(hang.map((h) => [h.key, loiHangNhap(h)])), [hang]);
  const tong = useMemo(() => {
    const sl = hang.reduce((s, h) => s + h.so_luong, 0);
    const ksc = hang.reduce((s, h) => s + (h.id_cot ? h.so_luong_huy : 0), 0);
    return { sl, ksc };
  }, [hang]);

  const goiY = (loai: typeof LOAI_LY_DO_DGDV.DANH_GIA | typeof LOAI_LY_DO_DGDV.LOI) =>
    tenKhongTrung(dsLyDo.filter((x) => x.loai === loai).map((x) => x.ten)).map((ten) => ({ value: ten, label: ten }));
  const goiYDanhGia = goiY(LOAI_LY_DO_DGDV.DANH_GIA);
  const goiYLoi = goiY(LOAI_LY_DO_DGDV.LOI);

  const nhanLoi = (l: LoiHangNhap) => (l === 'slLoiLonHon' ? t('danhGiaDauVao.luoi.canhBaoLoi') : t('danhGiaDauVao.validation.soLuongRequired'));

  const doiLo = (id: string) => {
    if (!id || id === idLo) return;
    if (!dirty) {
      chuyenLo(id);
      return;
    }
    confirm({
      title: t('common.unsavedChangesTitle'),
      message: t('danhGiaDauVao.nhapLo.boThayDoi'),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: () => chuyenLo(id),
    });
  };

  const luuLo = async (sangLoKe: boolean) => {
    const dauLoi = hang.find((h) => loi.get(h.key));
    if (dauLoi) {
      toast.error(t('danhGiaDauVao.nhapLo.conLoi'));
      focusO(`${dauLoi.key}:so_luong`);
      return;
    }
    const ops = keHoachLuuCaLo(phieu, idLo, phieu.ngay, hang);
    if (ops.length === 0) {
      toast.message(t('danhGiaDauVao.nhapLo.khongDoi'));
    } else {
      try {
        await luu.mutateAsync(ops);
      } catch {
        return;
      }
      for (const h of hang) {
        if (h.id_cot == null || h.so_luong <= 0) continue;
        themLyDo(h.danh_gia?.trim() || null, LOAI_LY_DO_DGDV.DANH_GIA);
        themLyDo(h.ly_do_huy?.trim() || null, LOAI_LY_DO_DGDV.LOI);
      }
    }
    if (sangLoKe && loKe) chuyenLo(loKe.id);
    else onClose();
  };

  const loOptions = loSapXep.map((l) => ({ value: l.id, label: l.ten_lo ?? '—', subLabel: l.to_truong ?? '' }));
  /** Hàng cuối của mỗi dây — chỗ đặt nút «+ dòng». */
  const hangCuoiCuaDay = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of hang) if (h.id_cot) m.set(h.id_cot, h.key);
    return new Set(m.values());
  }, [hang]);

  const oNhapSo = (h: DgdvHangNhapLo, cot: CotSo, loiO: boolean) => {
    const k = `${h.key}:${cot}`;
    return (
      <input
        ref={(el) => {
          if (el) oRef.current.set(k, el);
          else oRef.current.delete(k);
        }}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="next"
        className={cn(oSo, loiO && oLoi)}
        value={h[cot] ? String(h[cot]) : ''}
        onChange={(e) => doiHang(h.key, { [cot]: docSo(e.target.value) })}
        onKeyDown={onEnter(k)}
        onFocus={(e) => e.target.select()}
        aria-label={cot === 'so_luong' ? t('danhGiaDauVao.luoi.colSoLuong') : t('danhGiaDauVao.luoi.colSlLoi')}
      />
    );
  };

  const oChu = (h: DgdvHangNhapLo, cot: 'danh_gia' | 'ly_do_huy') => (
    <Combobox
      options={cot === 'danh_gia' ? goiYDanhGia : goiYLoi}
      value={h[cot] ?? ''}
      onChange={(v) => doiHang(h.key, { [cot]: v ? String(v).trim() : null })}
      placeholder={cot === 'danh_gia' ? t('danhGiaDauVao.chiTiet.dat') : '—'}
      creatable
      creatableLabel={t('danhGiaDauVao.form.dungTen')}
      dropdownInPortal
      triggerClassName="h-9"
      label={isMobile ? (cot === 'danh_gia' ? t('danhGiaDauVao.luoi.colDanhGia') : t('danhGiaDauVao.luoi.colLyDoLoi')) : undefined}
    />
  );

  const nutThemDong = (h: DgdvHangNhapLo) =>
    h.id_cot && hangCuoiCuaDay.has(h.key) ? (
      <button
        type="button"
        className="p-1.5 rounded-md text-primary hover:bg-primary/10"
        onClick={() => setSt((s) => ({ ...s, dirty: true, hang: themHangChoDay(s.hang, h.id_cot!) }))}
        title={t('danhGiaDauVao.nhapLo.themDongDay')}
        aria-label={t('danhGiaDauVao.nhapLo.themDongDay')}
      >
        <Plus size={14} />
      </button>
    ) : null;

  const chip = (h: DgdvHangNhapLo) => <ChipDay cot={h.id_cot ? (cotTheoId.get(h.id_cot) ?? null) : null} mauTheoId={mauTheoId} />;

  const bangDesktop = (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[46rem] border-collapse text-body-sm">
        <thead className="bg-muted text-xs">
          <tr>
            <th className="px-2 py-1.5 text-left font-semibold w-[13rem]">{t('danhGiaDauVao.chiTiet.colDay')}</th>
            <th className="px-2 py-1.5 text-right font-semibold w-[6rem]">{t('danhGiaDauVao.luoi.colSoLuong')}</th>
            <th className="px-2 py-1.5 text-left font-semibold">{t('danhGiaDauVao.luoi.colDanhGia')}</th>
            <th className="px-2 py-1.5 text-right font-semibold w-[6rem]">{t('danhGiaDauVao.luoi.colSlLoi')}</th>
            <th className="px-2 py-1.5 text-left font-semibold">{t('danhGiaDauVao.luoi.colLyDoLoi')}</th>
            <th className="w-[2.5rem]" />
          </tr>
        </thead>
        <tbody>
          {hang.map((h) => {
            const l = loi.get(h.key) ?? null;
            return (
              <React.Fragment key={h.key}>
                <tr className={cn('border-t border-border', h.id_cot == null && 'bg-muted/40')}>
                  <td className="px-2 py-1">{chip(h)}</td>
                  <td className="px-2 py-1">{oNhapSo(h, 'so_luong', l === 'thieuSoLuong')}</td>
                  <td className="px-2 py-1">{h.id_cot ? oChu(h, 'danh_gia') : null}</td>
                  <td className="px-2 py-1">{h.id_cot ? oNhapSo(h, 'so_luong_huy', l === 'slLoiLonHon') : null}</td>
                  <td className="px-2 py-1">{h.id_cot ? oChu(h, 'ly_do_huy') : null}</td>
                  <td className="px-1 py-1 text-center">{nutThemDong(h)}</td>
                </tr>
                {l && (
                  <tr>
                    <td colSpan={6} className="px-2 pb-1 text-caption text-destructive">
                      {nhanLoi(l)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const cardMobile = (
    <div className="space-y-2.5">
      {hang.map((h) => {
        const l = loi.get(h.key) ?? null;
        return (
          <div key={h.key} className={cn('rounded-xl border border-border p-3 space-y-2', h.id_cot == null && 'bg-muted/40', l && 'border-destructive')}>
            <div className="flex items-center justify-between gap-2">
              {chip(h)}
              {nutThemDong(h)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs font-medium">{t('danhGiaDauVao.luoi.colSoLuong')}</span>
                {oNhapSo(h, 'so_luong', l === 'thieuSoLuong')}
              </div>
              {h.id_cot && (
                <div className="space-y-1">
                  <span className="text-xs font-medium">{t('danhGiaDauVao.luoi.colSlLoi')}</span>
                  {oNhapSo(h, 'so_luong_huy', l === 'slLoiLonHon')}
                </div>
              )}
              {h.id_cot && <div>{oChu(h, 'danh_gia')}</div>}
              {h.id_cot && <div>{oChu(h, 'ly_do_huy')}</div>}
            </div>
            {l && <p className="m-0 text-caption text-destructive">{nhanLoi(l)}</p>}
          </div>
        );
      })}
    </div>
  );

  return (
    <GenericDrawer
      title={t('danhGiaDauVao.nhapLo.title')}
      subtitle={`${t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(phieu.ngay) })} · ${t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: phieu.chuyen })}`}
      icon={<Rows3 size={18} />}
      onClose={onClose}
      isDirty={dirty}
      stackLevel={stackLevel}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
      footer={
        <FooterLuuTiep
          onHuy={onClose}
          onLuu={() => void luuLo(false)}
          onLuuTiep={loKe ? () => void luuLo(true) : undefined}
          nhanTiep={t('danhGiaDauVao.nhapLo.luuSangLoKe')}
          dangLuu={luu.isPending}
        />
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Combobox
              label={t('danhGiaDauVao.form.lo')}
              options={loOptions}
              value={idLo}
              onChange={(v) => doiLo(v ? String(v) : '')}
              placeholder={t('danhGiaDauVao.form.chonLo')}
              dropdownInPortal
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-sm">
            <span className="text-muted-foreground">
              {t('danhGiaDauVao.form.toTruong')}: <span className="text-foreground font-medium">{lo?.to_truong ?? '—'}</span>
            </span>
            <span>
              {t('danhGiaDauVao.luoi.colSlBuong')} <span className="font-bold tabular-nums text-primary">{formatNumberVN(tong.sl)}</span>
            </span>
            <span>
              {t('danhGiaDauVao.luoi.ksc')} <span className="font-bold tabular-nums text-rose-600">{formatNumberVN(tong.ksc)}</span>
              <span className="text-muted-foreground"> · {nhanTiLeKsc(tong.ksc, tong.sl)}</span>
            </span>
            {loSapXep.length > 1 && viTriLo >= 0 && (
              <span className="text-muted-foreground tabular-nums">{t('danhGiaDauVao.nhapLo.thuTuLo', { i: viTriLo + 1, n: loSapXep.length })}</span>
            )}
          </div>
        </div>
        <p className="m-0 text-caption text-muted-foreground inline-flex items-center gap-1">
          <ListPlus size={12} />
          {t('danhGiaDauVao.nhapLo.hint')}
        </p>
        {phieu.cot.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">{t('danhGiaDauVao.luoi.chuaCoCot')}</p>
        ) : isMobile ? (
          cardMobile
        ) : (
          bangDesktop
        )}
      </div>
    </GenericDrawer>
  );
};

export default DgdvNhapTheoLoDrawer;
