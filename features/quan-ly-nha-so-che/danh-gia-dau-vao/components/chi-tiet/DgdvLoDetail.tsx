/**
 * Drawer con CHỈ XEM một lô của phiếu (mở từ bảng «Theo lô»): tổ trưởng, SL buồng, KSC + các dòng của lô
 * (chip màu dây · SL · đánh giá · SL lỗi · lý do, đứt dây cuối). Bấm dòng → `DgdvDongDetail` (do section cha
 * mở). Nút «Nhập theo lô» khi được nhập.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinned, Rows3 } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../../components/shared/DetailSection';
import DetailField from '../../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../../components/shared/DetailDrawerFooter';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import Button from '../../../../../components/ui/Button';
import { DRAWER_WIDTH_STACKED } from '../../../../../lib/dialog-sizes';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { dongPhangCuaPhieu, tongTheoLo, type DgdvDongPhang } from '../../core/chi-tiet-dong';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';
import { ChipDay } from '../ChipDay';

interface Props {
  phieu: DgdvPhieuDayDu;
  idPhieuLo: string;
  canNhap: boolean;
  onClose: () => void;
  onXemDong: (r: DgdvDongPhang) => void;
  onNhapTheoLo: () => void;
  stackLevel: number;
}

const DgdvLoDetail: React.FC<Props> = ({ phieu, idPhieuLo, canNhap, onClose, onXemDong, onNhapTheoLo, stackLevel }) => {
  const { t } = useTranslation();
  const { mauTheoId } = useMauDay();
  const tong = useMemo(() => tongTheoLo(phieu).find((r) => r.id_phieu_lo === idPhieuLo), [phieu, idPhieuLo]);
  const dong = useMemo(() => dongPhangCuaPhieu(phieu).filter((r) => r.id_phieu_lo === idPhieuLo), [phieu, idPhieuLo]);
  const cotTheoId = useMemo(() => new Map(phieu.cot.map((c) => [c.id, c])), [phieu.cot]);

  const columns: SubTableColumn[] = [
    { id: 'day', label: t('danhGiaDauVao.chiTiet.colDay'), width: 170, minWidth: 110, sticky: true, mobile: 'title' },
    { id: 'so_luong', label: t('danhGiaDauVao.luoi.colSoLuong'), width: 84, minWidth: 64, align: 'right' },
    { id: 'danh_gia', label: t('danhGiaDauVao.luoi.colDanhGia'), width: 140, minWidth: 90 },
    { id: 'so_luong_loi', label: t('danhGiaDauVao.luoi.colSlLoi'), width: 76, minWidth: 60, align: 'right' },
    { id: 'ly_do_loi', label: t('danhGiaDauVao.luoi.colLyDoLoi'), width: 140, minWidth: 90 },
  ];
  const renderCell = (colId: string, r: DgdvDongPhang) => {
    switch (colId) {
      case 'day':
        return <ChipDay cot={r.id_cot ? (cotTheoId.get(r.id_cot) ?? null) : null} mauTheoId={mauTheoId} />;
      case 'so_luong':
        return <span className="tabular-nums text-sm font-medium">{formatNumberVN(r.so_luong)}</span>;
      case 'danh_gia':
        return <span className="text-sm">{r.danh_gia ?? ''}</span>;
      case 'so_luong_loi':
        return (
          <span className={cn('tabular-nums text-sm', r.so_luong_loi > r.so_luong && 'text-rose-600 font-semibold')}>
            {r.so_luong_loi ? formatNumberVN(r.so_luong_loi) : ''}
          </span>
        );
      case 'ly_do_loi':
        return <span className="text-sm">{r.ly_do_loi ?? ''}</span>;
      default:
        return null;
    }
  };

  return (
    <GenericDrawer
      title={t('danhGiaDauVao.theoLo.loTitle', { lo: tong?.ten_lo ?? '—' })}
      subtitle={t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: phieu.chuyen })}
      icon={<MapPinned size={18} />}
      onClose={onClose}
      stackLevel={stackLevel}
      maxWidthClass={DRAWER_WIDTH_STACKED}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          extraActions={
            canNhap ? (
              <Button type="button" size="sm" onClick={onNhapTheoLo} className="bg-primary text-white">
                <Rows3 size={14} className="mr-1.5" />
                {t('danhGiaDauVao.nhapLo.nut')}
              </Button>
            ) : undefined
          }
        />
      }
    >
      <div className="space-y-4">
        <DetailSection title={t('danhGiaDauVao.theoLo.sectionTong')} variant="primary">
          <DetailFieldGrid cols={3}>
            <DetailField label={t('danhGiaDauVao.form.toTruong')} value={tong?.to_truong ?? '—'} />
            <DetailField
              label={t('danhGiaDauVao.luoi.colSlBuong')}
              value={
                <span className="tabular-nums">
                  <span className="font-bold text-primary">{formatNumberVN(tong?.slBuong ?? 0)}</span>
                  {!!tong?.dutDay && (
                    <span className="text-muted-foreground"> · {t('danhGiaDauVao.luoi.dutDayN', { n: formatNumberVN(tong.dutDay) })}</span>
                  )}
                </span>
              }
            />
            <DetailField
              label={t('danhGiaDauVao.store.colKsc')}
              value={
                <span className="tabular-nums">
                  <span className="font-bold text-rose-600">{formatNumberVN(tong?.ksc ?? 0)}</span>
                  <span className="text-muted-foreground"> · {nhanTiLeKsc(tong?.ksc ?? 0, tong?.slBuong ?? 0)}</span>
                </span>
              }
            />
          </DetailFieldGrid>
        </DetailSection>
        <DetailSection title={t('danhGiaDauVao.chiTiet.title')} variant="primary">
          <SubTable
            tableKey="danh-gia-dau-vao.lo-detail"
            columns={columns}
            rows={dong}
            keyExtractor={(r) => r.key}
            renderCell={renderCell}
            onRowClick={onXemDong}
            onMobileCardClick={onXemDong}
            rowClassName={(r) => (r.loai === 'dut_day' ? 'bg-muted/40' : r.so_luong_loi > r.so_luong ? 'bg-rose-50 dark:bg-rose-950/30' : undefined)}
            emptyContent={<p className="py-4 text-center text-sm text-muted-foreground m-0">{t('danhGiaDauVao.theoLo.loChuaCoSo')}</p>}
          />
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DgdvLoDetail;
