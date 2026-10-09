import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, ClipboardCheck, Minus, Plus, ScanLine, X } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { quyDoiNguong } from '../core/ket-luan';
import { docTongNhanh } from '../core/ti-le';
import type { GiamSatChatLuong, KetQuaThung, ThungMau, TieuChi } from '../core/types';
import { useLuuKetQuaThung } from '../hooks/use-giam-sat-chat-luong';
import {
  MAX_ANH_THUNG,
  MAX_MB_ANH_GOC,
  imageItemsToUrls,
  urlsToImageItems,
} from '../utils/anh-thung';
import { useUploadAnhThung } from '../hooks/use-upload-anh-thung';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau;
  onClose: () => void;
  /** Có nút "Lưu & quét tiếp" (đang trong luồng quét tem). */
  onQuetTiep?: () => void;
}

type Nhap = Record<string, string | boolean | null>;

function giaTriBanDau(tieuChi: TieuChi[], kq: KetQuaThung): Nhap {
  const out: Nhap = {};
  for (const tc of tieuChi) {
    const v = kq[tc.ma];
    if (tc.loai === 'dat_khong') out[tc.ma] = typeof v === 'boolean' ? v : null;
    else if (typeof v === 'number') out[tc.ma] = String(v);
    else out[tc.ma] = tc.loai === 'dem_loi' ? '0' : '';
  }
  return out;
}

const so = (n: number) => formatNumberVN(n, { maxFractionDigits: 2 });

