import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Building2 } from 'lucide-react';
import { useDoiThuList } from '../hooks/use-phan-tich-doi-thu';
import { SO_SANH_TIEU_CHI } from '../core/constants';
import { LOAI_DOI_THU_LABELS } from '../core/constants';
import type { DoiThu } from '../core/types';
import type { LoaiDoiThu } from '../core/constants';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { cn } from '../../../../lib/utils';

function getCellValue(d: DoiThu, key: string): string {
  const v = (d as Record<string, unknown>)[key];
  if (v == null || v === '') return '—';
  if (key === 'phan_loai' && typeof v === 'string')
    return LOAI_DOI_THU_LABELS[v as LoaiDoiThu] ?? String(v);
  if (typeof v === 'number') return String(v);
  return String(v).trim();
}

const TabSoSanh: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: list = [], isLoading } = useDoiThuList();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const filterOptions = useMemo(() => {
    const bySearch = searchTerm.trim()
      ? list.filter((d) =>
          d.ten_doi_thu.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
      : list;
    const selectedNotInFilter = [...selectedIds].filter(
      (id) => !bySearch.some((d) => d.id === id)
    );
    const toShow = [
      ...new Set([
        ...selectedNotInFilter
          .map((id) => list.find((d) => d.id === id))
          .filter((d): d is DoiThu => !!d),
        ...bySearch,
      ]),
    ];
    return toShow.map((d) => ({
      value: d.id,
      label: d.ten_doi_thu,
    }));
  }, [list, searchTerm, selectedIds]);

  const selectedDoiThu = useMemo(
    () => list.filter((d) => selectedIds.has(d.id)),
    [list, selectedIds]
  );
  const canCompare = selectedDoiThu.length >= 2;

  const activeFilterCount = (searchTerm ? 1 : 0) + (selectedIds.size > 0 ? 1 : 0);
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedIds(new Set());
  };

  const competitorListForToolbar = useMemo(
    () =>
      searchTerm.trim()
        ? list.filter((d) =>
            d.ten_doi_thu.toLowerCase().includes(searchTerm.trim().toLowerCase())
          )
        : list,
    [list, searchTerm]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={filterOptions}
        value={Array.from(selectedIds)}
        onChange={(v) => setSelectedIds(new Set(v))}
        placeholder={t('phanTichDoiThu.soSanh.filterDoiThu')}
        className="w-full sm:w-[200px] min-w-0 shrink-0"
        hideZeroCount={false}
      />
      {list.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto custom-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {competitorListForToolbar.map((d) => {
              const selected = selectedIds.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(d.id)) next.delete(d.id);
                      else next.add(d.id);
                      return next;
                    });
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors text-xs font-medium whitespace-nowrap shrink-0',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  {d.logo ? (
                    <img src={d.logo} alt="" className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <Building2 size={14} className="text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate max-w-[120px]">{d.ten_doi_thu}</span>
                  {selected && <span className="opacity-80">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'doi_thu',
        label: t('phanTichDoiThu.soSanh.filterDoiThu'),
        icon: Building2,
        options: filterOptions,
        value: Array.from(selectedIds),
        onChange: (val: string[]) => setSelectedIds(new Set(val)),
      },
    ],
    [filterOptions, selectedIds, t]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar: Back + Search + Multiselect đối thủ */}
      <div className="-mx-4 -mt-1 shrink-0">
        <GenericToolbar
          selectedCount={0}
          onClearSelection={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          actions={null}
          filters={renderFilters}
          filterGroups={filterGroups}
          showBack
          onBack={() => navigate('/dieu-hanh')}
          searchPlaceholder={t('phanTichDoiThu.soSanh.searchPlaceholder')}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
        />
      </div>

      {/* Nội dung: gợi ý + bảng so sánh */}
      <div className="flex-1 min-h-0 flex flex-col overflow-auto pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('phanTichDoiThu.empty')}</p>
        ) : (
          <>
            {selectedDoiThu.length > 0 && selectedDoiThu.length < 2 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-sm mb-4">
                <GitCompare size={16} />
                {t('phanTichDoiThu.soSanh.chonItNhat2')}
              </div>
            )}

            {canCompare && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <table
                    className="w-full border-collapse"
                    style={{ minWidth: 180 + selectedDoiThu.length * 180 }}
                  >
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[180px] min-w-[180px] sticky left-0 z-20 bg-muted/95 border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                          {t('phanTichDoiThu.soSanh.tieuChi')}
                        </th>
                        {selectedDoiThu.map((d) => (
                          <th
                            key={d.id}
                            className="text-left px-4 py-3 text-xs font-semibold text-foreground min-w-[180px] w-[180px]"
                          >
                            <div className="flex items-center gap-2">
                              {d.logo ? (
                                <img
                                  src={d.logo}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-border"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg border border-dashed border-border bg-muted/50 flex items-center justify-center">
                                  <Building2 size={14} className="text-muted-foreground" />
                                </div>
                              )}
                              <span
                                className="truncate max-w-[120px]"
                                title={d.ten_doi_thu}
                              >
                                {d.ten_doi_thu}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SO_SANH_TIEU_CHI.map((crit, idx) => (
                        <tr
                          key={crit.key}
                          className={cn(
                            'border-b border-border last:border-b-0',
                            idx % 2 === 1 && 'bg-muted/20'
                          )}
                        >
                          <td
                            className={cn(
                              'px-4 py-2.5 text-sm font-medium text-muted-foreground sticky left-0 z-10 w-[180px] min-w-[180px] border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]',
                              idx % 2 === 1 ? 'bg-muted/20' : 'bg-card'
                            )}
                          >
                            {t(crit.labelKey)}
                          </td>
                          {selectedDoiThu.map((d) => (
                            <td
                              key={d.id}
                              className="px-4 py-2.5 text-sm text-foreground align-top min-w-[180px] w-[180px]"
                            >
                              {getCellValue(d, crit.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TabSoSanh;
