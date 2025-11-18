import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar } from 'recharts';

type ViewMode = 'full' | 'similarity' | 'softmax' | 'output';

const VectorPlayground: React.FC = () => {
  // State for Query (interactive)
  const [qAngle, setQAngle] = useState(90);
  
  // Configurable Visibility Layers
  const [showDot, setShowDot] = useState(true);
  const [showSoftmax, setShowSoftmax] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  // Constants for Keys and Values to simulate "Attention"
  // K1: 45deg (Aligned-ish), K2: 135deg (Perpendicular-ish), K3: 270deg (Opposite)
  const keys = useMemo(() => [
    { id: 1, angle: 60, color: '#16a34a', label: 'K1', vLen: 8, vColor: '#9333ea' },
    { id: 2, angle: 150, color: '#ea580c', label: 'K2', vLen: 5, vColor: '#c084fc' }, 
    { id: 3, angle: 300, color: '#dc2626', label: 'K3', vLen: 3, vColor: '#d8b4fe' },
  ], []);

  const magnitude = 10;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 1. Calculate Coordinates
  const qVec = {
    x: magnitude * Math.cos(toRad(qAngle)),
    y: magnitude * Math.sin(toRad(qAngle))
  };

  // 2. Compute Dot Products (Attention Scores)
  const scores = keys.map(k => {
    const kx = magnitude * Math.cos(toRad(k.angle));
    const ky = magnitude * Math.sin(toRad(k.angle));
    const dot = (qVec.x * kx + qVec.y * ky).toFixed(1);
    return { ...k, kx, ky, dot: parseFloat(dot) };
  });

  // 3. Compute Softmax
  const rawExps = scores.map(s => Math.exp(s.dot / 50)); // Scale down dot for visualization spread
  const sumExps = rawExps.reduce((a, b) => a + b, 0);
  const attentionWeights = scores.map((s, i) => ({
    ...s,
    prob: rawExps[i] / sumExps
  }));

  // 4. Compute Weighted Sum (Output Vector) - Simplified to 1D magnitude for viz or 2D resultant
  // Let's visualize the Output Vector as a weighted sum of Value vectors.
  // Assuming Value vectors are unit vectors pointing in same direction as Keys for simplicity, or just magnitudes.
  // To make it visual, let's say Output Vector is the vector sum of (Prob_i * V_i).
  // Let's define V_i as vectors pointing in fixed directions for this demo.
  const outputVec = attentionWeights.reduce((acc, item) => {
    const vx = item.vLen * Math.cos(toRad(item.angle)); // V aligns with K for this visual metaphor
    const vy = item.vLen * Math.sin(toRad(item.angle));
    return {
      x: acc.x + (vx * item.prob),
      y: acc.y + (vy * item.prob)
    };
  }, { x: 0, y: 0 });


  // Prepare Data for Charts
  const scatterData = [
    { x: 0, y: 0, type: 'origin' },
    { x: qVec.x, y: qVec.y, type: 'Query', color: '#2563eb' },
    ...keys.map(k => ({
      x: magnitude * Math.cos(toRad(k.angle)),
      y: magnitude * Math.sin(toRad(k.angle)),
      type: k.label,
      color: k.color
    }))
  ];

  if (showOutput) {
    scatterData.push({
      x: outputVec.x * 3, // Scale up for visibility
      y: outputVec.y * 3,
      type: 'Output (V)',
      color: '#9333ea'
    });
  }

  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Control Bar */}
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
          <input type="checkbox" checked={showDot} onChange={e => setShowDot(e.target.checked)} className="accent-blue-600" />
          Step 1: Similarity (Q·K)
        </label>
        <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
          <input type="checkbox" checked={showSoftmax} onChange={e => setShowSoftmax(e.target.checked)} className="accent-orange-500" />
          Step 2: Softmax (Probability)
        </label>
        <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
          <input type="checkbox" checked={showOutput} onChange={e => setShowOutput(e.target.checked)} className="accent-purple-600" />
          Step 3: Weighted Sum (V)
        </label>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Vector Space */}
        {showDot && (
          <div className="h-[240px] relative border border-gray-100 rounded bg-slate-50">
             <div className="absolute top-2 left-2 text-xs font-bold text-gray-400">Vector Space</div>
             <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis type="number" dataKey="x" domain={[-15, 15]} hide />
                <YAxis type="number" dataKey="y" domain={[-15, 15]} hide />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <ReferenceLine x={0} stroke="#e5e7eb" />
                <Scatter name="Vectors" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#000'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* Overlay text for Q */}
            <div className="absolute bottom-2 left-2 text-xs text-blue-600 font-mono">
              Query Angle: {qAngle}°
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Scores / Softmax Charts */}
          {(showDot || showSoftmax) && (
             <div className="h-32 border border-gray-100 rounded p-2">
               <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                 {showSoftmax ? "Softmax Probabilities" : "Raw Dot Products"}
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={attentionWeights}>
                   <XAxis dataKey="label" tick={{fontSize: 10}} interval={0} />
                   <Tooltip contentStyle={{fontSize: '12px'}} />
                   <Bar dataKey={showSoftmax ? "prob" : "dot"} fill={showSoftmax ? "#f97316" : "#2563eb"} radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          )}

          {/* Controls */}
          <div className="flex flex-col justify-center space-y-4 p-2">
            <div>
              <label className="block text-xs font-bold text-blue-600 mb-1">Rotate Query Vector</label>
              <input
                type="range"
                min="0"
                max="360"
                value={qAngle}
                onChange={(e) => setQAngle(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              Rotate the blue <b>Query</b>. Notice how it aligns with different <b>Keys</b> (K1, K2, K3) to change the distribution.
            </div>
          </div>
        </div>

        {/* Output Explanation */}
        {showOutput && (
          <div className="bg-purple-50 p-3 rounded text-xs text-purple-800 border border-purple-100">
             <strong>Output = Σ (Prob × Value)</strong>
             <br/>
             The final vector (Purple) is the weighted average of Value vectors. Since K1 has high probability, the Output is pulled towards V1.
          </div>
        )}

      </div>
    </div>
  );
};

export default VectorPlayground;