import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Plus, Settings } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import Section from '../../../../components/shared/Section';
import VisionSegmentChart from './VisionSegmentChart';
import PhanKhucThiPhanSettingsDrawer from './PhanKhucThiPhanSettingsDrawer';
import type { PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import { AnimatePresence } from 'framer-motion';
import { VISION_CHART_COLORS } from './vision-chart-constants';

interface Props {
  segments: PhanKhucThiPhan[];
  targets: TamNhinThiPhanItem[];
}

function getYearDataForSegment(targets: TamNhinThiPhanItem[], segId: string): { nam: number; gia_tri: number }[] {
  return targets
    .filter((t) => t.id_phan_khuc === segId)
    .sort((a, b) => a.nam - b.nam);
}

const TamNhinThiPhanSection: React.FC<Props> = ({ segments, targets }) => {
  const { t } = useTranslation();
  const [settingsSegment, setSettingsSegment] = useState<PhanKhucThiPhan | 'new' | null>(null);

  const sortedSegments = useMemo(() => [...segments].sort((a, b) => a.thu_tu - b.thu_tu), [segments]);

  return (
    <>
      <Section title={t('suMenhTamNhin.visionMarketShare')} icon={<PieChart size={14} />} variant="primary">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground flex-1 min-w-0">
            {t('suMenhTamNhin.visionMarketShareDesc')}
          </p>
          <Tooltip content={t('suMenhTamNhin.addSegment')} placement="bottom">
            <Button
              size="sm"
              variant="default"
              onClick={() => setSettingsSegment('new')}
              className="shrink-0"
            >
              <Plus size={14} className="mr-1.5" />
              {t('suMenhTamNhin.addSegment')}
            </Button>
          </Tooltip>
        </div>
        {sortedSegments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">{t('suMenhTamNhin.emptySegments')}</p>
            <Tooltip content={t('suMenhTamNhin.addSegment')} placement="bottom">
              <Button size="sm" variant="outline" onClick={() => setSettingsSegment('new')}>
                <Plus size={14} className="mr-1.5" />
                {t('suMenhTamNhin.addSegment')}
              </Button>
            </Tooltip>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedSegments.map((seg, idx) => {
              const yearData = getYearDataForSegment(targets, seg.id);
              const color = VISION_CHART_COLORS[idx % VISION_CHART_COLORS.length];
              const chartType = seg.loai_bieu_do ?? 'donut';
              return (
                <div
                  key={seg.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <h4 className="text-sm font-semibold text-foreground">{seg.ten}</h4>
                      <Tooltip content={t('suMenhTamNhin.settingsSegment')} placement="top">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setSettingsSegment(seg)}
                          aria-label={t('suMenhTamNhin.settingsSegment')}
                        >
                          <Settings size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  {yearData.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyYearsHint')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      {yearData.map((item) => (
                        <VisionSegmentChart
                          key={item.nam}
                          percent={item.gia_tri}
                          segmentName={seg.ten}
                          year={item.nam}
                          chartType={chartType}
                          color={color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Tooltip content={t('suMenhTamNhin.addSegment')} placement="top">
              <Button size="sm" variant="outline" onClick={() => setSettingsSegment('new')}>
                <Plus size={14} className="mr-1.5" />
                {t('suMenhTamNhin.addSegment')}
              </Button>
            </Tooltip>
          </div>
        )}
      </Section>

      <AnimatePresence>
        {settingsSegment !== null && (
          <PhanKhucThiPhanSettingsDrawer
            segments={segments}
            targets={targets}
            segment={settingsSegment === 'new' ? null : settingsSegment}
            onClose={() => setSettingsSegment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TamNhinThiPhanSection;
