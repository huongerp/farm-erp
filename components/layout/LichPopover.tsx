import { useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Cake, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  canChiNam,
  canChiNgay,
  canChiThang,
  duongSangAm,
  gioHoangDao,
  jdTuNgay,
  soTuanIso,
  tietKhi,
  type NgayAm,
} from '../../lib/am-lich';
import AvatarWithFallback from '../ui/AvatarWithFallback';
import { useSinhNhatNhanVien } from '../../features/he-thong/nhan-vien/hooks/use-sinh-nhat';
import { sinhNhatTrongKhoang } from '../../features/he-thong/nhan-vien/utils/sinh-nhat';

export interface NgayDuong {
  y: number;
  m: number;
  d: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const khoaNgay = ({ y, m, d }: NgayDuong) => `${y}-${pad(m)}-${pad(d)}`;
const cungNgay = (a: NgayDuong, b: NgayDuong) => a.y === b.y && a.m === b.m && a.d === b.d;

function congNgay({ y, m, d }: NgayDuong, soNgay: number): NgayDuong {
  const t = new Date(Date.UTC(y, m - 1, d + soNgay));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = Thứ 2 … 6 = Chủ nhật */
const thuTrongTuan = ({ y, m, d }: NgayDuong) => (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;

const KHOA_THU_NGAN = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const KHOA_THU_DAY = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

interface OLich {
  ngay: NgayDuong;
  am: NgayAm;
  trongThang: boolean;
}

interface LichPopoverProps {
  homNay: NgayDuong;
}

/**
 * Panel lịch sổ ra từ đồng hồ trên header: âm lịch của ngày đang chọn, lịch tháng
 * dương kèm ngày âm, và sinh nhật nhân viên trong tuần hiện tại.
 * Nằm chunk riêng — chỉ tải khi người dùng bấm vào đồng hồ.
 */
const LichPopover: FC<LichPopoverProps> = ({ homNay }) => {
  const { t } = useTranslation();
  const [ngayChon, setNgayChon] = useState<NgayDuong>(homNay);
  const [thangXem, setThangXem] = useState({ y: homNay.y, m: homNay.m });

  const luoi = useMemo(() => {
    const dauThang = { y: thangXem.y, m: thangXem.m, d: 1 };
    const batDau = congNgay(dauThang, -thuTrongTuan(dauThang));
    const o: OLich[] = [];
    for (let i = 0; i < 42; i++) {
      const ngay = congNgay(batDau, i);
      o.push({ ngay, am: duongSangAm(ngay.d, ngay.m, ngay.y), trongThang: ngay.m === thangXem.m });
    }
    return o;
  }, [thangXem]);

  const { data: dsSinhNhat, isPending: dangTaiSinhNhat, isError: loiSinhNhat } = useSinhNhatNhanVien();

  const ngayCoSinhNhat = useMemo(() => {
    if (!dsSinhNhat) return new Set<string>();
    return new Set(sinhNhatTrongKhoang(dsSinhNhat, khoaNgay(luoi[0].ngay), khoaNgay(luoi[41].ngay)).map((x) => x.ngayDuong));
  }, [dsSinhNhat, luoi]);

  const sinhNhatTuanNay = useMemo(() => {
    if (!dsSinhNhat) return [];
    const thu2 = congNgay(homNay, -thuTrongTuan(homNay));
    return sinhNhatTrongKhoang(dsSinhNhat, khoaNgay(thu2), khoaNgay(congNgay(thu2, 6)));
  }, [dsSinhNhat, homNay]);

  const chiTiet = useMemo(() => {
    const jd = jdTuNgay(ngayChon.d, ngayChon.m, ngayChon.y);
    const am = duongSangAm(ngayChon.d, ngayChon.m, ngayChon.y);
    return { jd, am, gio: gioHoangDao(jd) };
  }, [ngayChon]);

  const doiThang = (buoc: number) =>
    setThangXem(({ y, m }) => {
      const t0 = new Date(Date.UTC(y, m - 1 + buoc, 1));
      return { y: t0.getUTCFullYear(), m: t0.getUTCMonth() + 1 };
    });

  const chonNgay = (ngay: NgayDuong) => {
    setNgayChon(ngay);
    if (ngay.m !== thangXem.m || ngay.y !== thangXem.y) setThangXem({ y: ngay.y, m: ngay.m });
  };

  const veHomNay = () => chonNgay(homNay);

  const nhanNgayAm = (am: NgayAm) =>
    am.ngay === 1 ? `${am.ngay}/${am.thang}${am.nhuan ? t('clock.leapShort') : ''}` : String(am.ngay);

  const { am } = chiTiet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      role="dialog"
      aria-label={t('clock.calendar')}
      className="bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto"
    >
      {/* 1. Âm lịch của ngày đang chọn */}
      <div className="flex gap-3 p-4 border-b border-border">
        <div className="flex flex-col items-center justify-center w-16 shrink-0 rounded-lg bg-primary/10 text-primary py-2">
          <span className="text-3xl font-bold leading-none tabular-nums">{ngayChon.d}</span>
          <span className="text-2xs font-medium mt-1">{t(`clock.${KHOA_THU_DAY[thuTrongTuan(ngayChon)]}`)}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {t('clock.lunarDate', {
              ngay: am.ngay,
              thang: am.thang,
              nhuan: am.nhuan ? t('clock.leapSuffix') : '',
              nam: canChiNam(am.nam),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('clock.dayCanChi')} <span className="text-foreground">{canChiNgay(chiTiet.jd)}</span>
            {' · '}
            {t('clock.monthCanChi')} <span className="text-foreground">{canChiThang(am.thang, am.nam)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('clock.solarTerm')} <span className="text-foreground">{tietKhi(chiTiet.jd)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('clock.goodHours')}{' '}
            <span className="text-foreground">
              {chiTiet.gio.map((g) => `${g.chi} (${g.tu}–${g.den}h)`).join(', ')}
            </span>
          </p>
        </div>
      </div>

      {/* 2. Lịch tháng */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => doiThang(-1)}
            aria-label={t('clock.prevMonth')}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t('clock.monthTitle', { m: thangXem.m, y: thangXem.y })}
            </span>
            <button
              type="button"
              onClick={veHomNay}
              className="text-xs font-medium text-primary px-2 py-0.5 rounded-md hover:bg-primary/10"
            >
              {t('clock.today')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => doiThang(1)}
            aria-label={t('clock.nextMonth')}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-y-0.5 text-center">
          <span className="text-2xs text-muted-foreground/70 py-1" title={t('clock.weekNumber')}>
            #
          </span>
          {KHOA_THU_NGAN.map((k, i) => (
            <span
              key={k}
              className={cn('text-2xs font-medium py-1', i === 6 ? 'text-destructive' : 'text-muted-foreground')}
            >
              {t(`clock.dowShort.${k}`)}
            </span>
          ))}

          {Array.from({ length: 6 }, (_, hang) => {
            const oHang = luoi.slice(hang * 7, hang * 7 + 7);
            const { tuan } = soTuanIso(oHang[0].ngay.y, oHang[0].ngay.m, oHang[0].ngay.d);
            return [
              <span key={`w${hang}`} className="text-2xs text-muted-foreground/70 tabular-nums flex items-center justify-center">
                {tuan}
              </span>,
              ...oHang.map((o, cot) => {
                const laHomNay = cungNgay(o.ngay, homNay);
                const dangChon = cungNgay(o.ngay, ngayChon);
                const ngayDacBiet = o.am.ngay === 1 || o.am.ngay === 15;
                return (
                  <button
                    key={khoaNgay(o.ngay)}
                    type="button"
                    onClick={() => chonNgay(o.ngay)}
                    aria-current={laHomNay ? 'date' : undefined}
                    aria-pressed={dangChon}
                    className={cn(
                      'relative flex flex-col items-center justify-center h-10 rounded-lg transition-colors',
                      dangChon ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                      !dangChon && laHomNay && 'ring-1 ring-primary',
                      !o.trongThang && !dangChon && 'opacity-40'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm leading-none tabular-nums',
                        laHomNay && 'font-bold',
                        !dangChon && (cot === 6 ? 'text-destructive' : 'text-foreground')
                      )}
                    >
                      {o.ngay.d}
                    </span>
                    <span
                      className={cn(
                        'text-2xs leading-none mt-0.5 tabular-nums',
                        dangChon
                          ? 'text-primary-foreground/80'
                          : ngayDacBiet
                            ? 'text-destructive font-semibold'
                            : 'text-muted-foreground'
                      )}
                    >
                      {nhanNgayAm(o.am)}
                    </span>
                    {ngayCoSinhNhat.has(khoaNgay(o.ngay)) && (
                      <span
                        className={cn(
                          'absolute top-1 right-1 h-1.5 w-1.5 rounded-full',
                          dangChon ? 'bg-primary-foreground' : 'bg-pink-500'
                        )}
                        aria-label={t('clock.birthday')}
                      />
                    )}
                  </button>
                );
              }),
            ];
          })}
        </div>
      </div>

      {/* 3. Sinh nhật tuần này */}
      <div className="border-t border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
          <Cake size={14} className="text-pink-500" />
          {t('clock.birthdaysThisWeek')}
        </p>
        {dangTaiSinhNhat ? (
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        ) : loiSinhNhat ? (
          <p className="text-xs text-muted-foreground">{t('clock.birthdayError')}</p>
        ) : sinhNhatTuanNay.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('clock.noBirthdays')}</p>
        ) : (
          <ul className="space-y-1.5">
            {sinhNhatTuanNay.map((nv) => {
              const [y, m, d] = nv.ngayDuong.split('-').map(Number);
              const ngay = { y, m, d };
              const laHomNay = cungNgay(ngay, homNay);
              return (
                <li key={`${nv.id}-${nv.ngayDuong}`} className="flex items-center gap-2">
                  <AvatarWithFallback src={nv.anh_dai_dien} name={nv.ho_ten} seed={nv.id} size="xs" rounded="full" />
                  <span className="text-sm text-foreground truncate flex-1">{nv.ho_ten}</span>
                  {laHomNay && (
                    <span className="text-2xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">
                      {t('clock.today')}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {t(`clock.dowShort.${KHOA_THU_NGAN[thuTrongTuan(ngay)]}`)}, {pad(d)}/{pad(m)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default LichPopover;
