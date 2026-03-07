import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Plus, Settings } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import Section from '../../../../components/shared/Section';
import ScaleBarChart, { type ScaleChartPoint, type ScaleChartLayout } from './ScaleBarChart';
import ChiTieuQuyMoSettingsDrawer from './ChiTieuQuyMoSettingsDrawer';
import type { ChiTieuQuyMo, GiaTriQuyMoTheoNam } from '../core/types';
import { AnimatePresence } from 'framer-motion';
import { VISION_CHART_COLORS } from './vision-chart-constants';

interface Props {
  metrics: ChiTieuQuyMo[];
  valuesByYear: GiaTriQuyMoTheoNam[];
}

function getChartData(values: GiaTriQuyMoTheoNam[], idChiTieu: string): ScaleChartPoint[] {
  return values
    .filter((v) => v.id_chi_tieu === idChiTieu)
    .sort((a, b) => a.nam - b.nam)
    .map((v) => ({ name: String(v.nam), value: v.gia_tri }));
}

const TamNhinQuyMoSection: React.FC<Props> = ({ metrics, valuesByYear }) => {
  const { t } = useTranslation();
  const [settingsMetric, setSettingsMetric] = useState<ChiTieuQuyMo | 'new' | null>(null);

  const sortedMetrics = useMemo(() => [...metrics].sort((a, b) => a.thu_tu - b.thu_tu), [metrics]);

  return (
    <>
      <Section title={t('suMenhTamNhin.visionScale')} icon={<TrendingUp size={14} />} variant="primary">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground flex-1 min-w-0">
            {t('suMenhTamNhin.visionScaleDesc')}
          </p>
          <Tooltip content={t('suMenhTamNhin.addScaleMetric')} placement="bottom">
            <Button
              size="sm"
              variant="default"
              onClick={() => setSettingsMetric('new')}
              className="shrink-0"
            >
              <Plus size={14} className="mr-1.5" />
              {t('suMenhTamNhin.addScaleMetric')}
            </Button>
          </Tooltip>
        </div>
        {sortedMetrics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">{t('suMenhTamNhin.emptyScaleMetrics')}</p>
            <Tooltip content={t('suMenhTamNhin.addScaleMetric')} placement="bottom">
              <Button size="sm" variant="outline" onClick={() => setSettingsMetric('new')}>
                <Plus size={14} className="mr-1.5" />
                {t('suMenhTamNhin.addScaleMetric')}
              </Button>
            </Tooltip>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMetrics.map((metric, idx) => {
              const chartData = getChartData(valuesByYear, metric.id);
              const color = VISION_CHART_COLORS[idx % VISION_CHART_COLORS.length];
              const layout: ScaleChartLayout = metric.loai_bieu_do === 'bar_horizontal' ? 'horizontal' : 'vertical';
              return (
                <div
                  key={metric.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {metric.ten}
                        <span className="text-muted-foreground font-normal ml-1.5">({metric.don_vi})</span>
                      </h4>
                      <Tooltip content={t('suMenhTamNhin.settingsMetric')} placement="top">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setSettingsMetric(metric)}
                          aria-label={t('suMenhTamNhin.settingsMetric')}
                        >
                          <Settings size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  {chartData.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyYearsHint')}</p>
                    </div>
                  ) : (
                    <ScaleBarChart
                      data={chartData}
                      valueLabel={`${metric.ten} (${metric.don_vi})`}
                      barColor={color}
                      layout={layout}
                    />
                  )}
                </div>
              );
            })}
            <Tooltip content={t('suMenhTamNhin.addScaleMetric')} placement="top">
              <Button size="sm" variant="outline" onClick={() => setSettingsMetric('new')}>
                <Plus size={14} className="mr-1.5" />
                {t('suMenhTamNhin.addScaleMetric')}
              </Button>
            </Tooltip>
          </div>
        )}
      </Section>

      <AnimatePresence>
        {settingsMetric !== null && (
          <ChiTieuQuyMoSettingsDrawer
            metrics={metrics}
            valuesByYear={valuesByYear}
            metric={settingsMetric === 'new' ? null : settingsMetric}
            onClose={() => setSettingsMetric(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TamNhinQuyMoSection;
