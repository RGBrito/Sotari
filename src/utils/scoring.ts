import { FeatureScores, DimensionWeights, ESGWeights, GTMSubScore, ValueFitItem } from '../types';

export function calculateESGComposite(
  scores: { environmental: number; social: number; governance: number },
  weights: ESGWeights
): number {
  return (
    scores.environmental * (weights.environmental / 100) +
    scores.social * (weights.social / 100) +
    scores.governance * (weights.governance / 100)
  );
}

export function calculateGTMComposite(gtm: GTMSubScore): number {
  return (gtm.marketTiming + gtm.salesReadiness + gtm.customerDemand + gtm.channelFit) / 4;
}

export function calculateValuesFitComposite(items: ValueFitItem[]): number {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item.score, 0) / items.length;
}

export function calculateCompositeScore(
  scores: FeatureScores,
  dimensionWeights: DimensionWeights,
  esgWeights: ESGWeights
): number {
  const esgComposite = calculateESGComposite(scores.esg, esgWeights);
  const gtmComposite = calculateGTMComposite(scores.gtmReadiness);
  const valuesFitComposite = calculateValuesFitComposite(scores.valuesFit);
  const effortInverted = 10 - scores.effort;

  const composite =
    (scores.businessValue / 10) * dimensionWeights.businessValue +
    (esgComposite / 10) * dimensionWeights.esg +
    (valuesFitComposite / 10) * dimensionWeights.valuesFit +
    (gtmComposite / 10) * dimensionWeights.gtmReadiness +
    (effortInverted / 10) * dimensionWeights.effort;

  return Math.round((composite / 10) * 100) / 10;
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 6) return 'text-blue-600';
  if (score >= 4) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-100 text-emerald-800';
  if (score >= 6) return 'bg-blue-100 text-blue-800';
  if (score >= 4) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export function getScoreBarColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-blue-500';
  if (score >= 4) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getQuadrant(effort: number, composite: number): { label: string; color: string } {
  const highValue = composite >= 5;
  const lowEffort = effort <= 5;
  if (highValue && lowEffort) return { label: 'Quick Wins', color: 'text-emerald-700' };
  if (highValue && !lowEffort) return { label: 'Major Projects', color: 'text-blue-700' };
  if (!highValue && lowEffort) return { label: 'Fill-ins', color: 'text-amber-700' };
  return { label: 'Reconsider', color: 'text-red-700' };
}
