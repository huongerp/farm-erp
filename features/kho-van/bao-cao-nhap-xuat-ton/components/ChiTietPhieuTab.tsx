import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Package } from 'lucide-react';
import { usePhieuInPeriod } from '../hooks/use-bao-cao-nxt';
import { usePhieuKhoById } from '../../phieu-kho/hooks/use-phieu-kho';
import type { NXTReportFilters } from '../core/types';
import type { PhieuKho, LoaiPhieuKho, TrangThaiPhieuKho } from '../../phieu-kho/core/types';
import { getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../../phieu-kho/core/constants';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';

function LoaiBadge({ loai }: { loai: LoaiPhieuKho }) {
  const { t } = useTranslation();
  const label = loai === 'nhập' ? t('baoCaonhapXuatTon.loaiNhap') : loai === 'xuất' ? t('baoCaonhapXuatTon.loaiXuat') : t('baoCaonhapXuatTon.loaiChuyen');
  const cls =
    loai === 'nhập'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : loai === 'xuất'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

function TrangThaiBadge({ status }: { status: TrangThaiPhieuKho }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
        getTrangThaiPhieuBadgeClass(status),
      )}
    >
      {t(`phieuKho.status.${trangThaiToI18nKey(status)}`)}
    </span>
  );
}

function PhieuDetailDrawer({
  phieuId,
  onClose,
}: {
  phieuId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: phieu, isLoading } = usePhieuKhoById(phieuId);

  return (
    <GenericDrawer
      title={t('baoCaonhapXuatTon.viewDetail')}
      subtitle={phieu?.so_phieu ?? ''}
      icon={<FileText size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex justify-start w-full">
          <Button variant="outline" onClick={onClose} className="border-border">
            {BTN_CLOSE()}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinnerWithText text={t('baoCaonhapXuatTon.loading')} />
      ) : !phieu ? (
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.soPhieu')}</p>
              <p className="font-medium">{phieu.so_phieu}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.ngay')}</p>
              <p className="font-medium">{phieu.ngay}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.loai')}</p>
              <LoaiBadge loai={phieu.loai} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.kho')}</p>
              <p className="font-medium">{phieu.ten_kho ?? '—'}</p>
            </div>
            {phieu.loai === 'chuyển' && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.khoDen')}</p>
                <p className="font-medium">{phieu.ten_kho_den ?? '—'}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.trangThai')}</p>
              <TrangThaiBadge status={phieu.trang_thai} />
            </div>
            {phieu.mo_ta && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.chiTiet.moTa')}</p>
                <p className="font-medium">{phieu.mo_ta}</p>
              </div>
            )}
          </div>
          {(phieu.chi_tiet?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
                <Package size={14} />
                <span className="text-sm font-medium">{t('baoCaonhapXuatTon.chiTiet.bangHangHoa')}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-xs">{t('baoCaonhapXuatTon.byProduct.maHang')}</th>
                      <th className="px-3 py-2 text-left font-semibold text-xs">{t('baoCaonhapXuatTon.byProduct.tenHang')}</th>
                      <th className="px-3 py-2 text-right font-semibold text-xs">{t('baoCaonhapXuatTon.tonThoiDiem.soLuong')}</th>
                      <th className="px-3 py-2 text-left font-semibold text-xs">{t('baoCaonhapXuatTon.byProduct.donViTinh')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phieu.chi_tiet!.map((ct) => (
                      <tr key={ct.id} className="border-b border-border/60">
                        <td className="px-3 py-2 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                        <td className="px-3 py-2">{ct.ten_hang ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{ct.so_luong.toLocaleString()}</td>
                        <td className="px-3 py-2 text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </GenericDrawer>
  );
}

interface ChiTietPhieuTabProps {
  filters: NXTReportFilters | null;
}

const ChiTietPhieuTab: React.FC<ChiTietPhieuTabProps> = ({ filters }) => {
  const { t } = useTranslation();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { data: phieuList = [], isLoading, isError } = usePhieuInPeriod(filters);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('common.error') || 'Có lỗi khi tải dữ liệu.'}</p>
      </div>
    );
  }

  if (!filters?.dateFrom || !filters?.dateTo) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaonhapXuatTon.selectPeriod')}
          description={t('baoCaonhapXuatTon.emptyHint')}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingSpinnerWithText text={t('baoCaonhapXuatTon.loading')} centered />
      </div>
    );
  }

  if (phieuList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaonhapXuatTon.empty')}
          description={t('baoCaonhapXuatTon.emptyHint')}
          icon={<FileText size={48} className="text-muted-foreground/30" />}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('baoCaonhapXuatTon.summary.soPhieu')}: <span className="font-semibold text-foreground">{phieuList.length}</span>
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.soPhieu')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.ngay')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.loai')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.kho')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.khoDen')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.trangThai')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.chiTiet.moTa')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.viewDetail')}</th>
                </tr>
              </thead>
              <tbody>
                {phieuList.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{p.so_phieu}</td>
                    <td className="px-4 py-3">{p.ngay}</td>
                    <td className="px-4 py-3">
                      <LoaiBadge loai={p.loai} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.ten_kho ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.loai === 'chuyển' ? (p.ten_kho_den ?? '—') : '—'}</td>
                    <td className="px-4 py-3">
                      <TrangThaiBadge status={p.trang_thai} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{p.mo_ta ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewingId(p.id)}
                        className="text-primary hover:underline text-xs font-medium"
                      >
                        {t('baoCaonhapXuatTon.viewDetail')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
      {viewingId && (
        <PhieuDetailDrawer phieuId={viewingId} onClose={() => setViewingId(null)} />
      )}
    </>
  );
};

export default ChiTietPhieuTab;
