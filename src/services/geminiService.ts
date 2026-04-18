/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface SearchFilters {
  category?: string;
  maxPrice?: number;
  location?: string;
  type?: 'online' | 'offline';
  keywords?: string[];
}

/**
 * Converts natural language query into structured filters
 */
export async function getSemanticSearchFilters(query: string): Promise<SearchFilters> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate this search query into a structured JSON filter for a course marketplace: "${query}"`,
    config: {
      systemInstruction: `
        You are an expert search engine optimizer for "Ritual", a course marketplace in South Sulawesi.
        Categories include: Desain, Coding, Musik, Bahasa, Akademik, Lifestyle.
        Locations are cities in South Sulawesi: Makassar, Gowa, Maros, dsb.
        Types: online, offline.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          maxPrice: { type: Type.NUMBER },
          location: { type: Type.STRING },
          type: { 
            type: Type.STRING,
            enum: ["online", "offline"]
          },
          keywords: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse semantic search results", e);
    return {};
  }
}

/**
 * Validates course description for spam/safety
 */
export async function validateContent(content: string): Promise<{ isValid: boolean; reason?: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Check if this course description is safe and professional: "${content}"`,
    config: {
      systemInstruction: `
        Analyze course descriptions for "Ritual".
        Reject if:
        1. Contains spam, illegal links, or inappropriate language.
        2. Promotes scams or generic "get rich quick" schemes.
        3. Is offensive or discriminatory.
        Return JSON with { isValid: boolean, reason: string if invalid }.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        },
        required: ["isValid"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"isValid": true}');
  } catch (e) {
    return { isValid: true };
  }
}
