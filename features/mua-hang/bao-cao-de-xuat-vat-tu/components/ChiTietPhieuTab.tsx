import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { usePhieuDeXuatInPeriod } from '../hooks/use-bao-cao-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuById } from '../../../kho-van/phieu-de-xuat-vat-tu/hooks/use-phieu-de-xuat-vat-tu';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { ChiTietPhieuRow } from '../core/types';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';

function getTrangThaiLabel(trang_thai: 0 | 1 | 2, t: (k: string) => string): string {
  return trang_thai === 0 ? t('baoCaodeXuatVatTu.trangThaiChoDuyet') : trang_thai === 1 ? t('baoCaodeXuatVatTu.trangThaiDaDuyet') : t('baoCaodeXuatVatTu.trangThaiKhongDuyet');
}

function TrangThaiBadge({ status }: { status: 0 | 1 | 2 }) {
  const { t } = useTranslation();
  const label = getTrangThaiLabel(status, t);
  const cls = status === 0 ? 'bg-amber-500/10 text-amber-600' : status === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600';
  return <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', cls)}>{label}</span>;
}

function PhieuDetailDrawer({ phieuId, onClose }: { phieuId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: phieu, isLoading } = usePhieuDeXuatVatTuById(phieuId);

  return (
    <GenericDrawer
      title={t('baoCaodeXuatVatTu.chiTiet.viewDetail')}
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
        <LoadingSpinnerWithText text={t('baoCaodeXuatVatTu.loading')} />
      ) : !phieu ? (
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.soPhieu')}</p>
              <p className="font-medium">{phieu.so_phieu}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ngay')}</p>
              <p className="font-medium">{phieu.ngay}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ngayCan')}</p>
              <p className="font-medium">{phieu.ngay_can}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.trangThai')}</p>
              <TrangThaiBadge status={phieu.trang_thai} />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</p>
              <p className="font-medium">{phieu.ten_noi_de_xuat ?? phieu.id_noi_de_xuat ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</p>
              <p className="font-medium">{phieu.ten_nguoi_de_xuat ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.nguoiDuyet')}</p>
              <p className="font-medium">{phieu.ten_nguoi_duyet ?? '—'}</p>
            </div>
            {phieu.ghi_chu && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ghiChu')}</p>
                <p className="font-medium">{phieu.ghi_chu}</p>
              </div>
            )}
          </div>
          {phieu.chi_tiet && phieu.chi_tiet.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('baoCaodeXuatVatTu.chiTiet.danhSachHang')}</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.maHang')}</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.tenHang')}</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.soLuong')}</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.dvt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phieu.chi_tiet.map((ct) => (
                      <tr key={ct.id} className="border-b border-border/60">
                        <td className="px-3 py-2 font-mono">{ct.ma_hang ?? '—'}</td>
                        <td className="px-3 py-2">{ct.ten_hang ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{ct.so_luong}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
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
  filters: BaoCaoDeXuatVatTuFilters | null;
  onClearFilters?: () => void;
}

const ChiTietPhieuTab: React.FC<ChiTietPhieuTabProps> = ({ filters, onClearFilters }) => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = usePhieuDeXuatInPeriod(filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-destructive">{t('common.error')}</p>
      </div>
    );
  }

  if (isLoading || !filters?.dateFrom || !filters?.dateTo) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 py-6 px-4">
          <LoadingSpinnerWithText
            text={!filters?.dateFrom || !filters?.dateTo ? t('baoCaodeXuatVatTu.selectPeriod') : t('baoCaodeXuatVatTu.loading')}
            centered
          />
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaodeXuatVatTu.empty')}
          description={t('baoCaodeXuatVatTu.emptyHint')}
          icon={<FileText size={48} className="text-muted-foreground/30" />}
          action={
            onClearFilters ? (
              <button type="button" onClick={onClearFilters} className="text-sm font-medium text-primary hover:underline">
                {t('common.clearFilters', { count: 1 })}
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.soPhieu')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.ngay')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.ngayCan')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDuyet')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.trangThai')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row: ChiTietPhieuRow, idx: number) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{row.so_phieu}</td>
                      <td className="px-4 py-3">{row.ngay}</td>
                      <td className="px-4 py-3">{row.ngay_can}</td>
                      <td className="px-4 py-3">{row.ten_noi_de_xuat ?? '—'}</td>
                      <td className="px-4 py-3">{row.ten_nguoi_de_xuat ?? '—'}</td>
                      <td className="px-4 py-3">{row.ten_nguoi_duyet ?? '—'}</td>
                      <td className="px-4 py-3">
                        <TrangThaiBadge status={row.trang_thai} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {selectedId && (
        <PhieuDetailDrawer phieuId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
};

export default ChiTietPhieuTab;
