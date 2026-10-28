/**
 * Toolbar chung của tab «Tổng hợp tuần» / «So sánh tháng»: bộ chọn kỳ (tuần / số tháng) + chi nhánh
 * (tất cả hoặc MỘT chi nhánh) + nút Xuất Excel. Khuôn `DashboardToolbar` như tab Tổng hợp ngày;
 * điện thoại: kỳ đi qua `mobileFilterExtra`, chi nhánh qua `filterGroups`.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, CalendarRange, FileSpreadsheet } from 'lucide-react';
import DashboardToolbar from '../../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../../components/shared/ResponsiveFilterChips';
import { MobileFilterField, type FilterGroup } from '../../../../../components/ui/MobileFilterSheet';
import Button from '../../../../../components/ui/Button';
import Tooltip from '../../../../../components/ui/Tooltip';
import type { Branch } from '../../../../he-thong/chi-nhanh/core/types';

interface Props {
  /** Bộ chọn kỳ; `inline` = bản trong bảng lọc mobile. */
  chonKy: (inline: boolean) => React.ReactNode;
  nhanKy: string;
  dsChiNhanh: Pick<Branch, 'id' | 'ma_chi_nhanh' | 'ten_chi_nhanh'>[];
  /** '' = tất cả chi nhánh trong phạm vi xem */
  idChiNhanh: string;
  onDoiChiNhanh: (id: string) => void;
  coSo: boolean;
  onXuat: () => void;
}

const TongHopToolbar: React.FC<Props> = ({ chonKy, nhanKy, dsChiNhanh, idChiNhanh, onDoiChiNhanh, coSo, onXuat }) => {
  const { t } = useTranslation();

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'branch',
        label: t('danhGiaDauVao.toolbar.filterBranch'),
        icon: Building2,
        options: dsChiNhanh.map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
        value: idChiNhanh ? [idChiNhanh] : [],
        // Một chi nhánh hoặc tất cả: giữ lựa chọn mới nhất.
        onChange: (v: string[]) => onDoiChiNhanh(v.find((x) => x !== idChiNhanh) ?? (v.includes(idChiNhanh) ? idChiNhanh : '')),
      },
    ],
    [t, dsChiNhanh, idChiNhanh, onDoiChiNhanh]
  );
  const filterItems: FilterChipItem[] = [
    { kind: 'custom', key: 'ky', node: chonKy(false) },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[220px]' },
  ];

  const iconBtn = 'h-9 w-9 p-0 inline-flex items-center justify-center border-border text-muted-foreground hover:bg-muted/50';
  const actions = (
    <Tooltip content={t('danhGiaDauVao.bang.xuatExcel')} placement="bottom">
      <Button variant="outline" size="sm" className={iconBtn} disabled={!coSo} onClick={onXuat} aria-label={t('danhGiaDauVao.bang.xuatExcel')}>
        <FileSpreadsheet className="w-4 h-4" />
      </Button>
    </Tooltip>
  );

  return (
    <DashboardToolbar
      hideBack
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={
        <MobileFilterField label={nhanKy} icon={CalendarRange} active>
          {chonKy(true)}
        </MobileFilterField>
      }
      mobileFilterExtraCount={1}
      activeFilterCount={idChiNhanh ? 1 : 0}
      onClearFilters={() => onDoiChiNhanh('')}
      actions={actions}
      className="static z-auto border-b border-border"
    />
  );
};

export default TongHopToolbar;
