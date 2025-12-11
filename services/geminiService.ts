import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BodyFatAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  
  const apiCall = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `You are an expert sports physiologist and anthropometrist with deep expertise in body composition analysis. 
          
          Analyze this image to estimate the body fat percentage of the person depicted. 
          
          **CRITICAL ANALYSIS STEPS (Perform these internally before generating JSON):**
          1. **Identify Biological Sex:** Male and female body fat distributions and healthy ranges differ significantly. Adjust your scale accordingly.
          2. **Observe Anatomical Markers:** Look for vascularity, muscle separation, and visibility of skeletal landmarks (ribs, collarbones, iliac crest).
          3. **Assess Fat Storage Sites:** Analyze fat accumulation in the midsection, chest/breasts, hips, thighs, arms, and face.
          4. **Evaluate High Body Fat Indicators:** 
             - If there is no visible muscle definition, look for signs of higher body fat such as skin folding (rolls), significant abdominal overhang, wide waist-to-hip ratio, or general roundness.
             - **Do not hesitate to estimate high ranges (e.g., 30-40%, 40-50%, or 50%+) if the visual evidence supports it.** 
             - Differentiate between "overweight", "obese", and "morbidly obese" visual categories based on visual adipose tissue volume.
          
          Return a JSON object. 
          If the image does not clearly show a person's physique suitable for analysis (e.g., fully clothed, bad lighting, not a person, too blurry, only face visible), 
          set the estimatedRange to "N/A". 
          
          In the "muscleDefinitionAnalysis", be honest and direct about the observation. If the person has high body fat, describe it in clinical/neutral terms (e.g., "Significant subcutaneous adipose tissue visible in the abdominal and thoracic regions...") rather than being vague.

          In the "suggestions" field, provide 3-4 specific, actionable tips for the user to take a better photo for this specific use case (e.g., "Ensure torso is visible", "Stand in front of a light source").

          Required fields:
          - estimatedRange: string (e.g., "12-15%", "25-30%", "45-50%", or "N/A")
          - confidenceLevel: string (e.g., "High", "Medium", "Low")
          - visualCues: array of strings (specific observations like "visible abs", "soft midsection", "skin folding")
          - muscleDefinitionAnalysis: string (detailed assessment of composition)
          - suggestions: array of strings (tips for better photo if N/A, otherwise general pose tips)
          - healthTips: array of strings (3 general fitness/health tips tailored to the estimated level)
          - disclaimer: string (Standard medical disclaimer)
          `,
        },
      ],
    },
    config: {
      // Disabled thinkingConfig to prevent RPC/timeout errors on unstable networks/proxies.
      // The prompt steps above are designed to simulate the reasoning process.
      maxOutputTokens: 4096, 
      responseMimeType: "application/json",
      // Adjust safety settings to allow physique analysis
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
          "disclaimer",
        ],
      },
    },
  });

  try {
    // Race the API call against a timeout
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
    
    // Catch specific XHR/RPC errors which often mean payload too large or connection reset
    if (typeof errorMessage === 'string' && (errorMessage.includes("Rpc failed") || errorMessage.includes("500") || errorMessage.includes("xhr error"))) {
      errorMessage = "Network error: The image may be too large or the service is temporarily unavailable. Please try a different, smaller image.";
    }
    
    throw new Error(errorMessage);
  }
};