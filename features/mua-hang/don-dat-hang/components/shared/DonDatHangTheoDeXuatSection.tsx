import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import Tooltip from '../../../../../components/ui/Tooltip';
import { cn, formatDate, formatNumberVN } from '../../../../../lib/utils';
import { useModulePermission } from '../../../../he-thong/phan-quyen/hooks/use-module-permission';
import { useKhoList } from '../../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useDonDatHangByPhieuDeXuat, useDonDatHangById } from '../../hooks/use-don-dat-hang';
import { DON_DAT_HANG_MODULE_ID, useDonDatHangServerScope } from '../../hooks/use-don-dat-hang-view-scope';
import { STATUS_VARIANTS, TRANG_THAI_KEY } from '../../core/constants';
import type { DonDatHang } from '../../core/types';
import DonDatHangDetail from '../DonDatHangDetail';

export interface DonDatHangTheoDeXuatSectionProps {
  idPhieuDeXuat: string | number;
  /** Mở form tạo đơn từ phiếu đề xuất (luồng sẵn có của module đề xuất). */
  onAdd?: () => void;
  /** Tầng drawer cho drawer đơn mở từ section. */
  stackLevel?: number;
  className?: string;
}

/**
 * Section "Đơn đặt hàng" trong drawer chi tiết Phiếu đề xuất vật tư: các đơn có
 * `id_phieu_de_xuat_vat_tu` = phiếu này. Bấm dòng mở drawer đơn CHỈ XEM (duyệt / sửa
 * đơn vẫn làm ở module Đơn đặt hàng). Quyền + phạm vi xem theo module Đơn đặt hàng.
 */
const DonDatHangTheoDeXuatSection: React.FC<DonDatHangTheoDeXuatSectionProps> = ({
  idPhieuDeXuat,
  onAdd,
  stackLevel = 1,
  className,
}) => {
  const { t } = useTranslation();
  const perm = useModulePermission(DON_DAT_HANG_MODULE_ID);
  const phamVi = useDonDatHangServerScope();
  const idStr = idPhieuDeXuat != null ? String(idPhieuDeXuat) : '';

  const { data: items = [], isLoading } = useDonDatHangByPhieuDeXuat(perm.canView && idStr ? idStr : null, phamVi);
  const [detailItem, setDetailItem] = useState<DonDatHang | null>(null);
  const { data: detailFull } = useDonDatHangById(detailItem?.id, phamVi);
  const { data: khoList = [] } = useKhoList();

  if (!perm.canView) return null;

  const money = (v: number | null | undefined) => (v != null ? formatNumberVN(v, { maxFractionDigits: 0 }) : '—');
  const canAdd = !!onAdd && perm.canCreate;
  const thCls = 'px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap';
  const detailData = detailFull ?? detailItem;

  return (
    <>
      <GenericSubTableSection
        title={t('donDatHang.lienQuanDeXuat.title')}
        icon={<ShoppingCart size={14} className="text-primary" />}
        count={items.length}
        addLabel={canAdd ? t('donDatHang.lienQuanDeXuat.add') : undefined}
        onAdd={canAdd ? onAdd : undefined}
        emptyTitle={t('donDatHang.lienQuanDeXuat.emptyTitle')}
        emptyDescription={t('donDatHang.lienQuanDeXuat.emptyHint')}
        emptyIcon={<ShoppingCart className="w-10 h-10 text-muted-foreground" />}
        loading={isLoading || phamVi.isLoading}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
        className={className}
      >
        {items.length > 0 ? (
          <>
            <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
              <tr>
                <th className={cn(thCls, 'text-left')}>{t('donDatHang.store.soPoCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('donDatHang.store.orderDateCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('donDatHang.store.supplierCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('donDatHang.store.statusCol')}</th>
                <th className={cn(thCls, 'text-right')}>{t('donDatHang.store.totalAmountCol')}</th>
                <th className="sticky right-0 z-[2] bg-muted px-2 py-2 w-[56px] border-l border-border" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailItem(item);
                    }
                  }}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2 text-xs font-mono whitespace-nowrap">{item.so_po}</td>
                  <td className="px-4 py-2 text-xs tabular-nums whitespace-nowrap">{formatDate(item.ngay_dat)}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className="line-clamp-2">{item.ten_nha_cung_cap || '—'}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        STATUS_VARIANTS[item.trang_thai] ?? 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {t(`donDatHang.status.${TRANG_THAI_KEY[item.trang_thai] ?? 'draft'}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold tabular-nums text-right whitespace-nowrap">
                    {money(item.tong_tien)}
                  </td>
                  <td className="sticky right-0 z-[1] bg-card px-2 py-2 border-l border-border">
                    <div className="flex items-center justify-end">
                      <Tooltip content={t('common.view')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem(item);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg"
                          aria-label={t('common.view')}
                        >
                          <Eye size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        ) : null}
      </GenericSubTableSection>

      <AnimatePresence>
        {detailData && (
          <DonDatHangDetail
            data={detailData}
            stackLevel={stackLevel}
            onClose={() => setDetailItem(null)}
            idChiNhanhKhoNhan={
              khoList.find((k) => String(k.id) === String(detailData.id_kho_nhan))?.id_chi_nhanh ?? null
            }
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DonDatHangTheoDeXuatSection;
