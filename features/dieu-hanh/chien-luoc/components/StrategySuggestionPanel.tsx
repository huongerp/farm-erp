import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { LoaiChienLuoc, LoaiTows, NhomLoaiChienLuoc } from '../core/types';
import { NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS } from '../core/constants';

interface Suggestion {
  loai_tows: LoaiTows;
  loaiChienLuoc: LoaiChienLuoc[];
}

function detectTowsTypes(
  hasS: boolean,
  hasW: boolean,
  hasO: boolean,
  hasT: boolean
): LoaiTows[] {
  const types: LoaiTows[] = [];
  if (hasS && hasO) types.push('SO');
  if (hasS && hasT) types.push('ST');
  if (hasW && hasO) types.push('WO');
  if (hasW && hasT) types.push('WT');
  return types;
}

interface Props {
  selectedStrengths: string[];
  selectedWeaknesses: string[];
  selectedOpportunities: string[];
  selectedThreats: string[];
  loaiChienLuocList: LoaiChienLuoc[];
  currentTows: LoaiTows | null;
  currentNhom: string | null;
  onSelectSuggestion: (tows: LoaiTows, nhomMa: string) => void;
}

const StrategySuggestionPanel: React.FC<Props> = ({
  selectedStrengths,
  selectedWeaknesses,
  selectedOpportunities,
  selectedThreats,
  loaiChienLuocList,
  currentTows,
  currentNhom,
  onSelectSuggestion,
}) => {
  const { t } = useTranslation();

  const hasS = selectedStrengths.length > 0;
  const hasW = selectedWeaknesses.length > 0;
  const hasO = selectedOpportunities.length > 0;
  const hasT = selectedThreats.length > 0;
  const hasAny = hasS || hasW || hasO || hasT;

  const detectedTypes = useMemo(() => detectTowsTypes(hasS, hasW, hasO, hasT), [hasS, hasW, hasO, hasT]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (detectedTypes.length === 0) return [];
    return detectedTypes.map((tows) => {
      const towsItems = loaiChienLuocList.filter((x) => x.nhom === 'tows' && x.ma === tows);
      const otherItems = loaiChienLuocList.filter((x) => x.nhom !== 'tows');
      return { loai_tows: tows, loaiChienLuoc: [...towsItems, ...otherItems] };
    });
  }, [detectedTypes, loaiChienLuocList]);

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">
          {t('chienLuoc.suggestion.selectSwotFirst')}
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">
          {t('chienLuoc.suggestion.noMatch')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1.5">
        <Sparkles size={12} className="text-primary" />
        {t('chienLuoc.suggestion.title')}
      </h4>
      <p className="text-[11px] text-muted-foreground px-1">
        {t('chienLuoc.suggestion.hint')}
      </p>

      <div className="space-y-4">
        {suggestions.map((sg) => (
          <div key={sg.loai_tows} className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-xs font-bold text-primary">{sg.loai_tows}</span>
              <ArrowRight size={10} className="text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {t('chienLuoc.suggestion.towsLabel')}
              </span>
            </div>
            <div className="space-y-1">
              {sg.loaiChienLuoc.map((lcl) => {
                const isActive = currentTows === sg.loai_tows && currentNhom === lcl.ma;
                return (
                  <button
                    key={`${sg.loai_tows}-${lcl.id}`}
                    type="button"
                    onClick={() => onSelectSuggestion(sg.loai_tows, lcl.ma)}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all text-xs ${
                      isActive
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            {t(NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS[lcl.nhom as NhomLoaiChienLuoc])}
                          </span>
                        </div>
                        <p className="font-medium text-foreground text-xs">{lcl.ten}</p>
                        {lcl.cau_chien_luoc_mau && (
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                            {lcl.cau_chien_luoc_mau}
                          </p>
                        )}
                      </div>
                      {isActive && (
                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategySuggestionPanel;
