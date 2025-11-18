import React from 'react';
import { DimensionStep } from '../../types';

interface Props {
  dimensions: DimensionStep[];
}

const DimensionBlocks: React.FC<Props> = ({ dimensions }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">🧱</span> The "Shape" Checker
      </h3>
      
      <div className="flex flex-col gap-4">
        {dimensions.map((dim, idx) => (
          <div key={idx} className="relative group">
            {/* Connector Line */}
            {idx < dimensions.length - 1 && (
              <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-200 h-full -z-10 group-last:hidden"></div>
            )}

            <div className="flex items-start gap-4">
              {/* The Block Icon */}
              <div className={`
                w-12 h-12 rounded-md flex items-center justify-center text-xs font-mono font-bold shadow-sm border
                ${dim.isInput ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'}
              `}>
                {dim.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-800">{dim.name}</h4>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">
                    {dim.shape}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{dim.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
        <strong>Pro Tip:</strong> If the inner dimensions of two multiplying matrices don't match (e.g., [A, B] × [C, D] where B ≠ C), the operation is mathematically impossible.
      </div>
    </div>
  );
};

export default DimensionBlocks;