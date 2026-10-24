import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { History } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import { useFarmPhieuKhoPTHangNxHistory } from '../hooks/use-farm-ton-kho-pt';
import type { TonKhoPTHangNxHistoryRow } from '../core/types';
import { formatNumberVN } from '../../../../lib/utils';
import { computeTonSauByChiTiet } from '../../../kho-van/ton-kho/utils/lich-su-ton-sau';
import { farmNxHistoryToLichSuRows } from '../utils/farm-nx-history-to-lich-su';

function formatNgayVN(ymd: string): string {
  const d = (ymd ?? '').slice(0, 10);
  if (!d || d.length < 10) return d || '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function loaiLabel(t: (k: string) => string, loai: string): string {
  const l = (loai ?? '').trim();
  if (l === 'nhập') return t('tonKhoPhanThuoc.detail.historyNx.loaiNhap');
  if (l === 'xuất') return t('tonKhoPhanThuoc.detail.historyNx.loaiXuat');
  if (l === 'chuyển') return t('tonKhoPhanThuoc.detail.historyNx.loaiChuyen');
  return l || '—';
}

function khoDisplay(row: TonKhoPTHangNxHistoryRow, t: TFunction): string {
  const from = (row.ten_kho ?? '').trim() || '—';
  const to = (row.ten_kho_den ?? '').trim();
  if ((row.loai ?? '').trim() === 'chuyển' && to) {
    return t('tonKhoPhanThuoc.detail.historyNx.khoChuyen', { from, to }) as string;
  }
  return from;
}

interface Props {
  idHangHoa: string;
  /** Kỳ đang xem — chỉ hiện phiếu trong kỳ; rỗng = không giới hạn. */
  ky: { tu: string; den: string };
}

const TonKhoPTHangNxHistorySection: React.FC<Props> = ({ idHangHoa, ky }) => {
  const { t } = useTranslation();
  const { data = [], isLoading, isError, error } = useFarmPhieuKhoPTHangNxHistory(idHangHoa);

  const errMsg = useMemo(() => (error instanceof Error ? error.message : String(error ?? '')), [error]);

  // Tồn sau luỹ kế tính trên TOÀN BỘ lịch sử, rồi mới cắt theo kỳ để hiện.
  const tonSauByChiTiet = useMemo(() => {
    if (!data.length) return new Map<string, number>();
    return computeTonSauByChiTiet(farmNxHistoryToLichSuRows(data, idHangHoa), 'byProductGlobal');
  }, [data, idHangHoa]);

  const rows = useMemo(
    () => data.filter((r) => (!ky.tu || r.ngay >= ky.tu) && (!ky.den || r.ngay <= ky.den)),
    [data, ky.tu, ky.den]
  );

  const columns: SubTableColumn[] = [
    { id: 'ngay', label: t('tonKhoPhanThuoc.detail.historyNx.colDate'), width: 100, minWidth: 90, sticky: true, mobile: 'badge' },
    { id: 'so_phieu', label: t('tonKhoPhanThuoc.detail.historyNx.colSoPhieu'), width: 140, minWidth: 100, sticky: true, mobile: 'title' },
    { id: 'loai', label: t('tonKhoPhanThuoc.detail.historyNx.colLoai'), width: 90, minWidth: 70 },
    { id: 'kho', label: t('tonKhoPhanThuoc.detail.historyNx.colKho'), width: 180, minWidth: 140, mobile: 'full' },
    { id: 'so_luong', label: t('tonKhoPhanThuoc.detail.historyNx.colSl'), width: 110, minWidth: 80, align: 'right' },
    { id: 'ton_sau', label: t('tonKhoPhanThuoc.detail.historyNx.colTon'), width: 100, minWidth: 70, align: 'right' },
    { id: 'trang_thai', label: t('tonKhoPhanThuoc.detail.historyNx.colTrangThai'), width: 120, minWidth: 80 },
  ];

  const renderCell = (colId: string, row: TonKhoPTHangNxHistoryRow) => {
    switch (colId) {
      case 'ngay':
        return <span className="tabular-nums text-muted-foreground whitespace-nowrap">{formatNgayVN(row.ngay)}</span>;
      case 'so_phieu':
        return <span className="font-mono text-xs">{row.so_phieu}</span>;
      case 'loai':
        return loaiLabel(t, row.loai);
      case 'kho':
        return <span className="text-muted-foreground text-xs">{khoDisplay(row, t)}</span>;
      case 'so_luong':
        return (
          <span className="tabular-nums">
            {formatNumberVN(row.so_luong)}
            {row.don_vi_tinh ? <span className="text-muted-foreground text-xs ml-1">{row.don_vi_tinh}</span> : null}
          </span>
        );
      case 'ton_sau': {
        const tonSau = tonSauByChiTiet.get(String(row.chi_tiet_id));
        return (
          <span className="tabular-nums text-muted-foreground">
            {tonSau !== undefined ? formatNumberVN(tonSau) : '—'}
          </span>
        );
      }
      case 'trang_thai':
        return <span className="text-xs">{row.trang_thai || '—'}</span>;
      default:
        return null;
    }
  };

  return (
    <GenericSubTableSection
      title={t('tonKhoPhanThuoc.detail.historyNx.title')}
      icon={<History size={14} />}
      count={isLoading ? undefined : rows.length}
      loading={isLoading}
      loadingText={t('tonKhoPhanThuoc.detail.historyNx.loading')}
      emptyTitle={t('tonKhoPhanThuoc.detail.historyNx.empty')}
      emptyDescription={isError ? errMsg : t('tonKhoPhanThuoc.detail.historyNx.emptyHint')}
      contentMode="raw"
    >
      {!isLoading && !isError && rows.length > 0 ? (
        // SubTable: desktop là bảng như cũ, điện thoại chuyển sang thẻ (số phiếu làm tiêu đề, ngày ở góc phải).
        <SubTable
          tableKey="ton-kho-pt.history-nx"
          columns={columns}
          rows={rows}
          keyExtractor={(row) => String(row.chi_tiet_id)}
          renderCell={renderCell}
          maxHeight="260px"
        />
      ) : undefined}
    </GenericSubTableSection>
  );
};

export default TonKhoPTHangNxHistorySection;
