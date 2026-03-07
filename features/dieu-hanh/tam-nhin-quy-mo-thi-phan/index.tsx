import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { TrendingUp, PieChart, Plus, Settings } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Tooltip from '../../../components/ui/Tooltip';
import TabGroup from '../../../components/ui/TabGroup';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import EmptyState from '../../../components/shared/EmptyState';
import { useSuMenhTamNhin } from '../su-menh-tam-nhin/hooks/use-su-menh-tam-nhin';
import ScaleBarChart, { type ScaleChartPoint, type ScaleChartLayout } from '../su-menh-tam-nhin/components/ScaleBarChart';
import VisionSegmentChart from '../su-menh-tam-nhin/components/VisionSegmentChart';
import ChiTieuQuyMoSettingsDrawer from '../su-menh-tam-nhin/components/ChiTieuQuyMoSettingsDrawer';
import PhanKhucThiPhanSettingsDrawer from '../su-menh-tam-nhin/components/PhanKhucThiPhanSettingsDrawer';
import { VISION_CHART_COLORS, VISION_CHART_HEIGHT_COMPACT } from '../su-menh-tam-nhin/components/vision-chart-constants';
import type { ChiTieuQuyMo, GiaTriQuyMoTheoNam, PhanKhucThiPhan, TamNhinThiPhanItem } from '../su-menh-tam-nhin/core/types';

function getChartDataQuyMo(values: GiaTriQuyMoTheoNam[], idChiTieu: string): ScaleChartPoint[] {
  return values
    .filter((v) => v.id_chi_tieu === idChiTieu)
    .sort((a, b) => a.nam - b.nam)
    .map((v) => ({ name: String(v.nam), value: v.gia_tri }));
}

/** Lấy danh sách { nam, gia_tri } cho một phân khúc, sort tăng dần theo năm */
function getYearDataForSegment(targets: TamNhinThiPhanItem[], segId: string): { nam: number; gia_tri: number }[] {
  return targets
    .filter((t) => t.id_phan_khuc === segId)
    .sort((a, b) => a.nam - b.nam);
}

const TAB_QUY_MO = 'quy-mo';
const TAB_THI_PHAN = 'thi-phan';

const TamNhinQuyMoThiPhanPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useSuMenhTamNhin();
  const [settingsMetric, setSettingsMetric] = useState<ChiTieuQuyMo | 'new' | null>(null);
  const [settingsSegment, setSettingsSegment] = useState<PhanKhucThiPhan | 'new' | null>(null);
  const [mobileTab, setMobileTab] = useState(TAB_QUY_MO);

  const metrics = useMemo(() => (data?.chi_tieu_quy_mo ?? []).sort((a, b) => a.thu_tu - b.thu_tu), [data?.chi_tieu_quy_mo]);
  const valuesByYear = useMemo(() => data?.gia_tri_quy_mo_theo_nam ?? [], [data?.gia_tri_quy_mo_theo_nam]);
  const segments = useMemo(() => (data?.phan_khuc_thi_phan ?? []).sort((a, b) => a.thu_tu - b.thu_tu), [data?.phan_khuc_thi_phan]);
  const targets = useMemo(() => data?.tam_nhin_thi_phan ?? [], [data?.tam_nhin_thi_phan]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <DashboardToolbar onBack={() => navigate('/dieu-hanh')} />
        <EmptyState
          title={t('page.dieuHanh.modules.tamNhinQuyMoThiPhan')}
          description={t('suMenhTamNhin.loadError')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/dieu-hanh')}
        leadingContent={
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {t('page.dieuHanh.modules.tamNhinQuyMoThiPhan')}
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('page.dieuHanh.descs.tamNhinQuyMoThiPhan')}
            </p>
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-auto px-2 sm:px-3 py-3 bg-muted/25">
        <div className="w-full flex flex-col gap-6">
          {/* Mobile: tabs */}
          <div className="flex sm:hidden w-full justify-center">
            <TabGroup
              tabs={[
                { id: TAB_QUY_MO, label: t('suMenhTamNhin.visionScale'), icon: TrendingUp },
                { id: TAB_THI_PHAN, label: t('suMenhTamNhin.visionMarketShare'), icon: PieChart },
              ]}
              activeTab={mobileTab}
              onChange={setMobileTab}
            />
          </div>
          {/* Widget 1: Tầm nhìn quy mô — hidden on mobile when tab Thị phần */}
          <section className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${mobileTab !== TAB_QUY_MO ? 'hidden sm:block' : ''}`}>
            <div className="bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border-b border-border px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                    <TrendingUp size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground truncate">
                      {t('suMenhTamNhin.visionScale')}
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Chỉ tiêu doanh số, cửa hàng, mặt hàng theo năm
                    </p>
                  </div>
                </div>
                <Tooltip content={t('suMenhTamNhin.addScaleMetric')} placement="left">
                  <Button size="sm" variant="default" className="shrink-0 h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => setSettingsMetric('new')}>
                    <Plus size={14} className="mr-1.5" />
                    {t('common.add')}
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-[200px]">
                {metrics.length === 0 ? (
                  <div className="col-span-full min-h-[120px] rounded-xl border border-dashed border-border bg-muted/30 py-8 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyScaleMetrics')}</p>
                  </div>
                ) : (
                  metrics.map((metric, idx) => {
                    const chartData = getChartDataQuyMo(valuesByYear, metric.id);
                    const color = VISION_CHART_COLORS[idx % VISION_CHART_COLORS.length];
                    const layout: ScaleChartLayout = metric.loai_bieu_do === 'bar_horizontal' ? 'horizontal' : 'vertical';
                    return (
                      <div
                        key={metric.id}
                        className="min-w-0 rounded-xl border border-border bg-background/80 p-3 shadow-sm flex flex-col hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {metric.ten}
                            <span className="text-muted-foreground font-normal ml-1">({metric.don_vi})</span>
                          </h3>
                          <Tooltip content={t('suMenhTamNhin.settingsMetric')} placement="top">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              onClick={() => setSettingsMetric(metric)}
                              aria-label={t('suMenhTamNhin.settingsMetric')}
                            >
                              <Settings size={14} />
                            </Button>
                          </Tooltip>
                        </div>
                        {chartData.length === 0 ? (
                          <div className="flex-1 min-h-[120px] flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border text-xs text-muted-foreground">
                            {t('suMenhTamNhin.emptyYearsHint')}
                          </div>
                        ) : (
                          <ScaleBarChart
                            data={chartData}
                            valueLabel={`${metric.ten} (${metric.don_vi})`}
                            barColor={color}
                            layout={layout}
                            height={VISION_CHART_HEIGHT_COMPACT}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  onClick={() => setSettingsMetric('new')}
                >
                  <Plus size={14} className="mr-1.5" />
                  {t('common.add')}
                </Button>
              </div>
            </div>
          </section>

          {/* Widget 2: Tầm nhìn thị phần — hidden on mobile when tab Quy mô */}
          <section className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${mobileTab !== TAB_THI_PHAN ? 'hidden sm:block' : ''}`}>
            <div className="bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border-b border-border px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                    <PieChart size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground truncate">
                      {t('suMenhTamNhin.visionMarketShare')}
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Mỗi phân khúc một widget – mỗi năm một biểu đồ tròn/donut
                    </p>
                  </div>
                </div>
                <Tooltip content={t('suMenhTamNhin.addSegment')} placement="left">
                  <Button size="sm" variant="default" className="shrink-0 h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => setSettingsSegment('new')}>
                    <Plus size={14} className="mr-1.5" />
                    {t('common.add')}
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {segments.length === 0 ? (
                <div className="min-h-[120px] rounded-xl border border-dashed border-border bg-muted/30 py-8 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptySegments')}</p>
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const yearData = getYearDataForSegment(targets, seg.id);
                  const chartType = seg.loai_bieu_do ?? 'donut';
                  const color = VISION_CHART_COLORS[idx % VISION_CHART_COLORS.length];
                  return (
                    <div
                      key={seg.id}
                      className="rounded-xl border border-border bg-background/80 p-3 sm:p-4 shadow-sm hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {seg.ten}
                          </h3>
                        </div>
                        <Tooltip content={t('suMenhTamNhin.settingsSegment')} placement="top">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            onClick={() => setSettingsSegment(seg)}
                            aria-label={t('suMenhTamNhin.settingsSegment')}
                          >
                            <Settings size={14} />
                          </Button>
                        </Tooltip>
                      </div>
                      {yearData.length === 0 ? (
                        <div className="min-h-[80px] flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border text-xs text-muted-foreground">
                          {t('suMenhTamNhin.emptyYearsHint')}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-4 sm:gap-6 justify-start">
                          {yearData.map((item) => (
                            <VisionSegmentChart
                              key={item.nam}
                              percent={item.gia_tri}
                              segmentName={seg.ten}
                              year={item.nam}
                              chartType={chartType}
                              color={color}
                              height={120}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  onClick={() => setSettingsSegment('new')}
                >
                  <Plus size={14} className="mr-1.5" />
                  {t('common.add')}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {settingsMetric !== null && (
          <ChiTieuQuyMoSettingsDrawer
            metrics={data.chi_tieu_quy_mo ?? []}
            valuesByYear={data.gia_tri_quy_mo_theo_nam ?? []}
            metric={settingsMetric === 'new' ? null : settingsMetric}
            onClose={() => setSettingsMetric(null)}
          />
        )}
        {settingsSegment !== null && (
          <PhanKhucThiPhanSettingsDrawer
            segments={data.phan_khuc_thi_phan ?? []}
            targets={data.tam_nhin_thi_phan ?? []}
            segment={settingsSegment === 'new' ? null : settingsSegment}
            onClose={() => setSettingsSegment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TamNhinQuyMoThiPhanPage;
