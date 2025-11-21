import { GoogleGenAI } from "@google/genai";
import { Wallpaper } from "../types";

// Helper to generate a single image
async function generateSingleImage(prompt: string, index: number): Promise<Wallpaper | null> {
  // Create instance with the environment key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "1K", // 1K is sufficient for mobile and faster than 2K/4K
        },
      },
    });

    // Extract image from candidates
    // Note: The SDK structure requires iterating parts to find inlineData
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const url = `data:${mimeType};base64,${base64Data}`;
          
          return {
            id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            prompt,
            timestamp: Date.now()
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

export const generateWallpapers = async (prompt: string): Promise<Wallpaper[]> => {
  if (!process.env.API_KEY) throw new Error("API Key is required");
  
  // Run 4 requests in parallel to get 4 variations
  const promises = Array.from({ length: 4 }).map((_, i) => generateSingleImage(prompt, i));
  
  const results = await Promise.all(promises);
  
  // Filter out failures
  return results.filter((w): w is Wallpaper => w !== null);
};