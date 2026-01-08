import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptResult } from "../types";

// Updated model as per project plan for superior audio handling
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025'; 

export const transcribeMedia = async (
  base64Data: string, 
  mimeType: string
): Promise<TranscriptResult> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  // JSON Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      raw_transcript: {
        type: Type.STRING,
        description: "The verbatim transcript including speaker labels (e.g. Speaker 1:) and timestamps [00:00].",
      },
      polished_version: {
        type: Type.STRING,
        description: "A professionally polished version. Remove filler words (um, ah), fix grammar, but strictly maintain meaning. Do not use timestamps here. Use paragraphs.",
      },
      summary: {
        type: Type.STRING,
        description: "A concise executive summary of the content (5 bullet points).",
      },
      key_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 3-5 distinct key takeaways.",
      },
    },
    required: ["raw_transcript", "polished_version", "summary", "key_points"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `
              You are an expert professional transcriber for 321 GROW.
              
              Task 1: Listen to the audio/video and provide a verbatim transcript. 
              CRITICAL: Identify distinct speakers (Speaker 1, Speaker 2, etc.) and add timestamps [MM:SS] at the start of each turn.
              
              Task 2: Create a polished version suitable for publishing. Remove stutters, false starts, and filler words. Ensure grammatical correctness.
              
              Task 3: Create a 5-point executive summary.
              
              Task 4: Extract key takeaways.

              Return the result strictly in JSON format matching the schema.
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        maxOutputTokens: 8192, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as TranscriptResult;

  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw error;
  }
};