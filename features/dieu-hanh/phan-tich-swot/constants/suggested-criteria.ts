/** Nhóm tiêu chí gợi ý theo từng ô SWOT (key i18n cho group và từng item) */
export type Quadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats' | 'industrySuccessFactors';

export interface SuggestedGroup {
  groupKey: string;
  itemKeys: string[];
}

export const SUGGESTED_CRITERIA: Record<Quadrant, SuggestedGroup[]> = {
  strengths: [
    { groupKey: 'phanTichSwot.suggestions.strengths.groupResources', itemKeys: ['phanTichSwot.suggestions.strengths.resource1', 'phanTichSwot.suggestions.strengths.resource2', 'phanTichSwot.suggestions.strengths.resource3'] },
    { groupKey: 'phanTichSwot.suggestions.strengths.groupCapabilities', itemKeys: ['phanTichSwot.suggestions.strengths.cap1', 'phanTichSwot.suggestions.strengths.cap2', 'phanTichSwot.suggestions.strengths.cap3'] },
    { groupKey: 'phanTichSwot.suggestions.strengths.groupBrand', itemKeys: ['phanTichSwot.suggestions.strengths.brand1', 'phanTichSwot.suggestions.strengths.brand2'] },
  ],
  weaknesses: [
    { groupKey: 'phanTichSwot.suggestions.weaknesses.groupFinance', itemKeys: ['phanTichSwot.suggestions.weaknesses.fin1', 'phanTichSwot.suggestions.weaknesses.fin2', 'phanTichSwot.suggestions.weaknesses.fin3'] },
    { groupKey: 'phanTichSwot.suggestions.weaknesses.groupOperations', itemKeys: ['phanTichSwot.suggestions.weaknesses.op1', 'phanTichSwot.suggestions.weaknesses.op2'] },
    { groupKey: 'phanTichSwot.suggestions.weaknesses.groupMarket', itemKeys: ['phanTichSwot.suggestions.weaknesses.mkt1', 'phanTichSwot.suggestions.weaknesses.mkt2'] },
  ],
  opportunities: [
    { groupKey: 'phanTichSwot.suggestions.opportunities.groupMarket', itemKeys: ['phanTichSwot.suggestions.opportunities.mkt1', 'phanTichSwot.suggestions.opportunities.mkt2', 'phanTichSwot.suggestions.opportunities.mkt3'] },
    { groupKey: 'phanTichSwot.suggestions.opportunities.groupPolicy', itemKeys: ['phanTichSwot.suggestions.opportunities.policy1', 'phanTichSwot.suggestions.opportunities.policy2'] },
    { groupKey: 'phanTichSwot.suggestions.opportunities.groupTech', itemKeys: ['phanTichSwot.suggestions.opportunities.tech1', 'phanTichSwot.suggestions.opportunities.tech2'] },
  ],
  threats: [
    { groupKey: 'phanTichSwot.suggestions.threats.groupCompetition', itemKeys: ['phanTichSwot.suggestions.threats.comp1', 'phanTichSwot.suggestions.threats.comp2', 'phanTichSwot.suggestions.threats.comp3'] },
    { groupKey: 'phanTichSwot.suggestions.threats.groupRegulation', itemKeys: ['phanTichSwot.suggestions.threats.reg1', 'phanTichSwot.suggestions.threats.reg2'] },
    { groupKey: 'phanTichSwot.suggestions.threats.groupEconomy', itemKeys: ['phanTichSwot.suggestions.threats.econ1', 'phanTichSwot.suggestions.threats.econ2'] },
  ],
  industrySuccessFactors: [
    { groupKey: 'phanTichSwot.suggestions.industrySuccessFactors.groupQuality', itemKeys: ['phanTichSwot.suggestions.industrySuccessFactors.quality1', 'phanTichSwot.suggestions.industrySuccessFactors.quality2'] },
    { groupKey: 'phanTichSwot.suggestions.industrySuccessFactors.groupEfficiency', itemKeys: ['phanTichSwot.suggestions.industrySuccessFactors.eff1', 'phanTichSwot.suggestions.industrySuccessFactors.eff2'] },
    { groupKey: 'phanTichSwot.suggestions.industrySuccessFactors.groupMarket', itemKeys: ['phanTichSwot.suggestions.industrySuccessFactors.mkt1', 'phanTichSwot.suggestions.industrySuccessFactors.mkt2'] },
  ],
};
