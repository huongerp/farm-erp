/** Xuất nhật ký pha phèn theo tháng: map phẳng + định nghĩa cột (bố cục theo file mẫu). */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhaPhen } from '../core/types';
import { kgCuaLan } from './hien-thi';

const so = (n: number | null) => (n == null ? '' : n);

/** `stt` do nơi gọi tính (thứ tự dòng khi xuất). */
export function mapNhatKyPhaPhenRow(p: NhatKyPhaPhen, stt: number): Record<string, unknown> {
  return {
    stt,
    ngay: formatYmdToDisplay(p.ngay),
    ten_chi_nhanh: p.ten_chi_nhanh ?? '',
    so_buong_du_thu: so(p.so_buong_du_thu),
    lan_1: so(kgCuaLan(p, 1)),
    lan_2: so(kgCuaLan(p, 2)),
    lan_3: so(kgCuaLan(p, 3)),
    lan_4: so(kgCuaLan(p, 4)),
    lan_5: so(kgCuaLan(p, 5)),
    tong_thuc_te: p.tong_thuc_te,
    tong_dinh_muc: p.tong_dinh_muc,
    chenh_lech: p.chenh_lech,
    so_be_so_che: so(p.so_be_so_che),
    nhan_su: p.ten_nhan_vien_phu_trach ?? '',
    ghi_chu: p.ghi_chu ?? '',
  };
}

const EXPORT_KEYS = [
  'stt',
  'ngay',
  'ten_chi_nhanh',
  'so_buong_du_thu',
  'lan_1',
  'lan_2',
  'lan_3',
  'lan_4',
  'lan_5',
  'tong_thuc_te',
  'tong_dinh_muc',
  'chenh_lech',
  'so_be_so_che',
  'nhan_su',
  'ghi_chu',
] as const;

export function getExportColumnsNhatKyPhaPhen(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`nkpp.export.${key}`) }));
}

export const exportFileNameNhatKyPhaPhen = () => `nhat-ky-pha-phen-${new Date().toISOString().slice(0, 10)}`;
