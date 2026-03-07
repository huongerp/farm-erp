import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { CongViec } from '../../cong-viec/core/types';
import type { DuAn } from '../../du-an/core/types';
import type { BaoCaoCongViecFilters } from '../core/types';

export function useBaoCaoCongViecData(
  congViecList: CongViec[],
  duAnList: DuAn[],
  filters: BaoCaoCongViecFilters
) {
  const duAnById = useMemo(() => {
    const m: Record<string, DuAn> = {};
    duAnList.forEach((d) => { m[d.id] = d; });
    return m;
  }, [duAnList]);

  const filtered = useMemo(() => {
    let list = congViecList;
    if (filters.dateFrom) {
      const from = dayjs(filters.dateFrom).startOf('day').valueOf();
      list = list.filter((c) => dayjs(c.tg_tao).valueOf() >= from);
    }
    if (filters.dateTo) {
      const to = dayjs(filters.dateTo).endOf('day').valueOf();
      list = list.filter((c) => dayjs(c.tg_tao).valueOf() <= to);
    }
    if (filters.id_du_an.length > 0) {
      list = list.filter((c) => c.id_du_an && filters.id_du_an.includes(c.id_du_an));
    }
    if (filters.id_phong_ban.length > 0) {
      list = list.filter((c) => {
        const duAn = c.id_du_an ? duAnById[c.id_du_an] : null;
        return duAn && filters.id_phong_ban.includes(duAn.id_phong_ban);
      });
    }
    if (filters.nguoi_ids.length > 0) {
      list = list.filter(
        (c) =>
          filters.nguoi_ids.includes(c.id_nguoi_giao) ||
          (c.danh_sach_nguoi_thuc_hien && c.danh_sach_nguoi_thuc_hien.some((id) => filters.nguoi_ids.includes(id)))
      );
    }
    return list;
  }, [congViecList, filters, duAnById]);

  const byTrangThai = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((c) => {
      m[c.trang_thai] = (m[c.trang_thai] ?? 0) + 1;
    });
    return Object.entries(m).map(([key, count]) => ({ name: key, count, value: count }));
  }, [filtered]);

  const byUuTien = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((c) => {
      m[c.uu_tien] = (m[c.uu_tien] ?? 0) + 1;
    });
    return Object.entries(m).map(([key, count]) => ({ name: key, count, value: count }));
  }, [filtered]);

  const byDuAn = useMemo(() => {
    const m: Record<string, { id: string; name: string; count: number }> = {};
    filtered.forEach((c) => {
      const id = c.id_du_an ?? '_none';
      const name = c.id_du_an ? (duAnById[c.id_du_an]?.ten_du_an ?? c.ten_du_an ?? id) : '—';
      if (!m[id]) m[id] = { id, name, count: 0 };
      m[id].count += 1;
    });
    return Object.values(m);
  }, [filtered, duAnById]);

  const byPhongBan = useMemo(() => {
    const m: Record<string, { id: string; name: string; count: number }> = {};
    filtered.forEach((c) => {
      const duAn = c.id_du_an ? duAnById[c.id_du_an] : null;
      const id = duAn?.id_phong_ban ?? '_none';
      const name = duAn?.ten_phong_ban ?? '—';
      if (!m[id]) m[id] = { id, name, count: 0 };
      m[id].count += 1;
    });
    return Object.values(m);
  }, [filtered, duAnById]);

  const summary = useMemo(
    () => ({
      total: filtered.length,
      hoanThanh: filtered.filter((c) => c.trang_thai === 'hoan_thanh').length,
      dangThucHien: filtered.filter((c) => c.trang_thai === 'dang_thuc_hien').length,
      choBaoCao: filtered.filter((c) => c.trang_thai === 'cho_bao_cao').length,
    }),
    [filtered]
  );

  return {
    filtered,
    byTrangThai,
    byUuTien,
    byDuAn,
    byPhongBan,
    summary,
  };
}
