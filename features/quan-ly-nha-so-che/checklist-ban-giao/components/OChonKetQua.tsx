import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Save, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import type { DongPhieuChecklist, KetQuaCl } from '../core/types';
import { useLuuDongKiemTra, useLuuDongThucHien } from '../hooks/use-checklist-ban-giao';
import { KetQuaTick } from './Badges';

interface Props {
  dong: DongPhieuChecklist;
  idPhieu: string;
  cot: 'kq_thuc_hien' | 'kq_kiem_tra';
  coTheSua: boolean;
  /** Phiếu vệ sinh tuần: kết quả dòng do lưới ngày tính → ẩn nút Đạt/K.Đạt, chỉ hiện kết quả + ô ghi chú. */
  ketQuaTuDong?: boolean;
}

/**
 * Ô tích một cột (khâu làm / khâu kiểm tra): bấm Đạt / K.Đạt lưu ngay; nút mở ghi chú để
 * điền tình trạng khắc phục / người xử lý / ghi chú rồi Lưu.
 */
const OChonKetQua: React.FC<Props> = ({ dong, idPhieu, cot, coTheSua, ketQuaTuDong = false }) => {
  const { t } = useTranslation();
  const isThucHien = cot === 'kq_thuc_hien';
  const kq = dong[cot];
  const tung = isThucHien ? dong.qlx_tung_khong_dat : dong.gs_tung_khong_dat;
  const nhanTung = kq === 'dat' && tung && (
    <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
      {t('checklistBanGiao.oChon.tungKhongDat')}
    </span>
  );
  const luuThucHien = useLuuDongThucHien();
  const luuKiemTra = useLuuDongKiemTra();

  const [mo, setMo] = useState(false);
  const [kp, setKp] = useState(dong.tinh_trang_khac_phuc ?? '');
  const [nguoi, setNguoi] = useState(dong.nguoi_xu_ly ?? '');
  const [ghi, setGhi] = useState(isThucHien ? (dong.ghi_chu ?? '') : (dong.ghi_chu_kiem_tra ?? ''));

  // Dòng đổi (tải lại sau lưu / mở phiếu khác) → đồng bộ lại giá trị đã lưu.
  useEffect(() => {
    setKp(dong.tinh_trang_khac_phuc ?? '');
    setNguoi(dong.nguoi_xu_ly ?? '');
    setGhi(isThucHien ? (dong.ghi_chu ?? '') : (dong.ghi_chu_kiem_tra ?? ''));
    setMo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dong.id]);

  // Lưới ngày vừa làm dòng thành K.Đạt → mở sẵn ô ghi tình trạng khắc phục (bắt buộc trước khi Chuyển).
  useEffect(() => {
    if (ketQuaTuDong && coTheSua && kq === 'khong_dat' && !(dong.tinh_trang_khac_phuc ?? '').trim()) setMo(true);
  }, [ketQuaTuDong, coTheSua, kq, dong.tinh_trang_khac_phuc]);

  if (!coTheSua) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <KetQuaTick value={kq} />
          {nhanTung}
        </div>
        {isThucHien ? (
          (dong.ghi_chu || dong.tinh_trang_khac_phuc || dong.nguoi_xu_ly) && (
            <p className="text-xs text-muted-foreground m-0 line-clamp-2">
              {[dong.nguoi_xu_ly, dong.tinh_trang_khac_phuc, dong.ghi_chu].filter(Boolean).join(' · ')}
            </p>
          )
        ) : (
          dong.ghi_chu_kiem_tra && <p className="text-xs text-muted-foreground m-0 line-clamp-2">{dong.ghi_chu_kiem_tra}</p>
        )}
      </div>
    );
  }

  const chon = (v: KetQuaCl | null) => {
    // K.Đạt ở khâu làm phải ghi tình trạng & biện pháp khắc phục → mở sẵn ô nhập.
    if (isThucHien && v === 'khong_dat') setMo(true);
    if (isThucHien) {
      luuThucHien.mutate({
        idDong: dong.id,
        idPhieu,
        kq_thuc_hien: v,
        tinh_trang_khac_phuc: kp.trim() || null,
        nguoi_xu_ly: nguoi.trim() || null,
        ghi_chu: ghi.trim() || null,
      });
    } else {
      luuKiemTra.mutate({ idDong: dong.id, idPhieu, kq_kiem_tra: v, ghi_chu_kiem_tra: ghi.trim() || null });
    }
  };

  const luu = () => chon(kq);

  const daLuuGhi = isThucHien ? (dong.ghi_chu ?? '') : (dong.ghi_chu_kiem_tra ?? '');
  const chuaLuu =
    ghi.trim() !== daLuuGhi.trim() ||
    (isThucHien && (kp.trim() !== (dong.tinh_trang_khac_phuc ?? '').trim() || nguoi.trim() !== (dong.nguoi_xu_ly ?? '').trim()));
  const hienKhacPhuc = isThucHien && (kq === 'khong_dat' || dong.qlx_tung_khong_dat || !!dong.tinh_trang_khac_phuc);

  const pending = isThucHien ? luuThucHien.isPending : luuKiemTra.isPending;

  const btn = (v: KetQuaCl, label: string, activeClass: string) => (
    <button
      type="button"
      disabled={pending}
      // Bấm lại nút đang chọn không xoá kết quả (tránh bấm nhầm làm mất dấu Không đạt).
      onClick={() => {
        if (kq !== v) chon(v);
      }}
      className={cn(
        'inline-flex h-11 flex-1 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50',
        kq === v ? activeClass : 'border-border text-muted-foreground hover:bg-muted'
      )}
    >
      {v === 'dat' ? <Check size={16} /> : <X size={16} />}
      {label}
    </button>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {ketQuaTuDong ? (
          <div className="flex min-h-11 flex-1 min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span>{t('checklistBanGiao.vs.ketQuaTuan')}:</span>
            <KetQuaTick value={kq} />
          </div>
        ) : (
          <>
            {btn('dat', t('checklistBanGiao.ketQua.dat'), 'border-emerald-600 bg-emerald-600 text-white')}
            {btn('khong_dat', t('checklistBanGiao.ketQua.khongDat'), 'border-rose-600 bg-rose-600 text-white')}
          </>
        )}
        <button
          type="button"
          onClick={() => setMo((v) => !v)}
          className={cn(
            'h-11 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted',
            mo && 'bg-muted'
          )}
          aria-label={t('checklistBanGiao.oChon.ghiChu')}
          title={t('checklistBanGiao.oChon.ghiChu')}
        >
          <ChevronDown size={13} className={cn('transition-transform', mo && 'rotate-180')} />
        </button>
      </div>
      {nhanTung}

      {mo && (
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-2">
          {isThucHien && (
            <>
              {hienKhacPhuc && (
                <div className="space-y-1">
                  <Textarea
                    rows={2}
                    label={t('checklistBanGiao.oChon.tinhTrangKhacPhuc')}
                    required={kq === 'khong_dat'}
                    value={kp}
                    onChange={(e) => setKp(e.target.value)}
                    placeholder={t('checklistBanGiao.oChon.tinhTrangKhacPhucPh')}
                  />
                  <p className="m-0 text-[11px] text-muted-foreground">{t('checklistBanGiao.oChon.goiYKhacPhuc')}</p>
                </div>
              )}
              <Input
                label={t('checklistBanGiao.oChon.nguoiXuLy')}
                value={nguoi}
                onChange={(e) => setNguoi(e.target.value)}
              />
            </>
          )}
          <Textarea
            rows={2}
            label={t('checklistBanGiao.oChon.ghiChu')}
            value={ghi}
            onChange={(e) => setGhi(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            {chuaLuu && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">{t('checklistBanGiao.oChon.chuaLuu')}</span>}
            <Button type="button" size="sm" variant={chuaLuu ? 'default' : 'outline'} onClick={luu} disabled={pending}>
              <Save size={13} className="mr-1" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OChonKetQua;
