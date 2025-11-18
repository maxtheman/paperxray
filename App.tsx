import React, { useState, useCallback, useRef, useEffect } from 'react';
import DocumentViewer from './components/PaperReader'; // Renamed internally or reused
import RightPane from './components/RightPane';
import { analyzeSelection } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  // API Key State
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiMenu, setShowApiMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiMenuRef = useRef<HTMLDivElement>(null);

  // Load saved key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('paper_xray_api_key');
    if (savedKey) setCustomApiKey(savedKey);
  }, []);

  // Close API menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (apiMenuRef.current && !apiMenuRef.current.contains(event.target as Node)) {
        setShowApiMenu(false);
      }
    };
    if (showApiMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showApiMenu]);

  const saveApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('paper_xray_api_key', key);
    setShowApiMenu(false);
  };

  const hasApiKey = !!customApiKey || !!process.env.API_KEY;

  const handleSelection = useCallback(async (data: { text?: string; image?: string; fullPageImage?: string; prevPageImage?: string }) => {
    if (!hasApiKey) {
      setSidebarOpen(true);
      setShowApiMenu(true);
      return;
    }
    
    setSidebarOpen(true);
    setLoading(true);
    try {
      const result = await analyzeSelection(data, customApiKey);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hasApiKey, customApiKey]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setCurrentFile(file);
      setAnalysis(null); // Clear previous analysis
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-ink text-white flex items-center justify-between px-6 flex-shrink-0 shadow-md z-20 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-ink rounded-full"></div>
            </div>
            <span className="font-mono font-bold tracking-tight hidden md:inline">PAPER X-RAY</span>
          </div>
          
          {/* File Upload */}
          <div className="h-6 w-px bg-gray-700 mx-2"></div>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileUpload} 
            className="hidden" 
            ref={fileInputRef} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-700 transition-colors flex items-center gap-2"
          >
            <span>{currentFile ? currentFile.name : "Upload PDF"}</span>
            <span className="opacity-50 text-[10px]">{currentFile ? 'Change' : 'or use default'}</span>
          </button>
        </div>

        <div className="relative" ref={apiMenuRef}>
          <button 
            onClick={() => setShowApiMenu(!showApiMenu)}
            className={`text-xs font-mono flex items-center gap-2 py-1.5 px-3 rounded transition-colors ${
              hasApiKey ? "text-gray-300 hover:text-white hover:bg-gray-800" : "text-red-400 hover:bg-red-900/20"
            }`}
          >
            <span>{hasApiKey ? "API Connected" : "Setup API Key"}</span>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </button>

          {/* API Key Configuration Menu */}
          {showApiMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-ink z-50">
              <h3 className="font-bold text-sm mb-2">Configuration</h3>
              <p className="text-xs text-gray-500 mb-3">
                Enter your Gemini API Key to enable analysis.
              </p>
              
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  placeholder="Enter key..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Get API Key ↗
                </a>
                <button 
                  onClick={() => saveApiKey(customApiKey)}
                  className="bg-ink text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  Save & Close
                </button>
              </div>
              
              {!customApiKey && process.env.API_KEY && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-green-600 flex items-center gap-1">
                  <span>✓</span> Using Environment Variable Key
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Split */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Pane: Document Viewer */}
        <div className={`flex-1 h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-1/2' : 'w-full'}`}>
          <DocumentViewer file={currentFile} onSelection={handleSelection} />
        </div>

        {/* Right Pane: AI Analysis */}
        <div 
          className={`
            absolute md:relative right-0 top-0 bottom-0 
            w-full md:w-[500px] lg:w-[600px] 
            bg-gray-50 border-l border-gray-200 shadow-2xl md:shadow-none
            transition-transform duration-300 z-10
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:hidden'}
          `}
        >
          <div className="h-full relative">
            {/* Close Button (Mobile/Toggle) */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 bg-white rounded-full shadow text-gray-500 z-50"
            >
              ✕
            </button>

            <RightPane analysis={analysis} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;