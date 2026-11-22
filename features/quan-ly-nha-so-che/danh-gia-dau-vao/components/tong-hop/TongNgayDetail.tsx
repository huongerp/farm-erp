/**
 * Detail tổng ngày (một ngày × một chi nhánh, 60rem) của tab «Tổng hợp ngày»: tổng thu / KSC đã cộng mọi chuyến,
 * danh sách chuyến (bấm → Detail phiếu chuyến, drawer chồng) và lưới lô × dây đã gộp chuyến. In ngày / Xuất Excel
 * ngày đó. Đang lọc tổ trưởng → số, chuyến và lưới chỉ tính lô của các tổ trưởng đó (ghi trên tiêu đề).
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarDays, FileSpreadsheet, ListOrdered, Printer, Scale } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../../components/shared/DetailSection';
import DetailField from '../../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../../components/shared/DetailDrawerFooter';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import { DRAWER_WIDTH_BAO_CAO_SO_CHE } from '../../../../../lib/dialog-sizes';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { tongPhieu } from '../../core/bang-tinh';
import { nhanTuanFarm } from '../../core/tuan';
import type { DgdvNgayChiNhanh } from '../../core/tong-hop';
import { useDungLuoi } from '../../hooks/use-dung-luoi';
import { useDgdvPermissions } from '../../hooks/use-danh-gia-dau-vao-permissions';
import { useDgdvXuatChiTiet } from '../../hooks/use-dgdv-xuat-chi-tiet';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';
import { getDgdvPreviewUrl } from '../../utils/preview-url';
import { taiXlsxLuoi } from '../../utils/export-luoi';
import DgdvLuoiNgayTable from '../luoi/DgdvLuoiNgayTable';
import DgdvDetail from '../DgdvDetail';
import { TrangThaiDgdvBadge } from '../DgdvList';

interface Props {
  dong: DgdvNgayChiNhanh;
  /** Phiếu (chuyến) của ngày × chi nhánh, đã lọc tổ trưởng (nếu có). */
  dsPhieu: DgdvPhieuDayDu[];
  /** Phiếu gốc (đủ lô) — mở Detail phiếu chuyến. */
  dsPhieuGoc: DgdvPhieuDayDu[];
  /** Tên tổ trưởng đang lọc; rỗng = không lọc. */
  tenToTruongLoc: string[];
  onClose: () => void;
}

interface DongChuyen {
  id: string;
  chuyen: number;
  tongThu: number;
  ksc: number;
  phieu: DgdvPhieuDayDu;
}

