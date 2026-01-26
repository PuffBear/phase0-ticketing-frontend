
import { GoogleGenAI, Type } from "@google/genai";
import { CheckInLog, Event } from "../types";

// Safety check for process.env in local dev environments
const API_KEY = typeof process !== 'undefined' ? process.env.API_KEY : '';

export async function getDoorInsights(event: Event, logs: CheckInLog[]) {
  if (!API_KEY) {
    console.warn("API_KEY not found in environment.");
    return { summary: "System analysis unavailable: missing configuration.", riskLevel: "Unknown" };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const prompt = `
      As an event operations expert for "phase0", analyze this informal event's door status.
      Event: ${event.title}
      Capacity: ${event.tiers.reduce((acc, t) => acc + t.capacity, 0)}
      Check-in Logs: ${JSON.stringify(logs.slice(-20))}
      
      Provide a concise 2-sentence summary of door traffic and a risk assessment for fraud or no-shows based on entry speed.
      Format: JSON with "summary" and "riskLevel" (Low, Medium, High).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A concise 2-sentence summary of door traffic.',
            },
            riskLevel: {
              type: Type.STRING,
              description: 'Risk assessment level: Low, Medium, or High.',
            },
          },
          required: ["summary", "riskLevel"],
        },
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { summary: "Analysis unavailable at this time due to network constraints.", riskLevel: "Unknown" };
  }
}
