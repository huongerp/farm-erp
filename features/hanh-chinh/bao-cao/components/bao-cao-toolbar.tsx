import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FolderOpen, Building2, User } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDuAnList } from '../../du-an/hooks/use-du-an';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import type { BaoCaoCongViecFilters } from '../core/types';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

/** Chỉ render phần filter controls (dùng nhúng vào DashboardToolbar). */
export const BaoCaoToolbarFilters: React.FC<Pick<Props, 'filters' | 'onFiltersChange'>> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const { data: duAnList = [] } = useDuAnList();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const duAnOptions = useMemo(
    () => duAnList.map((d) => ({ label: d.ten_du_an, value: d.id })),
    [duAnList]
  );
  const phongBanOptions = useMemo(
    () => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })),
    [departments]
  );
  const nguoiOptions = useMemo(
    () => employees.slice(0, 200).map((e) => ({ label: e.full_name || e.ma_nhan_vien, value: e.id })),
    [employees]
  );

  const update = (patch: Partial<BaoCaoCongViecFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="w-[130px] h-8 text-xs"
        />
        <span className="text-muted-foreground text-xs">→</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="w-[130px] h-8 text-xs"
        />
      </div>
      <FilterChipMultiSelect
        options={duAnOptions}
        value={filters.id_du_an}
        onChange={(v) => update({ id_du_an: v })}
        placeholder={t('baoCao.duAn')}
        icon={FolderOpen}
        className="w-[150px]"
      />
      <FilterChipMultiSelect
        options={phongBanOptions}
        value={filters.id_phong_ban}
        onChange={(v) => update({ id_phong_ban: v })}
        placeholder={t('baoCao.phongBan')}
        icon={Building2}
        className="w-[150px]"
      />
      <FilterChipMultiSelect
        options={nguoiOptions}
        value={filters.nguoi_ids}
        onChange={(v) => update({ nguoi_ids: v })}
        placeholder={t('baoCao.nguoi')}
        icon={User}
        className="w-[160px]"
      />
    </>
  );
};

/** Hook/build filter groups cho mobile (DashboardToolbar filterGroups). */
export function useBaoCaoFilterGroups(
  filters: BaoCaoCongViecFilters,
  onFiltersChange: (f: BaoCaoCongViecFilters) => void
): FilterGroup[] {
  const { t } = useTranslation();
  const { data: duAnList = [] } = useDuAnList();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const duAnOptions = useMemo(
    () => duAnList.map((d) => ({ label: d.ten_du_an, value: d.id })),
    [duAnList]
  );
  const phongBanOptions = useMemo(
    () => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })),
    [departments]
  );
  const nguoiOptions = useMemo(
    () => employees.slice(0, 200).map((e) => ({ label: e.full_name || e.ma_nhan_vien, value: e.id })),
    [employees]
  );

  const update = (patch: Partial<BaoCaoCongViecFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return useMemo(
    () => [
      {
        key: 'duAn',
        label: t('baoCao.duAn'),
        icon: FolderOpen,
        options: duAnOptions,
        value: filters.id_du_an,
        onChange: (val) => update({ id_du_an: val }),
      },
      {
        key: 'phongBan',
        label: t('baoCao.phongBan'),
        icon: Building2,
        options: phongBanOptions,
        value: filters.id_phong_ban,
        onChange: (val) => update({ id_phong_ban: val }),
      },
      {
        key: 'nguoi',
        label: t('baoCao.nguoi'),
        icon: User,
        options: nguoiOptions,
        value: filters.nguoi_ids,
        onChange: (val) => update({ nguoi_ids: val }),
      },
    ],
    [filters, duAnOptions, phongBanOptions, nguoiOptions, t]
  );
}

export default BaoCaoToolbarFilters;
