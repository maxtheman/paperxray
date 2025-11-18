import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

const GradientHill: React.FC = () => {
  const [position, setPosition] = useState(-3); // X axis position
  
  // Loss function: x^2 roughly
  const data = Array.from({ length: 21 }, (_, i) => {
    const x = (i - 10) / 2;
    return { x, loss: x * x + 1 };
  });

  const currentLoss = position * position + 1;
  const gradient = 2 * position; // Derivative of x^2 + 1 is 2x
  const stepDirection = gradient > 0 ? "Left" : "Right";

  // Simulate a step
  const takeStep = () => {
    const learningRate = 0.2;
    setPosition(prev => prev - (learningRate * gradient));
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800">The Hill Climber (Optimization)</h3>
        <p className="text-xs text-gray-500 mt-1">
          The <b>Gradient</b> points uphill. To minimize loss (error), we simply go the opposite way.
        </p>
      </div>

      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="x" hide />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip />
            <Area type="monotone" dataKey="loss" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoss)" />
            <ReferenceDot x={position} y={currentLoss} r={6} fill="#1a1a1a" stroke="#fff" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Gradient Arrow Overlay (Simplified visual) */}
        <div className="absolute top-2 right-2 bg-white/90 p-2 rounded border text-xs shadow-sm">
          <div>Loss (Error): <span className="font-mono font-bold">{currentLoss.toFixed(3)}</span></div>
          <div>Gradient (Slope): <span className="font-mono font-bold text-red-500">{gradient.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button 
          onClick={takeStep}
          className="flex-1 bg-ink text-white py-2 px-4 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Update Weights</span>
          <span className="bg-white/20 px-1.5 rounded text-xs">Step size: 0.2</span>
        </button>
      </div>
      <div className="mt-2 text-center text-xs text-gray-500">
        Recommended Direction: <strong>{stepDirection}</strong> (Opposite of Gradient)
      </div>
    </div>
  );
};

export default GradientHill;