import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { getKetQuaLabelPT, KET_QUA_SEMANTIC_PT } from '../core/constants';
import { getPhieuKhoPTPreviewUrl } from '../core/preview-url';
import { getLechKiemKePT } from '../core/ket-qua';
import type { ChiTietKiemKePT } from '../core/types';

interface Props {
  data: ChiTietKiemKePT[];
  showActions?: boolean;
  isDangKiemKe?: boolean;
  onNhapKetQua?: (item: ChiTietKiemKePT) => void;
  onDieuChinh?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKePT) => void;
  dieuChinhLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
}

const TH = 'px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap';
const TD = 'px-4 py-2.5';

/**
 * Bảng con chi tiết kiểm kê — chỉ `<thead>`/`<tbody>` để đặt trong
 * `GenericSubTableSection`. Trước đây đây là một `GenericTable` đầy đủ (checkbox,
 * phân trang, store cột riêng) nhúng trong drawer, lệch chuẩn bảng con của app.
 */
const ChiTietKiemKePTSubTable: React.FC<Props> = ({
  data,
  showActions = false,
  isDangKiemKe = false,
  onNhapKetQua,
  onDieuChinh,
  onDelete,
  dieuChinhLoading,
  nhapKetQuaLoading,
  deleteLoading,
}) => {
  const { t } = useTranslation();

  const rowCanDieuChinh = (item: ChiTietKiemKePT) =>
    Boolean(
      isDangKiemKe &&
        onDieuChinh &&
        showActions &&
        !item.id_phieu_kho_dieu_chinh &&
        item.so_luong_thuc_te != null &&
        item.so_luong_thuc_te !== item.so_luong_so
    );

  return (
    <>
      <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
        <tr>
          <th className={cn(TH, 'w-10')}>#</th>
          <th className={cn(TH, 'min-w-[120px]')}>{t('kiemKeKhoPT.store.khoCol')}</th>
          <th className={cn(TH, 'min-w-[160px]')}>{t('kiemKeKhoPT.store.hangHoaCol')}</th>
          <th className={cn(TH, 'w-20')}>{t('kiemKeKhoPT.store.dvtCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKhoPT.store.soLuongSoCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKhoPT.store.soLuongThucTeCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKhoPT.detail.chenhLech')}</th>
          <th className={cn(TH, 'min-w-[110px]')}>{t('kiemKeKhoPT.store.ketQuaCol')}</th>
          <th className={cn(TH, 'min-w-[140px]')}>{t('kiemKeKhoPT.store.dieuChinhCol')}</th>
          <th className={cn(TH, 'min-w-[140px]')}>{t('kiemKeKhoPT.store.ghiChuCol')}</th>
          {showActions && <th className={cn(TH, 'w-[110px] text-center')}>{t('common.actions')}</th>}
        </tr>
      </thead>
      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
        {data.map((item, idx) => {
          const lech = getLechKiemKePT(item);
          return (
            <tr key={item.id} className="hover:bg-muted/60 transition-colors">
              <td className={cn(TD, 'text-muted-foreground tabular-nums')}>{idx + 1}</td>
              <td className={cn(TD, 'text-body-sm')}>{item.ten_kho || item.ma_kho || '—'}</td>
              <td className={TD}>
                <div className="min-w-0">
                  <span className="text-body-sm">{item.ten_hang || item.ma_hang || '—'}</span>
                  {item.ma_hang && (
                    <span className="text-caption text-muted-foreground block">{item.ma_hang}</span>
                  )}
                </div>
              </td>
              <td className={cn(TD, 'text-caption text-muted-foreground')}>{item.don_vi_tinh || '—'}</td>
              <td className={cn(TD, 'tabular-nums text-right')}>{formatNumberVN(item.so_luong_so)}</td>
              <td className={cn(TD, 'tabular-nums text-right')}>
                {item.so_luong_thuc_te != null ? formatNumberVN(item.so_luong_thuc_te) : '—'}
              </td>
              <td
                className={cn(
                  TD,
                  'tabular-nums text-right font-medium',
                  lech != null && lech < 0 && 'text-rose-600 dark:text-rose-400',
                  lech != null && lech > 0 && 'text-violet-600 dark:text-violet-400'
                )}
              >
                {lech == null ? '—' : lech > 0 ? `+${formatNumberVN(lech)}` : formatNumberVN(lech)}
              </td>
              <td className={TD}>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                    getStatusBadgeClass(KET_QUA_SEMANTIC_PT[item.ket_qua])
                  )}
                >
                  {getKetQuaLabelPT(item.ket_qua, t)}
                </span>
              </td>
              <td className={TD}>
                {item.id_phieu_kho_dieu_chinh ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {t('kiemKeKhoPT.dieuChinhStatus.done')}
                    </span>
                    {item.so_luong_dieu_chinh != null && (
                      <span className="text-caption text-muted-foreground tabular-nums">
                        {formatNumberVN(item.so_luong_dieu_chinh)}
                      </span>
                    )}
                    <Tooltip content={t('kiemKeKhoPT.table.xemPhieuDieuChinh')} placement="top">
                      <a
                        href={getPhieuKhoPTPreviewUrl(item.id_phieu_kho_dieu_chinh)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-primary hover:bg-primary/10 rounded-md inline-flex"
                        aria-label={t('kiemKeKhoPT.table.xemPhieuDieuChinh')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </Tooltip>
                  </div>
                ) : (
                  <span className="text-caption text-muted-foreground">
                    {t('kiemKeKhoPT.dieuChinhStatus.pending')}
                  </span>
                )}
              </td>
              <td className={cn(TD, 'text-caption text-muted-foreground')}>{item.ghi_chu_dong || '—'}</td>
              {showActions && (
                <td className={TD}>
                  <div className="flex items-center justify-center gap-0.5">
                    {rowCanDieuChinh(item) && onDieuChinh && (
                      <Tooltip content={t('kiemKeKhoPT.dieuChinhTonTheoKetQua')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDieuChinh(item.id);
                          }}
                          disabled={dieuChinhLoading}
                          className="p-1.5 text-secondary-foreground hover:bg-muted rounded-md transition-all"
                          aria-label={t('kiemKeKhoPT.dieuChinhTonTheoKetQua')}
                        >
                          <RefreshCw size={14} />
                        </button>
                      </Tooltip>
                    )}
                    {isDangKiemKe && onNhapKetQua && (
                      <Tooltip content={t('kiemKeKhoPT.table.nhapKetQua')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNhapKetQua(item);
                          }}
                          disabled={nhapKetQuaLoading}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                          aria-label={t('kiemKeKhoPT.table.nhapKetQua')}
                        >
                          <PenLine size={14} />
                        </button>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip content={t('kiemKeKhoPT.table.xoaDong')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                          disabled={deleteLoading}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                          aria-label={t('kiemKeKhoPT.table.xoaDong')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </>
  );
};

export default ChiTietKiemKePTSubTable;
