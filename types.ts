export interface BodyFatAnalysis {
  estimatedRange: string;
  confidenceLevel: string;
  visualCues: string[];
  muscleDefinitionAnalysis: string;
  healthTips: string[];
  disclaimer: string;
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: BodyFatAnalysis | null;
}