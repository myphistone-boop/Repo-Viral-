import { GoogleGenAI, Type } from "@google/genai";
import { ViralClip, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeVideoForViralClips = async (videoFile: File): Promise<AnalysisResult> => {
  try {
    const videoPart = await fileToGenerativePart(videoFile);

    const prompt = `
      You are an expert Social Media Manager and Video Editor specializing in viral content for TikTok, Reels, and YouTube Shorts.
      
      Analyze the attached video. Identify exactly 5 distinct moments (clips) that have the highest potential to go viral.
      Look for:
      - High energy or emotion
      - Funny or unexpected moments
      - Insightful "knowledge drops"
      - Action sequences
      
      For each clip, provide:
      1. A catchy, clickbait-style title.
      2. A 'viralityScore' from 1-100.
      3. The 'startTime' and 'endTime' in "MM:SS" format. 
      4. A 'reason' why this is viral.
      5. The 'subtitles' - a verbatim transcript of what is said or a description of the sound if no speech, suitable for a TikTok overlay.
      
      Return the response in strictly JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using the requested model for video understanding
      contents: {
        parts: [videoPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                clips: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            viralityScore: { type: Type.NUMBER },
                            startTime: { type: Type.STRING },
                            endTime: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            subtitles: { type: Type.STRING },
                        },
                        required: ["title", "viralityScore", "startTime", "endTime", "reason", "subtitles"]
                    }
                }
            }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as AnalysisResult;
    
    // Add IDs if missing (safety net)
    result.clips = result.clips.map((clip, idx) => ({
        ...clip,
        id: clip.id || `clip-${idx}-${Date.now()}`
    }));

    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};