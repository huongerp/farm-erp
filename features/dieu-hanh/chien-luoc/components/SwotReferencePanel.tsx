import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, AlertCircle, Lightbulb, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { SwotAnalysis, SwotItem } from '../../phan-tich-swot/core/types';

interface QuadrantProps {
  label: string;
  items: SwotItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  icon: React.ReactNode;
  accentBorder: string;
  accentBg: string;
}

const QuadrantSection: React.FC<QuadrantProps> = ({
  label,
  items,
  selectedIds,
  onToggle,
  icon,
  accentBorder,
  accentBg,
}) => (
  <div className={`rounded-lg border ${accentBorder} overflow-hidden`}>
    <div className={`flex items-center gap-1.5 px-3 py-2 ${accentBg} border-b ${accentBorder}`}>
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{selectedIds.length}/{items.length}</span>
    </div>
    <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground p-3 italic">—</p>
      ) : (
        <ul className="p-1.5 space-y-0.5">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={`w-full text-left flex items-start gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className="flex-1 min-w-0 leading-relaxed">{item.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </div>
);

interface Props {
  swotData: SwotAnalysis | null | undefined;
  selectedStrengths: string[];
  selectedWeaknesses: string[];
  selectedOpportunities: string[];
  selectedThreats: string[];
  onToggleStrength: (id: string) => void;
  onToggleWeakness: (id: string) => void;
  onToggleOpportunity: (id: string) => void;
  onToggleThreat: (id: string) => void;
  year: number;
}

const SwotReferencePanel: React.FC<Props> = ({
  swotData,
  selectedStrengths,
  selectedWeaknesses,
  selectedOpportunities,
  selectedThreats,
  onToggleStrength,
  onToggleWeakness,
  onToggleOpportunity,
  onToggleThreat,
  year,
}) => {
  const { t } = useTranslation();

  if (!swotData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">
          {t('chienLuoc.swotPanel.noSwot', { nam: year })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        {t('chienLuoc.swotPanel.title', { nam: year })}
      </h4>
      <p className="text-[11px] text-muted-foreground px-1">
        {t('chienLuoc.swotPanel.hint')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <QuadrantSection
          label={t('chienLuoc.swotPanel.strengths')}
          items={swotData.strengths}
          selectedIds={selectedStrengths}
          onToggle={onToggleStrength}
          icon={<Zap size={12} className="text-emerald-600" />}
          accentBorder="border-emerald-200 dark:border-emerald-900/50"
          accentBg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <QuadrantSection
          label={t('chienLuoc.swotPanel.weaknesses')}
          items={swotData.weaknesses}
          selectedIds={selectedWeaknesses}
          onToggle={onToggleWeakness}
          icon={<AlertCircle size={12} className="text-amber-600" />}
          accentBorder="border-amber-200 dark:border-amber-900/50"
          accentBg="bg-amber-50 dark:bg-amber-950/30"
        />
        <QuadrantSection
          label={t('chienLuoc.swotPanel.opportunities')}
          items={swotData.opportunities}
          selectedIds={selectedOpportunities}
          onToggle={onToggleOpportunity}
          icon={<Lightbulb size={12} className="text-sky-600" />}
          accentBorder="border-sky-200 dark:border-sky-900/50"
          accentBg="bg-sky-50 dark:bg-sky-950/30"
        />
        <QuadrantSection
          label={t('chienLuoc.swotPanel.threats')}
          items={swotData.threats}
          selectedIds={selectedThreats}
          onToggle={onToggleThreat}
          icon={<ShieldAlert size={12} className="text-rose-600" />}
          accentBorder="border-rose-200 dark:border-rose-900/50"
          accentBg="bg-rose-50 dark:bg-rose-950/30"
        />
      </div>
    </div>
  );
};

export default SwotReferencePanel;
