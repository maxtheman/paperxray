import React from 'react';

export enum VisualizationType {
  VECTOR_ALIGNMENT = 'VECTOR_ALIGNMENT',
  DIMENSION_MISMATCH = 'DIMENSION_MISMATCH',
  GRADIENT_DESCENT = 'GRADIENT_DESCENT',
  GENERIC = 'GENERIC'
}

export interface MathSymbol {
  symbol: string;
  definition: string;
  plainEnglish: string;
  role: 'scalar' | 'vector' | 'matrix' | 'function' | 'constant';
}

export interface DimensionStep {
  name: string;
  shape: string; // e.g., "[Batch, Heads, Seq, Dim]"
  description: string;
  isInput: boolean;
}

export interface AnalysisResult {
  originalText: string;
  simplifiedExplanation: string;
  symbols: MathSymbol[];
  dimensions: DimensionStep[];
  vizType: VisualizationType;
  vizConfig?: any; // Flexible config for the specific visualizer
}

export interface PaperSection {
  id: string;
  title: string;
  content: React.ReactNode;
}