import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Edit } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface Props {
  mission: string;
  vision: string;
  onEdit?: () => void;
}

const MissionVisionSection: React.FC<Props> = ({ mission, vision, onEdit }) => {
  const { t } = useTranslation();
  const missionEmpty = !mission?.trim();
  const visionEmpty = !vision?.trim();

  return (
    <div className="w-full max-h-[36vh] sm:max-h-[40vh] md:max-h-none md:flex-[1.25] md:min-h-0 min-h-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 border-b border-primary/20 flex items-center justify-between gap-2 bg-card">
        <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold min-w-0 truncate">
          <Compass size={12} className="shrink-0" />
          <span className="truncate">{t('suMenhTamNhin.title')}</span>
        </h4>
        {onEdit && (
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10" aria-label={t('suMenhTamNhin.edit')} title={t('suMenhTamNhin.edit')}>
            <Edit size={12} />
          </Button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 sm:p-4 md:p-5 space-y-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            {t('suMenhTamNhin.mission')}
          </span>
          <div className="min-w-0 p-3 rounded-lg border border-border bg-muted/30">
            {missionEmpty ? (
              <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyMission')}</p>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">{mission}</p>
            )}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            {t('suMenhTamNhin.vision')}
          </span>
          <div className="min-w-0 p-3 rounded-lg border border-border bg-muted/30">
            {visionEmpty ? (
              <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyVision')}</p>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">{vision}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionVisionSection;
