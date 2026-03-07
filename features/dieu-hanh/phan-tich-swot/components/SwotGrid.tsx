import React from 'react';
import { Zap, AlertCircle, Lightbulb, ShieldAlert, Target } from 'lucide-react';
import SwotSection from './SwotSection';
import type { SwotAnalysis } from '../core/types';
import type { Quadrant } from '../constants/suggested-criteria';

interface SwotGridProps {
  data: SwotAnalysis;
  emptyLabel: string;
  onOpenSettings: (quadrant: Quadrant) => void;
}

const SwotGrid: React.FC<SwotGridProps> = ({ data, emptyLabel, onOpenSettings }) => {
  const industryFactors = data.industrySuccessFactors ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 min-h-[calc(100dvh-13rem)] md:auto-rows-fr">
      {/* Cột 1: Điểm mạnh (trên), Cơ hội (dưới) */}
      <SwotSection
        quadrant="strengths"
        items={data.strengths}
        icon={<Zap size={14} />}
        accentClass="border-l-4 border-l-emerald-500/40"
        emptyLabel={emptyLabel}
        onOpenSettings={() => onOpenSettings('strengths')}
      />
      {/* Cột 2: Điểm yếu (trên), Nguy cơ (dưới) */}
      <SwotSection
        quadrant="weaknesses"
        items={data.weaknesses}
        icon={<AlertCircle size={14} />}
        accentClass="border-l-4 border-l-amber-500/40"
        emptyLabel={emptyLabel}
        onOpenSettings={() => onOpenSettings('weaknesses')}
      />
      {/* Cột 3: Yếu tố thành công ngành - chiều cao gấp đôi (bằng cả 2 ô cột 1+2) */}
      <div className="md:row-span-2 md:min-h-0 flex flex-col">
        <SwotSection
          quadrant="industrySuccessFactors"
          items={industryFactors}
          icon={<Target size={14} />}
          accentClass="border-l-4 border-l-violet-500/40"
          emptyLabel={emptyLabel}
          onOpenSettings={() => onOpenSettings('industrySuccessFactors')}
          className="flex-1 min-h-0"
        />
      </div>
      <SwotSection
        quadrant="opportunities"
        items={data.opportunities}
        icon={<Lightbulb size={14} />}
        accentClass="border-l-4 border-l-sky-500/40"
        emptyLabel={emptyLabel}
        onOpenSettings={() => onOpenSettings('opportunities')}
      />
      <SwotSection
        quadrant="threats"
        items={data.threats}
        icon={<ShieldAlert size={14} />}
        accentClass="border-l-4 border-l-rose-500/40"
        emptyLabel={emptyLabel}
        onOpenSettings={() => onOpenSettings('threats')}
      />
    </div>
  );
};

export default SwotGrid;
