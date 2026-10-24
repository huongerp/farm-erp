import type { ThongKeSanXuatRow } from '../core/types';
import { kpiThucTeDisplay } from '../core/kpi-display';
import { n, pct, pctDirect, currency } from './format-thong-ke';

/**
 * Chuyển 1 hàng (ngày × chi nhánh) của bảng Thống kê sản xuất thành các nhóm chỉ số
 * cho thẻ trên điện thoại. Giá trị + tông màu giữ đúng như ô bảng desktop.
 */

export type MetricTone =
  | 'default'
  | 'strong'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'orange'
  | 'indigo'
  | 'muted';

export interface CardMetric {
  id: string;
  /** Khoá i18n (thongKeSanXuat.mobile.*) — nhãn viết đủ từ, không viết tắt. */
  labelKey: string;
  value: string;
  tone: MetricTone;
}

export type CardSectionId = 'nhanCong' | 'soChe' | 'dongThung';

export interface CardSection {
  id: CardSectionId;
  titleKey: string;
  metrics: CardMetric[];
}

const m = (id: string, value: string, tone: MetricTone = 'default'): CardMetric => ({
  id,
  labelKey: `thongKeSanXuat.mobile.${id}`,
  value,
  tone,
});

const DASH = '—';

function tienThuongMetric(id: string, tong: number | undefined | null): CardMetric {
  if (tong == null) return m(id, DASH, 'muted');
  if (tong === 0) return m(id, '0', 'muted');
  return m(id, currency(tong), tong > 0 ? 'positive' : 'negative');
}

/** 3 chỉ số quan trọng nhất — hiện ngay cả khi thẻ đang thu gọn. */
export function buildKeyMetrics(row: ThongKeSanXuatRow): CardMetric[] {
  const s = row.bcncSnapshot;
  const bcsc = row.bcsc;
  const d = row.dbdtKpi;
  return [
    m('congQD', s ? n(s.tongCongQuyDoi, 1) : DASH, s ? 'strong' : 'muted'),
    m('buongSoChe', bcsc ? n(bcsc.tong_buong_so_che) : DASH, bcsc ? 'strong' : 'muted'),
    m('thungTT', d ? n(d.tong_so_thung_thuc_te) : DASH, d ? 'indigo' : 'muted'),
  ];
}

export function buildRowSections(row: ThongKeSanXuatRow): CardSection[] {
  const s = row.bcncSnapshot;
  const k = row.kpiSnapshot;
  const d = row.dbdtKpi;
  const bcsc = row.bcsc;
  const dbdt = row.dbdt;

  const kDinhBienTone: MetricTone =
    s?.kDinhBien == null ? 'default' : s.kDinhBien >= 5 ? 'positive' : s.kDinhBien >= 3 ? 'default' : 'warning';

  const nhanCong: CardSection = {
    id: 'nhanCong',
    titleKey: 'thongKeSanXuat.table.groupNhanCong',
    metrics: [
      m('cnNgay', s ? n(s.cnSanXuatNgay) : DASH),
      m('cnNua', s ? n(s.cnSanXuatNua) : DASH),
      m('cnTangCa', s ? n(s.cnTangCa) : DASH),
      m('congQD', s ? n(s.tongCongQuyDoi, 1) : DASH, 'strong'),
      m('cnDinhBien', s ? n(s.cnDinhBien) : DASH, s && s.cnDinhBien > 0 ? 'warning' : 'default'),
      m('kDinhBien', s?.kDinhBien != null ? n(s.kDinhBien, 2) : DASH, kDinhBienTone),
      s && s.tongGioTangCaTich > 0
        ? m('gioTangCa', n(s.tongGioTangCaTich, 1), 'orange')
        : m('gioTangCa', s ? '0' : DASH),
    ],
  };

  const soChe: CardSection = {
    id: 'soChe',
    titleKey: 'thongKeSanXuat.table.groupSoChe',
    metrics: [
      m('buongThuHoach', bcsc ? n(bcsc.tong_buong_thu_hoach) : DASH),
      m('buongSoChe', bcsc ? n(bcsc.tong_buong_so_che) : DASH, 'strong'),
      m('buongTonCuoi', bcsc ? n(bcsc.sl_buong_ton_cuoi_ngay) : DASH),
      m(
        'loiQcPct',
        bcsc ? pctDirect(bcsc.danh_gia_loi_qc_pct) : DASH,
        bcsc && bcsc.danh_gia_loi_qc_pct > 0 ? 'negative' : 'muted'
      ),
      m('kpiNsSoChe', kpiThucTeDisplay(k, 0)),
      m('kpiLoiNaiChuoi', kpiThucTeDisplay(k, 1)),
      m('kpiTyLeThuHoi', kpiThucTeDisplay(k, 2)),
      tienThuongMetric('tienThuong', k?.tongTienThuong),
    ],
  };

  const dongThung: CardSection = {
    id: 'dongThung',
    titleKey: 'thongKeSanXuat.table.groupDongThung',
    metrics: [
      m('canBqBuong', d?.can_nang_binh_quan_buong != null ? n(d.can_nang_binh_quan_buong * 1000, 0) : DASH),
      m('buongNhapKH', dbdt ? n(dbdt.tong_buong_nhap_ke_hoach) : DASH),
      m('buongNhapTT', dbdt ? n(dbdt.tong_buong_nhap_thuc_te) : DASH),
      m('thungKH', d ? n(d.tong_so_thung_ke_hoach) : DASH, 'strong'),
      m('thungTT', d ? n(d.tong_so_thung_thuc_te) : DASH, d ? 'indigo' : 'muted'),
      m('tlThuHoiKH', dbdt ? pct(dbdt.ty_le_thu_hoi_ke_hoach) : DASH),
      m('tlThuHoiTT', dbdt ? pct(dbdt.ty_le_thu_hoi_thuc_te) : DASH),
    ],
  };

  return [nhanCong, soChe, dongThung];
}