const TongNgayDetail: React.FC<Props> = ({ dong, dsPhieu, dsPhieuGoc, tenToTruongLoc, onClose }) => {
  const { t } = useTranslation();
  const { canToggleTrangThai, canNhapLuoi } = useDgdvPermissions();
  const xuatChiTiet = useDgdvXuatChiTiet();
  const [moPhieuId, setMoPhieuId] = useState<string | null>(null);
  const [dangXuat, setDangXuat] = useState(false);

  const { dsKhoi, canhBao } = useDungLuoi(dsPhieu, dong.ngay, dong.ngay, true);
  const luoi = dsKhoi[0]?.luoi[0];
  const chuyen = useMemo<DongChuyen[]>(
    () => [...dsPhieu].sort((a, b) => a.chuyen - b.chuyen).map((p) => ({ id: p.id, chuyen: p.chuyen, ...tongPhieu(p), phieu: p })),
    [dsPhieu]
  );
  const phieuMo = moPhieuId ? dsPhieuGoc.find((p) => p.id === moPhieuId) : undefined;

  /**
   * Chuyến có cân mẫu buồng trong ngày + dòng tổng cộng (Σ buồng, Σ kg, bình quân = Σkg / Σbuồng).
   * Lấy phiếu GỐC: cân mẫu là số của cả chuyến, không chia được theo tổ trưởng đang lọc.
   */
  const canMau = useMemo(() => {
    const ds = [...dsPhieuGoc].filter((p) => p.so_buong_can_mau > 0).sort((a, b) => a.chuyen - b.chuyen);
    const tongBuong = ds.reduce((s, p) => s + p.so_buong_can_mau, 0);
    const tongKg = ds.reduce((s, p) => s + p.tong_can_nang_mau, 0);
    return { ds, tongBuong, tongKg, binhQuan: tongBuong > 0 ? tongKg / tongBuong : null };
  }, [dsPhieuGoc]);

  const xuatExcel = async () => {
    setDangXuat(true);
    try {
      const co = await taiXlsxLuoi(dsKhoi, dong.ngay, dong.ngay, t);
      if (!co) toast.warning(t('danhGiaDauVao.bang.khongCoDuLieu'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDangXuat(false);
    }
  };

  const actions: DetailToolbarAction[] = [
    {
      label: t('danhGiaDauVao.detail.inNgay'),
      icon: <Printer size={16} />,
      variant: 'primary',
      onClick: () => window.open(getDgdvPreviewUrl(dong.ngay, dong.ngay, dong.id_chi_nhanh), '_blank', 'noopener,noreferrer'),
    },
    { label: t('danhGiaDauVao.bang.xuatExcel'), icon: <FileSpreadsheet size={16} />, variant: 'outline', disabled: dangXuat || !luoi, onClick: () => void xuatExcel() },
  ];

  const columns: SubTableColumn[] = [
    { id: 'chuyen', label: t('danhGiaDauVao.store.colChuyen'), width: 90, minWidth: 70, sticky: true, mobile: 'title' },
    { id: 'tong_thu', label: t('danhGiaDauVao.store.colTongThu'), width: 100, minWidth: 80, align: 'right' },
    { id: 'ksc', label: t('danhGiaDauVao.store.colKsc'), width: 80, minWidth: 60, align: 'right' },
    { id: 'ti_le', label: t('danhGiaDauVao.store.colTiLeKsc'), width: 80, minWidth: 60, align: 'right' },
    { id: 'trang_thai', label: t('danhGiaDauVao.store.colTrangThai'), width: 120, minWidth: 100, mobile: 'badge' },
    { id: 'nguoi_tao', label: t('danhGiaDauVao.store.colNguoiTao'), width: 160, minWidth: 100 },
  ];
  const renderCell = (colId: string, r: DongChuyen) => {
    switch (colId) {
      case 'chuyen':
        return <span className="text-sm font-medium">{t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: r.chuyen })}</span>;
      case 'tong_thu':
        return <span className="tabular-nums text-sm font-semibold text-primary">{formatNumberVN(r.tongThu)}</span>;
      case 'ksc':
        return <span className={cn('tabular-nums text-sm', r.ksc > 0 && 'text-rose-600 font-medium')}>{formatNumberVN(r.ksc)}</span>;
      case 'ti_le':
        return <span className="tabular-nums text-sm text-muted-foreground">{nhanTiLeKsc(r.ksc, r.tongThu)}</span>;
      case 'trang_thai':
        return <TrangThaiDgdvBadge trangThai={r.phieu.trang_thai} />;
      case 'nguoi_tao':
        return <span className="text-sm text-muted-foreground">{r.phieu.ten_nguoi_tao ?? '—'}</span>;
      default:
        return null;
    }
  };

  const tieuDe = [
    t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(dong.ngay) }),
    t('danhGiaDauVao.luoi.tuan', { tuan: dong.tuan }),
    dong.ten_chi_nhanh,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <GenericDrawer
      title={tieuDe}
      subtitle={
        tenToTruongLoc.length > 0
          ? t('danhGiaDauVao.tongHop.ngayTheoToTruong', { ten: tenToTruongLoc.join(', ') })
          : t('danhGiaDauVao.tongHop.ngayTitle')
      }
      icon={<CalendarDays className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
      footer={<DetailDrawerFooter onClose={onClose} canUpdate={false} canDelete={false} />}
    >
      <div className="space-y-4 pb-2">
        <DetailToolbar actions={actions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('danhGiaDauVao.tongHop.sectionTong')} icon={<CalendarDays size={14} />} variant="primary">
          <DetailFieldGrid cols={3}>
            <DetailField label={t('danhGiaDauVao.store.colNamTuan')} value={`${nhanTuanFarm({ nam: dong.nam, tuan: dong.tuan })} · ${dong.nam}`} />
            <DetailField label={t('danhGiaDauVao.thang.colSoChuyen')} value={String(chuyen.length)} />
            <DetailField
              label={t('danhGiaDauVao.store.colTrangThai')}
              value={<TrangThaiDgdvBadge trangThai={dong.daKhoaHet ? 'khoa' : 'mo'} />}
            />
            <DetailField
              label={t('danhGiaDauVao.store.colTongThu')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(dong.tongThu)}</span>}
            />
            <DetailField
              label={t('danhGiaDauVao.store.colKsc')}
              value={
                <span className="tabular-nums">
                  <span className="font-bold text-rose-600">{formatNumberVN(dong.ksc)}</span>
                  <span className="text-muted-foreground"> · {nhanTiLeKsc(dong.ksc, dong.tongThu)}</span>
                </span>
              }
            />
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('danhGiaDauVao.tongHop.sectionChuyen')}
          icon={<ListOrdered size={14} className="text-primary" />}
          count={chuyen.length}
          contentMode="raw"
        >
          <SubTable
            tableKey="danh-gia-dau-vao.tong-ngay-chuyen"
            columns={columns}
            rows={chuyen}
            keyExtractor={(r) => r.id}
            renderCell={renderCell}
            onRowClick={(r) => setMoPhieuId(r.id)}
            onMobileCardClick={(r) => setMoPhieuId(r.id)}
            maxHeight="280px"
          />
        </GenericSubTableSection>

        {canMau.ds.length > 0 && (
          <GenericSubTableSection
            title={t('danhGiaDauVao.tongHop.sectionCanMau')}
            icon={<Scale size={14} className="text-primary" />}
            count={canMau.ds.length}
            contentMode="raw"
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm min-w-[36rem]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-2 text-left font-medium">{t('danhGiaDauVao.store.colChuyen')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('danhGiaDauVao.tongHop.colGioCan')}</th>
                    <th className="px-3 py-2 text-right font-medium">{t('danhGiaDauVao.form.soBuongCanMau')}</th>
                    <th className="px-3 py-2 text-right font-medium">{t('danhGiaDauVao.form.tongCanNangMau')}</th>
                    <th className="px-3 py-2 text-right font-medium">{t('danhGiaDauVao.form.binhQuanBuong')}</th>
                  </tr>
                </thead>
                <tbody>
                  {canMau.ds.map((p) => (
                    <tr key={p.id} className="border-b border-border/80 last:border-0">
                      <td className="px-3 py-2 text-sm font-medium">{t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: p.chuyen })}</td>
                      <td className="px-3 py-2 text-sm tabular-nums text-muted-foreground">{p.gio_can_mau ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">{formatNumberVN(p.so_buong_can_mau)}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">{formatNumberVN(p.tong_can_nang_mau)}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">
                        {formatNumberVN(p.tong_can_nang_mau / p.so_buong_can_mau, { maxFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/20">
                    <td className="px-3 py-2 text-sm font-semibold text-primary" colSpan={2}>
                      {t('danhGiaDauVao.tongHop.tongCongCanMau')}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-primary">
                      {formatNumberVN(canMau.tongBuong)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-primary">
                      {formatNumberVN(canMau.tongKg)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-primary">
                      {formatNumberVN(canMau.binhQuan, { maxFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GenericSubTableSection>
        )}

        <DetailSection title={t('danhGiaDauVao.tongHop.sectionLuoi')} variant="primary">
          {luoi ? <DgdvLuoiNgayTable luoi={luoi} canhBao={canhBao} /> : <p className="m-0 text-sm text-muted-foreground">{t('danhGiaDauVao.bang.khongCoDuLieu')}</p>}
        </DetailSection>
      </div>

      <AnimatePresence>
        {phieuMo && (
          <DgdvDetail
            data={phieuMo}
            onClose={() => setMoPhieuId(null)}
            canToggleTrangThai={canToggleTrangThai}
            canNhapLuoi={canNhapLuoi(phieuMo)}
            onXuatExcel={() => void xuatChiTiet.xuatPhieu(phieuMo)}
            dangXuat={xuatChiTiet.dangXuat}
            stackLevel={1}
          />
        )}
      </AnimatePresence>
    </GenericDrawer>
  );
};

export default TongNgayDetail;
