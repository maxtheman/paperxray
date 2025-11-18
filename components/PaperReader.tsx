import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

interface Props {
  file: File | null;
  onSelection: (data: { text?: string; image?: string; fullPageImage?: string; prevPageImage?: string }) => void;
}

type SelectionMode = 'text' | 'area';

const DocumentViewer: React.FC<Props> = ({ file, onSelection }) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.5);
  
  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('text');
  const [selectionBox, setSelectionBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);

  // -- Default HTML View State --
  const [defaultText, setDefaultText] = useState(`3.2 Attention Mechanism

An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension dk, and values of dimension dv. We compute the dot products of the query with all keys, divide each by sqrt(dk), and apply a softmax function to obtain the weights on the values.

In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed together into matrices K and V. We compute the matrix of outputs as:

Attention(Q, K, V) = softmax( (QK^T) / sqrt(dk) ) V

The two most commonly used attention functions are additive attention, and dot-product (multiplicative) attention. Dot-product attention is identical to our algorithm, except for the scaling factor of 1/sqrt(dk). Additive attention computes the compatibility function using a feed-forward network with a single hidden layer. While the two are similar in theoretical complexity, dot-product attention is much faster and more space-efficient in practice, since it can be implemented using highly optimized matrix multiplication code.`);

  // Load PDF when file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        loadingTask.promise.then((pdf) => {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNumber(1);
        }, (reason) => {
          console.error('Error loading PDF', reason);
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      setPdfDoc(null);
    }
  }, [file]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    pdfDoc.getPage(pageNumber).then((page: any) => {
      const viewport = page.getViewport({ scale: scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      // Also set CSS dimensions to match, ensuring 1:1 mapping for mouse events
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Render PDF to Canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      page.render(renderContext);

      // Render Text Layer (for selection)
      textLayerRef.current!.innerHTML = '';
      textLayerRef.current!.style.height = `${viewport.height}px`;
      textLayerRef.current!.style.width = `${viewport.width}px`;
      
      page.getTextContent().then((textContent: any) => {
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerRef.current!,
          viewport: viewport,
          textDivs: []
        });
      });
    });
  }, [pdfDoc, pageNumber, scale]);

  // Helper to render a specific page to base64 (for context)
  const renderPage = async (pageNum: number): Promise<string | null> => {
    if (!pdfDoc || pageNum < 1 || pageNum > numPages) return null;
    try {
      const page = await pdfDoc.getPage(pageNum);
      // Use a reasonable scale for context to keep payload manageable (e.g., 1.0)
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await page.render({ canvasContext: ctx, viewport }).promise;
      // Return JPEG (cleaner for context than PNG usually)
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    } catch (e) {
      console.error("Error rendering context page", e);
      return null;
    }
  };

  const handleTextSelection = () => {
    if (selectionMode !== 'text') return;
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const selectedText = selection.toString();
      // Heuristic to ignore accidental clicks
      if (selectedText.length > 2) {
        onSelection({ text: selectedText });
      }
    }
  };

  // --- Area Selection Logic ---
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectionMode !== 'area' || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    dragStartRef.current = { x, y };
    setIsDragging(true);
    setSelectionBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

    const x = Math.min(currentX, dragStartRef.current.x);
    const y = Math.min(currentY, dragStartRef.current.y);
    const w = Math.abs(currentX - dragStartRef.current.x);
    const h = Math.abs(currentY - dragStartRef.current.y);

    setSelectionBox({ x, y, w, h });
  };

  const handleMouseUp = async () => {
    if (selectionMode === 'text') {
      handleTextSelection();
      return;
    }

    if (selectionMode === 'area' && isDragging && selectionBox && canvasRef.current) {
      setIsDragging(false);
      dragStartRef.current = null;

      // Only capture if box is big enough (avoid accidental clicks)
      if (selectionBox.w > 10 && selectionBox.h > 10) {
        setIsProcessing(true);
        // 1. Crop the selection image
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          tempCanvas.width = selectionBox.w;
          tempCanvas.height = selectionBox.h;
          
          ctx.drawImage(
            canvas, 
            selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h, 
            0, 0, selectionBox.w, selectionBox.h
          );

          const selectionDataUrl = tempCanvas.toDataURL('image/png');
          const selectionBase64 = selectionDataUrl.split(',')[1];

          // 2. Get Context Images
          // Current Page
          const fullPageBase64 = await renderPage(pageNumber);
          
          // Previous Page (if exists)
          let prevPageBase64 = undefined;
          if (pageNumber > 1) {
            const result = await renderPage(pageNumber - 1);
            if (result) prevPageBase64 = result;
          }

          // Send everything
          onSelection({ 
            image: selectionBase64,
            fullPageImage: fullPageBase64 || undefined,
            prevPageImage: prevPageBase64 || undefined
          });
        }
        setIsProcessing(false);
      }
      
      setSelectionBox(null);
    }
  };

  // -- RENDER: Default View --
  if (!file) {
    return (
      <div 
        className="h-full bg-white shadow-inner overflow-y-auto p-8 md:p-16 cursor-text selection:bg-yellow-200 selection:text-black"
        onMouseUp={handleMouseUp}
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="border-b-2 border-black pb-4 mb-12 text-center">
            <h1 className="text-3xl font-bold font-serif mb-2">Attention Is All You Need</h1>
            <div className="text-sm text-gray-600 font-mono">Vaswani et al. (2017)</div>
            <div className="mt-4 text-xs bg-blue-50 text-blue-600 py-2 px-4 rounded-full inline-block">
              Example Mode: Upload a PDF to analyze your own papers
            </div>
          </div>
          <div 
            className="prose prose-lg prose-slate font-serif text-justify leading-loose max-w-none outline-none"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setDefaultText(e.currentTarget.textContent || '')}
          >
            <p className="whitespace-pre-wrap">{defaultText}</p>
          </div>
        </div>
      </div>
    );
  }

  // -- RENDER: PDF View --
  return (
    <div className="h-full bg-gray-200 flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-2 flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
        
        {/* Page Controls */}
        <div className="flex items-center gap-2">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-mono"
          >
            ←
          </button>
          <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button 
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(p => p + 1)}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-mono"
          >
            →
          </button>
        </div>

        {/* Tool Selection */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setSelectionMode('text')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              selectionMode === 'text' 
                ? 'bg-white text-ink shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            T Text
          </button>
          <button
            onClick={() => setSelectionMode('area')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              selectionMode === 'area' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⛝ Area
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-lg leading-none pb-1"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-lg leading-none pb-1"
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Scrollable PDF Area */}
      <div 
        className={`flex-1 overflow-auto flex justify-center p-8 relative bg-gray-200/50 ${isProcessing ? 'cursor-wait' : ''}`}
      >
        <div 
          ref={containerRef}
          className="relative shadow-lg bg-white inline-block" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isProcessing ? 'wait' : (selectionMode === 'area' ? 'crosshair' : 'text') }}
        >
          <canvas ref={canvasRef} className="block" />
          
          {/* Transparent Text Layer for Text Selection */}
          <div 
            ref={textLayerRef} 
            className="textLayer" 
            style={{ 
              pointerEvents: selectionMode === 'area' ? 'none' : 'auto'
            }}
          />

          {/* Drag Selection Box Overlay */}
          {isDragging && selectionBox && (
            <div 
              className="absolute border-2 border-blue-500 bg-blue-500/20 z-50"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.w,
                height: selectionBox.h,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;