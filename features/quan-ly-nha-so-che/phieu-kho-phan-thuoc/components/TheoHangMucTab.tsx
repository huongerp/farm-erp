/**
 * Tab "Theo hạng mục" — tổng hợp tiền xuất + luân chuyển theo hạng mục (migration 071).
 * Cuối năm kế toán cộng tiền theo hạng mục; RPC `rpc_*_tong_hop_hang_muc` trả tiền đã duyệt.
 * Bảng có cột tiền ẩn với người không được xem giá nhập; bấm dòng → nhảy tab Chi tiết đã lọc sẵn.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Download, Layers } from 'lucide-react';
import { formatNumberVN } from '../../../../lib/utils';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import EmptyState from '../../../../components/shared/EmptyState';
import LazyExportDialog from '../../../../components/shared/LazyExportDialog';
import type { ExportColumn } from '../../../../lib/export/dinh-dang-o';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { usePhieuKhoPTViewScope } from '../hooks/use-phieu-kho-pt-view-scope';
import { buildPhieuKhoPTPhamVi } from '../services/phieu-kho-pt-list-query';
import { useTongHopHangMuc } from '../hooks/use-phieu-kho-pt';
import { useXemGiaNhap } from '../../../he-thong/phan-quyen/hooks/use-xem-gia-nhap';
import { useChiTietPhieuKhoPTStore } from '../store/useChiTietPhieuKhoPTStore';
import { tongHopHangMuc } from '../core/tong-hop-hang-muc';

const TheoHangMucTab: React.FC = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const xemGia = useXemGiaNhap();

  // Mặc định nguyên năm hiện tại.
  const nam = new Date().getFullYear();
  const [tu, setTu] = useState(`${nam}-01-01`);
  const [den, setDen] = useState(`${nam}-12-31`);
  const [khoIds, setKhoIds] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);

  const { data: khoListAll = [], isPending: khoPending } = useKhoList();
  const viewScope = usePhieuKhoPTViewScope();
  const phamVi = useMemo(() => buildPhieuKhoPTPhamVi(viewScope, khoListAll), [viewScope, khoListAll]);
  /** Kho trong phạm vi — trống nghĩa là toàn phạm vi (RPC nhận null). */
  const khoList = useMemo(() => {
    if (phamVi.viewAll) return khoListAll;
    const allowed = new Set(phamVi.allowedKhoIds.map(String));
    return khoListAll.filter((k) => allowed.has(String(k.id)));
  }, [khoListAll, phamVi]);

  const khoOptions = useMemo(() => khoList.map((k) => ({ value: String(k.id), label: k.ten_kho })), [khoList]);

  /**
   * Kho gửi RPC: chọn kho thì theo lựa chọn; không chọn thì cấp cao = mọi kho (null),
   * người khác = đúng các kho trong phạm vi ('0' = không kho nào → RPC trả rỗng).
   */
  const khoIdsGui = useMemo(() => {
    if (khoIds.length > 0) return khoIds;
    if (phamVi.viewAll) return [];
    return phamVi.allowedKhoIds.length > 0 ? phamVi.allowedKhoIds.map(String) : ['0'];
  }, [khoIds, phamVi]);
  const scopeReady = !viewScope.isLoading && (phamVi.viewAll || !khoPending);

  const { data: tongHopDb = [], isPending } = useTongHopHangMuc({ tu, den, khoIds: khoIdsGui }, scopeReady);
  const tongHop = useMemo(() => tongHopHangMuc(tongHopDb), [tongHopDb]);

  const setFilter = useChiTietPhieuKhoPTStore((s) => s.setFilter);

  /** Bấm dòng → nhảy tab Chi tiết đã lọc sẵn hạng mục + khoảng ngày + kho. */
  const handleRowClick = (hangMuc: string | null) => {
    setFilter('hangMuc', hangMuc == null ? ['__none__'] : [hangMuc]);
    setFilter('datePreset', 'custom');
    setFilter('customDateFrom', tu);
    setFilter('customDateEnd', den);
    setFilter('khoIds', khoIds);
    setFilter('khoDenIds', []);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'chiTiet');
      return next;
    });
  };

  const exportColumns = useMemo<ExportColumn[]>(
    () => [
      { key: 'hang_muc', label: t('phieuKhoPhanThuoc.theoHangMuc.colHangMuc'), type: 'text' },
      ...(xemGia
        ? ([
            { key: 'tien_xuat', label: t('phieuKhoPhanThuoc.theoHangMuc.colTienXuat'), type: 'money' as const },
            { key: 'tien_chuyen', label: t('phieuKhoPhanThuoc.theoHangMuc.colTienChuyen'), type: 'money' as const },
            { key: 'tong', label: t('phieuKhoPhanThuoc.theoHangMuc.colTong'), type: 'money' as const },
          ] as ExportColumn[])
        : []),
      { key: 'so_dong', label: t('phieuKhoPhanThuoc.theoHangMuc.colSoDong'), type: 'number' },
    ],
    [t, xemGia]
  );

  const exportRows = useMemo(
    () =>
      tongHop.dong.map((d) => ({
        hang_muc: d.hangMuc ?? t('phieuKhoPhanThuoc.theoHangMuc.chuaPhanHangMuc'),
        tien_xuat: d.tienXuat,
        tien_chuyen: d.tienChuyen,
        tong: d.tong,
        so_dong: d.soDong,
      })),
    [tongHop, t]
  );

  const coDuLieu = tongHop.dong.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Bộ lọc */}
      <div className="shrink-0 flex flex-wrap items-end gap-3 px-4 py-3 border-b border-border">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
          {t('phieuKhoPhanThuoc.theoHangMuc.tuNgay')}
          <Input type="date" value={tu} onChange={(e) => setTu(e.target.value)} className="h-8 w-40" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
          {t('phieuKhoPhanThuoc.theoHangMuc.denNgay')}
          <Input type="date" value={den} onChange={(e) => setDen(e.target.value)} className="h-8 w-40" />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">{t('phieuKhoPhanThuoc.theoHangMuc.kho')}</span>
          <MultiSelect
            options={khoOptions}
            value={khoIds}
            onChange={setKhoIds}
            placeholder={t('phieuKhoPhanThuoc.theoHangMuc.khoPlaceholder')}
            size="md"
            className="w-56"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExport(true)}
          disabled={!coDuLieu}
          className="ml-auto h-8 gap-1.5"
        >
          <Download className="w-4 h-4" />
          {t('common.export')}
        </Button>
      </div>

      {/* Bảng tổng hợp */}
      <div className="flex-1 min-h-0 overflow-auto px-4 py-3">
        {isPending || khoPending ? (
          <div className="flex flex-1 min-h-[200px] items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
          </div>
        ) : !coDuLieu ? (
          <EmptyState
            icon={<Layers size={48} className="text-muted-foreground/50" />}
            title={t('phieuKhoPhanThuoc.theoHangMuc.empty')}
            description={t('phieuKhoPhanThuoc.theoHangMuc.emptyHint')}
          />
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/80 whitespace-nowrap">
                    {t('phieuKhoPhanThuoc.theoHangMuc.colHangMuc')}
                  </th>
                  {xemGia && (
                    <>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground/80 whitespace-nowrap">
                        {t('phieuKhoPhanThuoc.theoHangMuc.colTienXuat')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground/80 whitespace-nowrap">
                        {t('phieuKhoPhanThuoc.theoHangMuc.colTienChuyen')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground/80 whitespace-nowrap">
                        {t('phieuKhoPhanThuoc.theoHangMuc.colTong')}
                      </th>
                    </>
                  )}
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground/80 whitespace-nowrap">
                    {t('phieuKhoPhanThuoc.theoHangMuc.colSoDong')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tongHop.dong.map((d) => (
                  <tr
                    key={d.hangMuc ?? '__none__'}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(d.hangMuc)}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className={d.hangMuc == null ? 'italic text-muted-foreground' : undefined}>
                        {d.hangMuc ?? t('phieuKhoPhanThuoc.theoHangMuc.chuaPhanHangMuc')}
                      </span>
                    </td>
                    {xemGia && (
                      <>
                        <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(d.tienXuat)}</td>
                        <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(d.tienChuyen)}</td>
                        <td className="px-4 py-3 tabular-nums text-sm text-right font-medium">{formatNumberVN(d.tong)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 tabular-nums text-sm text-right text-muted-foreground">{formatNumberVN(d.soDong)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3 text-sm">{t('phieuKhoPhanThuoc.theoHangMuc.tongCong')}</td>
                  {xemGia && (
                    <>
                      <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(tongHop.tongCong.tienXuat)}</td>
                      <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(tongHop.tongCong.tienChuyen)}</td>
                      <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(tongHop.tongCong.tong)}</td>
                    </>
                  )}
                  <td className="px-4 py-3 tabular-nums text-sm text-right">{formatNumberVN(tongHop.tongCong.soDong)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-xs text-muted-foreground mt-3">{t('phieuKhoPhanThuoc.theoHangMuc.footnote')}</p>
          </>
        )}
      </div>

      <LazyExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportRows}
        fileName="Tong_hop_hang_muc"
      />
    </div>
  );
};

export default TheoHangMucTab;
