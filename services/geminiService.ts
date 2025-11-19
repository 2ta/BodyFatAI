import { GoogleGenAI, Type } from "@google/genai";
import { BodyFatAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBodyFatImage = async (base64Image: string): Promise<BodyFatAnalysis> => {
  try {
    const response = await ai.models.generateContent({
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
            text: `Analyze this image to estimate the body fat percentage of the person depicted. 
            Focus on visual cues such as muscle definition, vascularity, abdominal separation, and overall leanness.
            
            Return a JSON object. 
            If the image does not clearly show a person's physique suitable for analysis (e.g., fully clothed, bad lighting, not a person), 
            set the estimatedRange to "N/A" and explain why in the muscleDefinitionAnalysis.

            Required fields:
            - estimatedRange: string (e.g., "12-15%")
            - confidenceLevel: string (e.g., "High", "Medium", "Low")
            - visualCues: array of strings (specific observations like "visible abs", "shoulder striations")
            - muscleDefinitionAnalysis: string (a detailed paragraph explaining the assessment)
            - healthTips: array of strings (3 general fitness/health tips relevant to this physique range)
            - disclaimer: string (Standard medical disclaimer)
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
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

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    return JSON.parse(text) as BodyFatAnalysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};