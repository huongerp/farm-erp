import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardCheck, Building2, Target, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useTheoDoiDanhGiaStore } from '../store/useTheoDoiDanhGiaStore';
import { TRANG_THAI_BAO_CAO_LABEL_KEYS } from '../core/constants';
import type { KetQuaBaoCaoKpi } from '../core/types';
import type { TieuChiKpi } from '../../tieu-chi-kpi/core/types';

interface Department {
  id: string;
  ten_phong_ban: string;
}

interface Props {
  fullListForFilters: KetQuaBaoCaoKpi[];
  tieuChiList: TieuChiKpi[];
  phongBanList: Department[];
  onAdd: () => void;
}

const TheoDoiDanhGiaToolbar: React.FC<Props> = ({
  fullListForFilters,
  tieuChiList,
  phongBanList,
  onAdd,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useTheoDoiDanhGiaStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.id_tieu_chi ? 1 : 0) +
      (filters.id_phong_ban ? 1 : 0) +
      (filters.ky_nam != null ? 1 : 0) +
      (filters.ky_quy != null ? 1 : 0) +
      (filters.ky_thang != null ? 1 : 0) +
      (filters.trang_thai ? 1 : 0),
    [
      searchTerm,
      filters.id_tieu_chi,
      filters.id_phong_ban,
      filters.ky_nam,
      filters.ky_quy,
      filters.ky_thang,
      filters.trang_thai,
    ]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('id_tieu_chi', null);
    setFilter('id_phong_ban', null);
    setFilter('ky_nam', null);
    setFilter('ky_quy', null);
    setFilter('ky_thang', null);
    setFilter('trang_thai', null);
  };

  const tieuChiOptions = useMemo(() => {
    const list = fullListForFilters;
    return tieuChiList
      .filter((tc) => list.some((b) => b.id_tieu_chi === tc.id))
      .map((tc) => ({
        value: tc.id,
        label: tc.ten,
        count: list.filter((b) => b.id_tieu_chi === tc.id).length,
      }));
  }, [fullListForFilters, tieuChiList]);

  const phongBanOptions = useMemo(() => {
    const list = fullListForFilters;
    return phongBanList
      .filter((pb) => list.some((b) => b.id_phong_ban === pb.id))
      .map((pb) => ({
        value: pb.id,
        label: pb.ten_phong_ban,
        count: list.filter((b) => b.id_phong_ban === pb.id).length,
      }));
  }, [fullListForFilters, phongBanList]);

  const namOptions = useMemo(() => {
    const list = fullListForFilters;
    const years = [...new Set(list.map((b) => b.ky_nam))].sort((a, b) => b - a);
    return years.map((y) => ({
      value: String(y),
      label: String(y),
      count: list.filter((b) => b.ky_nam === y).length,
    }));
  }, [fullListForFilters]);

  const quyOptions = useMemo(() => {
    const list = fullListForFilters;
    return [1, 2, 3, 4]
      .filter((q) => list.some((b) => b.ky_quy === q))
      .map((q) => ({
        value: String(q),
        label: `Q${q}`,
        count: list.filter((b) => b.ky_quy === q).length,
      }));
  }, [fullListForFilters]);

  const thangOptions = useMemo(() => {
    const list = fullListForFilters;
    return Array.from({ length: 12 }, (_, i) => i + 1)
      .filter((m) => list.some((b) => b.ky_thang === m))
      .map((m) => ({
        value: String(m),
        label: String(m),
        count: list.filter((b) => b.ky_thang === m).length,
      }));
  }, [fullListForFilters]);

  const trangThaiOptions = useMemo(() => {
    const list = fullListForFilters;
    return (['nhap', 'da_gui', 'da_danh_gia'] as const)
      .filter((s) => list.some((b) => b.trang_thai === s))
      .map((s) => ({
        value: s,
        label: t(TRANG_THAI_BAO_CAO_LABEL_KEYS[s]),
        count: list.filter((b) => b.trang_thai === s).length,
      }));
  }, [fullListForFilters, t]);

  const renderFilters = (
    <>
      <FilterChipSingleSelect
        options={tieuChiOptions}
        value={filters.id_tieu_chi}
        onChange={(v) => setFilter('id_tieu_chi', v)}
        placeholder={t('theoDoiDanhGia.filterTieuChi')}
        icon={Target}
        className="w-full sm:w-[200px]"
      />
      <FilterChipSingleSelect
        options={phongBanOptions}
        value={filters.id_phong_ban}
        onChange={(v) => setFilter('id_phong_ban', v)}
        placeholder={t('theoDoiDanhGia.filterPhongBan')}
        icon={Building2}
        className="w-full sm:w-[180px]"
      />
      <FilterChipSingleSelect
        options={namOptions}
        value={filters.ky_nam != null ? String(filters.ky_nam) : null}
        onChange={(v) => setFilter('ky_nam', v ? Number(v) : null)}
        placeholder={t('theoDoiDanhGia.filterKyNam')}
        icon={Calendar}
        className="w-full sm:w-[100px]"
      />
      {quyOptions.length > 0 && (
        <FilterChipSingleSelect
          options={quyOptions}
          value={filters.ky_quy != null ? String(filters.ky_quy) : null}
          onChange={(v) => setFilter('ky_quy', v ? Number(v) : null)}
          placeholder={t('theoDoiDanhGia.filterKyQuy')}
          icon={Calendar}
          className="w-full sm:w-[90px]"
        />
      )}
      {thangOptions.length > 0 && (
        <FilterChipSingleSelect
          options={thangOptions}
          value={filters.ky_thang != null ? String(filters.ky_thang) : null}
          onChange={(v) => setFilter('ky_thang', v ? Number(v) : null)}
          placeholder={t('theoDoiDanhGia.filterKyThang')}
          icon={Calendar}
          className="w-full sm:w-[90px]"
        />
      )}
      <FilterChipSingleSelect
        options={trangThaiOptions}
        value={filters.trang_thai}
        onChange={(v) => setFilter('trang_thai', v)}
        placeholder={t('theoDoiDanhGia.filterTrangThai')}
        icon={ClipboardCheck}
        className="w-full sm:w-[130px]"
      />
    </>
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{BTN_ADD()}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      onClearSelection={() => {}}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      actions={renderActions}
      filters={renderFilters}
      onAdd={onAdd}
      showBack={true}
      onBack={() => navigate('/dieu-hanh')}
      searchPlaceholder={t('theoDoiDanhGia.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default TheoDoiDanhGiaToolbar;
