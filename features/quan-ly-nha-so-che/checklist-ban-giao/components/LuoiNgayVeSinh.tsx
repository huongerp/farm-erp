import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { DongPhieuChecklist } from '../core/types';
import { THU_TRONG_TUAN, kqKeTiep, ngayCuaThu, nhanThu } from '../../checklist-mau/core/ve-sinh-tuan';
import { useTichNgayVeSinh } from '../hooks/use-checklist-ban-giao';

interface Props {
  dong: DongPhieuChecklist;
  idPhieu: string;
  /** Thứ Hai đầu tuần (phiếu.ngay) */
  tuan: string;
  coTheSua: boolean;
}

/**
 * Lưới T2–CN của một hạng mục phiếu vệ sinh tuần. Ô có lịch bấm vòng trống → Đạt → K.Đạt → trống,
 * lưu ngay (RPC rpc_cl_vs_tich); ô không có lịch gạch chéo, không bấm được.
 */
const LuoiNgayVeSinh: React.FC<Props> = ({ dong, idPhieu, tuan, coTheSua }) => {
  const { t } = useTranslation();
  const tich = useTichNgayVeSinh();
  const lich = dong.ngay_lich ?? [];

  return (
    <div className="grid grid-cols-7 gap-1">
      {THU_TRONG_TUAN.map((thu) => {
        const coLich = lich.includes(thu);
        const v = dong.kq_ngay[String(thu)] ?? null;
        const ngay = ngayCuaThu(tuan, thu);
        const dinhDang = `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`;
        const bam = coLich && coTheSua;
        return (
          <button
            key={thu}
            type="button"
            disabled={!bam || tich.isPending}
            onClick={() =>
              tich.mutate({ idDong: dong.id, idPhieu, thu, kq: kqKeTiep(v), lich, kqNgayCu: dong.kq_ngay })
            }
            title={coLich ? undefined : t('checklistBanGiao.vs.khongLich')}
            aria-label={`${nhanThu(thu)} ${dinhDang}`}
            className={cn(
              'flex h-14 min-w-0 flex-col items-center justify-center rounded-lg border text-[11px] leading-tight transition-all',
              bam && 'active:scale-95',
              !coLich &&
                'border-dashed border-border bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgb(0_0_0/0.05)_4px,rgb(0_0_0/0.05)_8px)] text-muted-foreground/50 dark:bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgb(255_255_255/0.06)_4px,rgb(255_255_255/0.06)_8px)]',
              coLich && v === 'dat' && 'border-emerald-600 bg-emerald-600 text-white',
              coLich && v === 'khong_dat' && 'border-rose-600 bg-rose-600 text-white',
              coLich && v == null && 'border-border bg-card text-foreground',
              coLich && v == null && bam && 'hover:bg-muted',
              tich.isPending && bam && 'opacity-70'
            )}
          >
            <span className="font-semibold">{nhanThu(thu)}</span>
            <span className={cn('tabular-nums', v == null && 'text-muted-foreground')}>{dinhDang}</span>
            <span className="h-3.5">
              {coLich && v === 'dat' && <Check size={14} />}
              {coLich && v === 'khong_dat' && <X size={14} />}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default LuoiNgayVeSinh;
