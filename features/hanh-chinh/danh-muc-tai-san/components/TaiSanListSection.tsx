/**
 * Bảng con danh sách tài sản dùng trong Detail của Nơi lưu / Nhóm / Trạng thái.
 * Hiển thị một phần tài sản + link "Xem tất cả" sang Danh sách tài sản (có filter).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ExternalLink } from 'lucide-react';
import DetailSection from '../../../../components/shared/DetailSection';
import { formatCurrency } from '../../../../lib/utils';
import type { TaiSan } from '../core/types';

const MAX_ROWS = 8;

interface Props {
  title: string;
  assets: TaiSan[];
  viewAllHref: string;
  viewAllLabel: string;
  emptyMessage?: string;
}

const TaiSanListSection: React.FC<Props> = ({
  title,
  assets,
  viewAllHref,
  viewAllLabel,
  emptyMessage,
}) => {
  const { t } = useTranslation();
  const displayList = assets.slice(0, MAX_ROWS);
  const hasMore = assets.length > MAX_ROWS;

  return (
    <DetailSection title={title} icon={<Building2 size={14} />} variant="primary">
      <div className="space-y-3">
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {emptyMessage ?? t('common.noData')}
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                        {t('danhSachTaiSan.store.maCol')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                        {t('danhSachTaiSan.store.tenCol')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                        {t('danhSachTaiSan.store.nhomCol')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                        {t('danhSachTaiSan.store.nguoiGiuCol')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                        {t('danhSachTaiSan.store.nguyenGiaCol')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((row) => (
                      <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{row.ma_tai_san || '—'}</td>
                        <td className="px-3 py-2">{row.ten_tai_san || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.ten_nhom || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.ten_nhan_vien_dang_giu || '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.nguyen_gia != null ? formatCurrency(row.nguyen_gia) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground tabular-nums">
                {assets.length} {t('danhSachTaiSan.detail.assetCountLabel')}
                {hasMore && ` (${t('danhSachTaiSan.detail.showingFirst', { n: MAX_ROWS })})`}
              </span>
              <a
                href={viewAllHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink size={14} />
                {viewAllLabel}
              </a>
            </div>
          </>
        )}
      </div>
    </DetailSection>
  );
};

export default TaiSanListSection;