/** Form chấm một thùng mẫu — ô to, nút +/− cho lỗi đếm, Đạt/Không cho tiêu chí đạt-không. */
const NhapKetQuaThungDialog: React.FC<Props> = ({ phieu, thung, onClose, onQuetTiep }) => {
  const { t } = useTranslation();
  const luu = useLuuKetQuaThung();
  const [nhap, setNhap] = useState<Nhap>(() => giaTriBanDau(phieu.tieu_chi, thung.ket_qua));
  const [ghiChu, setGhiChu] = useState(thung.ghi_chu ?? '');
  const [tongNhanh, setTongNhanh] = useState(thung.tong_nhanh != null ? String(thung.tong_nhanh) : '');
  const [loiTongNhanh, setLoiTongNhanh] = useState(false);
  const [loi, setLoi] = useState<Record<string, string>>({});
  const [anh, setAnh] = useState<ImageItem[]>(() => urlsToImageItems(thung.hinh_anh_urls));
  const { upload, dangTai } = useUploadAnhThung();
  const khoaLuu = luu.isPending || dangTai;

  const dat = (ma: string, v: string | boolean | null) => {
    setNhap((cur) => ({ ...cur, [ma]: v }));
    setLoi((cur) => {
      if (!cur[ma]) return cur;
      const next = { ...cur };
      delete next[ma];
      return next;
    });
  };

  const goiYNguong = (tc: TieuChi): string | null => {
    if (tc.loai === 'dem_loi') {
      const max = quyDoiNguong(tc.nguong_max, phieu.so_thung_mau);
      return max != null ? t('giamSatChatLuong.nhap.nguongTong', { max: so(max), n: phieu.so_thung_mau }) : null;
    }
    if (tc.loai === 'do_luong') {
      const { nguong_min: a, nguong_max: b } = tc;
      if (a == null && b == null) return null;
      return t('giamSatChatLuong.nhap.nguongTb', { khoang: a != null && b != null ? `${so(a)}–${so(b)}` : a != null ? `≥ ${so(a)}` : `≤ ${so(b!)}` });
    }
    return null;
  };

  const docKetQua = (): KetQuaThung | null => {
    const out: KetQuaThung = {};
    const errs: Record<string, string> = {};
    for (const tc of phieu.tieu_chi) {
      const v = nhap[tc.ma];
      if (tc.loai === 'dat_khong') {
        if (typeof v !== 'boolean') errs[tc.ma] = t('giamSatChatLuong.nhap.chonDatKhong');
        else out[tc.ma] = v;
        continue;
      }
      const s = typeof v === 'string' ? v.trim().replace(',', '.') : '';
      if (s === '') {
        out[tc.ma] = tc.loai === 'dem_loi' ? 0 : null;
        continue;
      }
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) errs[tc.ma] = t('giamSatChatLuong.validation.soKhongHopLe');
      else if (tc.loai === 'dem_loi' && !Number.isInteger(n)) errs[tc.ma] = t('giamSatChatLuong.validation.soNguyen');
      else out[tc.ma] = n;
    }
    setLoi(errs);
    return Object.keys(errs).length ? null : out;
  };

  const submit = (quetTiep: boolean) => {
    const ketQua = docKetQua();
    const tong = docTongNhanh(tongNhanh);
    setLoiTongNhanh(tong == null);
    if (!ketQua || tong == null) {
      toast.error(t('giamSatChatLuong.nhap.conThieu'));
      return;
    }
    luu.mutate(
      {
        idThung: thung.id,
        idPhieu: phieu.id,
        ketQua,
        tongNhanh: tong,
        ghiChu,
        hinhAnhUrls: imageItemsToUrls(anh),
      },
      {
        onSuccess: (p) => {
          if (p.trang_thai === 'hoan_thanh' && p.ket_luan) {
            toast.success(t('giamSatChatLuong.nhap.daXongPhieu', { ket: t(`giamSatChatLuong.ketLuan.${p.ket_luan}`) }));
          } else {
            toast.success(t('giamSatChatLuong.nhap.daLuu', { stt: thung.stt_thung, n: p.so_thung_mau }));
          }
          if (quetTiep && onQuetTiep) onQuetTiep();
          else onClose();
        },
      }
    );
  };

  const nhom = useMemo(
    () => ({
      soDo: phieu.tieu_chi.filter((x) => x.loai === 'do_luong'),
      loi: phieu.tieu_chi.filter((x) => x.loai === 'dem_loi'),
      datKhong: phieu.tieu_chi.filter((x) => x.loai === 'dat_khong'),
    }),
    [phieu.tieu_chi]
  );

  const nhan = (tc: TieuChi) => (
    <div className="min-w-0">
      <div className="text-sm font-medium leading-tight">
        {tc.ten}
        {tc.don_vi && <span className="text-xs text-muted-foreground font-normal"> ({tc.don_vi})</span>}
      </div>
      {goiYNguong(tc) && <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{goiYNguong(tc)}</div>}
      {loi[tc.ma] && <div className="text-xs text-rose-600 mt-0.5">{loi[tc.ma]}</div>}
    </div>
  );

  const oSo = (tc: TieuChi, decimal: boolean) => (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={typeof nhap[tc.ma] === 'string' ? (nhap[tc.ma] as string) : ''}
      onChange={(e) => dat(tc.ma, e.target.value)}
      onFocus={(e) => e.target.select()}
      className={cn(
        'h-11 w-20 rounded-lg border bg-background text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30',
        loi[tc.ma] ? 'border-rose-500' : 'border-border'
      )}
      aria-label={tc.ten}
    />
  );

  const buoc = (tc: TieuChi, d: number) => {
    const cur = Number(typeof nhap[tc.ma] === 'string' ? (nhap[tc.ma] as string) : 0) || 0;
    dat(tc.ma, String(Math.max(0, cur + d)));
  };

  const nutTron =
    'h-11 w-11 rounded-lg border border-border bg-background flex items-center justify-center text-foreground active:scale-95 hover:bg-muted';

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.nhap.title', { stt: thung.stt_thung, n: phieu.so_thung_mau })}
      subtitle={[phieu.so_phieu, phieu.ten_hang_hoa, phieu.ma_cay_hang].filter(Boolean).join(' · ')}
      icon={<ClipboardCheck className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-end gap-2 w-full flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={luu.isPending}>
            {t('common.cancel')}
          </Button>
          {onQuetTiep && (
            <Button type="button" variant="outline" size="sm" onClick={() => submit(true)} disabled={khoaLuu}>
              <ScanLine size={14} className="mr-1.5" />
              {t('giamSatChatLuong.nhap.luuQuetTiep')}
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => submit(false)} disabled={khoaLuu}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {thung.da_kiem && (
          <p className="text-xs rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 m-0">
            {t('giamSatChatLuong.nhap.daKiemTruoc')}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">{t('giamSatChatLuong.nhap.tongNhanh')}</div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t('giamSatChatLuong.nhap.tongNhanhHint')}</div>
            {loiTongNhanh && <div className="text-xs text-rose-600 mt-0.5">{t('giamSatChatLuong.nhap.tongNhanhLoi')}</div>}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={tongNhanh}
            onChange={(e) => {
              setTongNhanh(e.target.value);
              setLoiTongNhanh(false);
            }}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-11 w-20 rounded-lg border bg-background text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30',
              loiTongNhanh ? 'border-rose-500' : 'border-border'
            )}
            aria-label={t('giamSatChatLuong.nhap.tongNhanh')}
          />
        </div>

        {nhom.soDo.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {nhom.soDo.map((tc) => (
              <div key={tc.ma} className="flex items-center justify-between gap-3">
                {nhan(tc)}
                {oSo(tc, true)}
              </div>
            ))}
          </div>
        )}

        {nhom.loi.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('giamSatChatLuong.nhap.nhomLoi')}
            </div>
            {nhom.loi.map((tc) => (
              <div key={tc.ma} className="flex items-center justify-between gap-3">
                {nhan(tc)}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" className={nutTron} onClick={() => buoc(tc, -1)} aria-label="-1">
                    <Minus size={16} />
                  </button>
                  {oSo(tc, false)}
                  <button type="button" className={nutTron} onClick={() => buoc(tc, 1)} aria-label="+1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {nhom.datKhong.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {nhom.datKhong.map((tc) => (
              <div key={tc.ma} className="flex items-center justify-between gap-3">
                {nhan(tc)}
                <div className="flex gap-1.5 shrink-0">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => dat(tc.ma, v)}
                      className={cn(
                        'h-11 px-3 rounded-lg border text-sm font-medium inline-flex items-center gap-1 active:scale-95',
                        nhap[tc.ma] === v
                          ? v
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {v ? <Check size={15} /> : <X size={15} />}
                      {t(v ? 'giamSatChatLuong.nhap.dat' : 'giamSatChatLuong.nhap.khong')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Textarea
          label={t('giamSatChatLuong.col.ghiChu')}
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          rows={2}
        />

        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('giamSatChatLuong.anhThung.title')}
          </div>
          <MultiImageInput
            value={anh}
            onChange={setAnh}
            uploadFile={upload}
            maxFiles={MAX_ANH_THUNG}
            maxSizeMB={MAX_MB_ANH_GOC}
            columns={3}
            placeholder={t('giamSatChatLuong.anhThung.placeholder')}
            hint={t('giamSatChatLuong.anhThung.hint', { max: MAX_ANH_THUNG })}
          />
        </div>
      </div>
    </GenericDrawer>
  );
};

export default NhapKetQuaThungDialog;
