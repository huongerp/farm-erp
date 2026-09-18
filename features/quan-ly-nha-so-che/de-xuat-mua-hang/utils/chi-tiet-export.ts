import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../lib/useExportData';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { DeXuatMuaHang, DeXuatMuaHangChiTietRow } from '../core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

function formatExportDateTime(iso: string | undefined | null): string {
  if (iso == null || iso === '') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/** Số ngày từ ngày lập phiếu đến ngày cần (hỗ trợ lập kế hoạch / SLA). */
function leadDays(ngayStr: string | null | undefined, ngayCanStr: string | null | undefined): string {
  if (!ngayStr?.trim() || !ngayCanStr?.trim()) return '';
  const a = new Date(ngayStr);
  const b = new Date(ngayCanStr);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
  return String(Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
}

/** Khóa cột export (dùng cho `visibleColumnKeys` của ExportDialog). */
export const CHI_TIET_EXPORT_KEYS: string[] = [
  'id_dong_chi_tiet',
  'id_de_xuat_mua_hang',
  'so_phieu',
  'ngay',
  'ngay_can',
  'so_ngay_den_ngay_can',
  'trang_thai_phieu',
  'tg_tao_phieu',
  'tg_cap_nhat_phieu',
  'id_noi_de_xuat',
  'ma_kho_de_xuat',
  'ten_noi_de_xuat',
  'ten_chi_nhanh_kho',
  'id_nguoi_de_xuat',
  'ma_nguoi_de_xuat',
  'ten_nguoi_de_xuat',
  'ghi_chu_phieu',
  'tong_so_dong_phieu',
  'tong_so_luong_phieu',
  'id_hang_hoa',
  'ma_hang',
  'ten_hang',
  'so_luong',
  'don_vi_tinh',
  'id_tien_do_mh',
  'ten_tien_do_mh',
  'id_nguoi_duyet',
  'ma_nguoi_duyet',
  'ten_nguoi_duyet',
  'thong_so',
  'ghi_chu',
  'trao_doi',
];

function employeesToMap(employees: EmployeeRef[]): Record<string, { ho_ten: string; ma_nhan_vien: string }> {
  const m: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => {
    m[e.id] = { ho_ten: e.ho_ten ?? '', ma_nhan_vien: e.ma_nhan_vien ?? '' };
  });
  return m;
}

/** Cột export tab Chi tiết — đầy đủ ID/mã/tên và metadata phiếu / kho. */
export function getChiTietExportColumns(t: TFunction): ExportColumn[] {
  return [
    { key: 'id_dong_chi_tiet', label: t('deXuatMuaHang.exportChiTiet.idDongChiTiet') },
    { key: 'id_de_xuat_mua_hang', label: t('deXuatMuaHang.exportChiTiet.idPhieu') },
    { key: 'so_phieu', label: t('deXuatMuaHang.store.soPhieuCol') },
    { key: 'ngay', label: t('deXuatMuaHang.store.ngayCol') },
    { key: 'ngay_can', label: t('deXuatMuaHang.store.ngayCanCol') },
    { key: 'so_ngay_den_ngay_can', label: t('deXuatMuaHang.exportChiTiet.soNgayDenNgayCan') },
    { key: 'trang_thai_phieu', label: t('deXuatMuaHang.store.statusCol') },
    { key: 'tg_tao_phieu', label: t('deXuatMuaHang.exportChiTiet.tgTaoPhieu') },
    { key: 'tg_cap_nhat_phieu', label: t('deXuatMuaHang.exportChiTiet.tgCapNhatPhieu') },
    { key: 'id_noi_de_xuat', label: t('deXuatMuaHang.exportChiTiet.idNoiDeXuat') },
    { key: 'ma_kho_de_xuat', label: t('deXuatMuaHang.exportChiTiet.maKhoDeXuat') },
    { key: 'ten_noi_de_xuat', label: t('deXuatMuaHang.store.noiDeXuatCol') },
    { key: 'ten_chi_nhanh_kho', label: t('deXuatMuaHang.exportChiTiet.tenChiNhanhKho') },
    { key: 'id_nguoi_de_xuat', label: t('deXuatMuaHang.exportChiTiet.idNguoiDeXuat') },
    { key: 'ma_nguoi_de_xuat', label: t('deXuatMuaHang.exportChiTiet.maNguoiDeXuat') },
    { key: 'ten_nguoi_de_xuat', label: t('deXuatMuaHang.store.nguoiDeXuatCol') },
    { key: 'ghi_chu_phieu', label: t('deXuatMuaHang.exportChiTiet.ghiChuPhieu') },
    { key: 'tong_so_dong_phieu', label: t('deXuatMuaHang.exportChiTiet.tongSoDongPhieu') },
    { key: 'tong_so_luong_phieu', label: t('deXuatMuaHang.exportChiTiet.tongSoLuongPhieu') },
    { key: 'id_hang_hoa', label: t('deXuatMuaHang.exportChiTiet.idHangHoa') },
    { key: 'ma_hang', label: t('deXuatMuaHang.form.itemCode') },
    { key: 'ten_hang', label: t('deXuatMuaHang.form.itemName') },
    { key: 'so_luong', label: t('deXuatMuaHang.form.quantity') },
    { key: 'don_vi_tinh', label: t('deXuatMuaHang.form.unit') },
    { key: 'id_tien_do_mh', label: t('deXuatMuaHang.exportChiTiet.idTienDoMh') },
    { key: 'ten_tien_do_mh', label: t('deXuatMuaHang.form.tienDoMh') },
    { key: 'id_nguoi_duyet', label: t('deXuatMuaHang.exportChiTiet.idNguoiDuyet') },
    { key: 'ma_nguoi_duyet', label: t('deXuatMuaHang.exportChiTiet.maNguoiDuyet') },
    { key: 'ten_nguoi_duyet', label: t('deXuatMuaHang.store.nguoiDuyetCol') },
    { key: 'thong_so', label: t('deXuatMuaHang.form.specs') },
    { key: 'ghi_chu', label: t('deXuatMuaHang.form.note') },
    { key: 'trao_doi', label: t('deXuatMuaHang.exportChiTiet.traoDoi') },
  ];
}

export function mapChiTietRowToExport(
  row: DeXuatMuaHangChiTietRow,
  phieu: DeXuatMuaHang | undefined,
  employees: EmployeeRef[],
  khoById?: Map<string, Kho>
): Record<string, string | number> {
  const nv = employeesToMap(employees);
  const reqId = phieu?.id_nguoi_de_xuat ?? '';
  const appId = phieu?.id_nguoi_duyet ?? '';
  const reqNv = reqId ? nv[reqId] : undefined;
  const appNv = appId ? nv[appId] : undefined;
  const khoId = phieu?.id_noi_de_xuat ?? '';
  const kho = khoId && khoById ? khoById.get(khoId) : undefined;
  const ngayRef = phieu?.ngay ?? row.ngay;
  const ngayCanRef = phieu?.ngay_can ?? row.ngay_can;

  return {
    id_dong_chi_tiet: row.id,
    id_de_xuat_mua_hang: row.id_de_xuat_mua_hang,
    so_phieu: row.so_phieu ?? phieu?.so_phieu ?? '',
    ngay: row.ngay ?? phieu?.ngay ?? '',
    ngay_can: row.ngay_can ?? phieu?.ngay_can ?? '',
    so_ngay_den_ngay_can: leadDays(ngayRef, ngayCanRef),
    trang_thai_phieu: row.trang_thai_phieu ?? phieu?.trang_thai ?? '',
    tg_tao_phieu: formatExportDateTime(phieu?.tg_tao),
    tg_cap_nhat_phieu: formatExportDateTime(phieu?.tg_cap_nhat),
    id_noi_de_xuat: phieu?.id_noi_de_xuat ?? '',
    ma_kho_de_xuat: kho?.ma_kho ?? '',
    ten_noi_de_xuat: row.ten_noi_de_xuat ?? phieu?.ten_noi_de_xuat ?? kho?.ten_kho ?? '',
    ten_chi_nhanh_kho: kho?.ten_chi_nhanh ?? '',
    id_nguoi_de_xuat: reqId,
    ma_nguoi_de_xuat: phieu?.ma_nguoi_de_xuat ?? reqNv?.ma_nhan_vien ?? '',
    ten_nguoi_de_xuat: row.ten_nguoi_de_xuat ?? phieu?.ten_nguoi_de_xuat ?? reqNv?.ho_ten ?? '',
    id_nguoi_duyet: appId,
    ma_nguoi_duyet: phieu?.ma_nguoi_duyet ?? appNv?.ma_nhan_vien ?? '',
    ten_nguoi_duyet: row.ten_nguoi_duyet ?? phieu?.ten_nguoi_duyet ?? appNv?.ho_ten ?? '',
    ghi_chu_phieu: phieu?.ghi_chu ?? '',
    tong_so_dong_phieu: phieu?.tong_so_dong ?? '',
    tong_so_luong_phieu: phieu?.tong_so_luong ?? '',
    id_hang_hoa: row.id_hang_hoa,
    ma_hang: row.ma_hang ?? '',
    ten_hang: row.ten_hang ?? '',
    so_luong: row.so_luong,
    don_vi_tinh: row.don_vi_tinh ?? '',
    id_tien_do_mh: row.id_tien_do_mh ?? '',
    ten_tien_do_mh: row.ten_tien_do_mh ?? '',
    thong_so: row.thong_so ?? '',
    ghi_chu: row.ghi_chu ?? '',
    trao_doi: row.trao_doi ?? '',
  };
}
