export type TenantStage = 'Seed' | 'Series A' | 'Series B' | 'Scale-up';
export type GTMModel = 'Product-Led' | 'Sales-Led' | 'Community-Led' | 'Hybrid';
export type UserRole = 'Admin' | 'PM' | 'Viewer';
export type FeatureStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done';
export type FeatureSource = 'manual' | 'jira' | 'linear';
export type Quarter = 'Q1 2025' | 'Q2 2025' | 'Q3 2025' | 'Q4 2025' | 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026';

export interface CompanyValue {
  id: string;
  name: string;
  description: string;
}

export interface ESGWeights {
  environmental: number;
  social: number;
  governance: number;
}

export interface DimensionWeights {
  businessValue: number;
  esg: number;
  valuesFit: number;
  gtmReadiness: number;
  effort: number;
}

export interface Tenant {
  id: string;
  name: string;
  sector: string;
  stage: TenantStage;
  gtmModel: GTMModel;
  values: CompanyValue[];
  esgWeights: ESGWeights;
  dimensionWeights: DimensionWeights;
  logo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarInitials: string;
  avatarColor: string;
}

export interface ESGSubScore {
  environmental: number;
  social: number;
  governance: number;
  environmentalReasoning: string;
  socialReasoning: string;
  governanceReasoning: string;
  summary: string;
  recommendations: string[];
  aiGenerated: boolean;
  pendingReview: boolean;
  proposedBy?: string;
  proposedEnvironmental?: number;
  proposedSocial?: number;
  proposedGovernance?: number;
}

export interface GTMSubScore {
  marketTiming: number;
  salesReadiness: number;
  customerDemand: number;
  channelFit: number;
}

export interface ValueFitItem {
  valueId: string;
  score: number;
  reasoning: string;
}

export interface FeatureScores {
  businessValue: number;
  esg: ESGSubScore;
  valuesFit: ValueFitItem[];
  gtmReadiness: GTMSubScore;
  effort: number;
  compositeScore: number;
}

export interface Feature {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: FeatureStatus;
  labels: string[];
  source: FeatureSource;
  sourceId?: string;
  quarter?: Quarter | null;
  scores?: FeatureScores;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapQuarter {
  id: string;
  tenantId: string;
  label: Quarter;
  locked: boolean;
  lockedBy?: string;
  lockedAt?: string;
}

export interface ESGAnalysisResult {
  environmental: { score: number; reasoning: string };
  social: { score: number; reasoning: string };
  governance: { score: number; reasoning: string };
  summary: string;
  recommendations: string[];
}

export interface IntegrationFeature {
  id: string;
  title: string;
  description: string;
  status: string;
  labels: string[];
  source: 'jira' | 'linear';
}
