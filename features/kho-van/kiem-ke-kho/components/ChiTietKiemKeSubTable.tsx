import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { getKetQuaLabel, KET_QUA_SEMANTIC } from '../core/constants';
import type { ChiTietKiemKeKho } from '../core/types';

const getPhieuKhoDieuChinhPreviewUrl = (idPhieu: string) =>
  `/mua-hang/phieu-kho/preview/${encodeURIComponent(idPhieu)}`;

interface Props {
  data: ChiTietKiemKeKho[];
  showActions?: boolean;
  isDangKiemKe?: boolean;
  onNhapKetQua?: (item: ChiTietKiemKeKho) => void;
  onDieuChinh?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKeKho) => void;
  dieuChinhLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
}

/** Lệch = thực tế − sổ; `null` khi chưa nhập kết quả. */
function getLech(item: ChiTietKiemKeKho): number | null {
  return item.so_luong_thuc_te == null ? null : item.so_luong_thuc_te - item.so_luong_so;
}

const TH = 'px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap';
const TD = 'px-4 py-2.5';

/**
 * Bảng con chi tiết kiểm kê — chỉ `<thead>`/`<tbody>` để đặt trong
 * `GenericSubTableSection`. Trước đây đây là một `GenericTable` đầy đủ (checkbox,
 * phân trang, store cột riêng) nhúng trong drawer, lệch chuẩn bảng con của app.
 */
const ChiTietKiemKeSubTable: React.FC<Props> = ({
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

  const rowCanDieuChinh = (item: ChiTietKiemKeKho) =>
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
          <th className={cn(TH, 'min-w-[120px]')}>{t('kiemKeKho.store.khoCol')}</th>
          <th className={cn(TH, 'min-w-[160px]')}>{t('kiemKeKho.store.hangHoaCol')}</th>
          <th className={cn(TH, 'w-20')}>{t('kiemKeKho.store.dvtCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKho.store.soLuongSoCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKho.store.soLuongThucTeCol')}</th>
          <th className={cn(TH, 'w-24 text-right')}>{t('kiemKeKho.detail.chenhLech')}</th>
          <th className={cn(TH, 'min-w-[110px]')}>{t('kiemKeKho.store.ketQuaCol')}</th>
          <th className={cn(TH, 'min-w-[140px]')}>{t('kiemKeKho.store.dieuChinhCol')}</th>
          <th className={cn(TH, 'min-w-[140px]')}>{t('kiemKeKho.store.ghiChuCol')}</th>
          {showActions && <th className={cn(TH, 'w-[110px] text-center')}>{t('common.actions')}</th>}
        </tr>
      </thead>
      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
        {data.map((item, idx) => {
          const lech = getLech(item);
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
                    getStatusBadgeClass(KET_QUA_SEMANTIC[item.ket_qua])
                  )}
                >
                  {getKetQuaLabel(item.ket_qua, t)}
                </span>
              </td>
              <td className={TD}>
                {item.id_phieu_kho_dieu_chinh ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {t('kiemKeKho.dieuChinhStatus.done')}
                    </span>
                    {item.so_luong_dieu_chinh != null && (
                      <span className="text-caption text-muted-foreground tabular-nums">
                        {formatNumberVN(item.so_luong_dieu_chinh)}
                      </span>
                    )}
                    <Tooltip content={t('kiemKeKho.table.xemPhieuDieuChinh')} placement="top">
                      <a
                        href={getPhieuKhoDieuChinhPreviewUrl(item.id_phieu_kho_dieu_chinh)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-primary hover:bg-primary/10 rounded-md inline-flex"
                        aria-label={t('kiemKeKho.table.xemPhieuDieuChinh')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </Tooltip>
                  </div>
                ) : (
                  <span className="text-caption text-muted-foreground">
                    {t('kiemKeKho.dieuChinhStatus.pending')}
                  </span>
                )}
              </td>
              <td className={cn(TD, 'text-caption text-muted-foreground')}>{item.ghi_chu_dong || '—'}</td>
              {showActions && (
                <td className={TD}>
                  <div className="flex items-center justify-center gap-0.5">
                    {rowCanDieuChinh(item) && onDieuChinh && (
                      <Tooltip content={t('kiemKeKho.dieuChinhTonTheoKetQua')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDieuChinh(item.id);
                          }}
                          disabled={dieuChinhLoading}
                          className="p-1.5 text-secondary-foreground hover:bg-muted rounded-md transition-all"
                          aria-label={t('kiemKeKho.dieuChinhTonTheoKetQua')}
                        >
                          <RefreshCw size={14} />
                        </button>
                      </Tooltip>
                    )}
                    {isDangKiemKe && onNhapKetQua && (
                      <Tooltip content={t('kiemKeKho.table.nhapKetQua')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNhapKetQua(item);
                          }}
                          disabled={nhapKetQuaLoading}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                          aria-label={t('kiemKeKho.table.nhapKetQua')}
                        >
                          <PenLine size={14} />
                        </button>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip content={t('kiemKeKho.table.xoaDong')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                          disabled={deleteLoading}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                          aria-label={t('kiemKeKho.table.xoaDong')}
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

export default ChiTietKiemKeSubTable;
