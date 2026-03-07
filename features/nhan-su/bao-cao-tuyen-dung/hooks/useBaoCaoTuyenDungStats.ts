import { useMemo } from 'react';
import type { DeXuatTuyenDungWithCounts } from '@/features/nhan-su/de-xuat-tuyen-dung/core/types';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';
import type { LichPhongVan } from '@/features/nhan-su/lich-phong-van/core/types';
import type { ThuGuiUngVien } from '@/features/nhan-su/thu-gui-ung-vien/core/types';
import type { HopDong } from '@/features/nhan-su/hop-dong/core/types';
import type { PhieuThanhLy } from '@/features/nhan-su/hop-dong/core/types';
import { DEXUAT_TRANG_THAI_DA_DUYET, LICH_PV_TRANG_THAI_DA_DIEN_RA } from '../core/constants';

export interface FunnelSummary {
  deXuatDaDuyet: number;
  ungVien: number;
  lichPVDaDienRa: number;
  thuMoiNhanViec: number;
  hopDong: number;
  hopDongThanhLy: number;
}

export interface ByViTriRow {
  id: string;
  id_de_xuat: string;
  label: string;
  so_ung_vien: number;
  so_pv: number;
  so_thu_moi: number;
  so_hop_dong: number;
}

export interface ByNguonRow {
  id: string;
  id_kenh: string;
  label: string;
  so_ung_vien: number;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface BaoCaoTuyenDungStatsResult {
  summary: FunnelSummary;
  funnel: FunnelSummary;
  byViTri: ByViTriRow[];
  byNguon: ByNguonRow[];
  chartFunnel: ChartItem[];
  chartByViTri: ChartItem[];
  chartByNguon: ChartItem[];
}

interface InputLists {
  dexuat: DeXuatTuyenDungWithCounts[];
  ungVien: UngVien[];
  lichPV: LichPhongVan[];
  thu: ThuGuiUngVien[];
  hopDong: HopDong[];
  phieuThanhLy: PhieuThanhLy[];
}

export function useBaoCaoTuyenDungStats(input: InputLists): BaoCaoTuyenDungStatsResult {
  return useMemo(() => {
    const { dexuat, ungVien, lichPV, thu, hopDong, phieuThanhLy } = input;

    const deXuatDaDuyet = dexuat.filter((d) => d.trang_thai === DEXUAT_TRANG_THAI_DA_DUYET).length;
    const lichPVDaDienRa = lichPV.filter((p) => p.trang_thai === LICH_PV_TRANG_THAI_DA_DIEN_RA).length;
    const thuMoiNhanViec = thu.filter((t) => t.loai_thu === 'moi-nhan-viec').length;
    const hopDongThanhLy = phieuThanhLy.length;

    const summary: FunnelSummary = {
      deXuatDaDuyet,
      ungVien: ungVien.length,
      lichPVDaDienRa,
      thuMoiNhanViec,
      hopDong: hopDong.length,
      hopDongThanhLy,
    };

    const uvByDeXuat = new Map<string, number>();
    const pvByUngVien = new Map<string, number>();
    lichPV.forEach((p) => {
      if (p.trang_thai === LICH_PV_TRANG_THAI_DA_DIEN_RA) {
        pvByUngVien.set(p.id_ung_vien, (pvByUngVien.get(p.id_ung_vien) ?? 0) + 1);
      }
    });
    const thuMoiByUngVien = new Set<string>();
    thu.forEach((t) => {
      if (t.loai_thu === 'moi-nhan-viec') thuMoiByUngVien.add(t.id_ung_vien);
    });
    const hopDongByUngVien = new Map<string, number>();
    hopDong.forEach((h) => {
      hopDongByUngVien.set(h.id_ung_vien, (hopDongByUngVien.get(h.id_ung_vien) ?? 0) + 1);
    });

    ungVien.forEach((u) => {
      uvByDeXuat.set(u.id_de_xuat_tuyen_dung, (uvByDeXuat.get(u.id_de_xuat_tuyen_dung) ?? 0) + 1);
    });

    const byViTri: ByViTriRow[] = dexuat.map((d) => {
      const candidates = ungVien.filter((u) => u.id_de_xuat_tuyen_dung === d.id);
      let so_pv = 0;
      let so_thu_moi = 0;
      let so_hop_dong = 0;
      candidates.forEach((u) => {
        so_pv += pvByUngVien.get(u.id) ?? 0;
        if (thuMoiByUngVien.has(u.id)) so_thu_moi += 1;
        so_hop_dong += hopDongByUngVien.get(u.id) ?? 0;
      });
      return {
        id: d.id,
        id_de_xuat: d.id,
        label: d.ma_de_xuat ? (d.ten_chuc_vu ? `${d.ma_de_xuat} · ${d.ten_chuc_vu}` : d.ma_de_xuat) : d.id,
        so_ung_vien: candidates.length,
        so_pv,
        so_thu_moi,
        so_hop_dong,
      };
    });

    const nguonMap = new Map<string, { label: string; count: number }>();
    ungVien.forEach((u) => {
      const key = u.id_kenh_tuyen_dung ?? '__unknown';
      const label = u.ten_kenh_tuyen_dung ?? (key === '__unknown' ? '' : key);
      const cur = nguonMap.get(key) ?? { label: label || key, count: 0 };
      cur.count += 1;
      nguonMap.set(key, cur);
    });
    const byNguon: ByNguonRow[] = Array.from(nguonMap.entries()).map(([id, v]) => ({
      id: id === '__unknown' ? 'unknown' : id,
      id_kenh: id === '__unknown' ? '' : id,
      label: v.label || id,
      so_ung_vien: v.count,
    }));

    const chartFunnel: ChartItem[] = [
      { name: 'DeXuat', value: summary.deXuatDaDuyet },
      { name: 'UngVien', value: summary.ungVien },
      { name: 'PhongVan', value: summary.lichPVDaDienRa },
      { name: 'ThuMoi', value: summary.thuMoiNhanViec },
      { name: 'HopDong', value: summary.hopDong },
    ];
    const chartByViTri: ChartItem[] = byViTri.map((r) => ({ name: r.label, value: r.so_ung_vien }));
    const chartByNguon: ChartItem[] = byNguon.map((r) => ({ name: r.label, value: r.so_ung_vien }));

    return {
      summary,
      funnel: summary,
      byViTri,
      byNguon,
      chartFunnel,
      chartByViTri,
      chartByNguon,
    };
  }, [
    input.dexuat,
    input.ungVien,
    input.lichPV,
    input.thu,
    input.hopDong,
    input.phieuThanhLy,
  ]);
}
