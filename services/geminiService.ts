import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BodyFatAnalysis } from "../types";

let aiClient: GoogleGenAI | null = null;

// Lazy initialize the client to prevent crashes if process.env isn't ready at module load
const getAiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

// Helper to sanitize JSON string (remove markdown code blocks)
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  // Remove ```json or ``` at the start
  clean = clean.replace(/^```(?:json)?\s*/, '');
  // Remove ``` at the end
  clean = clean.replace(/\s*```$/, '');
  return clean;
};

export const analyzeBodyFatImage = async (base64Image: string): Promise<BodyFatAnalysis> => {
  // 120s timeout to prevent premature timeout
  const timeoutMs = 120000;
  
  const ai = getAiClient();

  const apiCall = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `You are an expert sports physiologist and anthropometrist. Analyze this image to estimate body fat percentage.
          
          **CRITICAL ANALYSIS STEPS:**
          1. **Identify Biological Sex & Frame:** Adjust estimation scale accordingly.
          2. **Assess Composition:** Look for muscle separation, vascularity, and fat storage patterns.
          
          Return a JSON object. If the image is invalid (not a person, blurry, etc), set estimatedRange to "N/A" and explain why in "muscleDefinitionAnalysis".

          Required fields:
          - estimatedRange: string (e.g., "15-18%")
          - confidenceLevel: string ("High", "Medium", "Low")
          - visualCues: string[] (3-4 observations)
          - muscleDefinitionAnalysis: string (Short description of findings or error reason)
          - healthTips: string[] (3 general tips)
          - suggestions: string[] (photo improvement tips)
          - disclaimer: string
          `,
        },
      ],
    },
    config: {
      maxOutputTokens: 2048, 
      responseMimeType: "application/json",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedRange: { type: Type.STRING },
          confidenceLevel: { type: Type.STRING },
          visualCues: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          muscleDefinitionAnalysis: { type: Type.STRING },
          suggestions: {
             type: Type.ARRAY,
             items: { type: Type.STRING },
          },
          healthTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          disclaimer: { type: Type.STRING },
        },
        required: [
          "estimatedRange",
          "confidenceLevel",
          "visualCues",
          "muscleDefinitionAnalysis",
          "healthTips",
          "disclaimer"
        ],
      },
    },
  });

  try {
    const response = await Promise.race([
      apiCall,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. The image might be too large or the network is slow. Please try again.")), timeoutMs)
      )
    ]);

    const text = response.text;
    if (!text) {
      throw new Error("The model could not analyze this image. It may have been blocked by safety filters. Please try a different photo.");
    }

    try {
      const cleanedText = cleanJsonString(text);
      return JSON.parse(cleanedText) as BodyFatAnalysis;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      throw new Error("Received an invalid response from the server. Please try again.");
    }

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    let errorMessage = error.message || "Failed to analyze image. Please try again.";
    
    if (typeof errorMessage === 'string' && (errorMessage.includes("Rpc failed") || errorMessage.includes("500") || errorMessage.includes("xhr error"))) {
      errorMessage = "Network error: The image may be too large or the service is temporarily unavailable. Please try a different, smaller image.";
    }
    
    throw new Error(errorMessage);
  }
};