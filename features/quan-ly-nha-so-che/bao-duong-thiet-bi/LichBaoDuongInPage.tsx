/**
 * Trang in "Lịch bảo dưỡng thiết bị" — route /quan-ly-nha-so-che/bao-duong-thiet-bi/in-lich
 * Nhận ?loc=qua_han|sap_toi và ?khu_vuc=<tên> để in đúng bộ lọc đang xem ở tab Lịch bảo dưỡng.
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { getTodayISO } from '../../../lib/utils';
import { soSanhTheoHan, tinhTrangHan } from './core/han';
import type { LichBaoDuongRow } from './core/list-types';
import { useThietBiList, useViecDangDung } from './hooks/use-bao-duong-thiet-bi';
import LichBaoDuongLichIn from './components/preview/LichBaoDuongLichIn';

// Lịch nhiều cột → A4 ngang.
const MAC_DINH = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const LichBaoDuongInPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc');
  const khuVucParam = searchParams.get('khu_vuc');
  const viecQuery = useViecDangDung();
  const thietBiQuery = useThietBiList();

  const homNay = getTodayISO();

  const rows = useMemo<LichBaoDuongRow[]>(() => {
    const tbById = new Map((thietBiQuery.data ?? []).map((tb) => [tb.id, tb]));
    return (viecQuery.data ?? [])
      .map((v) => {
        const tb = tbById.get(v.id_thiet_bi);
        return {
          ...v,
          thiet_bi_ten: tb?.ten ?? '—',
          thiet_bi_ma_ts: tb?.ma_ts ?? null,
          thiet_bi_khu_vuc: tb?.khu_vuc ?? null,
        };
      })
      .filter((r) => {
        if (loc === 'qua_han' && tinhTrangHan(r.han_ke_tiep, homNay) !== 'qua_han') return false;
        if (loc === 'sap_toi' && tinhTrangHan(r.han_ke_tiep, homNay) !== 'sap_toi') return false;
        if (khuVucParam && r.thiet_bi_khu_vuc !== khuVucParam) return false;
        return true;
      })
      .sort(soSanhTheoHan);
  }, [viecQuery.data, thietBiQuery.data, loc, khuVucParam, homNay]);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (loc === 'qua_han' || loc === 'sap_toi') parts.push(t(`baoDuongThietBi.filter.${loc}`));
    if (khuVucParam) parts.push(`${t('baoDuongThietBi.col.khuVuc')}: ${khuVucParam}`);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }, [loc, khuVucParam, t]);

  const loi = viecQuery.isError
    ? (viecQuery.error?.message ?? t('baoDuongThietBi.empty'))
    : thietBiQuery.isError
      ? (thietBiQuery.error?.message ?? t('baoDuongThietBi.empty'))
      : null;

  return (
    <PhieuInPage
      title={t('baoDuongThietBi.inLich.title')}
      mauKey="bao-duong-thiet-bi-lich"
      macDinh={MAC_DINH}
      coChuGocPt={9}
      tenFile="Lich-bao-duong-thiet-bi"
      duongDanVe="/quan-ly-nha-so-che/bao-duong-thiet-bi"
      isLoading={viecQuery.isPending || thietBiQuery.isPending}
      loi={loi}
      onRetry={loi ? () => {
        void viecQuery.refetch();
        void thietBiQuery.refetch();
      } : undefined}
    >
      <LichBaoDuongLichIn rows={rows} subtitle={subtitle} />
    </PhieuInPage>
  );
};

export default LichBaoDuongInPage;
