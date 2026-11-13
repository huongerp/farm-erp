/**
 * Trang in "Lịch bảo dưỡng thiết bị" — route /quan-ly-nha-so-che/bao-duong-thiet-bi/in-lich
 * Nhận ?farm=<id chi nhánh>, ?loc=qua_han|sap_toi và ?khu_vuc=<tên> để in đúng farm + bộ lọc đang xem ở tab Lịch.
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { getTodayISO } from '../../../lib/utils';
import { soSanhTheoHan, tinhTrangHan } from './core/han';
import type { LichBaoDuongRow } from './core/list-types';
import { useBaoDuongTheoFarm } from './hooks/use-bao-duong-thiet-bi';
import { useBaoDuongFarm } from './hooks/use-bao-duong-view-scope';
import LichBaoDuongLichIn from './components/preview/LichBaoDuongLichIn';

// Lịch nhiều cột → A4 ngang.
const MAC_DINH = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const LichBaoDuongInPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const loc = searchParams.get('loc');
  const khuVucParam = searchParams.get('khu_vuc');
  // ?farm= chỉ nhận farm trong phạm vi; không có / ngoài phạm vi (link cũ, sửa tay) → farm đang chọn của người in.
  const farm = useBaoDuongFarm();
  const farmParam = searchParams.get('farm');
  const farmId = farmParam && farm.farms.some((b) => b.id === farmParam) ? farmParam : farm.farmId;
  const tenFarm = farmId ? (farm.tenFarm.get(farmId) ?? null) : null;
  const { viecQuery, thietBiQuery, viec, thietBi } = useBaoDuongTheoFarm(farmId);

  const homNay = getTodayISO();

  const rows = useMemo<LichBaoDuongRow[]>(() => {
    const tbById = new Map(thietBi.map((tb) => [tb.id, tb]));
    return viec
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
  }, [viec, thietBi, loc, khuVucParam, homNay]);

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
      title={tenFarm ? `${t('baoDuongThietBi.inLich.title')} — ${tenFarm}` : t('baoDuongThietBi.inLich.title')}
      mauKey="bao-duong-thiet-bi-lich"
      macDinh={MAC_DINH}
      coChuGocPt={9}
      tenFile="Lich-bao-duong-thiet-bi"
      duongDanVe="/quan-ly-nha-so-che/bao-duong-thiet-bi"
      isLoading={viecQuery.isPending || thietBiQuery.isPending || farm.isLoading}
      loi={loi}
      onRetry={loi ? () => {
        void viecQuery.refetch();
        void thietBiQuery.refetch();
      } : undefined}
    >
      <LichBaoDuongLichIn rows={rows} subtitle={subtitle} tenFarm={tenFarm} />
    </PhieuInPage>
  );
};

export default LichBaoDuongInPage;
