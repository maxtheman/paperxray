import React from 'react';
import { AnalysisResult, VisualizationType } from '../types';
import VectorPlayground from './viz/VectorPlayground';
import DimensionBlocks from './viz/DimensionBlocks';
import GradientHill from './viz/GradientHill';

interface Props {
  analysis: AnalysisResult | null;
  loading: boolean;
}

const RightPane: React.FC<Props> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <p className="mt-6 text-sm text-gray-400">Consulting the Oracle (Gemini 2.5)...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
        <span className="text-4xl mb-4 opacity-20">👈</span>
        <h3 className="text-lg font-medium text-gray-600">Select text to analyze</h3>
        <p className="text-sm max-w-xs mt-2">
          Highlight any equation, paragraph, or use the Box Tool to capture diagrams in the paper.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 bg-gray-50/50">
      {/* Header: Original Text */}
      <div className="pb-4 border-b border-gray-200">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Selected Context</span>
        <div className="mt-2 p-3 bg-white rounded border border-gray-200 font-serif text-gray-800 italic leading-relaxed text-sm max-h-40 overflow-y-auto custom-scrollbar break-words">
          "{analysis.originalText}"
        </div>
      </div>

      {/* Section 1: The Rosetta Stone */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">1. Plain English</h3>
        <p className="text-gray-800 leading-relaxed font-medium text-sm md:text-base">
          {analysis.simplifiedExplanation}
        </p>
      </div>

      {/* Section 2: Symbol Decoder */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">2. Symbol Decoder</h3>
        <div className="grid gap-3">
          {analysis.symbols.map((sym, idx) => (
            <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-start gap-3 overflow-hidden">
              {/* Increased min-width for symbol container to prevent overflow like 'softmax' */}
              <div className="shrink-0 min-w-[3rem] px-2 h-8 flex items-center justify-center bg-gray-100 rounded font-serif font-bold text-sm md:text-base">
                {sym.symbol}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-800 truncate" title={sym.definition}>{sym.definition}</div>
                <div className="text-xs text-gray-500 italic break-words">"{sym.plainEnglish}"</div>
              </div>
              <div className="shrink-0 text-[10px] uppercase font-bold text-gray-300 border border-gray-200 px-1.5 rounded self-center">
                {sym.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Visualization */}
      <div className="pb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3. Geometric Intuition</h3>
        
        {analysis.vizType === VisualizationType.VECTOR_ALIGNMENT && <VectorPlayground />}
        {analysis.vizType === VisualizationType.DIMENSION_MISMATCH && <DimensionBlocks dimensions={analysis.dimensions} />}
        {analysis.vizType === VisualizationType.GRADIENT_DESCENT && <GradientHill />}
        {analysis.vizType === VisualizationType.GENERIC && (
          <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
             This concept is best understood through the dimensional breakdown above.
             <div className="mt-4">
               <DimensionBlocks dimensions={analysis.dimensions} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPane;