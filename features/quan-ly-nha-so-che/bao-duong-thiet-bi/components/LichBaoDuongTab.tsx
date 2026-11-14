import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';
import { getTodayISO } from '../../../../lib/utils';
import { soSanhTheoHan, tinhTrangHan } from '../core/han';
import { tinhTrangHanLabel } from './Badges';
import type { LichBaoDuongRow } from '../core/list-types';
import { useBaoDuongTheoFarm } from '../hooks/use-bao-duong-thiet-bi';
import { LICH_COLUMNS, useLichStore } from '../store/useBaoDuongThietBiStore';
import LichBaoDuongToolbar, { type TinhTrangLoc } from './LichBaoDuongToolbar';
import LichBaoDuongList from './LichBaoDuongList';
import ThietBiDrawer from './ThietBiDrawer';

interface Props {
  /** Farm đang xem — chỉ hiện việc của thiết bị thuộc farm này */
  farmId: string | null;
  onGhiNhan: (row: LichBaoDuongRow) => void;
}

/** Tab "Lịch bảo dưỡng": mỗi dòng = một việc đang dùng, sắp theo hạn, chip lọc tình trạng + khu vực. */
const LichBaoDuongTab: React.FC<Props> = ({ farmId, onGhiNhan }) => {
  const { t } = useTranslation();
  const { canCreate } = useModulePermissionFromContext();
  // Xem lịch sử ghi nhận ngay từ tab Lịch (trước chỉ xem được ở tab Thiết bị → Nhật ký).
  const [xemThietBiId, setXemThietBiId] = useState<string | null>(null);

  const { viecQuery, thietBiQuery, viec, thietBi } = useBaoDuongTheoFarm(farmId);

  const searchTerm = useLichStore((s) => s.searchTerm);
  const {
    pagination,
    setPage,
    setPageSize,
    columns,
    resizeColumn,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    resetState,
  } = useLichStore();

  const [tinhTrang, setTinhTrang] = useState<TinhTrangLoc>('tat_ca');
  const [khuVuc, setKhuVuc] = useState<string | null>(null);

  useEffect(() => () => resetState(), [resetState]);

  const homNay = getTodayISO();

  const tbById = useMemo(() => new Map(thietBi.map((x) => [x.id, x])), [thietBi]);
  const rows = useMemo<LichBaoDuongRow[]>(
    () =>
      viec.map((v) => {
        const tb = tbById.get(v.id_thiet_bi);
        return {
          ...v,
          thiet_bi_ten: tb?.ten ?? '—',
          thiet_bi_ma_ts: tb?.ma_ts ?? null,
          thiet_bi_khu_vuc: tb?.khu_vuc ?? null,
        };
      }),
    [viec, tbById]
  );

  const counts = useMemo(() => {
    let quaHan = 0;
    let sapToi = 0;
    for (const v of viec) {
      const tt = tinhTrangHan(v.han_ke_tiep, homNay);
      if (tt === 'qua_han') quaHan += 1;
      else if (tt === 'sap_toi') sapToi += 1;
    }
    return { tatCa: viec.length, quaHan, sapToi };
  }, [viec, homNay]);

  const khuVucOptions = useMemo(() => {
    const dem = new Map<string, number>();
    for (const tb of thietBi) {
      if (tb.khu_vuc) dem.set(tb.khu_vuc, (dem.get(tb.khu_vuc) ?? 0) + 1);
    }
    return [...dem.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [thietBi]);

  // Ô tìm kiếm quét mọi cột; nhãn tình trạng để gõ "quá hạn" vẫn ra.
  const khopTimKiem = useMemo(
    () =>
      createListSearchMatcher<LichBaoDuongRow>({
        columns: LICH_COLUMNS,
        getCellText: (colId, item) => {
          switch (colId) {
            case 'thiet_bi':
              return [item.thiet_bi_ten, item.thiet_bi_ma_ts, item.thiet_bi_khu_vuc].filter(Boolean).join(' ');
            case 'chu_ky_ngay':
              return item.chu_ky_ngay != null
                ? t('baoDuongThietBi.chuKy.ngay', { n: item.chu_ky_ngay })
                : t('baoDuongThietBi.chuKy.khongTheoLich');
            case 'tinh_trang':
              return tinhTrangHanLabel(item.han_ke_tiep, homNay, t);
            default:
              return '';
          }
        },
      }),
    [homNay, t]
  );

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (tinhTrang === 'qua_han' && tinhTrangHan(item.han_ke_tiep, homNay) !== 'qua_han') return false;
        if (tinhTrang === 'sap_toi' && tinhTrangHan(item.han_ke_tiep, homNay) !== 'sap_toi') return false;
        if (khuVuc && item.thiet_bi_khu_vuc !== khuVuc) return false;
        return khopTimKiem(item, searchTerm);
      }),
    [rows, tinhTrang, khuVuc, homNay, khopTimKiem, searchTerm]
  );

  const sorted = useMemo(() => [...filtered].sort(soSanhTheoHan), [filtered]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const pageData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return sorted.slice(start, start + pagination.pageSize);
  }, [sorted, pagination.page, pagination.pageSize]);

  // In lịch theo đúng farm + bộ lọc đang xem (tình trạng hạn + khu vực).
  const inLich = () => {
    const q = new URLSearchParams();
    if (farmId) q.set('farm', farmId);
    if (tinhTrang !== 'tat_ca') q.set('loc', tinhTrang);
    if (khuVuc) q.set('khu_vuc', khuVuc);
    const qs = q.toString();
    window.open(
      `/quan-ly-nha-so-che/bao-duong-thiet-bi/in-lich${qs ? `?${qs}` : ''}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const isLoading = (viecQuery.isPending || thietBiQuery.isPending) && rows.length === 0;
  const isError = !!viecQuery.error || !!thietBiQuery.error;
  const retry = () => {
    viecQuery.refetch();
    thietBiQuery.refetch();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm overflow-hidden">
      <LichBaoDuongToolbar
        counts={counts}
        khuVucOptions={khuVucOptions}
        tinhTrang={tinhTrang}
        onTinhTrangChange={setTinhTrang}
        khuVuc={khuVuc}
        onKhuVucChange={setKhuVuc}
        selectedCount={selectedIds.size}
        onPrint={inLich}
      />
      <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
        <LichBaoDuongList
          data={pageData}
          columns={columns}
          isLoading={isLoading}
          isFetching={viecQuery.isFetching}
          isError={isError}
          onRetry={retry}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRecordsOverride={total}
          onResizeColumn={resizeColumn}
          onGhiNhan={canCreate ? onGhiNhan : undefined}
          onXemLichSu={(r) => setXemThietBiId(r.id_thiet_bi)}
        />
      </div>

      <AnimatePresence>
        {xemThietBiId && (
          <ThietBiDrawer
            id={xemThietBiId}
            onClose={() => setXemThietBiId(null)}
            canCreate={canCreate}
            canUpdate={false}
            canDelete={false}
            onGhiNhan={onGhiNhan}
            cuonToiNhatKy
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LichBaoDuongTab;
