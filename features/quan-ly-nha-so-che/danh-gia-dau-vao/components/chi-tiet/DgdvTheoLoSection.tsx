/**
 * Bảng con «Theo lô» trong Detail phiếu (khuôn `GenericSubTableSection` + `SubTable`): mỗi lô một dòng —
 * tổ trưởng · số lượng dây · đứt dây · SL buồng (tổng thu của lô) · KSC · % KSC, dòng tổng cuối; lô có dòng
 * SL lỗi > SL tô đỏ. Bấm lô → drawer lô; «Nhập theo lô» mở bảng nhập nhanh. Số gom ở core/chi-tiet-dong.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, MapPinned, Rows3 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import Button from '../../../../../components/ui/Button';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { congTongLo, tongTheoLo, type DgdvTongLoPhieu } from '../../core/chi-tiet-dong';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';
import TheDongMobile from '../TheDongMobile';

interface Props {
  phieu: DgdvPhieuDayDu;
  canNhap: boolean;
  onXemLo: (idPhieuLo: string) => void;
  onNhapTheoLo: (idPhieuLo: string | null) => void;
}

/** id ảo của dòng tổng cuối bảng. */
const ID_TONG = '__tong__';

const DgdvTheoLoSection: React.FC<Props> = ({ phieu, canNhap, onXemLo, onNhapTheoLo }) => {
  const { t } = useTranslation();
  const dsLo = useMemo(() => tongTheoLo(phieu), [phieu]);
  const rows = useMemo<DgdvTongLoPhieu[]>(() => {
    if (dsLo.length === 0) return [];
    const tong = congTongLo(dsLo);
    return [...dsLo, { ...tong, id_phieu_lo: ID_TONG, ten_lo: t('danhGiaDauVao.luoi.tongCong'), to_truong: null, coCanhBao: false }];
  }, [dsLo, t]);

  const columns: SubTableColumn[] = [
    { id: 'lo', label: t('danhGiaDauVao.form.lo'), width: 130, minWidth: 90, sticky: true, mobile: 'title' },
    { id: 'to_truong', label: t('danhGiaDauVao.form.toTruong'), width: 150, minWidth: 100 },
    { id: 'so_luong', label: t('danhGiaDauVao.luoi.colSoLuong'), width: 86, minWidth: 64, align: 'right' },
    { id: 'dut_day', label: t('danhGiaDauVao.luoi.dutDay'), width: 76, minWidth: 60, align: 'right' },
    { id: 'sl_buong', label: t('danhGiaDauVao.luoi.colSlBuong'), width: 90, minWidth: 70, align: 'right' },
    { id: 'ksc', label: t('danhGiaDauVao.store.colKsc'), width: 72, minWidth: 56, align: 'right' },
    { id: 'ti_le', label: t('danhGiaDauVao.store.colTiLeKsc'), width: 72, minWidth: 56, align: 'right' },
  ];

  const renderCell = (colId: string, r: DgdvTongLoPhieu) => {
    switch (colId) {
      case 'lo':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            {r.coCanhBao && <AlertTriangle size={12} className="text-rose-600" aria-label={t('danhGiaDauVao.luoi.canhBaoLoi')} />}
            {r.ten_lo ?? '—'}
          </span>
        );
      case 'to_truong':
        return <span className="text-sm">{r.to_truong ?? (r.id_phieu_lo === ID_TONG ? '' : '—')}</span>;
      case 'so_luong':
        return <span className="tabular-nums text-sm">{formatNumberVN(r.soLuong)}</span>;
      case 'dut_day':
        return <span className="tabular-nums text-sm text-muted-foreground">{r.dutDay ? formatNumberVN(r.dutDay) : ''}</span>;
      case 'sl_buong':
        return <span className="tabular-nums text-sm font-semibold text-primary">{formatNumberVN(r.slBuong)}</span>;
      case 'ksc':
        return <span className={cn('tabular-nums text-sm', r.ksc > 0 && 'text-rose-600 font-medium')}>{r.ksc ? formatNumberVN(r.ksc) : ''}</span>;
      case 'ti_le':
        return <span className="tabular-nums text-sm text-muted-foreground">{nhanTiLeKsc(r.ksc, r.slBuong)}</span>;
      default:
        return null;
    }
  };

  const moLo = (r: DgdvTongLoPhieu) => {
    if (r.id_phieu_lo !== ID_TONG) onXemLo(r.id_phieu_lo);
  };

  /** Điện thoại: «A1 · tổ trưởng ……… SL buồng» + «SL · đứt dây · KSC (%)». */
  const theMobile = (r: DgdvTongLoPhieu) => {
    const laTong = r.id_phieu_lo === ID_TONG;
    return (
      <TheDongMobile
        onClick={laTong ? undefined : () => moLo(r)}
        className={laTong ? 'bg-muted font-bold' : r.coCanhBao ? 'bg-rose-50 dark:bg-rose-950/30' : undefined}
        tieuDe={
          <>
            {renderCell('lo', r)}
            {r.to_truong && <span className="truncate text-caption font-normal text-muted-foreground">· {r.to_truong}</span>}
          </>
        }
        soChinh={<span className="text-primary">{formatNumberVN(r.slBuong)}</span>}
        phu={
          <>
            <span>
              {t('danhGiaDauVao.luoi.colSoLuong')} {formatNumberVN(r.soLuong)}
            </span>
            {r.dutDay > 0 && (
              <span>
                · {t('danhGiaDauVao.luoi.dutDay')} {formatNumberVN(r.dutDay)}
              </span>
            )}
            <span className={cn(r.ksc > 0 && 'text-rose-600 font-medium')}>
              · {t('danhGiaDauVao.store.colKsc')} {formatNumberVN(r.ksc)} ({nhanTiLeKsc(r.ksc, r.slBuong)})
            </span>
          </>
        }
      />
    );
  };

  return (
    <GenericSubTableSection
      title={t('danhGiaDauVao.theoLo.title')}
      icon={<MapPinned size={14} className="text-primary" />}
      count={dsLo.length}
      headerActions={
        canNhap && phieu.lo.length > 0 && phieu.cot.length > 0 ? (
          <Button type="button" size="sm" onClick={() => onNhapTheoLo(null)} className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0 bg-primary text-white">
            <Rows3 size={14} className="mr-1.5" />
            {t('danhGiaDauVao.nhapLo.nut')}
          </Button>
        ) : undefined
      }
      contentMode="raw"
      emptyTitle={t('danhGiaDauVao.luoi.chuaCoLo')}
    >
      {rows.length > 0 && (
        <SubTable
          tableKey="danh-gia-dau-vao.theo-lo"
          columns={columns}
          rows={rows}
          keyExtractor={(r) => r.id_phieu_lo}
          renderCell={renderCell}
          onRowClick={moLo}
          renderMobileCard={theMobile}
          // Không đánh số: dòng «Tổng cộng» cuối bảng không phải một lô.
          showIndex={false}
          rowClassName={(r) =>
            r.id_phieu_lo === ID_TONG ? 'bg-muted font-bold' : r.coCanhBao ? 'bg-rose-50 dark:bg-rose-950/30' : undefined
          }
          maxHeight="360px"
        />
      )}
    </GenericSubTableSection>
  );
};

export default DgdvTheoLoSection;
