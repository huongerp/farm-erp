import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import EmptyState from '../../../components/shared/EmptyState';
import Button from '../../../components/ui/Button';
import FilterChipSingleSelect from '../../../components/shared/FilterChipSingleSelect';
import { useSwotYears, useSwotByYear, useUpdateSwot } from './hooks/use-swot';
import SwotGrid from './components/SwotGrid';
import SwotQuadrantEditDrawer from './components/SwotQuadrantEditDrawer';
import SwotCreateDrawer from './components/SwotCreateDrawer';
import type { Quadrant } from './constants/suggested-criteria';
import type { SwotItem } from './core/types';

const currentYear = new Date().getFullYear();
/** Dải năm cho chip chọn: từ (năm hiện tại - 2) đến (năm hiện tại + 5) để luôn chọn được năm mới */
const YEAR_RANGE_START = currentYear - 2;
const YEAR_RANGE_END = currentYear + 5;

const PhanTichSwotPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: yearsList = [], isLoading: loadingYears } = useSwotYears();
  const [selectedYear, setSelectedYear] = useState<number>(() => currentYear);

  const yearOptions = useMemo(() => {
    const set = new Set<number>(yearsList);
    for (let y = YEAR_RANGE_START; y <= YEAR_RANGE_END; y++) set.add(y);
    set.add(selectedYear);
    return Array.from(set)
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: String(y) }));
  }, [yearsList, selectedYear]);

  const yearFilterValue = String(selectedYear);
  const onYearChange = (v: string | null) => setSelectedYear(v ? Number(v) : currentYear);

  const { data: swotData, isLoading: loadingSwot } = useSwotByYear(selectedYear);
  const updateSwot = useUpdateSwot();

  const [editingQuadrant, setEditingQuadrant] = useState<Quadrant | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const hasData = !!swotData;
  const isLoading = loadingYears || loadingSwot;

  if (loadingYears) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/dieu-hanh')}
        leadingContent={
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
            {t('phanTichSwot.title')}
          </h1>
        }
        row2Content={
          <div className="flex flex-wrap items-center gap-2">
            <FilterChipSingleSelect
              options={yearOptions}
              value={yearFilterValue}
              onChange={onYearChange}
              placeholder={t('phanTichSwot.selectYear')}
              icon={Calendar}
              className="w-full sm:w-[140px]"
            />
            {!hasData && (
              <Button size="sm" variant="default" onClick={() => setShowCreateDrawer(true)}>
                <Plus size={14} className="mr-1.5" />
                {t('phanTichSwot.createForYear', { year: selectedYear })}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="w-full px-3 md:px-4 pb-6 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
                aria-label={t('common.loading')}
              />
            </div>
          ) : hasData ? (
            <SwotGrid
              data={swotData}
              emptyLabel={t('phanTichSwot.emptyQuadrant')}
              onOpenSettings={(q) => setEditingQuadrant(q)}
            />
          ) : (
            <EmptyState
              title={t('phanTichSwot.noDataTitle')}
              description={t('phanTichSwot.noDataDescription', { year: selectedYear })}
              action={
                <Button variant="default" onClick={() => setShowCreateDrawer(true)}>
                  <Plus size={16} className="mr-2" />
                  {t('phanTichSwot.createForYear', { year: selectedYear })}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingQuadrant && swotData && (
          <SwotQuadrantEditDrawer
            quadrant={editingQuadrant}
            quadrantLabel={t(`phanTichSwot.${editingQuadrant}`)}
            items={(swotData[editingQuadrant] ?? []) as SwotItem[]}
            onSave={async (items: SwotItem[]) => {
              await updateSwot.mutateAsync({
                idOrNam: swotData.id,
                payload: {
                  strengths: editingQuadrant === 'strengths' ? items : swotData.strengths,
                  weaknesses: editingQuadrant === 'weaknesses' ? items : swotData.weaknesses,
                  opportunities: editingQuadrant === 'opportunities' ? items : swotData.opportunities,
                  threats: editingQuadrant === 'threats' ? items : swotData.threats,
                  industrySuccessFactors: editingQuadrant === 'industrySuccessFactors' ? items : (swotData.industrySuccessFactors ?? []),
                },
              });
            }}
            onClose={() => setEditingQuadrant(null)}
          />
        )}
        {showCreateDrawer && (
          <SwotCreateDrawer nam={selectedYear} onClose={() => setShowCreateDrawer(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhanTichSwotPage;
