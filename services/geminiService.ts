import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, VisualizationType } from "../types";

// Schema definition for structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    simplifiedExplanation: {
      type: Type.STRING,
      description: "A crystal clear, plain English explanation of the mathematical concept suitable for an engineer without a PhD.",
    },
    symbols: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          definition: { type: Type.STRING },
          plainEnglish: { type: Type.STRING, description: "A metaphor or simple explanation (e.g. 'Volume knob')" },
          role: { type: Type.STRING, enum: ['scalar', 'vector', 'matrix', 'function', 'constant'] },
        },
        required: ['symbol', 'definition', 'plainEnglish', 'role']
      }
    },
    dimensions: {
      type: Type.ARRAY,
      description: "The breakdown of matrix/vector shapes in the operation.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          shape: { type: Type.STRING, description: "e.g. [B, T, d_model]" },
          description: { type: Type.STRING },
          isInput: { type: Type.BOOLEAN }
        },
        required: ['name', 'shape', 'description', 'isInput']
      }
    },
    vizType: {
      type: Type.STRING,
      enum: [
        VisualizationType.VECTOR_ALIGNMENT, 
        VisualizationType.DIMENSION_MISMATCH, 
        VisualizationType.GRADIENT_DESCENT, 
        VisualizationType.GENERIC
      ],
      description: "The type of interactive visualization best suited for this concept."
    }
  },
  required: ['simplifiedExplanation', 'symbols', 'dimensions', 'vizType']
};

interface AnalyzeInput {
  text?: string;
  image?: string; // Base64 of cropped selection
  fullPageImage?: string; // Base64 of full current page
  prevPageImage?: string; // Base64 of previous page
}

export const analyzeSelection = async (input: AnalyzeInput, apiKey?: string): Promise<AnalysisResult> => {
  try {
    // Prioritize user-provided key, fallback to env var
    const effectiveKey = apiKey || process.env.API_KEY;
    
    if (!effectiveKey) {
      throw new Error("API Key is missing. Please provide an API Key in the settings.");
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    
    const contents = [];

    if (input.image) {
      const parts: any[] = [];

      // Add Context Images first
      if (input.prevPageImage) {
        parts.push({ text: "CONTEXT: This is the PREVIOUS page of the paper for reference:" });
        parts.push({ inlineData: { mimeType: "image/jpeg", data: input.prevPageImage } });
      }

      if (input.fullPageImage) {
        parts.push({ text: "CONTEXT: This is the FULL CURRENT page where the selection was made:" });
        parts.push({ inlineData: { mimeType: "image/jpeg", data: input.fullPageImage } });
      }

      // Add the actual query
      parts.push({ text: "TASK: Analyze the specific mathematical equation or diagram in the following cropped selection:" });
      parts.push({ inlineData: { mimeType: "image/png", data: input.image } });
      
      parts.push({ text: "Explain it, break down the symbols, and provide geometric intuitions." });

      contents.push({
        role: 'user',
        parts: parts
      });

    } else if (input.text) {
      contents.push({
        role: 'user',
        parts: [{ text: `Analyze this ML concept/equation: "${input.text}"` }]
      });
    } else {
      throw new Error("No input provided");
    }

    // Use ai.models.generateContent instead of deprecated getGenerativeModel
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      config: {
        systemInstruction: `You are a world-class ML researcher acting as a tutor. Your goal is to demystify mathematical equations from research papers. 
      
      Analyze the provided text or image (which may contain an equation). 
      1. Translate it into "Plain English" concepts (no jargon).
      2. Break down every symbol.
      3. Perform Dimensional Analysis (The "Shape" technique). Assume standard transformer/DL shapes if context implies it (e.g., d_model=512).
      4. Recommend a visualization type:
         - If it involves Dot Products, Attention, or Similarity -> VECTOR_ALIGNMENT
         - If it involves Matrix Multiplication shapes -> DIMENSION_MISMATCH
         - If it involves Loss, Optimization, or Gradients -> GRADIENT_DESCENT
         - Otherwise -> GENERIC
      `,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    // Correctly access text property (not a function)
    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const data = JSON.parse(jsonText);
    
    return {
      originalText: input.text || "[Analyzed Image Area]",
      ...data
    };

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    // Fallback structure in case of error to prevent app crash
    return {
      originalText: input.text || "[Image Analysis Error]",
      simplifiedExplanation: "We couldn't analyze this specific selection right now. Please check your API Key or try a clearer selection.",
      symbols: [],
      dimensions: [],
      vizType: VisualizationType.GENERIC
    };
  }
};